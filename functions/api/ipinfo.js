import { isValidIP } from '../../common/valid-ip.js';
import { refererCheck } from '../../common/referer-check-edge.js';
import countryLookup from 'country-code-lookup';

function modifyJson(json) {
    const { ip, city, region, country, loc, org } = json;
    const countryName = countryLookup.byIso(country)?.country || 'Unknown Country';
    const [latitude, longitude] = (loc || "0,0").split(',').map(Number);
    const [asn, ...orgName] = (org || "").split(' ');
    const modifiedOrg = orgName.join(' ');

    return {
        ip, city, region, country,
        country_name: countryName,
        country_code: country,
        latitude, longitude, asn,
        org: modifiedOrg
    };
}

export const onRequest = async (context) => {
    const { request, env } = context;
    const params = new URL(request.url).searchParams;
    const referer = request.headers.get('referer');

    if (!refererCheck(referer, env)) {
        return new Response(JSON.stringify({ error: 'Access denied' }), { status: 403 });
    }

    const ipAddress = params.get('ip');
    if (!ipAddress || !isValidIP(ipAddress)) {
        return new Response(JSON.stringify({ error: 'Invalid IP address' }), { status: 400 });
    }

    const tokens = (env.IPINFO_API_TOKEN || '').split(',');
    const token = tokens[Math.floor(Math.random() * tokens.length)];
    const url = `https://ipinfo.io/${ipAddress}${token ? `?token=${token}` : ''}`;

    try {
        const response = await fetch(url);
        const originalJson = await response.json();
        const modifiedJson = modifyJson(originalJson);
        return new Response(JSON.stringify(modifiedJson), { headers: { 'Content-Type': 'application/json' } });
    } catch (e) {
        return new Response(JSON.stringify({ error: 'Error parsing JSON' }), { status: 500 });
    }
};