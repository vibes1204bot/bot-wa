const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys')
const pino = require('pino')
const { Boom } = require('@hapi/boom')
const fs = require('fs')

async function startSock() {
    const { state, saveCreds } = await useMultiFileAuthState('session')

    const { version, isLatest } = await fetchLatestBaileysVersion()

    const sock = makeWASocket({
        version,
        printQRInTerminal: true,
        auth: state,
        logger: pino({ level: 'silent' })
    })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error = Boom)?.output?.statusCode !== DisconnectReason.loggedOut
            console.log('connection closed due to', lastDisconnect.error, ', reconnecting:', shouldReconnect)
            if (shouldReconnect) {
                startSock()
            }
        } else if (connection === 'open') {
            console.log('connection opened')
        }
    })

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type === 'notify') {
            const msg = messages[0]
            const sender = msg.key.remoteJid
            const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ''
            console.log('Pesan masuk dari:', sender, 'Isi:', text)

            if (text.toLowerCase() === 'ping') {
                await sock.sendMessage(sender, { text: 'pong 🏓' })
            }
        }
    })
}

startSock()
