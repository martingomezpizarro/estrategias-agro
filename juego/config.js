/* Configuración del juego.
   appsScriptURL: la URL del web app de Google Apps Script que guarda el mail en la planilla
   y manda el premio (ver scripts/apps-script/LEEME.md). Mientras esté vacía, los mails que
   se cargan quedan guardados en el dispositivo y se mandan solos cuando se configure. */
window.JUEGO_CONFIG = {
  appsScriptURL: "",
  preguntasPorJuego: 5, // se eligen al azar del banco de juego/preguntas.js
  sitio: "https://agro.martingomezpizarro.com.ar"
};
