const venom = require('venom-bot');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// Nombre de la sesión (puedes cambiarlo si quieres otra)
const SESSION_NAME = process.env.SESSION_NAME || 'venom-session';
// Ruta local donde se guardarán los tokens y el SingletonLock
const VENOM_TOKENS_PATH = process.env.VENOM_TOKENS_PATH || './tokens';

venom
  .create({
    session: SESSION_NAME,
    multidevice: true,
    headless: true,
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
  .then((client) => start(client))
  .catch((err) => {
    console.error('Error al iniciar Venom:', err);
  });

function start(client) {
  console.log('✅ Venom iniciado correctamente en tu PC local');

  // Endpoint de prueba para enviar mensaje
  app.post('/send', async (req, res) => {
    const { to, message } = req.body;
    try {
      await client.sendText(to, message);
      res.json({ success: true, to, message });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server corriendo en http://localhost:${PORT}`);
});
