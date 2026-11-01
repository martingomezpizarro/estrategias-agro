# Agro y Mercado

El mercado de capitales aplicado al agro, para productores agropecuarios. La página cuenta la historia (qué hubieras ganado cubriéndote, qué oportunidades hay hoy) y después deja probar con números propios: cobertura con futuros y opciones, financiamiento (canje, pagarés, cheques, caución y sintéticos con futuros de granos) y tasa (curva de granos y dólar futuro). Cierra con un formulario de contacto que arma el mensaje de WhatsApp o mail.

**En vivo:** https://agro.martingomezpizarro.com.ar

Hecho por Martín Gómez Pizarro, asesor financiero. Contacto por WhatsApp desde la app.

## Cómo está armado

Sitio estático, sin compilación:

| Archivo | Para qué |
|---|---|
| `index.html` | Toda la app (HTML, estilos y lógica en un solo archivo) |
| `admin/index.html` | La misma app con los QR del stand y la configuración de links. Protegida con Cloudflare Access (solo el administrador) |
| `logo.png`, `favicon.png` | Logo y favicon |
| `logo-mono.png`, `logo-mono-blanco.png` | Logo a un color (verde y blanco) para sellos, impresiones y fondos con foto |
| `manifest.webmanifest`, `icon-*.png` | Instalable en tablet y celular (PWA) |
| `sw.js` | Guarda la app en el dispositivo para usarla sin señal en el stand |
| `CNAME` | Dominio propio para GitHub Pages |

## Correrlo en la compu

```bash
python3 -m http.server 8000
# abrir http://localhost:8000
```

## Precios en vivo

Los futuros de soja, maíz y trigo, el dólar futuro, el A3500 y la caución se leen de la pantalla pública A3 Live (A3 Mercados) cada 5 minutos. No es una API documentada para terceros: si deja de responder, la app usa los cierres que trae incorporados y lo indica. **Primas de opciones.** A3 Live no publica opciones. La app toma primas de mercado por contrato desde `primas.json` (o del campo `primas` de `api/precios`, si se conecta un Worker con Primary API), con el formato `{"primasFecha": "2026-11-02T17:00:00-03:00", "primas": {"SOJ.ROS/MAY27 352 P": 15.4}}`. Las de más de 4 días se descartan. Si un contrato no tiene prima de mercado, se estima con Black-76 usando el vencimiento de la opción, y la app lo indica. Los strikes se redondean a los listados por A3 (cada 4 USD/t).

**Unidades.** Todo el simulador trabaja en toneladas: rinde en t/ha, costo en USD por tonelada producida, resultados en USD/t y totales en USD.

Los márgenes de garantía son los de Argentina Clearing (Comunicación N° 563, 09/10/2026): actualizarlos en `MARG` cuando cambien.

## Datos que se actualizan solos

El workflow `.github/workflows/datos.yml` corre `scripts/actualizar_datos.py` cada hora en días hábiles y guarda en `datos/`:

- `tasas.json`: tasas del MAV del último día operado (cheques electrónicos avalados en pesos por plazo y pagarés avalados en dólares), promedio ponderado por monto.
- `spot.json`: precios pizarra de la Cámara Arbitral de Rosario (BCR), el disponible que se paga por operaciones reales.

Si una fuente falla, quedan los datos anteriores. Se puede correr a mano desde la pestaña Actions → "Actualizar datos de mercado" → Run workflow.

Además, `.github/workflows/estadisticas.yml` corre los lunes `scripts/actualizar_estadisticas.py` y actualiza `estadisticas.json` (pestaña Datos): producción y área de la Secretaría de Agricultura (estimaciones agrícolas, CKAN), precios mensuales de Chicago y Live Cattle (CME vía Yahoo Finance) y relación stock/consumo mundial (USDA PSD). Las series se unen con las que ya tiene la app; lo que no se pudo bajar queda como estaba. El resto de la pestaña (INDEC, retenciones, ganadería de AgroIdeas, márgenes) sigue siendo carga manual.

**Estado de los precios de A3.** Con la rueda abierta (días hábiles de 10 a 17) la app dice "En vivo"; fuera de horario muestra el ajuste y dice "Cierre del" último día hábil. Los feriados están en `FERIADOS` dentro de `index.html`: actualizarlos cada año.

**Fuentes.** Cada número tiene una (i) con la fuente y la fecha. Si se agrega un dato, agregarle su (i).

## Panel de administración

`/admin` muestra los QR y la configuración de links. Para que solo entre el administrador, `agro.martingomezpizarro.com.ar/admin*` se protege con Cloudflare Access (política: solo gomezpizarromartin@gmail.com). Si cambiás `index.html`, copiá el mismo archivo a `admin/index.html` cambiando las rutas de íconos, manifest y `sw.js` a `../`.

## Publicar cambios

Cualquier cambio que se suba a `main` se publica solo en el subdominio en uno o dos minutos. Si cambiás `index.html`, subí también la versión en `sw.js` (`agro-v1` → `agro-v2`) para que las tablets que ya la instalaron tomen la nueva.
