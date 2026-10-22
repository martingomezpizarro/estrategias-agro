/* =====================================================================
   Configuración del pie de página — ÚNICO lugar para cambiar datos.
   El componente está en pie.js (igual en todos los proyectos).
   ===================================================================== */
window.PIE_CONFIG = {
  /* --- Autoría --- */
  autor: "Martín Gómez Pizarro",
  email: "gomezpizarromartin@gmail.com",
  sitio: "https://martingomezpizarro.com.ar",

  /* --- Proyecto --- */
  proyecto: "Estrategias Agro",
  descripcion: "Es un simulador de coberturas con futuros y opciones para productores agropecuarios, con estadísticas de granos y hacienda.",
  actualizado: "2026-10-22",           // fecha de la última actualización del sitio (AAAA-MM-DD)
  anio: 2026,                          // año del ©
  jurisdiccion: "República Argentina",
  temaAuto: false,                     // true = el pie sigue el modo oscuro del sistema; acá la app usa un solo tema claro

  /* --- Colaboración voluntaria (vacío = se muestra [COMPLETAR]) --- */
  cafecito: { url: "", texto: "Invitame un cafecito" },                 // ej.: "https://cafecito.app/tu-usuario"
  otraColaboracion: { url: "", alias: "", texto: "Mercado Pago" },     // poné url (link de pago) o alias

  /* --- Fechas de los datos (se recalculan solas) --- */
  fechasDatos: function () {
    var out = [];
    try { out.push({ etiqueta: (typeof LIVE !== "undefined" && LIVE) ? "Precios" : "Precios de referencia", fecha: MKT.fecha }); } catch (e) {}
    try { out.push({ etiqueta: "Estadísticas", fecha: STATS.fecha }); } catch (e) {}
    return out;
  },

  /* --- Descargos específicos que aplican a este proyecto --- */
  // opciones: financiero, herramientas, datosPublicos, examen, ia, privacidad
  especificos: ["financiero", "herramientas", "datosPublicos", "ia", "privacidad"],

  notaFinanciera: "Las estrategias que se muestran son ejemplos generales y no consideran la situación particular de cada productor. La operatoria con futuros y opciones requiere una cuenta comitente en un Agente de Liquidación y Compensación (ALyC) y una evaluación de perfil de riesgo.",
  notaHerramientas: "En este simulador, las primas de opciones son teóricas (modelo Black-76) y pueden diferir de las cotizaciones de A3 Mercados. Los cálculos no incluyen diferencias de base entre el futuro y el precio de venta del grano, comisiones, derechos de mercado, garantías ni impuestos. Los rindes, costos y precios precargados son valores de ejemplo.",
  fuentes: [
    "Precios de futuros y opciones de granos: A3 Mercados (precios de referencia incorporados cuando no hay conexión en vivo).",
    "Precios internacionales: CME Group, vía Yahoo Finance.",
    "Producción y existencias: Secretaría de Agricultura, Ganadería y Pesca; Bolsa de Cereales de Buenos Aires (proyecciones); SENASA.",
    "Mercado mundial y precios de la carne: USDA; FAO.",
    "Material del programa de AgroEducación (presentaciones de AgroIdeas y clase de comercialización), citado en cada gráfico."
  ],
  notaFuentes: "Las cifras de campañas en curso son estimaciones y cambian con cada informe. El material de terceros citado pertenece a sus autores.",
  notaIA: "El código y parte de los textos de este sitio se elaboraron con asistencia de herramientas de inteligencia artificial y fueron revisados por el autor.",

  privacidad: {
    recolecta:
      "<li>El sitio no tiene formularios ni registro, y no usa cookies propias ni herramientas de analítica.</li>" +
      "<li>Las estrategias guardadas y los ajustes se almacenan solo en tu dispositivo (almacenamiento local del navegador) y no se envían a ningún servidor. Podés borrarlos limpiando los datos del sitio en tu navegador.</li>" +
      "<li>El sitio se aloja en GitHub Pages y carga tipografías de Google Fonts y librerías de cdnjs. Esos proveedores pueden registrar datos técnicos de la conexión (como la dirección IP y el navegador) según sus propias políticas.</li>" +
      "<li>Si escribís por WhatsApp o por correo, tus datos se usan solo para responderte.</li>"
  },

  notaPropiedad: "Las marcas, datos y materiales de terceros pertenecen a sus titulares. Las librerías jsPDF y QRCode.js se usan bajo sus propias licencias (MIT)."
  // licencia: "",       // si definís una licencia (p. ej. MIT o CC BY 4.0), poné el texto completo acá
  // licenciaCorta: "",  // y su versión corta para el pie
};
