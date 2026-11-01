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
