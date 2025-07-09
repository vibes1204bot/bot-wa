import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  useMultiFileAuthState
} from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import pino from 'pino'
import { makeInMemoryStore } from '@whiskeysockets/baileys'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const store = makeInMemoryStore({ logger: pino({ level: 'silent' }) })

const startSock = async () => {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info')
  const { version } = await fetchLatestBaileysVersion()
  const sock = makeWASocket({
    version,
    printQRInTerminal: true,
    auth: state,
    logger: pino({ level: 'silent' })
  })

  store.bind(sock.ev)
  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
    if (connection === 'close') {
      const shouldReconnect =
        (lastDisconnect?.error instanceof Boom) &&
        lastDisconnect.error.output?.statusCode !== DisconnectReason.loggedOut
      if (shouldReconnect) startSock()
    } else if (connection === 'open') {
      console.log('✅ Bot is connected!')
    }
  })

  sock.ev.on('messages.upsert', ({ messages }) => {
    const msg = messages[0]
    const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text
    if (text?.toLowerCase() === 'ping') {
      sock.sendMessage(msg.key.remoteJid, { text: 'pong' })
    }
  })
}

startSock()
