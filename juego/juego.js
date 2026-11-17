/* =====================================================================
   Agro y Mercado · El desafío de la cosecha — LÓGICA
   Preguntas, puntos, agente del link (?a=), premio, mail y sonidos.
   Lo visual está en ilustraciones.js (window.ILU) y juego.css.
   ===================================================================== */
(() => {
const CFG = window.JUEGO_CONFIG || {};
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = id => document.getElementById(id);
const wait = ms => new Promise(r => setTimeout(r, ms));
const rand = (a, b) => a + Math.random() * (b - a);
const esc = s => String(s || "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const LS = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
};
if (reduce) gsap.globalTimeline.timeScale(20);

/* ================= SONIDO (Web Audio, sin archivos) ================= */
let ctx = null, muted = LS.get("aym-mute", false);
function ac() { if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } if (ctx && ctx.state === "suspended") ctx.resume(); return ctx; }
function tone(f, t0, dur, type = "sine", vol = .2, f2 = null) {
  const c = ac(); if (!c || muted) return; const t = c.currentTime + t0;
  const o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.setValueAtTime(f, t);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
  g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .012); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + .05);
}
function noise(c, sec) { const b = c.createBuffer(1, c.sampleRate * sec, c.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b; }
const sfx = {
  click() { tone(760, 0, .05, "sine", .12); },
  ok() { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * .07, .32, "triangle", .18)); },
  bad() { tone(240, 0, .16, "square", .06, 210); tone(170, .14, .32, "square", .06, 140); },
  tick() { tone(1400, 0, .03, "square", .05); },
  pop() { tone(500, 0, .12, "sine", .2, 1200); },
  coin() { tone(988, 0, .07, "square", .06); tone(1319, .07, .22, "square", .06); },
  moo(pitch = 1) {
    const c = ac(); if (!c || muted) return; const t = c.currentTime;
    const o = c.createOscillator(), o2 = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain(), l = c.createOscillator(), lg = c.createGain();
    o.type = o2.type = "sawtooth";
    [[o, 0], [o2, 1.5]].forEach(([x, d]) => { x.frequency.setValueAtTime((118 + d) * pitch, t); x.frequency.linearRampToValueAtTime((142 + d) * pitch, t + .35); x.frequency.linearRampToValueAtTime((94 + d) * pitch, t + 1.1); });
    f.type = "lowpass"; f.Q.value = 6; f.frequency.setValueAtTime(350, t); f.frequency.linearRampToValueAtTime(950, t + .4); f.frequency.linearRampToValueAtTime(380, t + 1.1);
    l.frequency.value = 5.5; lg.gain.value = 3; l.connect(lg).connect(o.frequency);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.2, t + .12); g.gain.setValueAtTime(.2, t + .85); g.gain.exponentialRampToValueAtTime(.0001, t + 1.25);
    o.connect(f); o2.connect(f); f.connect(g).connect(c.destination); [o, o2, l].forEach(x => { x.start(t); x.stop(t + 1.3); });
  },
  whoosh() {
    const c = ac(); if (!c || muted) return; const t = c.currentTime;
    const n = c.createBufferSource(); n.buffer = noise(c, .7); const bp = c.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 1.2;
    bp.frequency.setValueAtTime(300, t); bp.frequency.exponentialRampToValueAtTime(2600, t + .55);
    const g = c.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.25, t + .2); g.gain.exponentialRampToValueAtTime(.0001, t + .65);
    n.connect(bp).connect(g).connect(c.destination); n.start(t);
  },
  engine(sec) {
    const c = ac(); if (!c || muted) return; const t = c.currentTime;
    const n = c.createBufferSource(); n.buffer = noise(c, sec + .3);
    const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 320;
    const o = c.createOscillator(); o.type = "sawtooth"; o.frequency.setValueAtTime(45, t); o.frequency.linearRampToValueAtTime(70, t + sec * .4); o.frequency.linearRampToValueAtTime(48, t + sec);
    const og = c.createGain(); og.gain.value = .4;
    const g = c.createGain(), ch = c.createOscillator(), cg = c.createGain(); ch.frequency.value = 13; cg.gain.value = .07; ch.connect(cg).connect(g.gain);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.22, t + .3); g.gain.setValueAtTime(.22, t + sec - .4); g.gain.exponentialRampToValueAtTime(.0001, t + sec);
    n.connect(lp); o.connect(og).connect(lp); lp.connect(g).connect(c.destination); [n, o, ch].forEach(x => { x.start(t); x.stop(t + sec + .1); });
    for (let i = 0; i < sec * 14; i++) tone(rand(2500, 4200), .3 + i / 14 + rand(0, .05), .02, "square", .015);
  },
  tum() {
    const c = ac(); if (!c || muted) return; const t = c.currentTime;
    const o = c.createOscillator(), g = c.createGain(); o.frequency.setValueAtTime(170, t); o.frequency.exponentialRampToValueAtTime(40, t + .4);
    g.gain.setValueAtTime(.7, t); g.gain.exponentialRampToValueAtTime(.0001, t + .55); o.connect(g).connect(c.destination); o.start(t); o.stop(t + .6);
    [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, .1 + i * .06, 1.5, "triangle", .09));
  },
  fanfare() { [[523, 0], [659, .12], [784, .24], [1047, .4], [784, .55], [1047, .68]].forEach(([f, d]) => tone(f, d, d > .6 ? .8 : .18, "square", .07)); }
};
function setMute(v) {
  muted = v; LS.set("aym-mute", v);
  $("icoOn").style.display = v ? "none" : ""; $("icoOff").style.display = v ? "" : "none";
  $("muteBtn").setAttribute("aria-pressed", v); $("muteBtn").setAttribute("aria-label", v ? "Activar sonido" : "Silenciar sonido");
}
$("muteBtn").onclick = () => { setMute(!muted); if (!muted) sfx.click(); };
setMute(muted);

/* ================= AGENTE DEL LINK =================
   Igual que la página principal: ?a=<identificador>, si no el último agente del dispositivo,
   si no el predeterminado. El premio solo aparece si el agente tiene "juego": true y una
   "bonificacion" mayor a 0 en agentes.json (se configura en /admin). */
const SITIO = (/^https?:$/.test(location.protocol) && !/claude/.test(location.hostname)) ? location.origin : (CFG.sitio || "https://agro.martingomezpizarro.com.ar");
const AG_PARAM = (new URLSearchParams(location.search).get("a") || "").trim().toLowerCase();
if (AG_PARAM) LS.set("agro_agente", AG_PARAM);
let AGENTES = LS.get("agro_agentes_cache", null) || { predeterminado: "martin", agentes: { martin: { nombre: "Martín Gómez Pizarro", rol: "Agente productor · Mercado de capitales", whatsapp: "5493517862123", mail: "gomezpizarromartin@gmail.com", alyc: "AVSA", cuentaURL: "https://aperturas.avsa.com.ar/?advisor_alias=GONZALO_GOMEZPIZARRO", activo: true, juego: true, bonificacion: 50 } } };
let AG = {}, PREMIO = false, PCT = 0;
function resolverAgente() {
  const list = AGENTES.agentes || {}, def = AGENTES.predeterminado || "martin";
  let s = AG_PARAM || LS.get("agro_agente", "") || "";
  if (!s || !list[s] || list[s].activo === false) s = list[def] ? def : Object.keys(list)[0];
  AG = Object.assign({ slug: s }, list[s] || {});
  PCT = Math.max(0, Math.min(100, Math.round(+AG.bonificacion || 0)));
  PREMIO = AG.juego === true && PCT > 0;
  const nom = AG.nombre || "", first = nom.trim().split(/\s+/)[0] || "";
  $("brandWho").textContent = nom ? "con " + nom : "";
  $("brandLink").href = "/?a=" + encodeURIComponent(s);
  document.querySelectorAll(".agName").forEach(e => e.textContent = nom);
  document.querySelectorAll(".agFirst").forEach(e => e.textContent = first);
  $("prizePct").textContent = PCT;
  $("introSorpresa").hidden = !PREMIO;
}
async function cargarAgentes() {
  try {
    const r = await fetch("/agentes.json?t=" + Date.now(), { cache: "no-store" });
    if (r.ok) { const j = await r.json(); if (j && j.agentes) { AGENTES = j; LS.set("agro_agentes_cache", j); } }
  } catch (e) {}
  resolverAgente();
}
resolverAgente(); cargarAgentes();
const primerNombre = () => (AG.nombre || "").trim().split(/\s+/)[0] || "";
const linkCobertura = code => `${SITIO}/cobertura/?a=${encodeURIComponent(AG.slug)}${code ? "&codigo=" + code : ""}`;
const linkWa = (code, nombre) => AG.whatsapp ? "https://wa.me/" + AG.whatsapp + "?text=" + encodeURIComponent(code
  ? `Hola ${primerNombre()}${nombre ? ", soy " + nombre : ""}. Recibí mi bonificación del ${PCT} % del desafío de la cosecha (código ${code}). Hablemos para armar mi cobertura.`
  : `Hola ${primerNombre()}, jugué el desafío de la cosecha en Agro y Mercado. Quiero consultar por una cobertura para mi campaña.`) : "";

/* ================= ESCENAS ================= */
ILU.init({ gsap, reduce, sfx });
ILU.hero($("heroSvg"));
const planta = ILU.planta($("plant")); planta.set(0, true);
const mascota = ILU.mascota($("mascot"));
const fx = $("fx"), cows = $("cows");
let etapa = 0;
function avance(n, inst) {
  const from = { v: etapa / N * 100 }; etapa = n; planta.set(Math.round(n / N * 5), inst);
  gsap.to(from, { v: n / N * 100, duration: inst ? 0 : .9, onUpdate: () => $("pct").textContent = Math.round(from.v) + " %" });
}
gsap.to("#startBtn", { scale: 1.03, duration: .7, yoyo: true, repeat: -1, ease: "sine.inOut" });

function decir(t) {
  const b = $("bubble"); b.textContent = t;
  gsap.fromTo(b, { opacity: 0, scale: .4, transformOrigin: "100% 50%" }, { opacity: 1, scale: 1, duration: .45, ease: "back.out(3)" });
  gsap.to(b, { opacity: 0, delay: 2.2, duration: .3 });
}

/* ================= PUNTOS ================= */
let puntos = 0;
function sumar(n, label, cerca) {
  const o = { v: puntos }; puntos += n;
  gsap.to(o, { v: puntos, duration: .8, ease: "power2.out", onUpdate: () => $("ptsN").textContent = Math.round(o.v) });
  gsap.fromTo(".pts", { scale: 1.25 }, { scale: 1, duration: .5, ease: "back.out(3)" });
  const r = cerca.getBoundingClientRect(), f = document.createElement("div"); f.className = "float"; f.textContent = `+${n} ${label}`;
  f.style.left = (r.left + r.width / 2 - 50) + "px"; f.style.top = r.top + "px"; document.body.appendChild(f);
  gsap.fromTo(f, { y: 0, opacity: 1, scale: .6 }, { y: -70, opacity: 0, scale: 1.2, duration: 1.3, ease: "power2.out", onComplete: () => f.remove() });
  sfx.coin();
}
function cartel(t) {
  const s = document.createElement("div"); s.className = "streak"; s.textContent = t; document.body.appendChild(s);
  gsap.timeline({ onComplete: () => s.remove() }).fromTo(s, { scale: 0, rotation: -12, opacity: 1 }, { scale: 1, rotation: -4, duration: .5, ease: "back.out(3)" }).to(s, { opacity: 0, y: -40, duration: .4, delay: .5 });
}

/* ================= PREGUNTAS ================= */
/* Banco en preguntas.js: cada partida toma N al azar, sin repetir en el dispositivo hasta agotar el banco,
   y mezcla el orden de las opciones. */
const BANCO = (window.PREGUNTAS || []).filter(p => p && p.o && p.o.length >= 2);
const N = Math.max(1, Math.min(BANCO.length, Math.round(+CFG.preguntasPorJuego || 5)));
const mezclar = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
function elegirPreguntas() {
  let vistas = LS.get("agro_juego_vistas", []);
  let libres = BANCO.filter(p => !vistas.includes(p.id));
  if (libres.length < N) { vistas = []; libres = BANCO.slice(); }
  const elegidas = mezclar(libres).slice(0, N);
  LS.set("agro_juego_vistas", vistas.concat(elegidas.map(p => p.id)));
  return elegidas.map(p => {
    const orden = mezclar(p.o.map((t, i) => i));
    return { q: p.q, o: orden.map(i => p.o[i]), a: orden.indexOf(p.a), e: p.e };
  });
}
let Q = elegirPreguntas();
$("nPreg").textContent = N;
const SECS = 20;
let qi = 0, aciertos = 0, racha = 0, reloj = null, respondida = false;

function pantalla(id) {
  document.querySelectorAll(".screen").forEach(s => s.hidden = s.id !== id);
  window.scrollTo(0, 0);
  const h = $(id).querySelector("[tabindex='-1']"); if (h) h.focus({ preventScroll: true });
}
function mostrarPregunta() {
  const d = Q[qi]; respondida = false; mascota.normal();
  $("qNum").textContent = `${qi + 1}/${Q.length}`; $("qText").textContent = d.q;
  $("explainBox").innerHTML = ""; $("nextWrap").hidden = true;
  $("nextBtn").textContent = qi === Q.length - 1 ? "Cosechar lo último" : "Seguir cosechando";
  const box = $("opts"); box.innerHTML = "";
  d.o.forEach((t, i) => { const b = document.createElement("button"); b.className = "opt"; b.innerHTML = `<span class="k">${"ABCD"[i]}</span><span>${t}</span>`; b.onclick = () => responder(i, b); box.appendChild(b); });
  gsap.from("#qText", { y: 20, opacity: 0, duration: .5, ease: "back.out(2)" });
  gsap.from(box.children, { y: 30, opacity: 0, scale: .9, duration: .5, stagger: .07, delay: .15, ease: "back.out(2)" });
  const fill = $("timerFill"); gsap.set(fill, { scaleX: 1 }); fill.style.background = "#1E6B3D";
  let ult = SECS; $("secs").textContent = SECS;
  reloj = gsap.to(fill, { scaleX: 0, duration: SECS, ease: "none", delay: .6,
    onUpdate() {
      const rem = Math.ceil(SECS * (1 - this.progress())); $("secs").textContent = rem;
      if (rem !== ult) { ult = rem; if (rem <= 5) { sfx.tick(); gsap.fromTo("#secs", { scale: 1.5, color: "#A3361F" }, { scale: 1, duration: .3 }); } }
      fill.style.background = rem <= 5 ? "#A3361F" : rem <= 10 ? "#C9962E" : "#1E6B3D";
    },
    onComplete: () => responder(-1, null) });
}
function responder(i, btn) {
  if (respondida) return; respondida = true;
  const rem = reloj ? SECS * (1 - reloj.progress()) : 0; if (reloj) reloj.kill();
  const d = Q[qi], todas = [...$("opts").children];
  todas.forEach((b, j) => { b.disabled = true; if (j === d.a) b.classList.add("ok"); else if (j === i) b.classList.add("bad"); else b.classList.add("dim"); });
  const bien = i === d.a;
  if (bien) {
    aciertos++; racha++; sfx.ok(); mascota.feliz(); decir("¡Muuuy bien!"); ILU.vacaCorre(cows, .2, rand(.9, 1.15));
    gsap.fromTo(todas[d.a], { scale: 1 }, { scale: 1.05, duration: .15, yoyo: true, repeat: 1 });
    const rapidez = Math.round(rem / SECS * 100 / 10) * 10;
    setTimeout(() => sumar(100, "correcta", todas[d.a]), 150);
    if (rapidez > 0) setTimeout(() => sumar(rapidez, "rapidez", $("timerFill")), 650);
    if (racha >= 2) setTimeout(() => { cartel(`¡Racha x${racha}!`); sumar(50 * (racha - 1), "racha", $("qText")); }, 1100);
  } else {
    racha = 0; sfx.bad(); mascota.triste(); decir(i < 0 ? "¡Se pasó el tiempo!" : "Casi…");
    if (btn) gsap.fromTo(btn, { x: -10 }, { x: 0, duration: .5, ease: "elastic.out(1,.2)" });
    gsap.fromTo("#s-q", { x: -6 }, { x: 0, duration: .4, ease: "elastic.out(1,.25)" });
  }
  const ex = document.createElement("div"); ex.className = "explain " + (bien ? "good" : "bad");
  ex.innerHTML = `<strong>${bien ? "¡Correcto!" : i < 0 ? "Se terminó el tiempo." : "No era esa."}</strong>${d.e}`;
  $("explainBox").appendChild(ex); gsap.from(ex, { y: 16, opacity: 0, duration: .5, ease: "back.out(2)" });
  $("nextWrap").hidden = false; gsap.from("#nextWrap", { y: 20, opacity: 0, duration: .4, delay: .3, ease: "back.out(2)" });
}
$("nextBtn").onclick = async () => {
  sfx.click(); $("nextBtn").disabled = true; const n = qi + 1;
  await ILU.cosecha(fx, () => { if (n < Q.length) { qi = n; pantalla("s-q"); mostrarPregunta(); } else { pantalla("s-win"); prepararFinal(); } });
  $("nextBtn").disabled = false;
  avance(n);
  if (n === Q.length) final();
};

/* ================= FINAL Y PREMIO ================= */
let sacudida = null;
const lid = ILU.regalo($("gift")); ILU.rayos($("rays"));
function prepararFinal() {
  const n = aciertos === Q.length ? 3 : aciertos >= Q.length * .6 ? 2 : 1;
  $("stars").innerHTML = [0, 1, 2].map(i => ILU.estrella(i < n)).join("");
  gsap.set("#stars svg", { scale: 0 });
  $("scoreTxt").textContent = aciertos === Q.length ? `Acertaste las ${Q.length}. Sabés cuidar tu precio.` : `Acertaste ${aciertos} de ${Q.length}. Y ya sabés las que faltaban.`;
  $("finalPts").textContent = "0"; $("giftZone").hidden = true; $("noPrize").hidden = true;
  $("openGift").hidden = false; $("claim").hidden = true;
  gsap.set("#prize", { opacity: 0, scale: .2, xPercent: -50, yPercent: -50, x: 0, y: 0 });
  gsap.set("#gift", { opacity: 1, scale: 1, y: 0, rotation: 0 }); gsap.set(lid, { y: 0, rotation: 0, opacity: 1 });
  gsap.killTweensOf("#rays"); gsap.set("#rays", { opacity: 0, rotation: 0 });
}
async function final() {
  sfx.tum();
  gsap.fromTo(".meter", { scale: 1 }, { scale: 1.12, duration: .2, yoyo: true, repeat: 1, ease: "power2.out" });
  if (!reduce && window.confetti) {
    confetti({ particleCount: 140, spread: 100, origin: { y: .55 }, colors: ILU.colores, zIndex: 80 });
    setTimeout(() => { confetti({ particleCount: 70, angle: 60, spread: 70, origin: { x: 0, y: .7 }, colors: ILU.colores, zIndex: 80 }); confetti({ particleCount: 70, angle: 120, spread: 70, origin: { x: 1, y: .7 }, colors: ILU.colores, zIndex: 80 }); }, 400);
  }
  [0, .35, .6, .9, 1.25].forEach((d, i) => ILU.vacaCorre(cows, d, .85 + i * .08));
  const o = { v: 0 }; gsap.to(o, { v: puntos, duration: 1.6, ease: "power2.out", onUpdate: () => $("finalPts").textContent = Math.round(o.v) });
  document.querySelectorAll("#stars svg").forEach((s, i) => gsap.to(s, { scale: 1, rotation: 360, duration: .6, delay: .8 + i * .3, ease: "back.out(3)", onStart: () => sfx.pop() }));
  await wait(2200);
  if (PREMIO) {
    const z = $("giftZone"); z.hidden = false; gsap.from(z, { y: 40, opacity: 0, duration: .6, ease: "back.out(2)" });
    sacudida = gsap.timeline({ repeat: -1, repeatDelay: .8 }).to("#gift", { rotation: -8, duration: .08 }).to("#gift", { rotation: 8, duration: .08, yoyo: true, repeat: 3 }).to("#gift", { rotation: 0, duration: .08 }).to("#gift", { y: -10, duration: .15, yoyo: true, repeat: 1 }, "<");
  } else {
    $("npSim").href = linkCobertura(""); const w = linkWa(""); $("npWa").href = w; $("npWa").hidden = !w;
    $("npWa").textContent = "Escribile a " + (primerNombre() || "tu agente") + " por WhatsApp";
    const z = $("noPrize"); z.hidden = false; gsap.from(z, { y: 30, opacity: 0, duration: .5, ease: "back.out(2)" });
  }
}
function abrirRegalo() {
  if ($("openGift").hidden) return;
  if (sacudida) sacudida.kill(); sfx.fanfare(); $("openGift").hidden = true;
  gsap.timeline()
    .to("#gift", { scale: 1.15, duration: .15 }).to("#gift", { scale: .9, duration: .1 })
    .to(lid, { y: -90, rotation: -35, svgOrigin: "75 55", opacity: 0, duration: .6, ease: "power2.out" })
    .to("#gift", { scale: .6, opacity: 0, y: 40, duration: .4 }, "-=.3")
    .fromTo("#rays", { opacity: 0, scale: .3 }, { opacity: .55, scale: 1, duration: .6 }, "-=.4")
    .to("#prize", { opacity: 1, scale: 1, duration: .7, ease: "elastic.out(1,.5)" }, "-=.5")
    .add(() => {
      gsap.to("#rays", { rotation: 360, duration: 14, repeat: -1, ease: "none" });
      if (!reduce && window.confetti) confetti({ particleCount: 90, spread: 80, origin: { y: .6 }, colors: ILU.colores, zIndex: 80 });
      $("claim").hidden = false; gsap.from("#claim", { y: 20, opacity: 0, duration: .5, ease: "back.out(2)" });
    });
}
$("openGift").onclick = abrirRegalo; $("gift").onclick = abrirRegalo;
$("gift").onkeydown = e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); abrirRegalo(); } };
$("claim").onclick = () => { sfx.click(); pantalla("s-mail"); gsap.from("#s-mail", { y: 30, opacity: 0, duration: .5, ease: "back.out(2)" }); };

/* ================= MAIL =================
   El pedido se guarda primero en el dispositivo (cola) y se manda al Apps Script.
   Si no hay señal en el stand, se reintenta solo cuando vuelve la conexión. */
const COLA = "agro_juego_cola";
function nuevoCodigo() { const a = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let s = ""; for (let i = 0; i < 5; i++) s += a[Math.floor(Math.random() * a.length)]; return `AYM-${PCT}-${s}`; }
async function vaciarCola() {
  const url = CFG.appsScriptURL; if (!url || !navigator.onLine) return false;
  const cola = LS.get(COLA, []); if (!cola.length) return true;
  const quedan = [];
  for (const p of cola) {
    try { await fetch(url, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(p) }); }
    catch (e) { quedan.push(p); }
  }
  LS.set(COLA, quedan); return quedan.length === 0;
}
addEventListener("online", vaciarCola); vaciarCola();
$("mailForm").onsubmit = async e => {
  e.preventDefault();
  const mail = $("fMail").value.trim(), ok = $("fOk").checked, valido = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail);
  $("fMail").setAttribute("aria-invalid", !valido);
  $("eMail").textContent = valido ? "" : "Revisá el mail: tiene que tener la forma nombre@dominio.com";
  $("eOk").textContent = ok ? "" : "Necesito tu permiso para mandarte el premio.";
  if (!valido) { $("fMail").focus(); sfx.bad(); gsap.fromTo("#fMail", { x: -8 }, { x: 0, duration: .4, ease: "elastic.out(1,.2)" }); return; }
  if (!ok) { $("fOk").focus(); sfx.bad(); return; }
  const nombre = $("fName").value.trim().slice(0, 60), codigo = nuevoCodigo();
  const pedido = { nombre, mail, agente: AG.slug, codigo, bonificacion: PCT, puntos, aciertos, consentimiento: true, fecha: new Date().toISOString(), origen: "juego" };
  const cola = LS.get(COLA, []); cola.push(pedido); LS.set(COLA, cola);
  const enviado = await vaciarCola();
  $("codeBox").textContent = codigo;
  $("goSim").href = linkCobertura(codigo);
  const w = linkWa(codigo, nombre); $("goWa").href = w; $("goWa").hidden = !w;
  $("goAcc").href = AG.cuentaURL || "#"; $("goAcc").hidden = !AG.cuentaURL;
  $("goAcc").textContent = "Abrir mi cuenta en " + (AG.alyc || "la ALyC");
  if (enviado) { $("sentTitle").textContent = "Revisá tu mail"; $("sentTxt").innerHTML = `Te mandé el premio a <b>${esc(mail)}</b> (si no lo ves, mirá en spam). Este es tu código:`; }
  else if (CFG.appsScriptURL) { $("sentTitle").textContent = "¡Listo!"; $("sentTxt").innerHTML = `Ahora no hay señal: el mail a <b>${esc(mail)}</b> sale apenas vuelva la conexión. Tu código:`; }
  else { $("sentTitle").textContent = "¡Listo!"; $("sentTxt").innerHTML = `Anotá tu código y usalo al abrir la cuenta:`; }
  sfx.ok(); pantalla("s-sent"); gsap.from("#s-sent", { y: 30, opacity: 0, duration: .5, ease: "back.out(2)" });
  if (!reduce && window.confetti) confetti({ particleCount: 60, spread: 70, origin: { y: .4 }, colors: ILU.colores, zIndex: 80 });
};

/* ================= REINICIO E INICIO ================= */
document.querySelectorAll(".again").forEach(b => b.onclick = () => {
  sfx.click(); Q = elegirPreguntas(); qi = 0; aciertos = 0; racha = 0; puntos = 0; $("ptsN").textContent = "0"; $("mailForm").reset();
  avance(0); pantalla("s-q"); mostrarPregunta();
});
$("startBtn").onclick = async () => {
  ac(); sfx.click(); gsap.killTweensOf("#startBtn"); gsap.set("#startBtn", { scale: 1 });
  await ILU.cosecha(fx, () => { pantalla("s-q"); mostrarPregunta(); });
};
})();
