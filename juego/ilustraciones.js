/* =====================================================================
   Agro y Mercado · El desafío de la cosecha — ILUSTRACIONES Y ESCENAS
   ---------------------------------------------------------------------
   Estilo "lámina pampeana": formas planas SIN contorno, cada objeto
   modelado con tres valores del mismo color (luz arriba-izquierda,
   medio, sombra abajo-derecha) y el paisaje armado por planos con
   perspectiva atmosférica (lo lejano más claro y más frío).

   Movimiento según el material:
     · cosechadora  → rígida: sin rebote, power2, vaivén de 1 px
     · vacas        → elásticas: back.out, 200–350 ms
     · planta       → orgánica: elastic.out(1,.55), hojas en cascada 40 ms
     · ambiente     → seno lento de 3 a 9 s (solo en la portada)

   Interfaz que usa juego.js (no cambiar):
     ILU.init({ gsap, reduce, sfx })
     ILU.hero(svg)                    escena de la portada (600×230)
     ILU.planta(svg) -> { set(etapa 0..5, instantaneo) }   (120×420)
     ILU.mascota(el) -> { feliz(), triste(), normal() }
     ILU.vacaCorre(capa, demora, tono)
     ILU.cosecha(canvas, alTapar) -> Promise   transición a pantalla completa
     ILU.regalo(svg) -> tapa (se anima al abrir)
     ILU.rayos(svg)
     ILU.estrella(llena) -> string SVG
     ILU.corazon() -> string SVG
     ILU.colores                       paleta para el confeti
   ===================================================================== */
(function () {
  let gsap = null, reduce = false, sfx = {};
  const NS = "http://www.w3.org/2000/svg";
  const rand = (a, b) => a + Math.random() * (b - a);
  const el = (t, a, parent) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); if (parent) parent.appendChild(e); return e; };
  let uid = 0;

  /* ---------- Paleta: cada material con luz / medio / sombra ---------- */
  const C = {
    maizL: "#F4D06A", maiz: "#E3AE38", maizD: "#B98322", maizDD: "#80590F",
    ladL: "#D2654A", lad: "#B5452B", ladD: "#88301E",
    hojaL: "#7DB862", hoja: "#4A9150", hojaD: "#2D6A3A", hojaDD: "#1F4E2B",
    blanco: "#FBF8F1", blancoS: "#E6DED0", blancoSS: "#CFC4B2",
    negro: "#2A2523", negroL: "#45403C",
    rosaL: "#F7CFC1", rosa: "#EDB2A0", rosaD: "#D48E7B", nariz: "#8E4A41", boca: "#6E2F2A",
    cuerno: "#EEE2C2", cuernoD: "#CDBB91",
    vidrio: "#9FC4CB", vidrioL: "#D9EDEE",
    goma: "#2B2624", gomaL: "#4B4440",
    tierraL: "#9A7048", tierra: "#77522F", tierraD: "#55391F",
    trigoL: "#F2D27A", trigo: "#DDB04C", trigoD: "#B98B2E", trigoDD: "#8E6A21",
    ojo: "#2A1D15"
  };

  /* =====================================================================
     VACA HOLANDO — cabeza de frente, dos ojos (viewBox 0 0 100 100)
     ===================================================================== */
  const espejo = d => d.replace(/(-?\d+\.?\d*) (-?\d+\.?\d*)/g, (m, x, y) => `${100 - x} ${y}`);
  function cabezaVaca() {
    const cuernoI = "M34 24 C30 15 25 10 18 8 C22 13 24 19 27 26 Z";
    const orejaI = "M28 37 C19 30 7 30 2 36 C6 44 18 46 28 43 Z";
    const orejaInI = "M26 38 C19 34 11 34 7 37 C11 41 19 42 26 41 Z";
    return `
    <g class="cv">
      <path d="${cuernoI}" fill="${C.cuerno}"/><path d="${espejo(cuernoI)}" fill="${C.cuernoD}"/>
      <path d="${orejaI}" fill="${C.negro}"/><path d="${orejaInI}" fill="${C.rosa}"/>
      <path d="${espejo(orejaI)}" fill="${C.negro}"/><path d="${espejo(orejaInI)}" fill="${C.rosaD}"/>
      <path d="M50 16 C67 16 77 25 77 40 C77 51 73 58 71 66 L29 66 C27 58 23 51 23 40 C23 25 33 16 50 16 Z" fill="${C.blanco}"/>
      <path d="M64 19 C73 24 78 33 77 44 C76 53 72 59 71 66 L65 66 C68 55 71 41 64 19 Z" fill="${C.blancoS}"/>
      <path d="M47 16.5 C57 14.5 67 18 71 25 C64 27.5 56 25 51 21.5 C49 20 47.5 18.5 47 16.5 Z" fill="${C.negro}"/>
      <path d="M25 37 C27 30 36 27.5 43.5 31 C48.5 35.5 47.5 47 41.5 52 C34.5 55.5 27 51.5 25 44.5 Z" fill="${C.negro}"/>
      <path d="M44 16.8 C46 13 52 12 55 15 C52 15.5 49 17 47 19 Z" fill="${C.blancoS}"/>
      <g class="eye">
        <ellipse cx="37.5" cy="42" rx="6.6" ry="7.2" fill="#FFFDF8"/>
        <g class="pupil"><circle cx="38.2" cy="42.8" r="4.8" fill="${C.ojo}"/><circle cx="39.9" cy="40.6" r="1.7" fill="#fff"/><circle cx="36.6" cy="44.8" r=".8" fill="#fff" opacity=".7"/></g>
        <ellipse class="lid" cx="37.5" cy="42" rx="7.2" ry="7.8" fill="${C.negro}"/>
      </g>
      <g class="eye">
        <ellipse cx="62.5" cy="42" rx="6.6" ry="7.2" fill="#FFFDF8"/>
        <g class="pupil"><circle cx="63.2" cy="42.8" r="4.8" fill="${C.ojo}"/><circle cx="64.9" cy="40.6" r="1.7" fill="#fff"/><circle cx="61.6" cy="44.8" r=".8" fill="#fff" opacity=".7"/></g>
        <ellipse class="lid" cx="62.5" cy="42" rx="7.2" ry="7.8" fill="${C.blanco}"/>
      </g>
      <path class="brows" d="M29 30.5 L42 33.5 M71 30.5 L58 33.5" stroke="${C.negroL}" stroke-width="2.6" stroke-linecap="round" fill="none" opacity="0"/>
      <ellipse cx="28.5" cy="57" rx="4.6" ry="2.6" fill="${C.rosa}" opacity=".55"/><ellipse cx="71.5" cy="57" rx="4.6" ry="2.6" fill="${C.rosa}" opacity=".55"/>
      <path d="M27 63 C27 55 37 52.5 50 52.5 C63 52.5 73 55 73 63 C73 77 65 87 50 87 C35 87 27 77 27 63 Z" fill="${C.rosa}"/>
      <path d="M29 70 C32 81 40 87 50 87 C60 87 68 81 71 70 C67 79 60 83 50 83 C40 83 33 79 29 70 Z" fill="${C.rosaD}"/>
      <ellipse cx="43" cy="57.2" rx="9" ry="2.3" fill="${C.rosaL}"/>
      <ellipse cx="40.5" cy="65" rx="3.1" ry="4.4" transform="rotate(-16 40.5 65)" fill="${C.nariz}"/>
      <ellipse cx="59.5" cy="65" rx="3.1" ry="4.4" transform="rotate(16 59.5 65)" fill="${C.nariz}"/>
      <path class="m-idle" d="M43 76.5 Q50 80 57 76.5" stroke="${C.nariz}" stroke-width="2.3" fill="none" stroke-linecap="round"/>
      <g class="m-happy" opacity="0"><path d="M40.5 74 Q50 88 59.5 74 Q50 77.5 40.5 74 Z" fill="${C.boca}"/><path d="M45 80.6 Q50 84 55 80.6 Q50 79.4 45 80.6 Z" fill="${C.ladL}"/></g>
      <path class="m-sad" d="M43.5 80 Q50 75 56.5 80" stroke="${C.nariz}" stroke-width="2.3" fill="none" stroke-linecap="round" opacity="0"/>
    </g>`;
  }

  /* Cuerpo de perfil (corre hacia la izquierda) con la cabeza girada a cámara. viewBox 0 0 160 110 */
  function cuerpoVaca(variante) {
    const pata = (x, clase, lejos) => `<g class="lg ${clase}"><rect x="${x}" y="60" width="9.5" height="31" rx="4.5" fill="${lejos ? C.blancoS : C.blanco}"/><rect x="${x}" y="84" width="9.5" height="5" fill="${lejos ? C.blancoSS : C.blancoS}"/><path d="M${x} 89 h9.5 v4 q0 3 -3 3 h-3.5 q-3 0 -3 -3 z" fill="${C.negro}"/></g>`;
    const manchas = variante
      ? `<path d="M94 27.5 C108 25 124 27 129 35 C132 45 122 54 108 52 C97 50 90 40 94 27.5 Z" fill="${C.negro}"/>
         <path d="M68 47 C75 41 86 43 88 51 C89 59 81 64 72 60.5 C67 58 65 52 68 47 Z" fill="${C.negro}"/>
         <path d="M139 31.5 C148 33 154 40 154.5 48 C147 49.5 140 44 139 31.5 Z" fill="${C.negro}"/>`
      : `<path d="M78 28 C94 25 108 28 110 37 C111 47 99 51 88 48 C80 46 75 38 78 28 Z" fill="${C.negro}"/>
         <path d="M120 46 C130 40 144 43 148 52 C150 61 140 66 128 64 C120 62 116 53 120 46 Z" fill="${C.negro}"/>
         <path d="M56 40 C60 35 67 36 68 42 C68 48 61 50 57 47 Z" fill="${C.negro}"/>`;
    return `
    ${pata(76, "b", true)}${pata(134, "a", true)}
    <g class="tail"><path d="M151 40 C160 46 162 58 158 70" stroke="${C.blancoS}" stroke-width="3.2" fill="none" stroke-linecap="round"/><ellipse cx="158" cy="72" rx="3.6" ry="5.4" fill="${C.negro}"/></g>
    <path d="M58 32 C70 25.5 120 24 144 29.5 C156 33 159 49 155 61 C151 73 137 76 120 75 L76 75 C62 75 52 68 52 52 C52 42 54 36 58 32 Z" fill="${C.blanco}"/>
    ${manchas}
    <path d="M53.5 59 C58 71 69 76 80 76 L120 76 C137 77 150 72 155 61 C147 68 133 70.5 120 70 L80 70 C68 70 59 66 53.5 59 Z" fill="${C.blancoS}" opacity=".9"/>
    <path d="M111 73 C111 82.5 127 82.5 127 73 Z" fill="${C.rosa}"/><path d="M114 80 v3.5 M119 81 v3.5 M124 80 v3.5" stroke="${C.rosaD}" stroke-width="2.4" stroke-linecap="round"/>
    ${pata(58, "a", false)}${pata(118, "b", false)}
    <g class="head" transform="translate(8 10) scale(.64)">${cabezaVaca()}</g>`;
  }
  function cara(root, animo) {
    const set = (c, v) => root.querySelectorAll(c).forEach(e => e.setAttribute("opacity", v));
    set(".m-idle", animo === "idle" ? 1 : 0); set(".m-happy", animo === "happy" ? 1 : 0);
    set(".m-sad", animo === "sad" ? 1 : 0); set(".brows", animo === "sad" ? 1 : 0);
  }
  function prepararParpados(root) { gsap.set(root.querySelectorAll(".lid"), { scaleY: 0, transformOrigin: "50% 0%" }); }
  function parpadear(root) {
    const lid = root.querySelectorAll(".lid");
    gsap.timeline().to(lid, { scaleY: 1, duration: .07, ease: "power2.in" }).to(lid, { scaleY: 0, duration: .12, ease: "power2.out" });
  }

  /* =====================================================================
     COSECHADORA — una sola definición (trazos SVG) que se usa en la
     portada (SVG) y en la transición (canvas, vía Path2D).
     Coordenadas: suelo en y=0, avanza hacia la derecha, cabezal en x≈108.
     ===================================================================== */
  const COMB = [
    ["M21 -58 L-11 -73 L-9 -77.5 L23 -62.5 Z", "maizD"],           // tubo de descarga
    ["M-13.5 -76 L-16 -66 L-11 -65 L-8.5 -75 Z", "maizDD"],        // pico
    ["M38.5 -77 h4.5 v20 h-4.5 z", "goma"], ["M37.5 -80 h6.5 v3.4 h-6.5 z", "gomaL"], // escape
    ["M11 -50 L15 -64 L53 -64 L55 -50 Z", "maizL"],                // tolva
    ["M13.2 -56 L54 -56 L55 -50 L11 -50 Z", "maiz"],
    ["M14 -66.5 h40 v3 h-40 z", "maizDD"],
    ["M2 -46 Q2 -50 6 -50 L75 -50 Q79 -50 79 -46 L79 -15 L6 -15 Q2 -15 2 -19 Z", "maiz"], // cuerpo
    ["M2 -27 L79 -27 L79 -15 L6 -15 Q2 -15 2 -19 Z", "maizD"],
    ["M6 -50 L75 -50 Q79 -50 79 -46.5 L2 -46.5 Q2 -50 6 -50 Z", "maizL"],
    ["M2 -34 h77 v3.2 h-77 z", "lad"],                               // franja
    ["M11 -45 h20 v2 h-20 z M11 -41 h20 v2 h-20 z M11 -37 h20 v2 h-20 z", "maizD"], // rejilla
    ["M36 -45 h12 v8 h-12 z", "maizD"], ["M37 -44 h10 v6 h-10 z", "maizL"],          // tapa de servicio
    ["M50 -79 h30 q1.5 0 1.5 1.5 v2 h-33 v-2 q0 -1.5 1.5 -1.5 z", "blanco"],          // techo cabina
    ["M52 -75.5 h26 v26 h-26 z", "negro"],
    ["M55 -72.5 h20 v18 h-20 z", "vidrio"],
    ["M61 -72.5 h6 l-9 18 h-3 v-6 z", "vidrioL"],
    ["M62 -60 q3 -4 6 0 v5.5 h-6 z", "negroL"],                     // operario
    ["M64.8 -64.6 m-3 0 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0", "rosaD"],
    ["M77 -40 L91 -31 L91 -14 L77 -15 Z", "maizD"],                  // embocador
    ["M77 -40 L91 -31 L91 -28 L77 -36.5 Z", "maiz"],
    ["M86 -27 h20 q2.5 0 2.5 2.5 v16.5 h-22.5 z", "lad"],            // cabezal
    ["M86 -27 h20 q2.5 0 2.5 2.5 v1.8 h-22.5 z", "ladL"],
    ["M86 -12 h22.5 v4 h-22.5 z", "ladD"],
    ["M108.5 -11.5 l5 1.4 l-5 1.4 z M108.5 -16.5 l5 1.4 l-5 1.4 z M108.5 -21.5 l5 1.4 l-5 1.4 z", "gomaL"],
    ["M72 -49 h2.2 v31 h-2.2 z M69 -44 h5 v1.4 h-5 z M69 -38 h5 v1.4 h-5 z M69 -32 h5 v1.4 h-5 z M69 -26 h5 v1.4 h-5 z", "goma"], // escalera
    ["M78.5 -48.5 h3.5 v4 h-3.5 z", "vidrioL"],                      // faro
    ["M84 -37.5 L97.5 -31.5 L96.5 -29.5 L83 -35.5 Z", "ladD"]        // brazo del molinete
  ];
  const RUEDAS = [{ x: 56, y: -13, r: 13, llanta: 7 }, { x: 16, y: -8, r: 8, llanta: 4.2 }];
  const MOLINETE = { x: 97, y: -30.5, r: 11 };

  function cosechadoraSVG() {
    const partes = COMB.map(([d, f]) => `<path d="${d}" fill="${C[f]}"/>`).join("");
    const rueda = w => `<g class="wheel" data-cx="${w.x}" data-cy="${w.y}">
      <circle cx="${w.x}" cy="${w.y}" r="${w.r}" fill="${C.goma}"/>
      ${Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6; return `<rect x="${w.x - 1.2}" y="${w.y - w.r - .6}" width="2.4" height="2.4" rx=".6" fill="${C.gomaL}" transform="rotate(${a * 180 / Math.PI} ${w.x} ${w.y})"/>`; }).join("")}
      <circle cx="${w.x}" cy="${w.y}" r="${w.llanta}" fill="${C.maiz}"/><circle cx="${w.x}" cy="${w.y}" r="${w.llanta * .55}" fill="${C.maizD}"/>
      ${[0, 1, 2, 3, 4].map(i => `<circle cx="${w.x}" cy="${w.y - w.llanta * .78}" r="${w.r > 10 ? .9 : .6}" fill="${C.maizDD}" transform="rotate(${i * 72} ${w.x} ${w.y})"/>`).join("")}
      <circle cx="${w.x}" cy="${w.y}" r="${w.llanta * .22}" fill="${C.maizL}"/></g>`;
    const m = MOLINETE;
    const reel = `<g class="reel"><circle cx="${m.x}" cy="${m.y}" r="${m.r}" fill="none" stroke="${C.ladD}" stroke-width="1.2" opacity=".55"/>
      ${Array.from({ length: 5 }, (_, i) => `<g transform="rotate(${i * 72} ${m.x} ${m.y})"><rect x="${m.x - .7}" y="${m.y - m.r}" width="1.4" height="${m.r}" fill="${C.ladD}"/><rect x="${m.x - 2.6}" y="${m.y - m.r - 1.2}" width="5.2" height="2.4" rx="1" fill="${C.lad}"/></g>`).join("")}
      <circle cx="${m.x}" cy="${m.y}" r="2" fill="${C.ladD}"/></g>`;
    return `<ellipse cx="54" cy="0" rx="60" ry="3.4" fill="#3A2A12" opacity=".18"/><g class="body">${partes}${reel}${RUEDAS.map(rueda).join("")}</g>`;
  }

  let P2D = null;
  function dibujarCosechadora(c, fx, by, s, t) {
    if (!P2D) P2D = COMB.map(([d, f]) => [new Path2D(d), C[f]]);
    c.save(); c.translate(fx - FRENTE * s, by + Math.sin(t / 45) * s * .35); c.scale(s, s);
    c.fillStyle = "rgba(58,42,18,.2)"; c.beginPath(); c.ellipse(54, 1, 62, 4, 0, 0, 7); c.fill();
    P2D.forEach(([p, f]) => { c.fillStyle = f; c.fill(p); });
    const m = MOLINETE;
    c.save(); c.translate(m.x, m.y); c.rotate(t / 160);
    c.strokeStyle = C.ladD; c.globalAlpha = .55; c.lineWidth = 1.2; c.beginPath(); c.arc(0, 0, m.r, 0, 7); c.stroke(); c.globalAlpha = 1;
    for (let k = 0; k < 5; k++) { c.fillStyle = C.ladD; c.fillRect(-.7, -m.r, 1.4, m.r); c.fillStyle = C.lad; c.fillRect(-2.6, -m.r - 1.2, 5.2, 2.4); c.rotate(Math.PI * 2 / 5); }
    c.fillStyle = C.ladD; c.beginPath(); c.arc(0, 0, 2, 0, 7); c.fill(); c.restore();
    RUEDAS.forEach(w => {
      c.save(); c.translate(w.x, w.y); c.rotate(t / (w.r * 6));
      c.fillStyle = C.goma; c.beginPath(); c.arc(0, 0, w.r, 0, 7); c.fill();
      c.fillStyle = C.gomaL; for (let k = 0; k < 12; k++) { c.fillRect(-1.2, -w.r - .6, 2.4, 2.4); c.rotate(Math.PI / 6); }
      c.fillStyle = C.maiz; c.beginPath(); c.arc(0, 0, w.llanta, 0, 7); c.fill();
      c.fillStyle = C.maizD; c.beginPath(); c.arc(0, 0, w.llanta * .55, 0, 7); c.fill();
      c.fillStyle = C.maizDD; for (let k = 0; k < 5; k++) { c.beginPath(); c.arc(0, -w.llanta * .78, w.r > 10 ? .9 : .6, 0, 7); c.fill(); c.rotate(Math.PI * 2 / 5); }
      c.fillStyle = C.maizL; c.beginPath(); c.arc(0, 0, w.llanta * .22, 0, 7); c.fill();
      c.restore();
    });
    c.restore();
  }

  /* ---------- Transición: el lote sube, la cosechadora lo cosecha ---------- */
  const FRENTE = 112, ANCHO = 128;
  function texturaTrigo(W, H, dpr) {
    const o = document.createElement("canvas"); o.width = W * dpr; o.height = H * dpr; const c = o.getContext("2d"); c.scale(dpr, dpr);
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#E7C163"); g.addColorStop(1, "#C7973A");
    c.fillStyle = g; c.fillRect(0, 14, W, H);
    for (let y = 16, r = 0; y < H + 40; y += 20, r++) {
      const prof = Math.min(1, y / H);
      for (let x = -6 + (r % 2) * 5; x < W + 10; x += 9) {
        const j = rand(-3, 3), h = rand(26, 34);
        c.strokeStyle = prof > .5 ? C.trigoDD : C.trigoD; c.globalAlpha = .55; c.lineWidth = 1.3;
        c.beginPath(); c.moveTo(x, y + h); c.quadraticCurveTo(x + j * .3, y + h / 2, x + j, y); c.stroke();
        c.globalAlpha = 1;
        c.fillStyle = C.trigoD; c.beginPath(); c.ellipse(x + j + .8, y - 2, 3.1, 7.6, j / 10, 0, 7); c.fill();
        c.fillStyle = (x + r) % 3 ? C.trigo : C.trigoL; c.beginPath(); c.ellipse(x + j - .4, y - 3, 2.3, 6.6, j / 10, 0, 7); c.fill();
        c.strokeStyle = C.trigoL; c.globalAlpha = .5; c.lineWidth = .8;
        c.beginPath(); c.moveTo(x + j, y - 9); c.lineTo(x + j - 2, y - 15); c.moveTo(x + j + 1, y - 9); c.lineTo(x + j + 3, y - 14); c.stroke();
        c.globalAlpha = 1;
      }
    }
    return o;
  }
  function cosecha(fx, alTapar) {
    const g2 = fx.getContext("2d");
    return new Promise(res => {
      if (reduce) { alTapar(); return res(); }
      const dpr = Math.min(2, devicePixelRatio || 1), W = innerWidth, H = innerHeight;
      fx.width = W * dpr; fx.height = H * dpr; g2.setTransform(dpr, 0, 0, dpr, 0, 0);
      const tex = texturaTrigo(W, H, dpr);
      const s = Math.max(2.3, Math.min(H * .006, W * .0088)), by = H * .72, combW = ANCHO * s;
      const SUBE = 520, PAUSA = 120, PASA = 2300, FIN = 500;
      const parts = []; let tapado = false; const t0 = performance.now(); let last = t0;
      sfx.whoosh && sfx.whoosh(); setTimeout(() => sfx.engine && sfx.engine((PASA + 200) / 1000), SUBE);
      const ease = p => p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;   // power2.inOut: rígida, sin rebote
      function emit(type, x, y, n) {
        for (let i = 0; i < n; i++) {
          if (type === "paja") parts.push({ type, x, y: y + rand(-10, 10) * s / 4, vx: -rand(.12, .5), vy: -rand(.02, .28), g: .0006, life: rand(800, 1400), age: 0, r: rand(0, 6), vr: rand(-.02, .02), len: rand(3, 7) * s / 3, c: [C.trigoL, C.trigo, "#F6E3A6"][i % 3] });
          if (type === "grano") parts.push({ type, x, y, vx: -rand(.05, .18), vy: -rand(.05, .2), g: .0009, life: 1100, age: 0, sz: rand(1.4, 2.6) * s / 3 });
          if (type === "polvo") parts.push({ type, x: x + rand(-10, 10), y, vx: -rand(.02, .08), vy: -rand(.01, .04), g: 0, life: rand(700, 1100), age: 0, sz: rand(8, 16) * s / 3 });
          if (type === "humo") parts.push({ type, x, y, vx: -rand(.02, .06), vy: -rand(.05, .1), g: 0, life: 900, age: 0, sz: rand(4, 7) * s / 3 });
          if (type === "espiga") parts.push({ type, x, y, vx: rand(-.15, .25), vy: -rand(.1, .4), g: .0012, life: rand(600, 1000), age: 0, r: rand(0, 6), vr: rand(-.03, .03), c: [C.trigoL, C.trigo, C.trigoD][i % 3] });
        }
      }
      function frame(now) {
        const t = now - t0, dt = Math.min(40, now - last); last = now;
        g2.clearRect(0, 0, W, H);
        if (t < SUBE) {
          const p = 1 - Math.pow(1 - t / SUBE, 3), y = H * (1 - p) - 14;
          g2.drawImage(tex, 0, 0, tex.width, tex.height, 0, y, W, H);
          g2.fillStyle = "#C7973A"; g2.fillRect(0, y + H - 2, W, H);
        } else {
          if (!tapado) { tapado = true; alTapar(); }
          const p = Math.min(1, Math.max(0, (t - SUBE - PAUSA) / PASA)), e = ease(p);
          const front = -30 + (W + combW + 60) * e, cut = Math.max(0, Math.min(W, front - 2));
          const shake = p > 0 && p < 1 ? Math.sin(t / 26) * s * .25 : 0;
          g2.save(); g2.translate(0, shake);
          if (cut < W) {
            g2.drawImage(tex, cut * dpr, 0, (W - cut) * dpr, H * dpr, cut, -14, W - cut, H + 14);
            const sh = g2.createLinearGradient(cut - 18, 0, cut, 0); sh.addColorStop(0, "rgba(128,89,15,0)"); sh.addColorStop(1, "rgba(128,89,15,.28)");
            g2.fillStyle = sh; g2.fillRect(cut - 18, 0, 18, H);
          }
          if (p > 0 && p < 1) {
            const back = front - FRENTE * s, k = dt / 16;
            if (front > 0 && front < W + 10) emit("espiga", front, rand(0, H), Math.round(4 * k));
            emit("paja", back + 4 * s, by - 34 * s, Math.round(3 * k));
            emit("grano", back - 13 * s, by - 68 * s, Math.round(2 * k));
            emit("polvo", back + 18 * s, by, Math.round(.6 * k + Math.random()));
            if (Math.random() < .35 * k) emit("humo", back + 40.7 * s, by - 80 * s, 1);
          }
          for (let i = parts.length - 1; i >= 0; i--) {
            const q = parts[i]; q.age += dt; if (q.age > q.life) { parts.splice(i, 1); continue; }
            q.vy += q.g * dt; q.x += q.vx * dt; q.y += q.vy * dt; const a = 1 - q.age / q.life;
            g2.globalAlpha = a;
            if (q.type === "paja") { q.r += q.vr * dt; g2.strokeStyle = q.c; g2.lineWidth = 1.6; g2.lineCap = "round"; g2.beginPath(); g2.moveTo(q.x, q.y); g2.lineTo(q.x + Math.cos(q.r) * q.len, q.y + Math.sin(q.r) * q.len); g2.stroke(); }
            else if (q.type === "grano") { g2.fillStyle = C.maizD; g2.beginPath(); g2.ellipse(q.x, q.y, q.sz, q.sz * 1.3, .6, 0, 7); g2.fill(); }
            else if (q.type === "polvo") { g2.globalAlpha = a * .4; g2.fillStyle = "#E8D9AE"; g2.beginPath(); g2.arc(q.x, q.y, q.sz * (2 - a), 0, 7); g2.fill(); }
            else if (q.type === "humo") { g2.globalAlpha = a * .45; g2.fillStyle = "#8C857D"; g2.beginPath(); g2.arc(q.x, q.y, q.sz * (2 - a), 0, 7); g2.fill(); }
            else { q.r += q.vr * dt; g2.save(); g2.translate(q.x, q.y); g2.rotate(q.r); g2.fillStyle = C.trigoD; g2.beginPath(); g2.ellipse(.6, 0, 3, 7.4, 0, 0, 7); g2.fill(); g2.fillStyle = q.c; g2.beginPath(); g2.ellipse(-.4, -.6, 2.2, 6.4, 0, 0, 7); g2.fill(); g2.restore(); }
          }
          g2.globalAlpha = 1;
          if (p < 1) dibujarCosechadora(g2, front, by, s, t);
          g2.restore();
          if (p >= 1 && (parts.length === 0 || t > SUBE + PAUSA + PASA + FIN)) { g2.clearRect(0, 0, W, H); return res(); }
        }
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    });
  }

  /* =====================================================================
     PLANTA DE MAÍZ en su surco + regla de avance (viewBox 120×420)
     ===================================================================== */
  function planta(P) {
    const add = (t, a, p = P) => el(t, a, p);
    const TOP = [350, 300, 250, 190, 122, 46];
    const etapaDe = y => TOP.findIndex(t => t <= y - 4);
    // regla
    add("line", { x1: 110, y1: 46, x2: 110, y2: 380, stroke: "#E4DAC4", "stroke-width": 4, "stroke-linecap": "round" });
    const relleno = add("line", { x1: 110, y1: 380, x2: 110, y2: 380, stroke: C.hojaD, "stroke-width": 4, "stroke-linecap": "round" });
    [0, 1, 2, 3, 4, 5].forEach(i => add("circle", { cx: 110, cy: 380 - 334 * i / 5, r: 1.6, fill: "#C9BCA1" }));
    const marca = add("g", {});
    add("ellipse", { cx: 110, cy: 380, rx: 6.2, ry: 8, fill: C.maiz }, marca);
    add("ellipse", { cx: 108.4, cy: 377.6, rx: 2.4, ry: 3.6, fill: C.maizL }, marca);
    add("path", { d: "M106 385 q4 4 8 0 q-4 1.6 -8 0 z", fill: C.maizD }, marca);
    // planta
    const G = add("g", {});
    const id = "pl" + (++uid);
    const defs = add("defs", {}, G);
    defs.innerHTML = `<radialGradient id="${id}"><stop offset="0" stop-color="#F6DC8A" stop-opacity=".9"/><stop offset="1" stop-color="#F6DC8A" stop-opacity="0"/></radialGradient>`;
    const brillo = add("circle", { cx: 52, cy: 210, r: 80, fill: `url(#${id})`, opacity: 0 }, G);
    const tallo = add("g", {}, G);
    add("rect", { x: 48.5, y: 46, width: 7, height: 336, rx: 3.5, fill: C.hojaD }, tallo);
    add("rect", { x: 49.5, y: 46, width: 2.4, height: 336, rx: 1.2, fill: C.hoja }, tallo);
    [330, 282, 234, 186, 140, 96].forEach(y => add("rect", { x: 48, y, width: 8, height: 3, rx: 1.5, fill: C.hojaDD, opacity: .6 }, tallo));
    const hojas = [];
    [374, 366, 338, 316, 292, 268, 244, 220, 196, 172, 150, 128, 104].forEach((y, i) => {
      const lado = i % 2 ? 1 : -1, baja = i < 2, len = baja ? 17 : 46 - i * 1.4, ex = 52 + lado * len, cae = baja ? 2 : 4 + i * .5;
      const g = add("g", {}, G);
      add("path", { d: `M52 ${y} C ${52 + lado * len * .25} ${y - 26} ${52 + lado * len * .75} ${y - 24} ${ex} ${y - 10 + cae} C ${52 + lado * len * .7} ${y - 13} ${52 + lado * len * .3} ${y - 9} 52 ${y - 2} Z`, fill: baja ? C.hojaL : (i % 4 < 2 ? C.hoja : C.hojaD) }, g);
      add("path", { d: `M52 ${y - 1} C ${52 + lado * len * .3} ${y - 20} ${52 + lado * len * .7} ${y - 19} ${ex - lado * 2} ${y - 10 + cae}`, stroke: baja ? "#A9D58C" : C.hojaL, "stroke-width": 1, fill: "none", opacity: .7 }, g);
      g.dataset.st = Math.max(0, etapaDe(y)); g.dataset.side = lado; hojas.push(g);
    });
    const choclo = add("g", {}, G); choclo.innerHTML = `
      <path d="M58 228 C 66 222 72 206 70 190 C 66 196 61 208 58 228 Z" fill="${C.hoja}"/>
      <ellipse cx="63" cy="205" rx="6.4" ry="15.5" transform="rotate(14 63 205)" fill="${C.maiz}"/>
      <ellipse cx="61.6" cy="203" rx="2.6" ry="12" transform="rotate(14 61.6 203)" fill="${C.maizL}"/>
      <path d="M66 190 q2 -8 7 -12 M64.5 190 q0 -8 3 -13 M67 191 q5 -5 10 -6" stroke="#B9744E" stroke-width="1.2" fill="none" stroke-linecap="round"/>
      <path d="M56 230 C 56 214 58 200 64 192 C 62 206 62 218 63 230 Z" fill="${C.hojaD}"/>`; choclo.dataset.st = 4;
    const panoja = add("g", {}, G); panoja.innerHTML = `
      <path d="M52 50 L52 20 M52 46 Q44 34 37 30 M52 46 Q60 34 67 30 M52 48 Q42 42 33 42 M52 48 Q62 42 71 42" stroke="${C.trigoD}" stroke-width="2.6" fill="none" stroke-linecap="round"/>
      <path d="M52 22 L52 16 M37 30 l-3 -2 M67 30 l3 -2 M33 42 l-3 0 M71 42 l3 0" stroke="${C.trigoL}" stroke-width="2.6" stroke-linecap="round"/>
      ${[[52, 26], [52, 34], [44, 36], [60, 36], [40, 44], [64, 44]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.4" fill="${C.trigoL}"/>`).join("")}`; panoja.dataset.st = 5;
    // surco
    add("path", { d: "M4 418 C 6 392 26 378 52 378 C 78 378 98 392 100 418 Z", fill: C.tierra });
    add("path", { d: "M14 392 C 24 382 38 379 52 379 C 66 379 80 382 90 392 C 76 386 64 384 52 384 C 40 384 28 386 14 392 Z", fill: C.tierraL });
    add("path", { d: "M70 396 C 84 400 94 408 98 418 L 84 418 C 82 408 78 402 70 396 Z", fill: C.tierraD, opacity: .7 });
    [[26, 402, 2.6], [40, 410, 1.8], [64, 404, 2.2], [78, 412, 1.6], [34, 392, 1.4]].forEach(([x, y, r]) => add("ellipse", { cx: x, cy: y, rx: r * 1.4, ry: r, fill: C.tierraD, opacity: .55 }));
    const partes = [...hojas, choclo, panoja];
    gsap.set(tallo, { transformOrigin: "50% 100%", scaleY: (382 - TOP[0]) / 336 });
    hojas.forEach(l => gsap.set(l, { transformOrigin: l.dataset.side > 0 ? "0% 100%" : "100% 100%", scale: .001 }));
    gsap.set(choclo, { transformOrigin: "0% 100%", scale: .001 }); gsap.set(panoja, { transformOrigin: "50% 100%", scale: .001 });
    let actual = -1;
    function set(etapa, inst = false) {
      const d = inst || reduce ? 0 : 1;
      gsap.to(tallo, { scaleY: (382 - TOP[etapa]) / 336, duration: d * .9, ease: "elastic.out(1,.55)" });
      let k = 0;
      partes.forEach(p => {
        const quiero = +p.dataset.st <= etapa;
        if (inst || quiero !== (+p.dataset.st <= actual)) gsap.to(p, { scale: quiero ? 1 : .001, duration: d * .7, delay: d * (.2 + (k++) * .04), ease: quiero ? "back.out(1.8)" : "power2.in" });
      });
      const y = 380 - 334 * etapa / 5;
      gsap.to(relleno, { attr: { y2: y }, duration: d * .9, ease: "power2.out" });
      gsap.to(marca, { y: y - 380, duration: d * .9, ease: "back.out(1.4)" });
      if (d && etapa > actual) {
        gsap.fromTo(brillo, { opacity: .7, scale: .5, transformOrigin: "50% 50%" }, { opacity: 0, scale: 1.3, duration: 1, ease: "power2.out" });
        gsap.fromTo(G, { rotation: -3, svgOrigin: "52 380" }, { rotation: 0, svgOrigin: "52 380", duration: 1.2, ease: "elastic.out(1,.35)" });
      }
      actual = etapa;
    }
    return { set };
  }

  /* =====================================================================
     PORTADA — tarde en un lote de trigo: monte y molino al fondo,
     rastrojo detrás de la cosechadora, trigo en pie delante, Holandos.
     ===================================================================== */
  function hero(H) {
    const add = (t, a, p = H) => el(t, a, p);
    const id = "h" + (++uid);
    const loop = (t, v) => reduce ? null : gsap.to(t, Object.assign({ yoyo: true, repeat: -1, ease: "sine.inOut" }, v));
    H.innerHTML = `<defs>
      <linearGradient id="${id}c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D5E4E2"/><stop offset=".75" stop-color="#F4EBD3"/><stop offset="1" stop-color="#F8E6BE"/></linearGradient>
      <radialGradient id="${id}s"><stop offset="0" stop-color="#FFF0BF" stop-opacity=".95"/><stop offset="1" stop-color="#FFF0BF" stop-opacity="0"/></radialGradient>
      <linearGradient id="${id}t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E5BC58"/><stop offset="1" stop-color="#C99634"/></linearGradient>
      <linearGradient id="${id}p" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#A9BF76"/><stop offset="1" stop-color="#8AA65E"/></linearGradient></defs>
      <rect width="600" height="230" fill="url(#${id}c)"/>`;
    const halo = add("circle", { cx: 468, cy: 84, r: 70, fill: `url(#${id}s)` });
    add("circle", { cx: 468, cy: 84, r: 17, fill: "#FBE4A2" });
    loop(halo, { scale: 1.08, transformOrigin: "50% 50%", duration: 4 });
    const nubes = add("g", {});
    nubes.innerHTML = `
      <g><path d="M92 50 h86 c0 -8 -8 -13 -17 -11 c-3 -10 -18 -13 -26 -5 c-7 -6 -20 -3 -21 6 c-12 -2 -22 4 -22 10 z" fill="#FFFFFF" opacity=".9"/><path d="M92 50 h86 c-6 3 -76 3 -86 0 z" fill="#E8EEEA"/></g>
      <g><path d="M318 64 h62 c0 -6 -6 -10 -13 -8 c-3 -8 -15 -9 -20 -3 c-6 -4 -15 -1 -15 5 c-9 -1 -14 3 -14 6 z" fill="#FFFFFF" opacity=".85"/></g>`;
    [...nubes.children].forEach((n, i) => loop(n, { x: 28 + i * 10, duration: 9 + i * 2, delay: i * 1.5 }));
    // fondo: montes de estancia y molino (más fríos y claros)
    const fondo = add("g", {});
    fondo.innerHTML = `
      <path d="M0 116 C 20 100 40 104 52 96 C 64 86 84 90 92 98 C 104 92 120 96 128 106 C 140 102 156 106 162 116 Z" fill="#A9BBA1"/>
      <path d="M262 116 C 270 106 284 106 290 100 C 300 94 314 98 318 106 C 326 104 334 110 336 116 Z" fill="#B5C4AC"/>
      <path d="M420 116 C 428 102 446 100 456 106 C 466 98 482 100 488 110 C 494 108 500 112 502 116 Z" fill="#A9BBA1"/>
      <path d="M545 116 L552 66 L556 66 L563 116 Z M548 96 h12" stroke="#8E9E94" stroke-width="1.6" fill="none"/>
      <path d="M554 64 L572 61 L572 67 Z" fill="#8E9E94"/>`;
    const aspas = add("g", {});
    aspas.innerHTML = Array.from({ length: 8 }, (_, i) => `<rect x="553.4" y="52" width="1.6" height="12" fill="#8E9E94" transform="rotate(${i * 45} 554.2 64)"/>`).join("") + `<circle cx="554.2" cy="64" r="2" fill="#7E8E84"/>`;
    if (!reduce) gsap.to(aspas, { rotation: 360, svgOrigin: "554.2 64", duration: 7, repeat: -1, ease: "none" });
    add("rect", { y: 113, width: 600, height: 8, fill: "#DCC98B" });
    // lote: rastrojo (cosechado) a la izquierda, trigo en pie a la derecha
    add("rect", { y: 119, width: 600, height: 60, fill: `url(#${id}t)` });
    const rastrojo = add("path", { d: "M0 119 L212 119 L206 179 L0 179 Z", fill: "#E2C985" });
    for (let y = 124; y < 180; y += 7) add("line", { x1: 0, y1: y, x2: 208 - (y - 119) * .1, y2: y, stroke: "#CDAE62", "stroke-width": 1.4, opacity: .7 });
    const campo = add("g", {}); const tallos = [];
    [[126, 15, .65, "#C69A3C"], [146, 21, .82, null], [170, 27, 1, null]].forEach(([y, h, s, lejos]) => {
      for (let x = 214 + s * 4; x < 606; x += 7.5 * s) {
        const g = el("g", {}, campo), hh = h * rand(.86, 1.12), cl = lejos || [C.trigo, C.trigoL, C.trigo][Math.floor(rand(0, 3))];
        el("line", { x1: x, y1: y, x2: x, y2: y - hh, stroke: C.trigoD, "stroke-width": 1.3 * s }, g);
        el("ellipse", { cx: x + .5 * s, cy: y - hh - 3.6 * s, rx: 2.4 * s, ry: 5.8 * s, fill: C.trigoD }, g);
        el("ellipse", { cx: x - .3 * s, cy: y - hh - 4.2 * s, rx: 1.8 * s, ry: 5 * s, fill: cl }, g);
        tallos.push(g);
      }
    });
    gsap.set(tallos, { transformOrigin: "50% 100%" });
    loop(tallos, { rotation: 5, duration: 1.8, stagger: { each: .01, from: "end" } });
    // primer plano: pastura y alambrado
    add("path", { d: "M0 176 C 120 170 260 174 380 171 C 470 169 540 172 600 170 L600 230 L0 230 Z", fill: `url(#${id}p)` });
    add("path", { d: "M0 176 C 120 170 260 174 380 171 C 470 169 540 172 600 170 L600 174 C 540 176 470 173 380 175 C 260 178 120 174 0 180 Z", fill: "#BBCB8A" });
    const alambre = add("g", {});
    alambre.innerHTML = [258, 300, 342, 384, 426, 468, 510, 552, 594].map(x => `<rect x="${x}" y="158" width="3" height="20" rx="1" fill="#8B6E4E"/>`).join("") + `<path d="M250 163 H600 M250 170 H600" stroke="#7A6450" stroke-width=".7" opacity=".7"/>`;
    [[30, 208], [140, 214], [250, 222], [520, 216]].forEach(([x, y]) => add("path", { d: `M${x} ${y} q2 -8 4 0 q2 -10 4 0 q2 -7 4 0 z`, fill: "#7F9A55" }));
    // cosechadora
    const comb = add("g", { transform: "translate(80 190) scale(1.18)" });
    comb.innerHTML = cosechadoraSVG();
    if (!reduce) {
      gsap.to(comb.querySelector(".body"), { y: -1, duration: .14, yoyo: true, repeat: -1, ease: "sine.inOut" });
      gsap.to(comb.querySelector(".reel"), { rotation: 360, svgOrigin: `${MOLINETE.x} ${MOLINETE.y}`, duration: 3, repeat: -1, ease: "none" });
      // paja que sale por detrás (movimiento secundario)
      for (let i = 0; i < 7; i++) {
        const b = add("rect", { x: 0, y: 0, width: 4, height: 1.4, rx: .7, fill: i % 2 ? C.trigoL : "#F6E3A6" });
        gsap.fromTo(b, { x: 82, y: 168, rotation: 0, opacity: .9 }, { x: () => rand(20, 60), y: () => rand(150, 172), rotation: rand(-160, 160), opacity: 0, duration: rand(1.2, 1.8), delay: i * .25, repeat: -1, ease: "power1.out" });
      }
    }
    // Holandos
    [[352, 140, .6, 1], [452, 150, .7, 0]].forEach(([x, y, s, sp], i) => {
      const g = add("g", { transform: `translate(${x} ${y}) scale(${s})` });
      g.innerHTML = `<ellipse cx="104" cy="96" rx="50" ry="4.5" fill="#3E5228" opacity=".2"/>` + cuerpoVaca(sp);
      prepararParpados(g);
      if (!reduce) {
        gsap.to(g.querySelector(".head"), { rotation: i ? 5 : -5, svgOrigin: "44 50", duration: 2 + i * .5, yoyo: true, repeat: -1, ease: "sine.inOut" });
        gsap.to(g.querySelector(".tail"), { rotation: 16, svgOrigin: "151 40", duration: .6, yoyo: true, repeat: -1, ease: "sine.inOut", delay: i * .3 });
        setInterval(() => parpadear(g), 2800 + i * 1100);
      }
    });
    // teros
    if (!reduce) [0, 1].forEach(i => {
      const p = add("path", { d: "M0 0 q4 -4 8 0 q4 -4 8 0", stroke: "#5D5149", "stroke-width": 1.5, fill: "none", "stroke-linecap": "round" });
      gsap.fromTo(p, { x: -30 - i * 24, y: 58 + i * 8 }, { x: 640, y: 34 + i * 6, duration: 13, delay: i * .6, repeat: -1, ease: "none" });
      gsap.to(p, { scaleY: -.4, transformOrigin: "50% 50%", duration: .22 + i * .04, yoyo: true, repeat: -1, ease: "sine.inOut" });
    });
  }

  /* ---------- Vaca mascota ---------- */
  function mascota(box) {
    box.innerHTML = `<svg viewBox="0 0 100 100" overflow="visible" aria-hidden="true"><ellipse cx="50" cy="96" rx="24" ry="3.5" fill="#2A1E15" opacity=".12"/>${cabezaVaca()}</svg>`;
    const cv = box.querySelector(".cv");
    prepararParpados(box);
    setInterval(() => { if (box.offsetParent) parpadear(box); }, 3400);
    document.addEventListener("pointermove", e => {
      const r = box.getBoundingClientRect(); if (!r.width) return;
      const dx = Math.max(-1, Math.min(1, (e.clientX - r.left - r.width / 2) / 220)), dy = Math.max(-1, Math.min(1, (e.clientY - r.top - r.height / 2) / 220));
      gsap.to(box.querySelectorAll(".pupil"), { x: dx * 1.8, y: dy * 2, duration: .25, ease: "power2.out", overwrite: "auto" });
    });
    return {
      normal() {
        cara(box, "idle");
        if (reduce) return;
        gsap.fromTo(box, { y: 46, rotation: -14, opacity: 0 }, { y: 0, rotation: 0, opacity: 1, duration: .45, delay: .15, ease: "back.out(1.7)" });
      },
      feliz() {
        cara(box, "happy");
        if (reduce) return;
        gsap.timeline()
          .to(cv, { scaleY: .9, scaleX: 1.06, svgOrigin: "50 88", duration: .09, ease: "power2.in" })
          .to(box, { y: -22, duration: .22, ease: "power2.out" })
          .to(cv, { scaleY: 1.05, scaleX: .97, svgOrigin: "50 88", duration: .18, ease: "power2.out" }, "<")
          .to(box, { y: 0, duration: .26, ease: "power2.in" })
          .to(cv, { scaleY: 1, scaleX: 1, svgOrigin: "50 88", duration: .35, ease: "back.out(3)" });
        for (let i = 0; i < 4; i++) {
          const h = document.createElement("div"); h.innerHTML = corazon();
          h.style.cssText = "position:absolute;right:34px;top:4px;z-index:4;pointer-events:none"; box.parentElement.appendChild(h);
          gsap.fromTo(h, { x: 0, y: 0, scale: .4, opacity: 1 }, { x: rand(-56, 24), y: rand(-86, -54), rotation: rand(-20, 20), scale: rand(.8, 1.2), opacity: 0, duration: 1.1, delay: .1 + i * .08, ease: "power2.out", onComplete: () => h.remove() });
        }
      },
      triste() {
        cara(box, "sad");
        if (reduce) return;
        gsap.timeline()
          .to(cv, { y: 4, rotation: -4, svgOrigin: "50 88", duration: .5, ease: "power2.out" })
          .to(cv, { rotation: 4, svgOrigin: "50 88", duration: .5, ease: "sine.inOut" })
          .to(cv, { y: 0, rotation: 0, svgOrigin: "50 88", duration: .6, ease: "sine.inOut" });
      }
    };
  }

  /* ---------- Vacas que cruzan corriendo ---------- */
  function vacaCorre(capa, demora = 0, tono = 1) {
    if (reduce) return;
    const d = document.createElement("div"); d.className = "runner";
    d.innerHTML = `<svg viewBox="0 0 160 110" overflow="visible">${cuerpoVaca(Math.random() < .5)}</svg>`; capa.appendChild(d);
    const w = d.offsetWidth, A = d.querySelectorAll(".lg.a"), B = d.querySelectorAll(".lg.b");
    prepararParpados(d); cara(d, "happy");
    const svg = d.querySelector("svg");
    gsap.set(A, { transformOrigin: "50% 8%", rotation: 24 }); gsap.set(B, { transformOrigin: "50% 8%", rotation: -24 });
    const P = .17;
    const t1 = gsap.to([...A], { rotation: -24, duration: P, yoyo: true, repeat: -1, ease: "sine.inOut" });
    const t2 = gsap.to([...B], { rotation: 24, duration: P, yoyo: true, repeat: -1, ease: "sine.inOut" });
    const t3 = gsap.to(svg, { y: -14, duration: P, yoyo: true, repeat: -1, ease: "power1.out" });
    const t4 = gsap.to(svg, { rotation: -3, transformOrigin: "50% 80%", duration: P * 2, yoyo: true, repeat: -1, ease: "sine.inOut" });
    const t5 = gsap.to(d.querySelector(".tail"), { rotation: -30, svgOrigin: "151 40", duration: P, yoyo: true, repeat: -1, ease: "sine.inOut" });
    gsap.fromTo(d, { x: innerWidth + 20 }, { x: -w - 40, duration: 2.6, delay: demora, ease: "none", onStart: () => sfx.moo && sfx.moo(tono), onComplete: () => { [t1, t2, t3, t4, t5].forEach(t => t.kill()); d.remove(); } });
  }

  /* ---------- Regalo, rayos, estrellas, corazón ---------- */
  function regalo(svg) {
    svg.innerHTML = `
      <ellipse cx="75" cy="143" rx="54" ry="5" fill="#2A1E15" opacity=".14"/>
      <rect x="26" y="66" width="98" height="74" rx="5" fill="${C.lad}"/>
      <path d="M108 66 h11 q5 0 5 5 v64 q0 5 -5 5 h-11 z" fill="${C.ladD}"/>
      <rect x="26" y="66" width="98" height="9" fill="${C.ladD}" opacity=".55"/>
      <rect x="66" y="66" width="18" height="74" fill="${C.maiz}"/><rect x="75" y="66" width="9" height="74" fill="${C.maizD}"/>
      <rect x="66" y="66" width="18" height="9" fill="${C.maizDD}" opacity=".45"/>
      <g class="lid">
        <rect x="18" y="44" width="114" height="25" rx="5" fill="${C.ladL}"/>
        <path d="M118 44 h9 q5 0 5 5 v15 q0 5 -5 5 h-9 z" fill="${C.lad}"/>
        <rect x="18" y="44" width="114" height="5" rx="2.5" fill="#E07A5E"/>
        <rect x="66" y="44" width="18" height="25" fill="${C.maizL}"/><rect x="75" y="44" width="9" height="25" fill="${C.maiz}"/>
        <path d="M75 44 C 60 24 36 10 28 22 C 22 33 40 42 75 44 Z" fill="${C.maiz}"/>
        <path d="M75 44 C 90 24 114 10 122 22 C 128 33 110 42 75 44 Z" fill="${C.maizD}"/>
        <path d="M75 44 C 62 32 44 22 37 25 C 44 32 60 40 75 44 Z" fill="${C.maizDD}" opacity=".45"/>
        <path d="M75 44 C 88 32 106 22 113 25 C 106 32 90 40 75 44 Z" fill="${C.maizDD}" opacity=".55"/>
        <path d="M32 21 C 36 16 46 16 54 22" stroke="${C.maizL}" stroke-width="2.6" fill="none" stroke-linecap="round"/>
        <path d="M70 46 L58 66 L64 66 L72 50 Z" fill="${C.maizD}"/><path d="M80 46 L92 66 L86 66 L78 50 Z" fill="${C.maizDD}"/>
        <ellipse cx="75" cy="43" rx="8" ry="6.5" fill="${C.maizL}"/><ellipse cx="76.5" cy="44.2" rx="5" ry="4.2" fill="${C.maiz}"/>
      </g>`;
    return svg.querySelector(".lid");
  }
  function rayos(svg) {
    svg.innerHTML = Array.from({ length: 16 }, (_, i) => { const a = i * Math.PI / 8, w = i % 2 ? .07 : .12, r = i % 2 ? 120 : 150;
      return `<path d="M0 0 L${Math.cos(a - w) * r} ${Math.sin(a - w) * r} L${Math.cos(a + w) * r} ${Math.sin(a + w) * r} z" fill="${i % 2 ? C.maizL : C.maiz}"/>`; }).join("")
      + `<circle r="46" fill="#FFF2C6" opacity=".7"/>`;
  }
  const estrella = llena => llena
    ? `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1.8l3.1 6.6 7.2.9-5.3 4.9 1.4 7.2L12 17.9l-6.4 3.5 1.4-7.2L1.7 9.3l7.2-.9z" fill="${C.maiz}"/><path d="M12 1.8 L12 17.9 L5.6 21.4 7 14.2 1.7 9.3 8.9 8.4z" fill="${C.maizL}"/><path d="M12 17.9 L18.4 21.4 17 14.2 22.3 9.3 12 12z" fill="${C.maizD}" opacity=".55"/></svg>`
    : `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1.8l3.1 6.6 7.2.9-5.3 4.9 1.4 7.2L12 17.9l-6.4 3.5 1.4-7.2L1.7 9.3l7.2-.9z" fill="#EAE1CD"/><path d="M12 1.8 L12 17.9 L5.6 21.4 7 14.2 1.7 9.3 8.9 8.4z" fill="#F1EADB"/></svg>`;
  const corazon = () => `<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11z" fill="${C.lad}"/><path d="M8.5 7.2 a2.6 2.6 0 0 0 -2.4 2.6" stroke="${C.ladL}" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>`;

  window.ILU = {
    init(o) { gsap = o.gsap; reduce = !!o.reduce; sfx = o.sfx || {}; },
    hero, planta, mascota, vacaCorre, cosecha, regalo, rayos, estrella, corazon,
    colores: [C.maiz, C.maizL, C.hojaD, C.lad, C.hoja, "#FBF8F1"]
  };
})();
