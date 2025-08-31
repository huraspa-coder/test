// server.js
const fs = require("fs");
const path = require("path");
const express = require("express");
const venom = require("venom-bot");

const app = express();
const PORT = process.env.PORT || 4000;

// Carpeta persistente local en Windows
const SESSION_DIR = "C:\\venom-session";
const QR_PATH = path.join(SESSION_DIR, "qr.png");

// Crear carpeta si no existe
fs.mkdirSync(SESSION_DIR, { recursive: true });
console.log("📂 Carpeta de tokens asegurada en:", SESSION_DIR);

// Middleware para leer JSON
app.use(express.json());

// Endpoint para ver el QR en el explorador
app.get("/qr", (req, res) => {
  if (fs.existsSync(QR_PATH)) {
    res.sendFile(QR_PATH);
  } else {
    res.status(404).send("QR aún no generado");
  }
});

// Endpoint para enviar mensajes
app.post("/send-message", async (req, res) => {
  if (!venomClient) return res.status(503).json({ error: "Cliente no listo" });
  const { to, message } = req.body;

  try {
    // WhatsApp requiere formato completo: número@s.whatsapp.net
    const formattedTo = to.includes("@") ? to : `${to}@c.us`;
    const result = await venomClient.sendText(formattedTo, message);
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint para status de sesión
app.get("/status", (req, res) => {
  if (venomClient && venomClient.isConnected()) {
    res.json({ status: "logged", message: "Cliente WhatsApp conectado ✅" });
  } else {
    res.json({ status: "not_logged", message: "Cliente esperando QR o no iniciado ❌" });
  }
});

let venomClient;

// Crear sesión Venom
venom
  .create(
    "venom-session",
    (base64Qr) => {
      const matches = base64Qr.match(/^data:image\/png;base64,(.+)$/);
      if (matches) {
        const buffer = Buffer.from(matches[1], "base64");
        fs.writeFileSync(QR_PATH, buffer, "binary");
        console.log("✅ QR guardado en:", QR_PATH);
      }
    },
    undefined,
    {
      headless: false, // Windows: Chrome visible para evitar errores
      logQR: false,
      browserPathExecutable: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      browserArgs: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu",
      ],
      mkdirFolderToken: SESSION_DIR,
      folderNameToken: "venom-session",
    }
  )
  .then((client) => {
    venomClient = client;
    console.log("🤖 Venom iniciado correctamente");

    // Responder automáticamente a mensajes entrantes
    client.onMessage((message) => {
      if (message.body.toLowerCase() === "hola") {
        client.sendText(message.from, "👋 Hola, bot funcionando!").catch(console.error);
      }
    });
  })
  .catch((err) => console.error("❌ Error iniciando Venom:", err));

// Healthcheck
app.get("/", (req, res) => res.send("Venom BOT corriendo en Windows 🚀"));

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en puerto ${PORT}`);
});
