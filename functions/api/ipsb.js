import { isValidIP } from '../../common/valid-ip.js';
import { refererCheck } from '../../common/referer-check-edge.js';

function modifyJsonForIPSB(json) {
    return {
        ip: json.ip,
        city: json.city,
        region: json.region ? json.region : json.city,
        country: json.country_code,
        country_name: json.country,
        country_code: json.country_code,
        latitude: json.latitude,
        longitude: json.longitude,
        asn: "AS" + json.asn,
        org: json.isp
    };
}

export const onRequest = async (context) => {
    const { request, env } = context;
    const params = new URL(request.url).searchParams;

    // 限制只能从指定域名访问
    const referer = request.headers.get('referer');
    if (!refererCheck(referer, env)) {
        return new Response(JSON.stringify({ error: referer ? 'Access denied' : 'What are you doing?' }), { status: 403 });
    }

    const ipAddress = params.get('ip');
    if (!ipAddress) {
        return new Response(JSON.stringify({ error: 'No IP address provided' }), { status: 400 });
    }

    // 检查 IP 地址是否合法
    if (!isValidIP(ipAddress)) {
        return new Response(JSON.stringify({ error: 'Invalid IP address' }), { status: 400 });
    }

    const url = `https://api.ip.sb/geoip/${ipAddress}`;

    try {
        const response = await fetch(url);
        const originalJson = await response.json();
        const modifiedJson = modifyJsonForIPSB(originalJson);
        return new Response(JSON.stringify(modifiedJson), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
};