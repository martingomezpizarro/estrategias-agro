# Estrategias Agro

Simulador de coberturas con futuros y opciones para productores agropecuarios: cuánto cobrás por hectárea con cada estrategia (venta de futuro, put, collar, put spread, futuro + call), armado de estrategias propias, mercado, estadísticas por cultivo y ganadería, y QR para el stand.

**En vivo:** https://agro.martingomezpizarro.com.ar

Hecho por Martín Gómez Pizarro, asesor financiero. Contacto por WhatsApp desde la app.

## Cómo está armado

Sitio estático, sin compilación:

| Archivo | Para qué |
|---|---|
| `index.html` | Toda la app (HTML, estilos y lógica en un solo archivo) |
| `manifest.webmanifest`, `icon*.{svg,png}` | Instalable en tablet y celular (PWA) |
| `sw.js` | Guarda la app en el dispositivo para usarla sin señal en el stand |
| `CNAME` | Dominio propio para GitHub Pages |

## Correrlo en la compu

```bash
python3 -m http.server 8000
# abrir http://localhost:8000
```

## Precios en vivo

La app busca `api/precios` o `precios.json` (y `api/estadisticas` o `estadisticas.json`). Si no los encuentra, usa los precios de referencia que trae incorporados y lo indica debajo de los granos. Para precios en vivo hace falta un servicio que los publique (pendiente: credenciales de la API de Primary vía la ALyC).

## Publicar cambios

Cualquier cambio que se suba a `main` se publica solo en el subdominio en uno o dos minutos. Si cambiás `index.html`, subí también la versión en `sw.js` (`agro-v1` → `agro-v2`) para que las tablets que ya la instalaron tomen la nueva.
