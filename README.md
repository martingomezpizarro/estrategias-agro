# Agro y Mercado

El mercado de capitales aplicado al agro, para productores agropecuarios. La página cuenta la historia (qué hubieras ganado cubriéndote, qué oportunidades hay hoy) y después deja probar con números propios: cobertura con futuros y opciones, financiamiento (canje, pagarés, cheques, caución y sintéticos con futuros de granos) y tasa (curva de granos y dólar futuro). Cierra con un formulario de contacto que arma el mensaje de WhatsApp o mail.

**En vivo:** https://agro.martingomezpizarro.com.ar

Hecho por Martín Gómez Pizarro, asesor financiero. Contacto por WhatsApp desde la app.

## Cómo está armado

Sitio estático, sin compilación:

| Archivo | Para qué |
|---|---|
| `index.html` | Toda la app (HTML, estilos y lógica en un solo archivo) |
| `agentes.json` | Agentes y sus datos de contacto: cada link `?a=<identificador>` muestra los del agente correspondiente |
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

El workflow `.github/workflows/datos.yml` corre `scripts/actualizar_datos.py` tres veces por día hábil (11:00, 14:00 y 17:15, hora argentina; GitHub puede demorar unos minutos) y guarda en `datos/`:

- `tasas.json`: tasas del MAV del último día operado, promedio ponderado por monto: cheques y pagarés en pesos y en dólares, por segmento (avalado, garantizado, no garantizado) y por tramo de plazo. Guarda las tres fotos del día (`cortes`: apertura, media jornada y cierre); la app las muestra en la pestaña Mercado.
- `spot.json`: precios pizarra de la Cámara Arbitral de Rosario (BCR), el disponible que se paga por operaciones reales.

Si una fuente falla, quedan los datos anteriores. Se puede correr a mano desde la pestaña Actions → "Actualizar datos de mercado" → Run workflow.

Además, `.github/workflows/estadisticas.yml` corre los lunes `scripts/actualizar_estadisticas.py` y actualiza `estadisticas.json` (pestaña Datos): producción y área de la Secretaría de Agricultura (estimaciones agrícolas, CKAN), precios mensuales de Chicago y Live Cattle (CME vía Yahoo Finance) y relación stock/consumo mundial (USDA PSD). Las series se unen con las que ya tiene la app; lo que no se pudo bajar queda como estaba. El resto de la pestaña (INDEC, retenciones, ganadería de AgroIdeas, márgenes) sigue siendo carga manual.

**Estado de los precios de A3.** Con la rueda abierta (días hábiles de 10 a 17) la app dice "En vivo"; fuera de horario muestra el ajuste y dice "Cierre del" último día hábil. Los feriados están en `FERIADOS` dentro de `index.html`: actualizarlos cada año.

**Fuentes.** Cada número tiene una (i) con la fuente y la fecha. Si se agrega un dato, agregarle su (i).

## Panel de administración

`/admin` muestra los QR y la configuración de links. Para que solo entre el administrador, `agro.martingomezpizarro.com.ar/admin*` se protege con Cloudflare Access (política: solo gomezpizarromartin@gmail.com). Si cambiás `index.html`, copiá el mismo archivo a `admin/index.html` cambiando las rutas de íconos, manifest y `sw.js` a `../`.

## Agentes y links por agente

La página puede compartirse con otros agentes productores. Cada uno tiene su link, por ejemplo `agro.martingomezpizarro.com.ar/?a=juan-perez`: quien entra por ahí ve el nombre, WhatsApp, mail, ALyC y link de apertura de ese agente, y el formulario de contacto le escribe a él. El dispositivo recuerda el último agente con el que entró, así que si el productor vuelve sin el link sigue viendo al mismo. Un identificador que no existe o un agente inactivo muestran al predeterminado (`predeterminado` en `agentes.json`).

Los agentes se administran desde `/admin` → "Agentes y links": agregar, editar, desactivar o quitar, copiar el link de cada uno y "Armar QR" para que los tres QR y sus PDF salgan con los datos de ese agente. Los cambios quedan en el dispositivo hasta tocar "Publicar en la página", que guarda `agentes.json` en `main` con la API de GitHub usando un token fine-grained ("Contents: read and write" solo en este repositorio) que queda guardado únicamente en ese dispositivo. Sin token, "Descargar agentes.json" y subirlo a mano.

La autoría del pie de página sigue siendo la del autor de la plataforma.

## El desafío de la cosecha (`/juego`) y la página de cobertura (`/cobertura`)

Dos entradas pensadas para eventos, aparte de la página completa:

- **`/juego/?a=<agente>`**: juego de 5 preguntas sobre cobertura, elegidas al azar de un banco de 30 en `juego/preguntas.js` sin repetir en el mismo dispositivo hasta agotarlo (20 segundos cada una, puntos por acierto, rapidez y racha). Entre preguntas una cosechadora cruza la pantalla y la planta del costado crece con el avance. Al final, si el agente tiene el premio habilitado, se abre un regalo con la bonificación, se pide el mail y se muestran el código, WhatsApp del agente, apertura de cuenta y el simulador. Anda sin señal: GSAP y canvas-confetti están en `juego/vendor/` y los pedidos de mail quedan en el dispositivo hasta que haya conexión.
  - Para cambiar el estilo visual ver `juego/LEEME-diseno.md`: los dibujos y animaciones están todos en `juego/ilustraciones.js`.
  - Mail del premio: Google Apps Script, ver `scripts/apps-script/LEEME.md`. La URL va en `juego/config.js`.
- **`/cobertura/?a=<agente>&codigo=<código>`**: abre la app en modo "solo cobertura" (`/?modo=cobertura`), sin el resto de las secciones. Con un código del juego muestra, debajo del detalle, cuánto se ahorra con la bonificación: comisión de referencia del 1 % (`COMISION` en `index.html`) sobre el valor operado (toneladas × futuro, o toneladas × prima en opciones).

En `/admin` → Agentes y links, cada agente tiene "Juego con premio" y "Bonificación del premio" (%), además de "Matrícula CNV". Sin premio habilitado, el juego igual se puede jugar pero termina con los links al simulador y al WhatsApp del agente. Si el agente tiene el premio, en Códigos QR aparece el QR 4 del juego.

## Publicar cambios

Cualquier cambio que se suba a `main` se publica solo en el subdominio en uno o dos minutos. Si cambiás `index.html`, subí también la versión en `sw.js` (`agro-v1` → `agro-v2`) para que las tablets que ya la instalaron tomen la nueva.
