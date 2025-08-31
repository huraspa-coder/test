// server-local.js
const fs = require("fs");
const path = require("path");
const express = require("express");
const venom = require("venom-bot");

const app = express();
app.use(express.json());
const PORT = 3000; // puerto local para pruebas

// Carpeta donde se almacenará la sesión de Venom en tu PC
const SESSION_DIR = path.join(__dirname, "venom-session");
const QR_PATH = path.join(SESSION_DIR, "qr.png");

// Crear carpeta si no existe
fs.mkdirSync(SESSION_DIR, { recursive: true });
console.log("📂 Carpeta de tokens asegurada en:", SESSION_DIR);

let venomClient;

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
      headless: false, // abrir Chrome visible para generar sesión
      logQR: true,
      browserPathExecutable: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      mkdirFolderToken: SESSION_DIR,
      folderNameToken: "venom-session",
    }
  )
  .then((client) => {
    venomClient = client;
    console.log("🤖 Venom iniciado correctamente");

    client.onMessage((message) => {
      console.log(`📩 Mensaje recibido: ${message.body} de ${message.from}`);
      if (message.body.toLowerCase() === "hola") {
        client.sendText(message.from, "👋 Hola, bot funcionando!").catch(console.error);
      }
    });
  })
  .catch((err) => console.error("❌ Error iniciando Venom:", err));

// Endpoints de prueba
app.get("/", (req, res) => res.send("Venom BOT corriendo localmente 🚀"));
app.get("/qr", (req, res) => {
  if (fs.existsSync(QR_PATH)) res.sendFile(QR_PATH);
  else res.status(404).send("QR aún no generado");
});
app.get("/status", (req, res) => {
  if (venomClient && venomClient.isConnected()) res.json({ status: "logged" });
  else res.json({ status: "not_logged" });
});
app.post("/send-message", (req, res) => {
  const { to, message } = req.body;
  if (!venomClient) return res.status(400).json({ error: "Bot no iniciado" });

  venomClient.sendText(to + "@c.us", message)
    .then(() => res.json({ success: true }))
    .catch((err) => res.status(500).json({ error: err.message }));
});

app.listen(PORT, () => console.log(`🚀 Servidor escuchando en puerto ${PORT}`));
