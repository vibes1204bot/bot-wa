const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason
} = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info');
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    auth: state
    // printQRInTerminal: true ← ❌ sudah deprecated
  });

  // ✅ Tampilkan QR manual di terminal
  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('\n📲 Scan QR Code berikut dengan WhatsApp:');
      console.log(qr);
    }

    if (connection === 'close') {
      const reason = new Boom(lastDisconnect?.error).output?.statusCode;
      if (reason !== DisconnectReason.loggedOut) {
        startBot(); // 🔄 Reconnect otomatis
      } else {
        console.log('❌ Logged out. Silakan hapus folder auth_info dan login ulang.');
      }
    }

    if (connection === 'open') {
      console.log('✅ Bot terhubung ke WhatsApp!');
    }
  });

  // ✅ Simpan auth jika diperbarui
  sock.ev.on('creds.update', saveCreds);

  // ✅ Balas otomatis jika ada pesan "ping"
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
