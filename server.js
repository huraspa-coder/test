// server.js
const fs = require("fs");
const path = require("path");
const express = require("express");
const venom = require("venom-bot");
const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());

// Carpeta local para la sesión y QR
const SESSION_DIR = "C:\\venom-session";
const QR_PATH = path.join(SESSION_DIR, "qr.png");

// Crear carpeta si no existe
fs.mkdirSync(SESSION_DIR, { recursive: true });
console.log("📂 Carpeta de tokens asegurada en:", SESSION_DIR);

let venomClient;

// Endpoint para ver QR
app.get("/qr", (req, res) => {
  if (fs.existsSync(QR_PATH)) {
    res.sendFile(QR_PATH);
  } else {
    res.status(404).send("QR aún no generado");
  }
});

// Endpoint para enviar mensajes
app.post("/send-message", async (req, res) => {
  const { to, message } = req.body;
  if (!venomClient) {
    return res.status(503).json({ error: "Cliente WhatsApp no iniciado" });
  }
  try {
    const result = await venomClient.sendText(to, message);
    res.json({ success: true, result });
  } catch (err) {
    console.error("Error enviando mensaje:", err);
    res.status(500).json({ error: err.message });
  }
});

// Endpoint de status
app.get("/status", (req, res) => {
  if (venomClient && venomClient.isConnected()) {
    res.json({ status: "logged", message: "Cliente WhatsApp conectado ✅" });
  } else {
    res.json({ status: "not_logged", message: "Esperando QR o no iniciado ❌" });
  }
});

// Crear sesión Venom
venom
  .create(
    "venom-session",
    (base64Qr) => {
      // Guardar QR en PNG
      const matches = base64Qr.match(/^data:image\/png;base64,(.+)$/);
      if (matches) {
        const buffer = Buffer.from(matches[1], "base64");
        fs.writeFileSync(QR_PATH, buffer, "binary");
        console.log("✅ QR guardado en:", QR_PATH);
      }
    },
    undefined,
    {
      headless: false, // mostrar ventana para Windows
      logQR: true,
      browserPathExecutable: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      browserArgs: [
        "--disable-gpu",
        "--disable-extensions",
        "--disable-background-networking",
        "--disable-default-apps",
        "--disable-popup-blocking",
        "--no-first-run",
      ],
      mkdirFolderToken: SESSION_DIR,
      folderNameToken: "venom-session",
    }
  )
  .then((client) => {
    venomClient = client;
    console.log("🤖 Venom iniciado correctamente");

    // Listener de mensajes entrantes
    client.onMessage((message) => {
      console.log("Mensaje recibido de", message.from, ":", message.body);
      // Respuesta automática ejemplo
      if (message.body.toLowerCase() === "hola") {
        client.sendText(message.from, "👋 Hola, bot funcionando!").catch(console.error);
      }
    });
  })
  .catch((err) => console.error("❌ Error iniciando Venom:", err));

// Healthcheck
app.get("/", (req, res) => res.send("Venom BOT corriendo en Windows 🚀"));

app.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en puerto ${PORT}`);
});
