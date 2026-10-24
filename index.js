const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require("@whiskeysockets/baileys");
const pino = require('pino');
const Groq = require("groq-sdk");
const yts = require('yt-search');
const ytdl = require('ytdl-core');
const fs = require('fs');

const GROQ_API_KEY = process.env.GROQ_API_KEY || "gsk_حط_مفتاحك_هنا";
const groq = new Groq({ apiKey: GROQ_API_KEY });

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: true,
        auth: state,
    });
    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('✅ 7amo Bot شغال');
        }
    });
    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;
        const from = msg.key.remoteJid;
        const body = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
        if (!body) return;
        if (body === "7amo." || body === ".7amo") {
            await sock.sendMessage(from, { text: "✅ البوت شغال يا 7amo\nاكتب *اوامر*" });
            return;
        }
        if (body === "اوامر") {
            await sock.sendMessage(from, { text: "*اوامر 7amo:*\n.7amo - فحص\nاوامر - القائمة\nتشغيل + اسم الأغنية\nواسأل أي سؤال AI" });
            return;
        }
        try {
            const chat = await groq.chat.completions.create({
                messages: [{ role: "system", content: "انت مساعد مصري جدع اسمه 7amo Bot" }, { role: "user", content: body }],
                model: "llama-3.1-8b-instant",
            });
            await sock.sendMessage(from, { text: chat.choices[0]?.message?.content }, { quoted: msg });
        } catch (e) { console.log(e.message); }
    });
}
startBot();
console.log("⏳ بيبدأ... استنى QR");