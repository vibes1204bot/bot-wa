const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason
} = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const qrcode = require('qrcode-terminal');

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info');
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    auth: state
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log("🔑 QR code received, generating in terminal...");
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      const reason = new Boom(lastDisconnect?.error).output?.statusCode;
      if (reason !== DisconnectReason.loggedOut) {
        console.log("🔁 Reconnecting...");
        startBot();
      }
    }
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const sender = msg.key.remoteJid;
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text;

    if (text?.toLowerCase() === 'ping') {
      await sock.sendMessage(sender, { text: 'Pong!' });
    }
  });
}

startBot();
