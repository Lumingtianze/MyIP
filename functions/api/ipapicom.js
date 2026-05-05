import { isValidIP } from '../../common/valid-ip.js';
import { refererCheck } from '../../common/referer-check-edge.js';

export const onRequest = async (context) => {
    const { request, env } = context;
    const params = new URL(request.url).searchParams;
    const referer = request.headers.get('referer');

    if (!refererCheck(referer, env)) {
        return new Response(JSON.stringify({ error: 'Access denied' }), { status: 403 });
    }

    const ipAddress = params.get('ip');
    const lang = params.get('lang') || 'en';
    if (!ipAddress || !isValidIP(ipAddress)) {
        return new Response(JSON.stringify({ error: 'Invalid IP address' }), { status: 400 });
    }

    const url = `http://ip-api.com/json/${ipAddress}?fields=66842623&lang=${lang}`;

    try {
        const response = await fetch(url);
        const json = await response.json();
        const modified = {
            ip: json.query,
            city: json.city,
            region: json.regionName,
            country: json.countryCode,
            country_name: json.country,
            country_code: json.countryCode,
            latitude: json.lat,
            longitude: json.lon,
            asn: json.as ? json.as.split(" ")[0] : '',
            org: json.isp
        };
        return new Response(JSON.stringify(modified), { headers: { 'Content-Type': 'application/json' } });
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
};