# El desafío de la cosecha · guía para rediseñar el estilo

El juego está separado en capas para poder cambiar todo lo visual sin tocar la lógica.

| Archivo | Qué tiene | ¿Se toca para rediseñar? |
|---|---|---|
| `ilustraciones.js` | Todos los dibujos y sus animaciones: portada, planta lateral, vaca mascota, vacas que corren, cosechadora a pantalla completa (canvas), regalo, estrellas | **Sí, libremente** |
| `juego.css` | Colores, tipografías, tarjetas, botones, tamaños | **Sí, libremente** |
| `index.html` | Estructura de las pantallas (los `id` los usa juego.js) | Solo el marcado visual; no cambiar los `id` |
| `juego.js` | Preguntas, puntos, temporizador, agente del link, premio, mail, sonidos | No (salvo que se quiera cambiar el contenido) |
| `preguntas.js` | Banco de 30 preguntas (salen al azar) | Solo para agregar o corregir preguntas |
| `config.js` | URL del Apps Script del mail y cantidad de preguntas por partida | No |
| `vendor/` | GSAP y canvas-confetti, locales para que ande sin señal | No usar CDN |

## La interfaz que juego.js necesita de `ilustraciones.js`

`window.ILU` con:

- `init({ gsap, reduce, sfx })`: recibe GSAP, si el usuario pidió menos movimiento y los sonidos (`sfx.whoosh()`, `sfx.engine(seg)`, `sfx.moo(tono)`).
- `hero(svg)`: dibuja la portada dentro de `#heroSvg` (viewBox 600×230).
- `planta(svg)` → `{ set(etapa, instantaneo) }`: la planta de la columna lateral (`#plant`, viewBox 120×420). Etapa de 0 a 5, una por pregunta.
- `mascota(div)` → `{ normal(), feliz(), triste() }`: la vaca que asoma en la tarjeta de la pregunta.
- `vacaCorre(capa, demora, tono)`: una vaca que cruza la pantalla (en aciertos y en la estampida final).
- `cosecha(canvas, alTapar)` → `Promise`: la transición entre preguntas. Tiene que tapar toda la pantalla, llamar a `alTapar()` cuando está tapada (ahí se cambia la pregunta de abajo) y resolver la promesa cuando terminó de destapar.
- `regalo(svg)` → devuelve la tapa (se anima al abrir). `rayos(svg)`. `estrella(llena)` y `corazon()` devuelven SVG en texto.
- `colores`: paleta del confeti.

## Reglas que hay que mantener

- Respetar `prefers-reduced-motion` (`reduce`): sin transición ni vacas corriendo.
- Nada de recursos externos (CDN, imágenes remotas): el juego tiene que andar sin señal en el stand. Las ilustraciones nuevas van como SVG dentro del JS o como archivos en `juego/` (y agregarlos a `JUEGO` en `/sw.js`).
- Probar en tablet (1024×768) y celular (390×844).
- Vacas de frente, con los dos ojos.
