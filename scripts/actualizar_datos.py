#!/usr/bin/env python3
"""Actualiza los datos públicos que usa Agro y Mercado y los guarda en datos/.

- datos/tasas.json: tasas del MAV del último día operado (cheques electrónicos avalados en pesos,
  por plazo, y pagarés avalados en dólares), promedio ponderado por monto liquidado.
  Fuente: tablas de "Datos de Mercado" de la portada de mav-sa.com.ar.
- datos/spot.json: precios pizarra de la Cámara Arbitral de Cereales de Rosario (pesos por tonelada,
  promedio ponderado de operaciones reales del mercado físico) de los últimos días publicados.
  Fuente: bcr.com.ar, Cotizaciones locales. Se agrega el A3500 de cada fecha (BCRA) para pasarlos a dólares.

Solo usa la biblioteca estándar. Lo corre el workflow .github/workflows/datos.yml.
Si una fuente falla, deja el archivo anterior como estaba.
"""
import datetime as dt
import html
import json
import os
import re
import sys
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "datos")
UA = "Mozilla/5.0 (compatible; AgroYMercado/1.0; +https://agro.martingomezpizarro.com.ar)"
ART = dt.timezone(dt.timedelta(hours=-3))


def get(url, timeout=40):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Language": "es-AR,es"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read().decode("utf-8", "replace")


def num(s):
    s = html.unescape(re.sub(r"<[^>]+>", "", s)).strip().replace("$", "").replace("%", "").strip()
    if not s or s.upper() in ("S/C", "-"):
        return None
    return float(s.replace(".", "").replace(",", "."))


def cells(row):
    return [html.unescape(re.sub(r"<[^>]+>", "", c)).strip() for c in re.findall(r"<td[^>]*>(.*?)</td>", row, re.S)]


# ---------------- MAV ----------------
BUCKETS = [(0, 30, "hasta 30 días"), (31, 60, "31 a 60 días"), (61, 90, "61 a 90 días"),
           (91, 120, "91 a 120 días"), (121, 180, "121 a 180 días"), (181, 400, "181 a 365 días")]


def mav_switchers(page):
    """Devuelve una lista de switchers; cada uno es una lista de tablas (lista de filas)."""
    out = []
    for blk in re.split(r'<div id="mavsw-[^"]+" class="mav-switcher">', page)[1:]:
        blk = blk.split('class="mav-switcher"')[0]
        tables = []
        for tb in re.findall(r"<tbody>(.*?)</tbody>", blk, re.S):
            rows = [cells(r) for r in re.findall(r"<tr[^>]*>(.*?)</tr>", tb, re.S)]
            tables.append([r for r in rows if len(r) >= 10])
        out.append(tables)
    return out


def wavg(rows):
    w = sum(r[2] for r in rows)
    return (sum(r[1] * r[2] for r in rows) / w, w) if w > 0 else (None, 0)


def parse_mav(page, today):
    sws = mav_switchers(page)
    if len(sws) < 2:
        raise ValueError("no encontré las tablas de echeq y pagarés")

    def rows_of(tables, seg, moneda):
        res = []
        for t in tables:
            for c in t:
                # Plazo, Vto, Min, Max, Prom, Moneda, Nom, Liq, Instr, Segmento, ...
                m = re.match(r"(\d+)", c[0])
                if not m or c[9] != seg or c[5] != moneda:
                    continue
                tasa, liq = num(c[4]), num(c[7])
                if tasa is None or liq is None:
                    continue
                res.append((int(m.group(1)), tasa, liq, c[1]))
        return res

    echeq = rows_of(sws[0], "Avalado", "$")
    pag_usd = rows_of(sws[1], "Avalado", "USD")
    seg = segmentos(sws)
    if not seg:
        raise ValueError("sin operaciones de cheques ni pagarés")
    primera = next(r for inst in seg.values() for mon in inst.values() for sg in mon.values() for r in [sg["_fila"]])

    # Fecha operada: vencimiento menos plazo de una fila
    d0 = None
    p, _, _, vto = primera
    try:
        dd, mm = map(int, vto.split("/"))
        y = today.year + (1 if mm < today.month - 6 else 0)
        d0 = (dt.date(y, mm, dd) - dt.timedelta(days=p)).isoformat()
    except Exception:
        pass

    buckets = []
    for lo, hi, name in BUCKETS:
        rr = [r for r in echeq if lo <= r[0] <= hi]
        t, w = wavg(rr)
        if t is not None:
            buckets.append({"plazo": name, "desde": lo, "hasta": hi, "tasa": round(t, 2), "operaciones": len(rr), "monto": round(w)})
    tu, wu = wavg(pag_usd)
    return {
        "fuente": "MAV, Datos de Mercado (mav-sa.com.ar)",
        "fecha": d0,
        "actualizado": dt.datetime.now(ART).isoformat(timespec="minutes"),
        "echeqAvalado": buckets,
        "pagareUsdAvalado": None if tu is None else {
            "tasa": round(tu, 2), "operaciones": len(pag_usd), "monto": round(wu),
            "min": min(r[1] for r in pag_usd), "max": max(r[1] for r in pag_usd)},
        "segmentos": {i: {m: {k: {x: y for x, y in v.items() if x != "_fila"} for k, v in mm.items()} for m, mm in ii.items()} for i, ii in seg.items()},
        "nota": "Promedio ponderado por monto liquidado de las operaciones del día, por segmento (avalado por SGR, garantizado, no garantizado). Tasas nominales anuales.",
    }


def segmentos(sws):
    """Todas las operaciones del día por instrumento (cheque, pagaré), moneda y segmento, con tramos de plazo."""
    out = {}
    for inst, tables in (("cheque", sws[0]), ("pagare", sws[1])):
        grupos = {}
        for t in tables:
            for c in t:
                m = re.match(r"(\d+)", c[0])
                tasa, liq = num(c[4]), num(c[7])
                if not m or tasa is None or not liq:
                    continue
                grupos.setdefault((c[5], c[9].strip() or "Otro"), []).append((int(m.group(1)), tasa, liq, c[1]))
        for (mon, sg), rows in grupos.items():
            t, w = wavg(rows)
            tramos = []
            for lo, hi, name in BUCKETS:
                rr = [r for r in rows if lo <= r[0] <= hi]
                tt, ww = wavg(rr)
                if tt is not None:
                    tramos.append({"plazo": name, "tasa": round(tt, 2), "operaciones": len(rr), "monto": round(ww)})
            out.setdefault(inst, {}).setdefault(mon, {})[sg] = {
                "tasa": round(t, 2), "operaciones": len(rows), "monto": round(w),
                "min": min(r[1] for r in rows), "max": max(r[1] for r in rows), "tramos": tramos, "_fila": rows[0]}
    return out


def corte(now):
    """Apertura (11 h), media jornada (14 h) o cierre (17:15 h), según la hora de la corrida."""
    h = now.hour + now.minute / 60
    return "apertura" if h < 12.5 else "media" if h < 15.75 else "cierre"


def con_cortes(nuevo, path):
    """Guarda las tres fotos del día: si el archivo anterior es del mismo día operado, suma este corte."""
    now = dt.datetime.now(ART)
    k = corte(now)
    cortes = {}
    try:
        with open(path, encoding="utf-8") as f:
            viejo = json.load(f)
        if viejo.get("fecha") == nuevo.get("fecha"):
            cortes = viejo.get("cortes", {})
    except Exception:
        pass
    cortes[k] = {"hora": now.strftime("%H:%M"), "segmentos": nuevo["segmentos"]}
    nuevo["corte"] = k
    nuevo["cortes"] = cortes
    return nuevo


# ---------------- BCR pizarra ----------------
GRANOS = {"Soja": "soja", "Maíz": "maiz", "Maiz": "maiz", "Trigo": "trigo", "Girasol": "girasol", "Sorgo": "sorgo"}


def parse_bcr(page):
    t = re.search(r"<table[^>]*>(.*?)</table>", page, re.S)
    if not t:
        raise ValueError("sin tabla de pizarra")
    t = t.group(1)
    fechas = re.findall(r"<th>\s*(\d{2}/\d{2}/\d{4})\s*</th>", t)
    fechas = [dt.datetime.strptime(f, "%d/%m/%Y").date().isoformat() for f in fechas]
    res = {}
    for r in re.findall(r"<tr[^>]*>(.*?)</tr>", t, re.S):
        c = cells(r)
        if len(c) < 3 or c[0] not in GRANOS:
            continue
        vals = [num(x) for x in c[2:2 + len(fechas)]]
        res[GRANOS[c[0]]] = [{"fecha": f, "ars": v} for f, v in zip(fechas, vals)]
    if not res:
        raise ValueError("pizarra vacía")
    return res, fechas


def a3500(fechas):
    """Tipo de cambio de referencia Com. A 3500 (BCRA, variable 5) para cada fecha."""
    if not fechas:
        return {}
    d1, d2 = min(fechas), max(fechas)
    j, err = None, None
    for v in ("v4.0", "v3.0"):
        try:
            j = json.loads(get(f"https://api.bcra.gob.ar/estadisticas/{v}/monetarias/5?desde={d1}&hasta={d2}"))
            break
        except Exception as e:
            err = e
    if j is None:
        raise err
    res = {}
    results = j.get("results", [])
    if isinstance(results, dict):
        results = [results]
    for x in results:
        if isinstance(x, dict) and "fecha" in x and "valor" in x:
            res[x["fecha"][:10]] = float(x["valor"])
        for y in (x.get("detalle") or []) if isinstance(x, dict) else []:
            res[y["fecha"][:10]] = float(y["valor"])
    return res


def build_spot(page):
    granos, fechas = parse_bcr(page)
    try:
        tc = a3500(fechas)
    except Exception as e:  # sin BCRA: la app convierte con el A3500 que lee de A3
        print("BCRA A3500 no disponible:", e, file=sys.stderr)
        tc = {}
    for lst in granos.values():
        for x in lst:
            v = tc.get(x["fecha"])
            x["a3500"] = v
            x["usd"] = round(x["ars"] / v, 1) if (v and x["ars"]) else None
    return {
        "fuente": "Cámara Arbitral de Cereales, Bolsa de Comercio de Rosario (precios pizarra)",
        "url": "https://www.bcr.com.ar/es/mercados/mercado-de-granos/cotizaciones/cotizaciones-locales-0",
        "nota": "Pesos por tonelada. Promedio ponderado de operaciones del mercado físico de Rosario. En dólares, al A3500 del BCRA de cada fecha.",
        "actualizado": dt.datetime.now(ART).isoformat(timespec="minutes"),
        "granos": granos,
    }


# ---------------- Parámetros para estimar primas (Black-76) ----------------
# Contrato de Chicago más parecido a la posición de A3 que usa el simulador (mismo cultivo, mes igual o siguiente).
# Al cambiar de campaña en la app (A3COS en index.html), actualizar acá también.
CBOT = {"soja": ("ZSK27.CBT", "ZS=F", "Soja mayo 2027 (ZSK27)"),
        "maiz": ("ZCK27.CBT", "ZC=F", "Maíz mayo 2027 (ZCK27)"),
        "trigo": ("ZWH27.CBT", "ZW=F", "Trigo marzo 2027 (ZWH27)")}
VENTANA = 60  # ruedas


def yahoo_daily(sym):
    j = json.loads(get(f"https://query1.finance.yahoo.com/v8/finance/chart/{sym}?range=1y&interval=1d"))
    r = j["chart"]["result"][0]
    return [(t, c) for t, c in zip(r["timestamp"], r["indicators"]["quote"][0]["close"]) if c]


def realized_vol(px, continuo):
    import math
    rets = [math.log(b[1] / a[1]) for a, b in zip(px, px[1:])]
    if continuo:  # el contrato continuo salta al cambiar de vencimiento: descartar saltos de más de 6%
        rets = [x for x in rets if abs(x) < 0.06]
    rets = rets[-VENTANA:]
    if len(rets) < 30:
        raise ValueError("pocos datos")
    m = sum(rets) / len(rets)
    var = sum((x - m) ** 2 for x in rets) / (len(rets) - 1)
    return math.sqrt(var * 252) * 100


def build_params():
    out = {"actualizado": dt.datetime.now(ART).isoformat(timespec="minutes"), "vol": {}}
    for g, (sym, cont, nombre) in CBOT.items():
        for s_, continuo in ((sym, False), (cont, True)):
            try:
                px = yahoo_daily(s_)
                v = realized_vol(px, continuo)
                out["vol"][g] = {"valor": round(v, 1), "contrato": nombre if not continuo else f"{nombre.split(' (')[0]}, contrato continuo ({cont})",
                                 "fecha": dt.datetime.fromtimestamp(px[-1][0], ART).date().isoformat(), "ventana": VENTANA,
                                 "fuente": "CME Group vía Yahoo Finance: volatilidad histórica anualizada de los últimos 60 cierres diarios"}
                break
            except Exception as e:
                print(f"vol {g} {s_}: {e}", file=sys.stderr)
    try:  # Tasa libre de riesgo en dólares: letras del Tesoro de EE.UU. a 13 semanas
        px = yahoo_daily("^IRX")
        out["r"] = {"valor": round(px[-1][1], 2), "fecha": dt.datetime.fromtimestamp(px[-1][0], ART).date().isoformat(),
                    "fuente": "Rendimiento de las letras del Tesoro de EE.UU. a 13 semanas (^IRX, CBOE vía Yahoo Finance)"}
    except Exception as e:
        print("tasa ^IRX:", e, file=sys.stderr)
    if not out["vol"] and "r" not in out:
        raise ValueError("sin parámetros")
    return out


def save(name, data):
    os.makedirs(OUT, exist_ok=True)
    p = os.path.join(OUT, name)
    old = None
    if os.path.exists(p):
        with open(p, encoding="utf-8") as f:
            old = json.load(f)
    strip = lambda d: {k: v for k, v in (d or {}).items() if k != "actualizado"}
    if old is not None and strip(old) == strip(data):
        print(name, "sin cambios")
        return
    with open(p, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
    print(name, "actualizado")


def main():
    today = dt.datetime.now(ART).date()
    ok = True
    try:
        save("tasas.json", con_cortes(parse_mav(get("https://mav-sa.com.ar/"), today), os.path.join(OUT, "tasas.json")))
    except Exception as e:
        ok = False
        print("MAV falló:", e, file=sys.stderr)
    try:
        save("parametros.json", build_params())
    except Exception as e:
        ok = False
        print("Parámetros fallaron:", e, file=sys.stderr)
    try:
        save("spot.json", build_spot(get("https://www.bcr.com.ar/es/mercados/mercado-de-granos/cotizaciones/cotizaciones-locales-0")))
    except Exception as e:
        ok = False
        print("BCR falló:", e, file=sys.stderr)
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
