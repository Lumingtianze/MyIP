import { isValidIP } from '../../common/valid-ip.js';
import { refererCheck } from '../../common/referer-check-edge.js';

function modifyJsonForIPAPIIS(json) {
    let asn = json.asn || {};
    const { ip, location, is_datacenter, is_proxy, is_vpn, is_tor } = json;

    return {
        ip: ip,
        city: location.city || 'N/A',
        region: location.state || 'N/A',
        country: location.country_code || 'N/A',
        country_name: location.country || 'N/A',
        country_code: location.country_code || 'N/A',
        latitude: location.latitude || 'N/A',
        longitude: location.longitude || 'N/A',
        asn: asn.asn === undefined ? 'N/A' : 'AS' + asn.asn,
        org: asn.org || 'N/A',
        isHosting: is_datacenter || false,
        isProxy: is_proxy || is_vpn || is_tor || false
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

    // 从请求中获取 IP 地址
    const ipAddress = params.get('ip');
    if (!ipAddress) {
        return new Response(JSON.stringify({ error: 'No IP address provided' }), { status: 400 });
    }

    // 检查 IP 地址是否合法
    if (!isValidIP(ipAddress)) {
        return new Response(JSON.stringify({ error: 'Invalid IP address' }), { status: 400 });
    }

    // 从环境变量获取 Key
    const envKeys = env.IPAPIIS_API_KEY || '';
    const keys = envKeys.split(',');
    const key = keys[Math.floor(Math.random() * keys.length)];
    const url = `https://api.ipapi.is?q=${ipAddress}&key=${key}`;

    try {
        const response = await fetch(url);
        const originalJson = await response.json();
        const modifiedJson = modifyJsonForIPAPIIS(originalJson);
        return new Response(JSON.stringify(modifiedJson), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
};