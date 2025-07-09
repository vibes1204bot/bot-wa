const {
  default: makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");

const P = require("pino");

async function startSock() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info");

  const { version } = await fetchLatestBaileysVersion();
  const sock = makeWASocket({
    version,
    logger: P({ level: "silent" }),
    printQRInTerminal: true,
    auth: state,
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;

      console.log("connection closed due to", lastDisconnect?.error, ", reconnecting:", shouldReconnect);
      if (shouldReconnect) {
        startSock();
      }
    } else if (connection === "open") {
      console.log("opened connection");
    }
  });

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type === "notify") {
      const msg = messages[0];
      if (!msg.key.fromMe) {
        await sock.sendMessage(msg.key.remoteJid, {
          text: "Halo! Ini adalah bot WhatsApp yang sedang aktif 🚀",
        });
      }
    }
  });
}

startSock();