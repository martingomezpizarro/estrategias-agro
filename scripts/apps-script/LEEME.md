# Mail del premio (Google Apps Script)

Cuando alguien termina el desafío de la cosecha (`/juego`) y deja su mail, la página manda el pedido a este script. El script:

1. Lo guarda en una planilla de Google, hoja **Leads** (fecha, nombre, mail, agente, código, puntos).
2. Le manda el mail con el código y tres botones: WhatsApp del agente con el mensaje escrito, apertura de cuenta y "Simular mi cobertura" (`/cobertura/?a=…&codigo=…`).

Los datos del agente se leen de `agentes.json` del sitio, no del navegador. El mail sale desde la cuenta de Google que publica el script; las respuestas van al mail del agente.

## Publicarlo (una sola vez, 10 minutos)

1. Entrá a [sheets.new](https://sheets.new) con **gomezpizarromartin@gmail.com**. Ponele de nombre "Agro y Mercado · Leads del juego".
2. **Extensiones → Apps Script**. Borrá lo que aparece y pegá todo el contenido de `Codigo.gs`. Guardá (ícono del disquete).
3. Probalo: arriba elegí la función **probar** → **Ejecutar**. La primera vez Google pide permisos (enviar mails, usar la planilla y conectarse a un servicio externo para leer `agentes.json`): **Revisar permisos** → tu cuenta → "Configuración avanzada" → "Ir a … (no seguro)" → **Permitir**. Es tu propio script, por eso aparece esa advertencia. Te tiene que llegar un mail de prueba y aparecer una fila en la hoja **Leads** (borrala después).
4. **Implementar → Nueva implementación** → tipo **Aplicación web**.
   - Descripción: `juego v1`
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier usuario**
   - **Implementar** y copiá la **URL de la aplicación web** (termina en `/exec`).
5. Pasame esa URL y la cargo en `juego/config.js` (`appsScriptURL`). También podés pegarla vos en GitHub.

Desde ese momento los mails salen solos. Los que se hayan cargado antes en una tablet se mandan cuando esa tablet vuelva a abrir el juego con señal.

## Para tener en cuenta

- **Límite de Gmail:** una cuenta gratuita manda hasta unos 100 mails por día con Apps Script. Para una feria alcanza; si un día se pasa, el resto queda sin enviar y se ve en la hoja.
- **Un premio por persona:** si el mismo mail juega de nuevo, se le reenvía el código que ya tenía. Además, hay un máximo de 3 pedidos por mail por día.
- **Si cambiás el script:** Implementar → Gestionar implementaciones → editar (lápiz) → Versión: **Nueva versión** → Implementar. Así la URL no cambia.
- **Baja de datos (Ley 25.326):** el mail invita a responder "BAJA". Cuando llegue, borrá la fila de la hoja.
