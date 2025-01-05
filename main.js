const TELEGRAM_API_TOKEN = '*******************************';
const IPINFO_TOKEN = '**********';
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_API_TOKEN}`;

async function fetchIPInfo(ip) {
    try {
        const response = await fetch(`https://ipinfo.io/${ip}?token=${IPINFO_TOKEN}`);
        if (!response.ok) {
            throw new Error(`IPInfo API returned status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching IP info:', error);
        throw new Error('Failed to fetch IP information.');
    }
}

async function handleUpdate(update) {
    const message = update.message;
    if (!message || !message.chat || !message.chat.id) {
        console.error('Invalid update structure:', update);
        return;
    }

    const chatId = message.chat.id;
    const text = message.text?.trim();

    if (!text) {
        await sendMessage(chatId, 'Please send a valid IP address (IPv4 or IPv6).');
        return;
    }

    if (text === '/start') {
        await sendMessage(chatId, 'Hi! Send me an IP address, and I will show you its information.');
    } else if (/^(\d{1,3}\.){3}\d{1,3}$/.test(text) || /^[a-fA-F0-9:]+$/.test(text)) {
        try {
            const ipInfo = await fetchIPInfo(text);
            const responseMessage = `
*IP Information:*
- *IP:* ${ipInfo.ip}
- *City:* ${ipInfo.city || 'Unknown'}
- *Region:* ${ipInfo.region || 'Unknown'}
- *Country:* ${ipInfo.country || 'Unknown'}
- *Location:* ${ipInfo.loc || 'Unknown'}
- *Organization:* ${ipInfo.org || 'Unknown'}
- *Postal Code:* ${ipInfo.postal || 'Unknown'}
- *Timezone:* ${ipInfo.timezone || 'Unknown'}
            `;
            await sendMessage(chatId, responseMessage, 'Markdown');
        } catch (error) {
            await sendMessage(chatId, 'Sorry, I couldn’t fetch the IP information. Please try again later.');
        }
    } else {
        await sendMessage(chatId, 'Invalid IP address. Please send a valid IPv4 or IPv6 address.');
    }
}

async function sendMessage(chatId, text, parseMode = 'Markdown') {
    try {
        const response = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: text,
                parse_mode: parseMode
            })
        });

        if (!response.ok) {
            console.error('Failed to send message:', await response.text());
        }
    } catch (error) {
        console.error('Error sending message:', error);
    }
}

addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
    if (request.method === 'POST') {
        try {
            const update = await request.json();
            await handleUpdate(update);
            return new Response('OK', { status: 200 });
        } catch (error) {
            console.error('Error handling update:', error);
            return new Response('Internal Server Error', { status: 500 });
        }
    }
    return new Response('Method Not Allowed', { status: 405 });
}