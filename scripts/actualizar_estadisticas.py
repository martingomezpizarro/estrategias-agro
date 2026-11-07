#!/usr/bin/env python3
"""Actualiza estadisticas.json (pestaña Datos) con los últimos datos de organismos públicos.

Lo corre una vez por semana el workflow .github/workflows/estadisticas.yml. La app lo lee y lo
combina con los datos que trae incorporados: cada serie que no se pudo actualizar queda como estaba.

Series automáticas:
- prod, areaGir: Secretaría de Agricultura, Estimaciones agrícolas (datos.magyp.gob.ar, CKAN).
  Producción nacional por campaña (Mt) de soja, maíz, trigo y girasol; área sembrada de girasol (Mha).
- cbot, le: CME Group vía Yahoo Finance, cierre mensual del contrato más cercano.
  Soja, maíz y trigo pasados a USD/t; Live Cattle en centavos de dólar por libra.
- stockCons: USDA FAS, PSD Online. Relación stock final / consumo mundial (%) por campaña.
- pizarra.json: Cámara Arbitral de Cereales de Rosario (BCR), precio pizarra diario de soja, maíz, trigo,
  girasol y sorgo desde 2003, pasado a USD con la Com. A 3500 del BCRA y promediado por mes. Cada semana
  baja solo desde el mes anterior al último guardado; el histórico completo se arma una sola vez.

Solo usa la biblioteca estándar.
"""
import csv
import datetime as dt
import io
import json
import os
import re
import sys
import urllib.request
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "estadisticas.json")
UA = "Mozilla/5.0 (compatible; AgroYMercado/1.0; +https://agro.martingomezpizarro.com.ar)"
ART = dt.timezone(dt.timedelta(hours=-3))
LOG = []


def get(url, timeout=120, binary=False):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "*/*"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        b = r.read()
    return b if binary else b.decode("utf-8", "replace")


def camp(y):
    """2024 -> '24/25'; '2024/25' o '2024/2025' -> '24/25'."""
    m = re.match(r"\s*(\d{4})\s*/\s*(\d{2,4})", str(y))
    if m:
        a = int(m.group(1))
    else:
        a = int(str(y)[:4])
    return f"{a % 100:02d}/{(a + 1) % 100:02d}"


# ---------------- Secretaría de Agricultura ----------------
def sagyp():
    meta = json.loads(get("https://datos.magyp.gob.ar/api/3/action/package_show?id=estimaciones-agricolas"))
    res = [r for r in meta["result"]["resources"] if (r.get("format") or "").upper() == "CSV" and "estimaciones" in (r.get("url") or "")]
    res.sort(key=lambda r: r.get("last_modified") or r.get("created") or "", reverse=True)
    url = res[0]["url"]
    raw = get(url, binary=True)
    try:
        txt = raw.decode("utf-8-sig")
    except UnicodeDecodeError:
        txt = raw.decode("latin-1")
    dialect = csv.Sniffer().sniff(txt[:5000], delimiters=",;")
    rows = csv.DictReader(io.StringIO(txt), dialect=dialect)
    cols = {c.lower().strip(): c for c in rows.fieldnames}
    pick = lambda *keys: next((cols[c] for c in cols if all(k in c for k in keys)), None)
    c_cul, c_cam = pick("cultivo"), pick("campa")
    c_prod, c_sem = pick("produc"), pick("sembrad") or pick("siembra")
    if not all([c_cul, c_cam, c_prod]):
        raise ValueError(f"columnas inesperadas: {rows.fieldnames}")
    prod, sem = {}, {}

    def key(cul):
        c = cul.lower().replace("í", "i")
        if c.startswith("soja"):
            return "soja_total" if "total" in c else "soja_parcial"
        if c.startswith("maiz"):
            return "maiz"
        if c.startswith("trigo"):
            return "trigo" if ("total" in c or c.strip() in ("trigo", "trigo pan")) else None
        if c.startswith("girasol"):
            return "girasol"
        return None

    num = lambda v: float(str(v).replace(",", ".") or 0) if str(v).strip() not in ("", "SD", "-") else 0.0
    for r in rows:
        k = key(r[c_cul] or "")
        if not k:
            continue
        cm = camp(r[c_cam])
        prod.setdefault(k, {}).setdefault(cm, 0.0)
        prod[k][cm] += num(r[c_prod])
        if c_sem and k == "girasol":
            sem.setdefault(cm, 0.0)
            sem[cm] += num(r[c_sem])
    soja = prod.get("soja_total") or prod.get("soja_parcial") or {}
    out = {"soja": soja, "maiz": prod.get("maiz", {}), "trigo": prod.get("trigo", {}), "girasol": prod.get("girasol", {})}
    series = {}
    for g, d in out.items():
        lst = sorted(((c, round(v / 1e6, 1)) for c, v in d.items() if v > 0), key=lambda x: ckey(x[0]))
        lst = [x for x in lst if ckey(x[0]) >= "2004"]
        if len(lst) >= 5:
            series[g] = [list(x) for x in lst]
    area = [[c, round(v / 1e6, 2)] for c, v in sorted(sem.items(), key=lambda x: ckey(x[0])) if v > 0 and ckey(c) >= "2004"]
    LOG.append(f"SAGyP: {url.rsplit('/', 1)[-1]}, campañas {', '.join(g + ' ' + s[0][0] + '–' + s[-1][0] for g, s in series.items())}")
    return series, area


# ---------------- CME vía Yahoo ----------------
BU = {"ZS=F": 0.367437, "ZC=F": 0.393679, "ZW=F": 0.367437}


def yahoo(sym):
    j = json.loads(get(f"https://query1.finance.yahoo.com/v8/finance/chart/{sym}?range=5y&interval=1mo"))
    r = j["chart"]["result"][0]
    ts, cl = r["timestamp"], r["indicators"]["quote"][0]["close"]
    out = {}
    for t, c in zip(ts, cl):
        if c is None:
            continue
        m = dt.datetime.fromtimestamp(t, dt.timezone.utc).strftime("%Y-%m")
        out[m] = round(c * BU[sym], 1) if sym in BU else round(c, 1)
    lst = sorted(out.items())[-60:]  # meses "AAAA-MM": el orden de texto ya es cronológico
    if len(lst) < 24:
        raise ValueError(f"{sym}: pocos datos")
    return [list(x) for x in lst]


# ---------------- USDA PSD ----------------
PSD = {"soja": ("psd_oilseeds_csv.zip", "Soybeans"), "maiz": ("psd_grains_pulses_csv.zip", "Corn"), "trigo": ("psd_grains_pulses_csv.zip", "Wheat")}


def psd():
    cache, res = {}, {}
    for g, (fn, com) in PSD.items():
        if fn not in cache:
            z = zipfile.ZipFile(io.BytesIO(get("https://apps.fas.usda.gov/psdonline/downloads/" + fn, timeout=300, binary=True)))
            cache[fn] = z.read(z.namelist()[0]).decode("utf-8-sig", "replace")
        stock, cons = {}, {}
        for r in csv.DictReader(io.StringIO(cache[fn])):
            if r.get("Commodity_Description") != com:
                continue
            a = r.get("Attribute_Description", "")
            y = int(r.get("Market_Year") or 0)
            v = float(r.get("Value") or 0)
            if a == "Ending Stocks":
                stock[y] = stock.get(y, 0) + v
            elif a in ("Domestic Consumption", "Total Dom. Cons."):
                cons.setdefault(a, {})
                cons[a][y] = cons[a].get(y, 0) + v
        cc = cons.get("Domestic Consumption") or cons.get("Total Dom. Cons.") or {}
        lst = []
        for y in sorted(stock):
            if y >= 2014 and cc.get(y):
                ratio = stock[y] / cc[y] * 100
                if 5 < ratio < 80:
                    lst.append([camp(y), round(ratio, 1)])
        if len(lst) >= 5:
            res[g] = lst
    LOG.append(f"USDA PSD: última campaña {max((v[-1][0] for v in res.values()), default='?')}")
    return res



# ---------------- Pizarra de Rosario (Cámara Arbitral, BCR) ----------------
PIZ_OUT = os.path.join(ROOT, "pizarra.json")
PIZ_PROD = {"soja": 13, "maiz": 3, "trigo": 8, "girasol": 9, "sorgo": 6}
PIZ_DESDE = "2003-01-01"


def xlsx_rows(b):
    """Filas de la primera hoja de un .xlsx como listas de valores (texto o número)."""
    z = zipfile.ZipFile(io.BytesIO(b))
    ss = []
    if "xl/sharedStrings.xml" in z.namelist():
        x = z.read("xl/sharedStrings.xml").decode("utf-8")
        ss = [re.sub(r"<[^>]+>", "", m) for m in re.findall(r"<si>(.*?)</si>", x, re.S)]
    sh = sorted(n for n in z.namelist() if n.startswith("xl/worksheets/sheet") and n.endswith(".xml"))[0]
    x = z.read(sh).decode("utf-8")
    out = []
    for row in re.findall(r"<row[^>]*>(.*?)</row>", x, re.S):
        vals = []
        for attrs, inner in re.findall(r"<c([^>]*?)(?:/>|>(.*?)</c>)", row, re.S):
            v = re.search(r"<v>(.*?)</v>", inner or "", re.S)
            t = re.search(r'\bt="(\w+)"', attrs)
            if t and t.group(1) == "s" and v:
                vals.append(ss[int(v.group(1))])
            elif t and t.group(1) == "inlineStr":
                vals.append(re.sub(r"<[^>]+>", "", inner or ""))
            elif v:
                try:
                    vals.append(float(v.group(1)))
                except ValueError:
                    vals.append(v.group(1))
            else:
                vals.append("")
        out.append(vals)
    return out


def a_fecha(v):
    if isinstance(v, float) and 30000 < v < 80000:  # número de serie de Excel
        return (dt.date(1899, 12, 30) + dt.timedelta(days=int(v))).isoformat()
    m = re.match(r"\s*(\d{1,2})/(\d{1,2})/(\d{4})", str(v))
    if m:
        return f"{m.group(3)}-{int(m.group(2)):02d}-{int(m.group(1)):02d}"
    m = re.match(r"\s*(\d{4})-(\d{2})-(\d{2})", str(v))
    return m.group(0).strip() if m else None


def a_num(v):
    if isinstance(v, float):
        return v
    s = str(v).replace("$", "").replace(" ", "").strip()
    if not re.search(r"\d", s):
        return None
    if "," in s:
        s = s.replace(".", "").replace(",", ".")
    try:
        return float(s)
    except ValueError:
        return None


def pizarra_bcr(prod, desde, hasta):
    url = ("https://www.cac.bcr.com.ar/es/api/prices/987/export"
           f"?product={prod}&type=any&date_start={desde}&date_end={hasta}&period=day")
    res = {}
    for r in xlsx_rows(get(url, timeout=180, binary=True)):
        f = next((a_fecha(c) for c in r if a_fecha(c)), None)
        if not f:
            continue
        nums = [a_num(c) for c in r[1:] if a_num(c) is not None and a_fecha(c) is None]
        if not nums or nums[-1] <= 0:
            continue
        res[f] = (nums[-1], any(str(c).strip() == "(E)" for c in r))
    if not res:
        raise ValueError(f"producto {prod}: sin precios desde {desde}")
    return res


def a3500_hist(desde, hasta):
    """Com. A 3500 diaria (BCRA, variable 5), año por año."""
    res = {}
    for y in range(int(desde[:4]), int(hasta[:4]) + 1):
        d1, d2 = max(desde, f"{y}-01-01"), min(hasta, f"{y}-12-31")
        j = None
        for v in ("v4.0", "v3.0"):
            try:
                j = json.loads(get(f"https://api.bcra.gob.ar/estadisticas/{v}/monetarias/5?desde={d1}&hasta={d2}&limit=3000", timeout=60))
                break
            except Exception as e:
                err = e
        if j is None:
            raise err
        rs = j.get("results", [])
        rs = [rs] if isinstance(rs, dict) else rs
        for x in rs:
            if isinstance(x, dict) and "fecha" in x and "valor" in x:
                res[x["fecha"][:10]] = float(x["valor"])
            for d in (x.get("detalle") or []) if isinstance(x, dict) else []:
                res[d["fecha"][:10]] = float(d["valor"])
    if not res:
        raise ValueError(f"A3500: sin cotizaciones desde {desde}")
    return res


def pizarra():
    """Incremental: solo baja desde el mes anterior al último guardado (ese mes y el corriente se
    recalculan completos por si la BCR corrige un precio). Sin pizarra.json, arma todo desde 2003."""
    hoy = dt.datetime.now(ART).date().isoformat()
    old = {}
    if os.path.exists(PIZ_OUT):
        with open(PIZ_OUT, encoding="utf-8") as f:
            old = json.load(f)
    om = old.get("mensual", {})

    def desde_de(g):
        s = om.get(g)
        if not s:
            return PIZ_DESDE
        y, m = int(s[-1][0][:4]), int(s[-1][0][5:7]) - 1
        if m == 0:
            y, m = y - 1, 12
        return f"{y}-{m:02d}-01"

    desdes = {g: desde_de(g) for g in PIZ_PROD}
    tc = a3500_hist(min(desdes.values()), hoy)
    tcf = sorted(tc)
    import bisect
    def tc_de(f):
        i = bisect.bisect_right(tcf, f) - 1
        return tc[tcf[i]] if i >= 0 else None
    out = {"fuente": "Cámara Arbitral de Cereales de Rosario (BCR): precio pizarra o, si no hubo, estimativo",
           "tc": "BCRA, Comunicación A 3500 del mismo día", "url": "https://www.cac.bcr.com.ar/es/precios-de-pizarra/consultas",
           "actualizado": hoy, "ultimo": dict(old.get("ultimo", {})), "mensual": {g: list(v) for g, v in om.items()}}
    for g, prod in PIZ_PROD.items():
        d0 = desdes[g]
        try:
            px = pizarra_bcr(prod, d0, hoy)
        except Exception as e:
            print(f"pizarra {g} falló: {e}", file=sys.stderr)
            continue
        mes = {}
        for f, (ars, est) in sorted(px.items()):
            t = tc_de(f)
            if not t:
                continue
            usd = ars / t
            if not 30 < usd < 2000:  # precio o tipo de cambio fuera de rango: se descarta
                continue
            mes.setdefault(f[:7], []).append(usd)
            out["ultimo"][g] = {"fecha": f, "ars": ars, "usd": round(usd, 1), "tc": t, "estimativo": est}
        nuevos = [[m, round(sum(v) / len(v), 1)] for m, v in sorted(mes.items())]
        viejos = [x for x in out["mensual"].get(g, []) if x[0] < d0[:7]]
        out["mensual"][g] = viejos + nuevos
        LOG.append(f"Pizarra {g}: {len(px)} días nuevos desde {d0}, último {out['ultimo'][g]['fecha']}")
    if out == {**old, "actualizado": hoy}:
        return
    with open(PIZ_OUT, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))

def ckey(k):
    """Orden cronológico: campañas '04/05' (siglo según el año) y meses '2026-10'."""
    m = re.match(r"^(\d{2})/(\d{2})$", str(k))
    if m:
        a = int(m.group(1))
        return f"{(1900 if a >= 50 else 2000) + a}"
    return str(k)


def merge(old, new, desde=None):
    """Une dos series [[clave, valor], ...]: lo nuevo pisa lo viejo en la misma clave."""
    d = {k: v for k, v in (old or [])}
    d.update({k: v for k, v in new})
    ks = sorted(d, key=ckey)
    if desde:
        ks = [k for k in ks if ckey(k) >= desde]
    return [[k, d[k]] for k in ks]


def embedded():
    """Datos que trae index.html (const STATS = {...};), punto de partida la primera vez."""
    with open(os.path.join(ROOT, "index.html"), encoding="utf-8") as f:
        m = re.search(r"const STATS = (\{.*?\});\n", f.read(), re.S)
    return json.loads(m.group(1)) if m else {}


def main():
    if os.path.exists(OUT):
        with open(OUT, encoding="utf-8") as f:
            old = json.load(f)
    else:
        old = embedded()
    new = json.loads(json.dumps(old))
    fuentes = dict(old.get("auto", {}))
    hoy = dt.datetime.now(ART).date().isoformat()

    def step(name, fn):
        try:
            fn()
            fuentes[name] = hoy
        except Exception as e:
            print(f"{name} falló: {e}", file=sys.stderr)

    def do_sagyp():
        series, area = sagyp()
        P = new.setdefault("prod", {})
        for g, l in series.items():
            P[g] = merge(P.get(g), l, "2004")
        if len(area) >= 5:
            new["areaGir"] = merge(new.get("areaGir"), area, "2004")

    def do_cme():
        C = new.setdefault("cbot", {})
        for g, sym in (("soja", "ZS=F"), ("maiz", "ZC=F"), ("trigo", "ZW=F")):
            C[g] = merge(C.get(g), yahoo(sym))[-60:]
        G = new.setdefault("gan", {})
        G["le"] = merge(G.get("le"), yahoo("LE=F"))[-60:]
        LOG.append(f"CME: último mes {new['cbot']['soja'][-1][0]}")

    def do_psd():
        r = psd()
        SC = new.setdefault("stockCons", {})
        for g, l in r.items():
            SC[g] = merge(SC.get(g), l, "2014")

    step("sagyp", do_sagyp)
    step("cme", do_cme)
    step("usda", do_psd)
    step("pizarra", pizarra)
    for l in LOG:
        print(l)
    if not fuentes:
        return 1
    new["auto"] = fuentes
    new["actualizado"] = hoy
    strip = lambda d: {k: v for k, v in d.items() if k not in ("actualizado", "auto")}
    if strip(new) == strip(old):
        print("estadisticas.json sin cambios de datos")
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(new, f, ensure_ascii=False, separators=(",", ":"))
    print("estadisticas.json guardado")
    return 0


if __name__ == "__main__":
    sys.exit(main())
