import { makeWASocket, useMultiFileAuthState } from '@whiskeysockets/baileys';
import P from 'pino';
import figlet from 'figlet';
import chalk from 'chalk';
import ora from 'ora';

const greetings = ['hi', 'hii', 'hello', 'hey', 'hola', 'howdy'];
const myNumber = '918750725493@s.whatsapp.net'; // Replace with your number (JID format)

// Display "Whiskey Bot" in ASCII art
function displayGraphics() {
    console.clear();
    console.log(
        chalk.green(
            figlet.textSync('Whiskey Bot', {
                font: 'Standard',
                horizontalLayout: 'default',
                verticalLayout: 'default',
            })
        )
    );
    console.log(chalk.blue('Version: 1.0.0\nDeveloped by Whiskeys\n\n'));
}

// Start the bot
async function startBot() {
    const spinner = ora(chalk.cyan('Starting Whiskey Bot...')).start();
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info');

    // Provide the `pino` logger to Baileys
    const logger = P({
        level: 'silent', // Suppress unnecessary logs
    });

    const sock = makeWASocket({
        auth: state,
        logger, // Use pino as the logger
    });

    spinner.succeed(chalk.green('Whiskey Bot started successfully!'));
    displayGraphics();

    sock.ev.on('connection.update', (update) => {
        const { connection, qr } = update;

        if (qr) {
            console.log(chalk.yellow('Scan this QR code to log in:'));
            console.log(qr); // Display QR code in terminal
        }

        if (connection === 'close') {
            console.log(chalk.red('Connection closed. Reconnecting...'));
            startBot();
        } else if (connection === 'open') {
            console.log(chalk.green('Connected to WhatsApp successfully!\n'));
        }
    });

    sock.ev.on('messages.upsert', async (msg) => {
        const message = msg.messages[0];

        if (!message.message) return; // Ignore empty messages

        const from = message.key.remoteJid;
        const isFromMe = message.key.fromMe;
        const text =
            message.message.conversation ||
            message.message.extendedTextMessage?.text;

        if (isFromMe || from === myNumber) return; // Ignore messages from bot or your own number

        if (text) {
            const normalizedText = text.toLowerCase().trim();

            // Respond to greetings
            if (greetings.includes(normalizedText)) {
                console.log(chalk.cyan(`Greeting detected from ${from}. Replying...`));
                await sock.sendMessage(from, { text: 'Hello! How are you?' });
            } else if (normalizedText === 'ping') {
                // Respond to "ping"
                console.log(chalk.cyan(`Ping detected from ${from}. Replying...`));
                await sock.sendMessage(from, { text: 'Pong!' });
            } else if (normalizedText === '/info') {
                // Respond to "/info"
                console.log(chalk.cyan(`Info command detected from ${from}. Replying...`));
                const aboutMessage = `🤖 *Whiskey Bot* 🤖\n\n` +
                    `I am Whiskey Bot, your personal assistant!\n` +
                    `I can:\n` +
                    `- Respond to greetings like "hi" or "hello".\n` +
                    `- Reply to "ping" with "pong".\n` +
                    `- Provide this info when you type "/info".\n\n` +
                    `Built with ❤️ using Node.js and Baileys.`;
                await sock.sendMessage(from, { text: aboutMessage });
            }
        }
    });

    sock.ev.on('creds.update', saveCreds);
}

displayGraphics();
startBot();
