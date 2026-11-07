/* =====================================================================
   Agro y Mercado · El desafío de la cosecha — ILUSTRACIONES Y ESCENAS
   ---------------------------------------------------------------------
   Todo lo que se VE y se MUEVE vive en este archivo: la escena de
   inicio, la planta lateral, la vaca mascota, las vacas que corren,
   la cosechadora que cruza la pantalla, el regalo y las estrellas.

   La lógica del juego (preguntas, puntos, agentes, mail) está en
   juego.js y solo usa la interfaz de abajo (window.ILU). Para rediseñar
   el estilo se puede reescribir este archivo y juego.css por completo,
   siempre que se respete la misma interfaz:

     ILU.init({ gsap, reduce, sfx })
     ILU.hero(svg)                    escena de la portada
     ILU.planta(svg) -> { set(etapa 0..5, instantaneo) }
     ILU.mascota(el) -> { feliz(), triste(), normal() }
     ILU.vacaCorre(capa, demora, tono)
     ILU.cosecha(canvas, alTapar) -> Promise   transición a pantalla completa
     ILU.regalo(svg) -> { abrir(timeline) }   (devuelve la tapa para animarla)
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

  /* ---------- Vaca (cabeza de frente, dos ojos) ---------- */
  function cabezaVaca() {
    return `
    <path d="M30 22 q-6 -12 -14 -14 q6 8 6 18 z M70 22 q6 -12 14 -14 q-6 8 -6 18 z" fill="#E8D9B0" stroke="#2A1E15" stroke-width="2.5" stroke-linejoin="round"/>
    <g><ellipse cx="14" cy="40" rx="15" ry="8" transform="rotate(-20 14 40)" fill="#FBF7EF" stroke="#2A1E15" stroke-width="2.5"/><ellipse cx="14" cy="40" rx="8" ry="3.5" transform="rotate(-20 14 40)" fill="#F2B8A6"/></g>
    <g><ellipse cx="86" cy="40" rx="15" ry="8" transform="rotate(20 86 40)" fill="#FBF7EF" stroke="#2A1E15" stroke-width="2.5"/><ellipse cx="86" cy="40" rx="8" ry="3.5" transform="rotate(20 86 40)" fill="#F2B8A6"/></g>
    <rect x="22" y="18" width="56" height="70" rx="26" fill="#FBF7EF" stroke="#2A1E15" stroke-width="2.5"/>
    <path d="M52 19 q20 2 26 20 q-12 8 -24 -2 q-6 -8 -2 -18 z" fill="#4A3426"/>
    <g><circle cx="39" cy="45" r="7.5" fill="#fff" stroke="#2A1E15" stroke-width="2"/><circle class="pupil" cx="40" cy="46" r="4.2" fill="#2A1E15"/><circle cx="41.5" cy="44" r="1.5" fill="#fff"/></g>
    <g><circle cx="61" cy="45" r="7.5" fill="#fff" stroke="#2A1E15" stroke-width="2"/><circle class="pupil" cx="62" cy="46" r="4.2" fill="#2A1E15"/><circle cx="63.5" cy="44" r="1.5" fill="#fff"/></g>
    <rect class="lid" x="30" y="36" width="40" height="19" fill="#FBF7EF"/>
    <path class="brows" d="M31 35 l12 4 M69 35 l-12 4" stroke="#2A1E15" stroke-width="2.5" stroke-linecap="round" opacity="0"/>
    <ellipse cx="31" cy="58" rx="5" ry="3" fill="#F2B8A6" opacity=".7"/><ellipse cx="69" cy="58" rx="5" ry="3" fill="#F2B8A6" opacity=".7"/>
    <ellipse cx="50" cy="72" rx="25" ry="16" fill="#F2B8A6" stroke="#2A1E15" stroke-width="2.5"/>
    <ellipse cx="41" cy="69" rx="3.5" ry="4.5" fill="#2A1E15"/><ellipse cx="59" cy="69" rx="3.5" ry="4.5" fill="#2A1E15"/>
    <path class="m-idle" d="M43 79 q7 4 14 0" stroke="#2A1E15" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <path class="m-happy" d="M40 77 q10 12 20 0 z" fill="#A3361F" stroke="#2A1E15" stroke-width="2.2" stroke-linejoin="round" opacity="0"/>
    <path class="m-sad" d="M43 82 q7 -5 14 0" stroke="#2A1E15" stroke-width="2.5" fill="none" stroke-linecap="round" opacity="0"/>`;
  }
  function cuerpoVaca(manchas) {
    return `
    <g>
      <rect class="lg a" x="58" y="62" width="9" height="34" rx="4" fill="#FBF7EF" stroke="#2A1E15" stroke-width="2.5"/>
      <rect class="lg b" x="74" y="62" width="9" height="34" rx="4" fill="#FBF7EF" stroke="#2A1E15" stroke-width="2.5"/>
      <rect class="lg b" x="118" y="62" width="9" height="34" rx="4" fill="#FBF7EF" stroke="#2A1E15" stroke-width="2.5"/>
      <rect class="lg a" x="134" y="62" width="9" height="34" rx="4" fill="#FBF7EF" stroke="#2A1E15" stroke-width="2.5"/>
    </g>
    <path class="tail" d="M150 42 q14 6 10 28" stroke="#2A1E15" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="160" cy="72" r="4" fill="#2A1E15"/>
    <rect x="50" y="30" width="104" height="44" rx="22" fill="#FBF7EF" stroke="#2A1E15" stroke-width="2.5"/>
    ${manchas ? `<path d="M100 31 q18 -2 22 14 q-14 12 -24 -2 z" fill="#4A3426"/><path d="M68 50 q12 -6 16 6 q-6 12 -16 6 z" fill="#4A3426"/>`
              : `<path d="M86 31 q22 0 24 16 q-16 10 -26 -4 z" fill="#4A3426"/><path d="M128 52 q12 -6 18 4 q-8 12 -18 4 z" fill="#4A3426"/>`}
    <ellipse cx="118" cy="74" rx="9" ry="5" fill="#F2B8A6" stroke="#2A1E15" stroke-width="2"/>
    <g class="head" transform="scale(.66)">${cabezaVaca()}</g>`;
  }
  function cara(root, animo) {
    const set = (c, v) => root.querySelectorAll(c).forEach(e => e.setAttribute("opacity", v));
    set(".m-idle", animo === "idle" ? 1 : 0); set(".m-happy", animo === "happy" ? 1 : 0);
    set(".m-sad", animo === "sad" ? 1 : 0); set(".brows", animo === "sad" ? 1 : 0);
  }
  function parpadear(root) {
    const lid = root.querySelectorAll(".lid");
    gsap.timeline().to(lid, { scaleY: 1, duration: .07 }).to(lid, { scaleY: 0, duration: .1 });
  }
  function prepararParpados(root) { gsap.set(root.querySelectorAll(".lid"), { scaleY: 0, transformOrigin: "50% 0%" }); }

  /* ---------- Cosechadora (SVG para la portada) ---------- */
  function cosechadoraSVG() {
    return `<g class="body">
      <line x1="22" y1="-48" x2="-12" y2="-64" stroke="#7A5C0E" stroke-width="5" stroke-linecap="round"/>
      <rect x="14" y="-58" width="38" height="14" rx="2" fill="#C08A2A" stroke="#2A1E15" stroke-width="1.6"/>
      <rect x="4" y="-46" width="72" height="32" rx="5" fill="#D9A23A" stroke="#2A1E15" stroke-width="1.6"/>
      <rect x="4" y="-31" width="72" height="4" fill="#A3361F"/>
      <rect x="40" y="-74" width="3.5" height="18" fill="#2A1E15"/>
      <rect x="52" y="-68" width="24" height="26" rx="3" fill="#2A1E15"/>
      <rect x="55" y="-65" width="18" height="15" rx="2" fill="#A9CCD0"/>
      <circle cx="63" cy="-56" r="3.6" fill="#E8B48A"/><rect x="58.5" y="-62" width="9" height="3" rx="1" fill="#7A5C0E"/>
      <polygon points="74,-36 86,-30 86,-14 74,-14" fill="#B98A26" stroke="#2A1E15" stroke-width="1.6"/>
      <rect x="84" y="-22" width="20" height="15" rx="2" fill="#A3361F" stroke="#2A1E15" stroke-width="1.6"/>
      <g class="reel"><circle cx="93" cy="-30" r="11" fill="none" stroke="#2A1E15" stroke-width="1.8"/><path d="M82 -30 h22 M93 -41 v22" stroke="#2A1E15" stroke-width="1.8"/></g>
      <g><circle cx="58" cy="-12" r="13" fill="#2A1E15"/><circle cx="58" cy="-12" r="5" fill="#E6CA78"/></g>
      <g><circle cx="18" cy="-8" r="8" fill="#2A1E15"/><circle cx="18" cy="-8" r="3" fill="#E6CA78"/></g></g>`;
  }

  /* ---------- Cosechadora (canvas, para la transición) ---------- */
  const FRENTE = 104, ANCHO = 120;
  function dibujarCosechadora(c, fx, by, s, t) {
    c.save(); c.translate(fx - FRENTE * s, by + Math.sin(t / 40) * s * .4); c.scale(s, s);
    c.fillStyle = "rgba(42,30,21,.22)"; c.beginPath(); c.ellipse(50, 1, 58, 4, 0, 0, 7); c.fill();
    c.lineJoin = "round"; c.strokeStyle = "#2A1E15"; c.lineWidth = 1.6;
    const rr = (x, y, w, h, r, f) => { c.beginPath(); c.roundRect ? c.roundRect(x, y, w, h, r) : c.rect(x, y, w, h); c.fillStyle = f; c.fill(); c.stroke(); };
    c.save(); c.strokeStyle = "#7A5C0E"; c.lineWidth = 5; c.lineCap = "round"; c.beginPath(); c.moveTo(22, -48); c.lineTo(-12, -64); c.stroke(); c.restore();
    rr(14, -58, 38, 14, 2, "#C08A2A"); rr(4, -46, 72, 32, 5, "#D9A23A");
    c.fillStyle = "#A3361F"; c.fillRect(4.8, -31, 70.4, 4);
    c.fillStyle = "#2A1E15"; c.fillRect(40, -74, 3.5, 18);
    rr(52, -68, 24, 26, 3, "#2A1E15"); c.fillStyle = "#A9CCD0"; c.fillRect(55, -65, 18, 15);
    c.fillStyle = "#E8B48A"; c.beginPath(); c.arc(63, -56, 3.6, 0, 7); c.fill(); c.fillStyle = "#7A5C0E"; c.fillRect(58.5, -62, 9, 3);
    c.beginPath(); c.moveTo(74, -36); c.lineTo(86, -30); c.lineTo(86, -14); c.lineTo(74, -14); c.closePath(); c.fillStyle = "#B98A26"; c.fill(); c.stroke();
    rr(84, -22, 20, 15, 2, "#A3361F");
    c.fillStyle = "#2A1E15"; for (let k = 0; k < 5; k++) { c.beginPath(); c.moveTo(104, -21 + k * 3); c.lineTo(108, -19.5 + k * 3); c.lineTo(104, -18 + k * 3); c.fill(); }
    const rueda = (x, y, r, rot, hub) => { c.save(); c.translate(x, y); c.rotate(rot); c.fillStyle = "#2A1E15"; c.beginPath(); c.arc(0, 0, r, 0, 7); c.fill(); c.strokeStyle = "#5E4E41"; c.lineWidth = 1.6; c.beginPath(); c.moveTo(-r * .7, 0); c.lineTo(r * .7, 0); c.moveTo(0, -r * .7); c.lineTo(0, r * .7); c.stroke(); c.fillStyle = "#E6CA78"; c.beginPath(); c.arc(0, 0, hub, 0, 7); c.fill(); c.restore(); };
    rueda(58, -12, 13, t / 70, 5); rueda(18, -8, 8, t / 45, 3);
    c.save(); c.translate(93, -30); c.rotate(t / 90); c.strokeStyle = "#2A1E15"; c.lineWidth = 1.8; c.beginPath(); c.arc(0, 0, 11, 0, 7); c.stroke();
    for (let k = 0; k < 4; k++) { c.rotate(Math.PI / 4); c.beginPath(); c.moveTo(-11, 0); c.lineTo(11, 0); c.stroke(); } c.restore();
    c.restore();
  }
  function texturaTrigo(W, H, dpr) {
    const o = document.createElement("canvas"); o.width = W * dpr; o.height = H * dpr; const c = o.getContext("2d"); c.scale(dpr, dpr);
    c.fillStyle = "#C9A04A"; c.fillRect(0, 14, W, H);
    const cols = ["#E8C25A", "#DDB24C", "#F0CF6A", "#D4A843"];
    for (let y = 18, r = 0; y < H + 30; y += 22, r++) {
      for (let x = -4 + (r % 2) * 4; x < W + 8; x += 8) {
        const j = rand(-3, 3), h = rand(24, 32);
        c.strokeStyle = "#A9852F"; c.lineWidth = 1.4; c.beginPath(); c.moveTo(x, y + h); c.lineTo(x + j, y); c.stroke();
        c.fillStyle = cols[(x * 7 + r) % 4 | 0]; c.beginPath(); c.ellipse(x + j, y - 3, 3, 7.5, j / 10, 0, 7); c.fill();
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
      const s = Math.max(2.4, Math.min(H * .0064, W * .0095)), by = H * .7, combW = ANCHO * s;
      const SUBE = 520, PAUSA = 120, PASA = 2300, FIN = 500;
      const parts = []; let tapado = false; const t0 = performance.now(); let last = t0;
      sfx.whoosh && sfx.whoosh(); setTimeout(() => sfx.engine && sfx.engine((PASA + 200) / 1000), SUBE);
      const ease = p => p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      function emit(type, x, y, n) {
        for (let i = 0; i < n; i++) {
          if (type === "paja") parts.push({ type, x, y: y + rand(-10, 10) * s / 4, vx: -rand(.12, .5), vy: -rand(.02, .28), g: .0006, life: rand(800, 1400), age: 0, r: rand(0, 6), vr: rand(-.02, .02), len: rand(3, 7) * s / 3, c: ["#E8C25A", "#D9B04A", "#F3DD8E"][i % 3] });
          if (type === "grano") parts.push({ type, x, y, vx: -rand(.05, .18), vy: -rand(.05, .2), g: .0009, life: 1100, age: 0, sz: rand(1.6, 3) * s / 3 });
          if (type === "polvo") parts.push({ type, x: x + rand(-10, 10), y, vx: -rand(.02, .08), vy: -rand(.01, .04), g: 0, life: rand(700, 1100), age: 0, sz: rand(8, 16) * s / 3 });
          if (type === "humo") parts.push({ type, x, y, vx: -rand(.02, .06), vy: -rand(.05, .1), g: 0, life: 900, age: 0, sz: rand(4, 7) * s / 3 });
          if (type === "espiga") parts.push({ type, x, y, vx: rand(-.15, .25), vy: -rand(.1, .4), g: .0012, life: rand(600, 1000), age: 0, r: rand(0, 6), vr: rand(-.03, .03), c: ["#E8C25A", "#DDB24C", "#F0CF6A"][i % 3] });
        }
      }
      function frame(now) {
        const t = now - t0, dt = Math.min(40, now - last); last = now;
        g2.clearRect(0, 0, W, H);
        if (t < SUBE) {
          const p = 1 - Math.pow(1 - t / SUBE, 3), y = H * (1 - p) - 14;
          g2.drawImage(tex, 0, 0, tex.width, tex.height, 0, y, W, H);
          g2.fillStyle = "#C9A04A"; g2.fillRect(0, y + H - 2, W, H);
        } else {
          if (!tapado) { tapado = true; alTapar(); }
          const p = Math.min(1, Math.max(0, (t - SUBE - PAUSA) / PASA)), e = ease(p);
          const front = -30 + (W + combW + 60) * e, cut = Math.max(0, Math.min(W, front - 2));
          const shake = p > 0 && p < 1 ? Math.sin(t / 22) * s * .35 : 0;
          g2.save(); g2.translate(0, shake);
          if (cut < W) g2.drawImage(tex, cut * dpr, 0, (W - cut) * dpr, H * dpr, cut, -14, W - cut, H + 14);
          if (p > 0 && p < 1) {
            const back = front - FRENTE * s, k = dt / 16;
            if (front > 0 && front < W + 10) emit("espiga", front, rand(0, H), Math.round(4 * k));
            emit("paja", back + 4 * s, by - 34 * s, Math.round(3 * k));
            emit("grano", back - 12 * s, by - 64 * s, Math.round(2 * k));
            emit("polvo", back + 18 * s, by, Math.round(.6 * k + Math.random()));
            if (Math.random() < .35 * k) emit("humo", back + 41.7 * s, by - 74 * s, 1);
          }
          for (let i = parts.length - 1; i >= 0; i--) {
            const q = parts[i]; q.age += dt; if (q.age > q.life) { parts.splice(i, 1); continue; }
            q.vy += q.g * dt; q.x += q.vx * dt; q.y += q.vy * dt; const a = 1 - q.age / q.life;
            g2.globalAlpha = a;
            if (q.type === "paja") { q.r += q.vr * dt; g2.strokeStyle = q.c; g2.lineWidth = 1.6; g2.beginPath(); g2.moveTo(q.x, q.y); g2.lineTo(q.x + Math.cos(q.r) * q.len, q.y + Math.sin(q.r) * q.len); g2.stroke(); }
            else if (q.type === "grano") { g2.fillStyle = "#C9962E"; g2.beginPath(); g2.arc(q.x, q.y, q.sz, 0, 7); g2.fill(); }
            else if (q.type === "polvo") { g2.globalAlpha = a * .45; g2.fillStyle = "#E3D2A2"; g2.beginPath(); g2.arc(q.x, q.y, q.sz * (2 - a), 0, 7); g2.fill(); }
            else if (q.type === "humo") { g2.globalAlpha = a * .5; g2.fillStyle = "#8A8178"; g2.beginPath(); g2.arc(q.x, q.y, q.sz * (2 - a), 0, 7); g2.fill(); }
            else { q.r += q.vr * dt; g2.save(); g2.translate(q.x, q.y); g2.rotate(q.r); g2.fillStyle = q.c; g2.beginPath(); g2.ellipse(0, 0, 3, 7.5, 0, 0, 7); g2.fill(); g2.restore(); }
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

  /* ---------- Planta lateral (crece con el avance) ---------- */
  function planta(P) {
    const add = (t, a, p = P) => el(t, a, p);
    const TOP = [348, 300, 250, 190, 122, 46];
    const etapaDe = y => TOP.findIndex(t => t <= y - 4);
    add("line", { x1: 110, y1: 46, x2: 110, y2: 380, stroke: "#E2D5BA", "stroke-width": 6, "stroke-linecap": "round" });
    const relleno = add("line", { x1: 110, y1: 380, x2: 110, y2: 380, stroke: "#1E6B3D", "stroke-width": 6, "stroke-linecap": "round" });
    [0, 1, 2, 3, 4, 5].forEach(i => add("line", { x1: 101, x2: 105, y1: 380 - 334 * i / 5, y2: 380 - 334 * i / 5, stroke: "#B9A98E", "stroke-width": 2 }));
    const marca = add("g", {}); add("circle", { cx: 110, cy: 380, r: 8, fill: "#E6CA78", stroke: "#2A1E15", "stroke-width": 2 }, marca);
    const G = add("g", {});
    const brillo = add("circle", { cx: 52, cy: 200, r: 70, fill: "#E6CA78", opacity: 0 }, G);
    const tallo = add("rect", { x: 49.5, y: 46, width: 5, height: 334, rx: 2.5, fill: "#2F7A3E" }, G);
    const hojas = [];
    [374, 368, 338, 316, 292, 268, 244, 220, 196, 172, 150, 128, 104].forEach((y, i) => {
      const lado = i % 2 ? 1 : -1, baja = i < 2, len = baja ? 15 : 42 - i * 1.3, ex = 52 + lado * len;
      const p = add("path", { d: `M52 ${y} Q ${52 + lado * len * .55} ${y - 18} ${ex} ${y - 9} Q ${52 + lado * len * .5} ${y - 4} 52 ${y}`, fill: baja ? "#5BAA5F" : "#3E8E4A", stroke: "#2B6B36", "stroke-width": 1.2 }, G);
      p.dataset.st = Math.max(0, etapaDe(y)); p.dataset.side = lado; hojas.push(p);
    });
    const choclo = add("g", {}, G); choclo.innerHTML = `<ellipse cx="62" cy="208" rx="6" ry="16" fill="#E6CA78" stroke="#7A5C0E" stroke-width="1.2"/><path d="M60 196 v24 M64 196 v24" stroke="#C9A04A" stroke-width="1"/><path d="M55 226 q3 -20 5 -32 q6 12 9 32 z" fill="#3E8E4A" stroke="#2B6B36"/>`; choclo.dataset.st = 4;
    const panoja = add("g", {}, G); panoja.innerHTML = `<path d="M52 48 L52 24 M52 46 L38 28 M52 46 L66 28 M52 47 L32 38 M52 47 L72 38" stroke="#C9A04A" stroke-width="3" stroke-linecap="round"/>`; panoja.dataset.st = 5;
    add("path", { d: "M22 380 h60 l-7 36 h-46 z", fill: "#A3361F", stroke: "#2A1E15", "stroke-width": 2 });
    add("rect", { x: 18, y: 374, width: 68, height: 10, rx: 3, fill: "#B8452A", stroke: "#2A1E15", "stroke-width": 2 });
    add("ellipse", { cx: 52, cy: 376, rx: 30, ry: 4, fill: "#5A3D22" });
    const partes = [...hojas, choclo, panoja];
    gsap.set(tallo, { transformOrigin: "50% 100%", scaleY: (380 - TOP[0]) / 334 });
    hojas.forEach(l => gsap.set(l, { transformOrigin: l.dataset.side > 0 ? "0% 100%" : "100% 100%", scale: 0 }));
    gsap.set(choclo, { transformOrigin: "0% 100%", scale: 0 }); gsap.set(panoja, { transformOrigin: "50% 100%", scale: 0 });
    let actual = -1;
    function set(etapa, inst = false) {
      const d = inst ? 0 : 1;
      gsap.to(tallo, { scaleY: (380 - TOP[etapa]) / 334, duration: d * .9, ease: "elastic.out(1,.6)" });
      partes.forEach((p, i) => {
        const quiero = +p.dataset.st <= etapa;
        if (inst || quiero !== (+p.dataset.st <= actual)) gsap.to(p, { scale: quiero ? 1 : 0, duration: d * .8, delay: d * (.25 + i * .04), ease: "back.out(2.2)" });
      });
      const y = 380 - 334 * etapa / 5;
      gsap.to(relleno, { attr: { y2: y }, duration: d * .9, ease: "power2.out" });
      gsap.to(marca, { y: y - 380, duration: d * .9, ease: "back.out(1.6)" });
      if (!inst && etapa > actual) {
        gsap.fromTo(brillo, { opacity: .5, scale: .4, transformOrigin: "50% 50%" }, { opacity: 0, scale: 1.4, duration: .9 });
        gsap.fromTo(G, { rotation: -4, transformOrigin: "50% 100%" }, { rotation: 0, duration: 1.2, ease: "elastic.out(1,.3)" });
      }
      actual = etapa;
    }
    return { set };
  }

  /* ---------- Portada ---------- */
  function hero(H) {
    const add = (t, a, p = H) => el(t, a, p);
    add("rect", { width: 600, height: 230, fill: "#E3ECDD" });
    const sol = add("circle", { cx: 520, cy: 46, r: 22, fill: "#E6CA78" });
    gsap.to(sol, { scale: 1.12, transformOrigin: "50% 50%", duration: 2, yoyo: true, repeat: -1, ease: "sine.inOut" });
    const nubes = add("g", { fill: "#fff", opacity: .9 });
    nubes.innerHTML = `<g><ellipse cx="120" cy="40" rx="30" ry="11"/><ellipse cx="140" cy="33" rx="20" ry="11"/></g><g><ellipse cx="360" cy="56" rx="26" ry="9"/><ellipse cx="378" cy="50" rx="16" ry="9"/></g>`;
    gsap.to(nubes.children, { x: 40, duration: 9, yoyo: true, repeat: -1, ease: "sine.inOut", stagger: 1.5 });
    const arboles = add("g", { fill: "#6E8F57" }); arboles.innerHTML = `<circle cx="40" cy="98" r="14"/><circle cx="60" cy="93" r="17"/><circle cx="290" cy="96" r="14"/><circle cx="455" cy="97" r="12"/><circle cx="474" cy="92" r="16"/>`;
    add("rect", { y: 100, width: 600, height: 80, fill: "#C7A25A" });
    const campo = add("g", {}); const tallos = [];
    [[122, 20, .75], [142, 25, .88], [168, 30, 1]].forEach(([y, h, s]) => {
      for (let x = 4; x < 600; x += 8 * s) {
        const g = el("g", {}, campo), hh = h * rand(.85, 1.15);
        el("line", { x1: x, y1: y, x2: x, y2: y - hh, stroke: "#A88838", "stroke-width": 1.5 * s }, g);
        el("ellipse", { cx: x, cy: y - hh - 4 * s, rx: 2.4 * s, ry: 6 * s, fill: ["#D4AA48", "#DDB44E", "#E6C25E"][Math.floor(rand(0, 3))] }, g);
        tallos.push(g);
      }
    });
    gsap.set(tallos, { transformOrigin: "50% 100%" });
    gsap.to(tallos, { rotation: 6, duration: 1.4, yoyo: true, repeat: -1, ease: "sine.inOut", stagger: { each: .012, from: "start" } });
    add("rect", { y: 172, width: 600, height: 58, fill: "#93B46C" });
    const comb = add("g", { transform: "translate(70 196) scale(1.15)" });
    comb.innerHTML = cosechadoraSVG();
    gsap.to(comb.querySelector(".body"), { y: -1.5, duration: .12, yoyo: true, repeat: -1 });
    gsap.to(comb.querySelector(".reel"), { rotation: 360, svgOrigin: "93 -30", duration: 2.5, repeat: -1, ease: "none" });
    [[330, 150, .62, 0], [430, 158, .7, 1]].forEach(([x, y, s, sp], i) => {
      const g = add("g", { transform: `translate(${x} ${y}) scale(${s})` }); g.innerHTML = cuerpoVaca(sp);
      prepararParpados(g);
      gsap.to(g.querySelector(".head"), { rotation: i ? 6 : -6, svgOrigin: "33 50", duration: 1.6 + i * .4, yoyo: true, repeat: -1, ease: "sine.inOut" });
      gsap.to(g.querySelector(".tail"), { rotation: 18, svgOrigin: "150 42", duration: .5, yoyo: true, repeat: -1, ease: "sine.inOut", delay: i * .3 });
      setInterval(() => parpadear(g), 2600 + i * 900);
    });
    const pajaro = add("path", { d: "M0 0 q5 -5 10 0 q5 -5 10 0", stroke: "#2A1E15", "stroke-width": 2, fill: "none" });
    gsap.fromTo(pajaro, { x: -30, y: 60 }, { x: 640, y: 30, duration: 11, repeat: -1, ease: "none" });
    gsap.to(pajaro, { scaleY: -.4, transformOrigin: "50% 50%", duration: .25, yoyo: true, repeat: -1 });
  }

  /* ---------- Vaca mascota ---------- */
  function mascota(box) {
    box.innerHTML = `<svg viewBox="0 0 100 100" overflow="visible" aria-hidden="true">${cabezaVaca()}</svg>`;
    prepararParpados(box);
    setInterval(() => { if (box.offsetParent) parpadear(box); }, 3200);
    document.addEventListener("pointermove", e => {
      const r = box.getBoundingClientRect(); if (!r.width) return;
      const dx = Math.max(-1, Math.min(1, (e.clientX - r.left - r.width / 2) / 200)), dy = Math.max(-1, Math.min(1, (e.clientY - r.top - r.height / 2) / 200));
      gsap.to(box.querySelectorAll(".pupil"), { x: dx * 2.5, y: dy * 2.5, duration: .3 });
    });
    return {
      normal() { cara(box, "idle"); gsap.from(box, { y: 60, rotation: -20, duration: .7, delay: .2, ease: "back.out(2.5)" }); },
      feliz() {
        cara(box, "happy");
        gsap.timeline().to(box, { y: -26, duration: .22, ease: "power2.out" }).to(box, { y: 0, duration: .5, ease: "bounce.out" })
          .to(box, { rotation: 10, duration: .1, yoyo: true, repeat: 3 }, 0);
        for (let i = 0; i < 4; i++) {
          const h = document.createElement("div"); h.innerHTML = corazon();
          h.style.cssText = "position:absolute;right:30px;top:0;z-index:4;pointer-events:none"; box.parentElement.appendChild(h);
          gsap.fromTo(h, { x: 0, y: 0, scale: .3, opacity: 1 }, { x: rand(-50, 30), y: rand(-80, -50), scale: rand(.8, 1.3), opacity: 0, duration: 1.2, delay: i * .1, ease: "power1.out", onComplete: () => h.remove() });
        }
      },
      triste() {
        cara(box, "sad");
        gsap.timeline().to(box, { rotation: -12, duration: .1 }).to(box, { rotation: 12, duration: .14, yoyo: true, repeat: 3 }).to(box, { rotation: 0, duration: .2 });
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
    gsap.set(A, { transformOrigin: "50% 0%", rotation: 25 }); gsap.set(B, { transformOrigin: "50% 0%", rotation: -25 });
    const t1 = gsap.to([...A], { rotation: -25, duration: .16, yoyo: true, repeat: -1, ease: "sine.inOut" });
    const t2 = gsap.to([...B], { rotation: 25, duration: .16, yoyo: true, repeat: -1, ease: "sine.inOut" });
    const t3 = gsap.to(d, { y: -18, duration: .16, yoyo: true, repeat: -1, ease: "sine.out" });
    gsap.fromTo(d, { x: innerWidth + 20 }, { x: -w - 40, duration: 2.6, delay: demora, ease: "none", onStart: () => sfx.moo && sfx.moo(tono), onComplete: () => { t1.kill(); t2.kill(); t3.kill(); d.remove(); } });
  }

  /* ---------- Regalo, rayos, estrellas, corazón ---------- */
  function regalo(svg) {
    svg.innerHTML = `<g class="lid"><rect x="18" y="42" width="114" height="26" rx="5" fill="#A3361F" stroke="#2A1E15" stroke-width="3"/><rect x="66" y="42" width="18" height="26" fill="#E6CA78" stroke="#2A1E15" stroke-width="3"/>
      <path d="M75 42 q-26 -34 -38 -16 q-6 14 38 16 z M75 42 q26 -34 38 -16 q6 14 -38 16 z" fill="#E6CA78" stroke="#2A1E15" stroke-width="3" stroke-linejoin="round"/></g>
      <rect x="26" y="68" width="98" height="72" rx="5" fill="#C24A2C" stroke="#2A1E15" stroke-width="3"/><rect x="66" y="68" width="18" height="72" fill="#E6CA78" stroke="#2A1E15" stroke-width="3"/>`;
    return svg.querySelector(".lid");
  }
  function rayos(svg) {
    svg.innerHTML = Array.from({ length: 12 }, (_, i) => `<path d="M0 0 L${Math.cos(i * Math.PI / 6 - .12) * 150} ${Math.sin(i * Math.PI / 6 - .12) * 150} L${Math.cos(i * Math.PI / 6 + .12) * 150} ${Math.sin(i * Math.PI / 6 + .12) * 150} z" fill="#E6CA78"/>`).join("");
  }
  const estrella = llena => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l3 6.5 7 .9-5.2 4.8 1.4 7L12 17.8 5.8 21.2l1.4-7L2 9.4l7-.9z" fill="${llena ? "#E6CA78" : "#E9DFC8"}" stroke="#2A1E15" stroke-width="1.3" stroke-linejoin="round"/></svg>`;
  const corazon = () => `<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11z" fill="#A3361F"/></svg>`;

  window.ILU = {
    init(o) { gsap = o.gsap; reduce = !!o.reduce; sfx = o.sfx || {}; },
    hero, planta, mascota, vacaCorre, cosecha, regalo, rayos, estrella, corazon,
    colores: ["#E6CA78", "#1E6B3D", "#A3361F", "#D9A23A", "#3E8E4A"]
  };
})();
