import { refererCheck } from '../../common/referer-check-edge.js';

const isValidMAC = (address) => {
    const normalizedAddress = address.replace(/[:-]/g, '');
    return normalizedAddress.length >= 6 && normalizedAddress.length <= 12 && /^[0-9A-Fa-f]+$/.test(normalizedAddress);
}

const modifyData = (data) => {
    // 检查单播/多播以及本地/全球地址
    const firstByte = parseInt(data.macPrefix.substring(0, 2), 16);
    const isMulticast = (firstByte & 0x01) === 0x01;
    const isLocal = (firstByte & 0x02) === 0x02;

    data.isMulticast = !!isMulticast;
    data.isLocal = !!isLocal;
    data.isGlobal = !isLocal;
    data.isUnicast = !isMulticast;
    data.macPrefix = data.macPrefix ? data.macPrefix.match(/.{1,2}/g).join(':') : 'N/A';
    data.company = data.company || 'N/A';
    data.country = data.country || 'N/A';
    data.address = data.address || 'N/A';
    data.updated = data.updated || 'N/A';
    data.blockStart = data.blockStart ? data.blockStart.match(/.{1,2}/g).join(':') : 'N/A';
    data.blockEnd = data.blockEnd ? data.blockEnd.match(/.{1,2}/g).join(':') : 'N/A';
    data.blockSize = data.blockSize || 'N/A';
    data.blockType = data.blockType || 'N/A';

    return data;
}

export const onRequest = async (context) => {
    const { request, env } = context;
    const params = new URL(request.url).searchParams;
    const referer = request.headers.get('referer');

    if (!refererCheck(referer, env)) {
        return new Response(JSON.stringify({ error: referer ? 'Access denied' : 'What are you doing?' }), { status: 403 });
    }

    let macAddress = params.get('mac');
    if (!macAddress) {
        return new Response(JSON.stringify({ error: 'No MAC address provided' }), { status: 400 });
    }
    macAddress = macAddress.replace(/:/g, '').replace(/-/g, '');

    if (!isValidMAC(macAddress)) {
        return new Response(JSON.stringify({ error: 'Invalid MAC address' }), { status: 400 });
    }

    const token = env.MAC_LOOKUP_API_KEY || '';
    const url = `https://api.maclookup.app/v2/macs/${macAddress}${token ? `?apiKey=${token}` : ''}`;

    try {
        const response = await fetch(url);
        const originalJson = await response.json();
        if (originalJson.success !== true) {
            return new Response(JSON.stringify({ success: false, error: originalJson.error || 'Data not found' }));
        }
        const finalData = modifyData(originalJson);
        return new Response(JSON.stringify(finalData), { headers: { 'Content-Type': 'application/json' } });
    } catch (e) {
        return new Response(JSON.stringify({ error: 'Error fetching MAC info' }), { status: 500 });
    }
};