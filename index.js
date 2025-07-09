import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeInMemoryStore
} from '@whiskeysockets/baileys'
import pino from 'pino'
import { Boom } from '@hapi/boom'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) })
store.readFromFile('./baileys_store.json')
setInterval(() => {
  store.writeToFile('./baileys_store.json')
}, 10_000)

const startSock = async () => {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info')
  const { version } = await fetchLatestBaileysVersion()
  
  const sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: true,
    auth: state
  })

  store.bind(sock.ev)

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update
    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut
      console.log('connection closed due to', lastDisconnect?.error, ', reconnecting:', shouldReconnect)
      if (shouldReconnect) {
        startSock()
      }
    } else if (connection === 'open') {
      console.log('✅ Bot is connected')
    }
  })

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type === 'notify') {
      const msg = messages[0]
      if (!msg.key.fromMe && msg.message?.conversation) {
        const sender = msg.key.remoteJid
        const text = msg.message.conversation
        console.log('📩 New message:', text)

        await sock.sendMessage(sender, { text: `Kamu mengirim: ${text}` })
      }
    }
  })
}

startSock()
