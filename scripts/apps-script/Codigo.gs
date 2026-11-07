/**
 * Agro y Mercado · El desafío de la cosecha — envío del premio por mail.
 *
 * Va pegado en el editor de Apps Script de una planilla de Google (Extensiones → Apps Script).
 * Recibe lo que manda /juego, lo guarda en la hoja "Leads" y manda el mail con el código
 * desde la cuenta de Google que publica el script (gomezpizarromartin@gmail.com).
 *
 * Los datos del agente (nombre, WhatsApp, apertura de cuenta, % de bonificación) NO vienen
 * del navegador: se leen de agentes.json del sitio, así nadie puede mandar mails con otros links.
 * Paso a paso en LEEME.md.
 */
const CONFIG = {
  SITIO: "https://agro.martingomezpizarro.com.ar",
  HOJA: "Leads",
  REMITENTE: "Agro y Mercado",
  MAX_POR_MAIL_DIA: 3 // pedidos máximos por dirección de mail en 24 h
};

function doPost(e) {
  try {
    const d = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    const mail = String(d.mail || "").trim().toLowerCase();
    const nombre = String(d.nombre || "").trim().slice(0, 60);
    const slug = String(d.agente || "").trim().toLowerCase();
    let codigo = String(d.codigo || "").trim().toUpperCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail) || mail.length > 120) return salida({ ok: false, error: "mail" });
    if (d.consentimiento !== true) return salida({ ok: false, error: "consentimiento" });
    if (!/^AYM-\d{1,3}-[A-Z0-9]{4,8}$/.test(codigo)) return salida({ ok: false, error: "codigo" });

    const ag = agente(slug);
    if (!ag || ag.juego !== true || !(+ag.bonificacion > 0)) return salida({ ok: false, error: "agente" });
    const pct = Math.round(+ag.bonificacion);
    codigo = codigo.replace(/^AYM-\d{1,3}-/, "AYM-" + pct + "-"); // el % lo fija agentes.json, no el navegador

    // Límite simple contra abusos: pocos pedidos por mail por día
    const cache = CacheService.getScriptCache(), clave = "n:" + mail, n = +(cache.get(clave) || 0);
    if (n >= CONFIG.MAX_POR_MAIL_DIA) return salida({ ok: false, error: "limite" });
    cache.put(clave, String(n + 1), 24 * 3600);

    // Si ese mail ya tiene un código, se le reenvía el mismo (un premio por persona)
    const hoja = hojaLeads(), previo = buscarCodigo(hoja, mail);
    const reenvio = !!previo; if (previo) codigo = previo;

    const envio = {
      to: mail,
      subject: "Tu premio del desafío de la cosecha · Agro y Mercado",
      htmlBody: htmlMail({ nombre, codigo, pct, slug, ag, puntos: +d.puntos || 0 }),
      name: CONFIG.REMITENTE
    };
    if (ag.mail) envio.replyTo = ag.mail; // las respuestas le llegan al agente
    MailApp.sendEmail(envio);
    hoja.appendRow([new Date(), nombre, mail, slug, ag.nombre || "", codigo, pct, +d.puntos || 0, +d.aciertos || 0,
      d.fecha || "", reenvio ? "reenvío" : "nuevo", "consentimiento: sí"]);
    return salida({ ok: true, codigo });
  } catch (err) {
    return salida({ ok: false, error: String(err) });
  }
}

/** Para probar desde el editor: cambiá el mail y tocá Ejecutar. */
function probar() {
  const r = doPost({ postData: { contents: JSON.stringify({ nombre: "Prueba", mail: "gomezpizarromartin@gmail.com", agente: "martin", codigo: "AYM-50-PRUEB", puntos: 870, aciertos: 4, consentimiento: true }) } });
  Logger.log(r.getContent());
}

function doGet() { return salida({ ok: true, servicio: "desafio-cosecha" }); }

/* ---------- Ayudas ---------- */
function salida(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

function agente(slug) {
  const cache = CacheService.getScriptCache();
  let txt = cache.get("agentes");
  if (!txt) {
    const r = UrlFetchApp.fetch(CONFIG.SITIO + "/agentes.json?t=" + Date.now(), { muteHttpExceptions: true });
    if (r.getResponseCode() !== 200) throw new Error("No pude leer agentes.json");
    txt = r.getContentText(); cache.put("agentes", txt, 600);
  }
  const j = JSON.parse(txt), list = j.agentes || {};
  const s = list[slug] && list[slug].activo !== false ? slug : j.predeterminado;
  const a = list[s]; if (!a) return null;
  a.slug = s; return a;
}

function hojaLeads() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let h = ss.getSheetByName(CONFIG.HOJA);
  if (!h) {
    h = ss.insertSheet(CONFIG.HOJA);
    h.appendRow(["Fecha", "Nombre", "Mail", "Agente", "Nombre del agente", "Código", "Bonificación %", "Puntos", "Aciertos", "Fecha en el dispositivo", "Tipo", "Consentimiento"]);
    h.setFrozenRows(1);
  }
  return h;
}

function buscarCodigo(h, mail) {
  const n = h.getLastRow(); if (n < 2) return null;
  const filas = h.getRange(2, 3, n - 1, 4).getValues(); // columnas Mail..Código
  for (let i = filas.length - 1; i >= 0; i--) if (String(filas[i][0]).toLowerCase() === mail) return String(filas[i][3]);
  return null;
}

function esc(s) { return String(s || "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }

function htmlMail(o) {
  const ag = o.ag, first = String(ag.nombre || "").trim().split(/\s+/)[0] || "";
  const texto = `Hola ${first}${o.nombre ? ", soy " + o.nombre : ""}. Recibí mi bonificación del ${o.pct} % del desafío de la cosecha (código ${o.codigo}). Hablemos para armar mi cobertura.`;
  const wa = ag.whatsapp ? "https://wa.me/" + ag.whatsapp + "?text=" + encodeURIComponent(texto) : "";
  const sim = CONFIG.SITIO + "/cobertura/?a=" + encodeURIComponent(ag.slug) + "&codigo=" + encodeURIComponent(o.codigo);
  const btn = (href, txt, bg, fg) => href ? `<tr><td style="padding:5px 0"><a href="${esc(href)}" style="display:block;text-align:center;background:${bg};color:${fg};font-weight:700;text-decoration:none;padding:14px 18px;border-radius:12px;font-family:Arial,sans-serif;font-size:16px">${txt}</a></td></tr>` : "";
  return `<!DOCTYPE html><html><body style="margin:0;background:#F6F0E1;padding:24px 12px;font-family:Arial,sans-serif;color:#2A1E15">
  <table role="presentation" width="100%" style="max-width:520px;margin:0 auto;background:#FFFBF2;border:1px solid #E2D5BA;border-radius:18px" cellpadding="0" cellspacing="0"><tr><td style="padding:24px 22px">
    <p style="margin:0 0 6px;font-size:13px;color:#7A5C0E">El desafío de la cosecha · Agro y Mercado</p>
    <h1 style="margin:0 0 12px;font-family:Georgia,serif;font-size:26px">¡Ganaste ${o.pct} % de bonificación!</h1>
    <p style="margin:0 0 12px;font-size:16px;line-height:1.5">Hola${o.nombre ? " " + esc(o.nombre) : ""}, gracias por jugar${o.puntos ? ": hiciste " + o.puntos + " puntos" : ""}. Tu premio es <b>${o.pct} % de bonificación en la comisión de tu primera operación</b>, abriendo tu cuenta comitente con ${esc(ag.nombre)}.</p>
    <p style="margin:0 0 4px;font-size:14px;color:#5E4E41">Tu código</p>
    <p style="margin:0 0 16px"><span style="display:inline-block;font-family:'Courier New',monospace;font-weight:700;font-size:24px;letter-spacing:1px;background:#E6CA78;padding:10px 16px;border-radius:10px">${esc(o.codigo)}</span></p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${btn(wa, "Hablemos por WhatsApp", "#1E6B3D", "#ffffff")}
      ${btn(ag.cuentaURL, "Abrir mi cuenta en " + esc(ag.alyc || "la ALyC"), "#2A1E15", "#FFFBF2")}
      ${btn(sim, "Simular mi cobertura y ver cuánto me ahorro", "#E6CA78", "#2A1E15")}
    </table>
    <p style="margin:18px 0 0;font-size:15px;line-height:1.5">${esc(ag.nombre)}<br><span style="color:#5E4E41">${esc(ag.rol || "Agente productor")}${ag.matricula ? " · Matrícula CNV N° " + esc(ag.matricula) : ""}${ag.mail ? "<br>" + esc(ag.mail) : ""}</span></p>
    <p style="margin:18px 0 0;font-size:12px;line-height:1.5;color:#5E4E41">Bonificación sobre la comisión de la ALyC de la primera operación de una cuenta nueva abierta con ${esc(ag.nombre)}; no incluye derechos de mercado ni impuestos. Material educativo: no constituye recomendación de inversión. Recibís este mail porque lo pediste en el desafío de la cosecha. Para que borremos tus datos, respondé este mail con la palabra BAJA.</p>
  </td></tr></table></body></html>`;
}
