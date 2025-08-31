const venom = require('venom-bot');
const path = require('path');
const fs = require('fs');

const SESSION_NAME = "venom-session";
const VENOM_TOKENS_PATH = path.join(__dirname, "tokens");

// Verifica que la carpeta exista, si no, la crea
if (!fs.existsSync(VENOM_TOKENS_PATH)) {
  fs.mkdirSync(VENOM_TOKENS_PATH, { recursive: true });
}

venom
  .create({
    session: SESSION_NAME,
    multidevice: true,
    headless: false, // para ver la ventana en tu PC
    folderNameToken: VENOM_TOKENS_PATH,
    browserArgs: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu'
    ]
  })
  .then((client) => {
    console.log("✅ Venom iniciado correctamente en tu PC local");
    start(client);
  })
  .catch((err) => {
    console.error("❌ Error al iniciar Venom:", err);
  });

function start(client) {
  client.onMessage((message) => {
    if (message.body === 'Hola') {
      client.sendText(message.from, '👋 Hola, soy tu bot Venom en PC local.');
    }
  });
}
