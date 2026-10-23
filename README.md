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
| `manifest.webmanifest`, `icon-*.png` | Instalable en tablet y celular (PWA) |
| `sw.js` | Guarda la app en el dispositivo para usarla sin señal en el stand |
| `CNAME` | Dominio propio para GitHub Pages |

## Correrlo en la compu

```bash
python3 -m http.server 8000
# abrir http://localhost:8000
```

## Precios en vivo

Los futuros de soja, maíz y trigo, el dólar futuro, el A3500 y la caución se leen de la pantalla pública A3 Live (A3 Mercados) cada 5 minutos. No es una API documentada para terceros: si deja de responder, la app usa los cierres que trae incorporados y lo indica. Los márgenes de garantía son los de Argentina Clearing (Comunicación N° 563, 09/10/2026): actualizarlos en `MARG` cuando cambien.

## Panel de administración

`/admin` muestra los QR y la configuración de links. Para que solo entre el administrador, `agro.martingomezpizarro.com.ar/admin*` se protege con Cloudflare Access (política: solo gomezpizarromartin@gmail.com). Si cambiás `index.html`, copiá el mismo archivo a `admin/index.html` cambiando las rutas de íconos, manifest y `sw.js` a `../`.

## Publicar cambios

Cualquier cambio que se suba a `main` se publica solo en el subdominio en uno o dos minutos. Si cambiás `index.html`, subí también la versión en `sw.js` (`agro-v1` → `agro-v2`) para que las tablets que ya la instalaron tomen la nueva.
