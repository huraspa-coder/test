// server.js
const fs = require("fs");
const path = require("path");
const express = require("express");
const venom = require("venom-bot");
const app = express();
const PORT = process.env.PORT || 3000;

// Carpeta local para sesión (Windows)
const SESSION_DIR = "C:\\venom-session"; // <-- Aquí se guarda la sesión
const QR_PATH = path.join(SESSION_DIR, "qr.png");

// Crear carpeta si no existe
fs.mkdirSync(SESSION_DIR, { recursive: true });
console.log("📂 Carpeta de tokens asegurada en:", SESSION_DIR);

// Endpoint para ver el QR
app.get("/qr", (req, res) => {
  if (fs.existsSync(QR_PATH)) {
    res.sendFile(QR_PATH);
  } else {
    res.status(404).send("QR aún no generado");
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
      headless: false, // Para Windows, así ves el navegador y escaneas QR
      logQR: false,
      browserPathExecutable: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", // Ruta del Chrome instalado
      browserArgs: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
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
      console.log("📩 Mensaje recibido:", message.body, "de", message.from);
      if (message.body.toLowerCase() === "hola") {
        client.sendText(message.from, "👋 Hola, bot funcionando!").catch(console.error);
      }
    });
  })
  .catch((err) => console.error("❌ Error iniciando Venom:", err));

// Healthcheck
app.get("/", (req, res) => res.send("Venom BOT corriendo localmente 🚀"));

app.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en puerto ${PORT}`);
});
