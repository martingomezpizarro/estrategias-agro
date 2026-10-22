/* =====================================================================
   Pie de página institucional — componente reutilizable
   Martín Gómez Pizarro · mismo pie para todos los proyectos públicos

   Uso en cualquier proyecto:
     1. Definir window.PIE_CONFIG (ver pie-config.js; ahí van TODOS los datos).
     2. Poner <footer id="pie"></footer> donde va el pie (si no está, se agrega al final del body).
     3. Cargar <script src="pie-config.js"></script><script src="pie.js"></script> al final del body.
   Toma los colores y tipografías del proyecto si existen las variables
   --bg, --surface2, --ink, --muted, --line, --font-body, --font-display, --r;
   si no, usa valores neutros con modo claro y oscuro.
   Expone window.Pie.refresh() (recalcula fechas) y window.Pie.abrir(seccion).
   ===================================================================== */
(function () {
  "use strict";
  var C = window.PIE_CONFIG;
  if (!C) { console.warn("pie.js: falta window.PIE_CONFIG"); return; }

  var FALTA = "[COMPLETAR]";
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function ext(url, texto, cls) {
    return '<a href="' + esc(url) + '" target="_blank" rel="noopener noreferrer"' + (cls ? ' class="' + cls + '"' : "") + ">" + texto + "</a>";
  }
  function falta(que) { return '<span class="pie-falta">' + FALTA + " " + esc(que) + "</span>"; }
  function fechaLarga(iso) {
    if (!iso) return null;
    var d = new Date(String(iso).slice(0, 10) + "T12:00:00");
    if (isNaN(d)) return esc(iso);
    return d.toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });
  }
  function anio() { return C.anio || new Date().getFullYear(); }
  function fechasDatos() {
    var out = [];
    try { out = (typeof C.fechasDatos === "function" ? C.fechasDatos() : C.fechasDatos) || []; } catch (e) { out = []; }
    return out.filter(function (x) { return x && x.fecha; });
  }
  function lineaFechas() {
    var partes = fechasDatos().map(function (x) { return esc(x.etiqueta) + " al " + fechaLarga(x.fecha); });
    partes.push("Sitio actualizado el " + (fechaLarga(C.actualizado) || FALTA));
    return partes.join(" · ");
  }
  function tiene(k) { return (C.especificos || []).indexOf(k) >= 0; }

  /* ---------- Descargos específicos disponibles ---------- */
  var ESPECIFICOS = {
    financiero: {
      corto: "Nada de lo publicado constituye asesoramiento, recomendación ni oferta de compra o venta de valores negociables o instrumentos financieros (Ley 26.831 y normativa de la CNV). Invertir implica riesgos, incluida la pérdida del capital.",
      titulo: "No es asesoramiento financiero",
      largo: function () {
        return "<p>La información no constituye asesoramiento, recomendación ni oferta de compra o venta de valores negociables o instrumentos financieros, en los términos de la Ley 26.831 de Mercado de Capitales y la normativa de la CNV. Rentabilidades pasadas no garantizan rentabilidades futuras. Invertir implica riesgos, incluida la pérdida del capital. Consultá con un profesional idóneo antes de tomar decisiones.</p>" +
          (C.notaFinanciera ? "<p>" + C.notaFinanciera + "</p>" : "");
      }
    },
    herramientas: {
      corto: "Los resultados son estimaciones basadas en supuestos y en los datos que ingresás; no reemplazan el análisis profesional.",
      titulo: "Herramientas, calculadoras y modelos",
      largo: function () {
        return "<p>Los resultados son estimaciones basadas en supuestos y en los datos ingresados por el usuario. No reemplazan el análisis profesional.</p>" +
          (C.notaHerramientas ? "<p>" + C.notaHerramientas + "</p>" : "");
      }
    },
    datosPublicos: {
      corto: "Los datos provienen de las fuentes citadas, pueden tener rezagos, revisiones o transformaciones propias, y esto no es una publicación oficial de esos organismos.",
      titulo: "Fuentes de datos",
      largo: function () {
        var f = (C.fuentes || []).map(function (x) { return "<li>" + x + "</li>"; }).join("");
        return "<p>Los datos económicos, estadísticos y de mercado se toman de las fuentes indicadas en cada gráfico y en esta lista. Pueden tener rezagos, revisiones posteriores o transformaciones propias (conversiones de unidades, promedios, selección de contratos). Este sitio no es una publicación oficial de esos organismos ni cuenta con su aval.</p>" +
          (f ? "<ul>" + f + "</ul>" : "<p>" + falta("lista de fuentes") + "</p>") +
          (C.notaFuentes ? "<p>" + C.notaFuentes + "</p>" : "");
      }
    },
    examen: {
      corto: "Proyecto independiente, sin afiliación con la CNV ni con ninguna entidad examinadora. No garantiza la aprobación de ningún examen.",
      titulo: "Material de estudio",
      largo: function () {
        return "<p>Proyecto independiente, sin afiliación con la CNV ni con ninguna entidad examinadora. No garantiza la aprobación de ningún examen. Verificá siempre la normativa vigente en las fuentes oficiales.</p>";
      }
    },
    ia: {
      corto: "Desarrollado con asistencia de inteligencia artificial: puede contener errores.",
      titulo: "Contenido asistido por inteligencia artificial",
      largo: function () {
        return "<p>" + (C.notaIA || "Parte del contenido y del código de este sitio se elaboró con asistencia de herramientas de inteligencia artificial y fue revisado por el autor.") + " Aun así, puede contener errores u omisiones; verificá la información importante en las fuentes originales.</p>";
      }
    },
    privacidad: {
      corto: null,
      titulo: "Privacidad y datos personales",
      largo: function () {
        return "<p>Política breve en el marco de la Ley 25.326 de Protección de Datos Personales.</p>" +
          "<ul>" + (C.privacidad && C.privacidad.recolecta ? C.privacidad.recolecta : "<li>" + falta("qué datos se recolectan y para qué") + "</li>") + "</ul>" +
          "<p>No se venden, alquilan ni ceden datos personales a terceros. Para consultar, rectificar o pedir la eliminación de tus datos, escribí a " +
          '<a href="mailto:' + esc(C.email) + '">' + esc(C.email) + "</a>.</p>";
      }
    }
  };

  /* ---------- Términos completos ---------- */
  function seccionesTerminos() {
    var s = [];
    s.push(["objeto", "Objeto", "<p>" + esc(C.proyecto) + " es un proyecto independiente y gratuito desarrollado por " + esc(C.autor) + ". " + (C.descripcion ? esc(C.descripcion) + " " : "") + "El contenido es informativo y educativo. Usar el sitio implica aceptar estos términos.</p>"]);
    s.push(["garantias", "Sin garantías", "<p>El contenido se ofrece «tal cual», sin garantías de exactitud, integridad ni actualización. Puede haber errores, interrupciones del servicio o cambios sin previo aviso.</p>"]);
    s.push(["responsabilidad", "Limitación de responsabilidad", "<p>El autor no se responsabiliza por las decisiones que se tomen a partir del sitio ni por daños directos o indirectos derivados de su uso o de la información publicada.</p>"]);
    (C.especificos || []).forEach(function (k) {
      var e = ESPECIFICOS[k];
      if (e && k !== "privacidad") s.push([k, e.titulo, e.largo()]);
    });
    s.push(["terceros", "Enlaces a sitios de terceros", "<p>Los enlaces a sitios de terceros no implican aval de su contenido. Esos sitios se rigen por sus propios términos y políticas, y el autor no responde por lo que publiquen.</p>"]);
    s.push(["colaboraciones", "Colaboraciones", "<p>Las colaboraciones son voluntarias, no constituyen contraprestación por ningún servicio ni otorgan derechos sobre el contenido.</p>"]);
    if (tiene("privacidad")) s.push(["privacidad", ESPECIFICOS.privacidad.titulo, ESPECIFICOS.privacidad.largo()]);
    s.push(["propiedad", "Propiedad intelectual", "<p>" + (C.licencia ? C.licencia : "© " + anio() + " " + esc(C.autor) + ". Todos los derechos reservados.") + "</p>" + (C.notaPropiedad ? "<p>" + C.notaPropiedad + "</p>" : "")]);
    s.push(["actualizacion", "Última actualización", "<p>" + lineaFechas() + ".</p>"]);
    s.push(["jurisdiccion", "Jurisdicción", "<p>Estos términos se rigen por las leyes de la " + esc(C.jurisdiccion || "República Argentina") + ".</p>"]);
    s.push(["contacto", "Contacto", '<p><a href="mailto:' + esc(C.email) + '">' + esc(C.email) + "</a></p>"]);
    return s;
  }

  /* ---------- Estilos ---------- */
  var CSS = [
    ".pie{--pie-bg:var(--bg,#fff);--pie-ink:var(--ink,#1d1d1b);--pie-muted:var(--muted,#55554f);--pie-line:var(--line,rgba(0,0,0,.18));--pie-soft:var(--surface2,rgba(0,0,0,.05));--pie-r:var(--r,8px);--pie-body:var(--font-body,system-ui,-apple-system,'Segoe UI',sans-serif);--pie-disp:var(--font-display,var(--pie-body))}",
    "@media (prefers-color-scheme:dark){.pie.pie-auto{--pie-bg:var(--bg,#151515);--pie-ink:var(--ink,#f2f0ec);--pie-muted:var(--muted,#b9b5ad);--pie-line:var(--line,rgba(255,255,255,.18));--pie-soft:var(--surface2,rgba(255,255,255,.07))}}",
    ".pie{color:var(--pie-ink);font-family:var(--pie-body);font-size:.88rem;line-height:1.5;max-width:720px;margin:0 auto;padding:28px 20px 40px;border-top:1.5px solid var(--pie-ink);display:flex;flex-direction:column;gap:22px}",
    ".pie a{color:inherit;text-decoration:underline;text-underline-offset:2px}",
    ".pie a:focus-visible,.pie button:focus-visible,.pie-dlg button:focus-visible,.pie-dlg a:focus-visible{outline:2px solid var(--pie-ink);outline-offset:2px}",
    ".pie h2{font:700 .78rem var(--pie-body);letter-spacing:.08em;text-transform:uppercase;margin:0 0 6px;color:var(--pie-muted)}",
    ".pie p{margin:0}",
    ".pie-autor{font-family:var(--pie-disp);font-size:1.05rem}",
    ".pie-links{display:flex;flex-wrap:wrap;gap:4px 16px;margin-top:4px}",
    ".pie-btns{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0 8px}",
    ".pie-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:44px;padding:0 16px;border:1.5px solid var(--pie-ink);border-radius:var(--pie-r);background:transparent;color:var(--pie-ink)!important;font:600 .9rem var(--pie-body);text-decoration:none!important;cursor:pointer}",
    ".pie-btn.pie-pri{background:var(--pie-ink);color:var(--pie-bg)!important}",
    ".pie-alias{display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:0 14px;border:1.5px dashed var(--pie-line);border-radius:var(--pie-r);font-weight:600}",
    ".pie-small{font-size:.78rem;color:var(--pie-muted)}",
    ".pie-falta{display:inline-block;padding:2px 8px;border:1.5px dashed currentColor;font:700 .8rem var(--pie-body);color:#B00020;background:#FFF3D6}",
    ".pie-legal{display:flex;flex-wrap:wrap;align-items:center;gap:8px 16px;padding-top:14px;border-top:1px solid var(--pie-line)}",
    ".pie-linkbtn{background:none;border:0;padding:10px 0;margin:-10px 0;color:inherit;font:600 .88rem var(--pie-body);text-decoration:underline;text-underline-offset:2px;cursor:pointer}",
    /* modal */
    ".pie-dlg{width:min(720px,calc(100vw - 24px));max-height:calc(100dvh - 24px);padding:0;border:1.5px solid var(--ink,#1d1d1b);border-radius:var(--r,8px);background:var(--bg,#fff);color:var(--ink,#1d1d1b);font-family:var(--font-body,system-ui,sans-serif);line-height:1.55}",
    ".pie-dlg::backdrop{background:rgba(20,20,10,.55)}",
    ".pie-dlg-in{display:flex;flex-direction:column;max-height:calc(100dvh - 28px)}",
    ".pie-dlg-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 18px;border-bottom:1.5px solid var(--ink,#1d1d1b)}",
    ".pie-dlg-head h2{margin:0;font:700 1.25rem var(--font-display,var(--font-body,serif))}",
    ".pie-dlg-x{width:44px;height:44px;flex:none;border:1.5px solid var(--ink,#1d1d1b);border-radius:var(--r,8px);background:transparent;color:inherit;font-size:1.4rem;line-height:1;cursor:pointer}",
    ".pie-dlg-body{overflow:auto;padding:6px 18px 22px;font-size:.95rem;-webkit-overflow-scrolling:touch}",
    ".pie-dlg-body h3{margin:20px 0 6px;font:700 1.02rem var(--font-display,var(--font-body,serif))}",
    ".pie-dlg-body p{margin:0 0 8px}.pie-dlg-body ul{margin:0 0 8px;padding-left:20px}.pie-dlg-body li{margin:0 0 4px}",
    ".pie-dlg-body a{color:inherit}",
    ".pie-dlg-body .pie-small{font-size:.82rem;color:var(--muted,#55554f)}",
    "@media (max-width:520px){.pie-btns .pie-btn,.pie-btns .pie-alias{flex:1 1 100%}}"
  ].join("\n");

  /* ---------- Render ---------- */
  var root, dlg;

  function colabHTML() {
    var cf = C.cafecito || {}, otra = C.otraColaboracion || {};
    var b1 = cf.url ? ext(cf.url, esc(cf.texto || "Invitame un cafecito"), "pie-btn pie-pri") : falta("link de Cafecito");
    var b2;
    if (otra.url) b2 = ext(otra.url, esc(otra.texto || "Otra forma de colaborar"), "pie-btn");
    else if (otra.alias) b2 = '<span class="pie-alias">' + esc(otra.texto || "Alias") + ": " + esc(otra.alias) + ' <button type="button" class="pie-linkbtn" data-pie-copiar="' + esc(otra.alias) + '">Copiar</button></span>';
    else b2 = falta("alias / link de Mercado Pago u otra opción");
    return '<section aria-labelledby="pie-h-colab"><h2 id="pie-h-colab">Colaborá</h2>' +
      "<p>Este proyecto es gratuito e independiente. Si te resulta útil, podés colaborar voluntariamente para sostenerlo.</p>" +
      '<div class="pie-btns">' + b1 + b2 + "</div>" +
      '<p class="pie-small">Las colaboraciones son voluntarias, no constituyen contraprestación por ningún servicio ni otorgan derechos sobre el contenido.</p></section>';
  }

  function descargoCorto() {
    var t = ["Contenido informativo y educativo, ofrecido «tal cual», sin garantías de exactitud, integridad ni actualización. El autor no se responsabiliza por decisiones tomadas ni por daños derivados del uso del sitio."];
    (C.especificos || []).forEach(function (k) { var e = ESPECIFICOS[k]; if (e && e.corto) t.push(e.corto); });
    return t.join(" ");
  }

  function render() {
    root.className = "pie" + (C.temaAuto ? " pie-auto" : "");
    root.setAttribute("aria-label", "Pie de página");
    root.innerHTML =
      '<section aria-labelledby="pie-h-autor"><h2 id="pie-h-autor">Autoría</h2>' +
        '<p class="pie-autor">Desarrollado por ' + esc(C.autor) + "</p>" +
        '<p class="pie-links"><a href="mailto:' + esc(C.email) + '">' + esc(C.email) + "</a>" + ext(C.sitio, esc(C.sitio.replace(/^https?:\/\//, ""))) + "</p></section>" +
      colabHTML() +
      '<section aria-labelledby="pie-h-legal"><h2 id="pie-h-legal">Aviso legal</h2>' +
        "<p>" + descargoCorto() + "</p>" +
        '<p class="pie-small" data-pie-fechas style="margin-top:8px">' + lineaFechas() + ".</p></section>" +
      '<div class="pie-legal">' +
        '<button type="button" class="pie-linkbtn" data-pie-abrir="objeto">Términos y condiciones de uso</button>' +
        (tiene("privacidad") ? '<button type="button" class="pie-linkbtn" data-pie-abrir="privacidad">Privacidad</button>' : "") +
        '<span class="pie-small">' + (C.licenciaCorta || "© " + anio() + " " + esc(C.autor) + ". Todos los derechos reservados.") + " · " + esc(C.jurisdiccion || "República Argentina") + "</span>" +
      "</div>";
  }

  function crearDialogo() {
    dlg = document.createElement("dialog");
    dlg.className = "pie-dlg";
    dlg.id = "terminos";
    dlg.setAttribute("aria-labelledby", "pie-dlg-t");
    document.body.appendChild(dlg);
    dlg.addEventListener("click", function (e) { if (e.target === dlg) cerrar(); });
    dlg.addEventListener("close", function () { if (location.hash === "#terminos" || location.hash === "#privacidad") history.replaceState(null, "", location.pathname + location.search); });
  }

  function llenarDialogo() {
    dlg.innerHTML = '<div class="pie-dlg-in"><div class="pie-dlg-head"><h2 id="pie-dlg-t">Términos y condiciones de uso</h2>' +
      '<button type="button" class="pie-dlg-x" aria-label="Cerrar" data-pie-cerrar>×</button></div>' +
      '<div class="pie-dlg-body"><p class="pie-small" style="margin-top:12px">' + esc(C.proyecto) + " · " + lineaFechas() + "</p>" +
      seccionesTerminos().map(function (s) { return '<h3 id="pie-t-' + s[0] + '">' + s[1] + "</h3>" + s[2]; }).join("") +
      "</div></div>";
  }

  function abrir(seccion) {
    llenarDialogo();
    if (typeof dlg.showModal === "function") { if (!dlg.open) dlg.showModal(); } else dlg.setAttribute("open", "");
    var t = seccion && dlg.querySelector("#pie-t-" + seccion);
    var body = dlg.querySelector(".pie-dlg-body");
    body.scrollTop = 0;
    if (t && seccion !== "objeto") body.scrollTop = t.getBoundingClientRect().top - body.getBoundingClientRect().top - 8;
  }
  function cerrar() { if (typeof dlg.close === "function") dlg.close(); else dlg.removeAttribute("open"); }

  function refresh() {
    var f = root && root.querySelector("[data-pie-fechas]");
    if (f) f.innerHTML = lineaFechas() + ".";
  }

  function iniciar() {
    var st = document.createElement("style");
    st.id = "pie-css"; st.textContent = CSS;
    document.head.appendChild(st);
    root = document.getElementById("pie");
    if (!root) { root = document.createElement("footer"); root.id = "pie"; document.body.appendChild(root); }
    render();
    crearDialogo();
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest("[data-pie-abrir],[data-pie-cerrar],[data-pie-copiar]");
      if (!a) return;
      if (a.hasAttribute("data-pie-abrir")) abrir(a.getAttribute("data-pie-abrir"));
      else if (a.hasAttribute("data-pie-cerrar")) cerrar();
      else {
        var v = a.getAttribute("data-pie-copiar");
        var ok = function () { a.textContent = "Copiado"; setTimeout(function () { a.textContent = "Copiar"; }, 1600); };
        if (navigator.clipboard) navigator.clipboard.writeText(v).then(ok, function () {});
      }
    });
    if (location.hash === "#terminos") abrir("objeto");
    if (location.hash === "#privacidad" && tiene("privacidad")) abrir("privacidad");
    window.addEventListener("hashchange", function () {
      if (location.hash === "#terminos") abrir("objeto");
      else if (location.hash === "#privacidad" && tiene("privacidad")) abrir("privacidad");
    });
  }

  window.Pie = { refresh: refresh, abrir: function (s) { abrir(s || "objeto"); } };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar); else iniciar();
})();
