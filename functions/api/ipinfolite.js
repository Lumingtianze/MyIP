import { isValidIP } from '../../common/valid-ip.js';
import { refererCheck } from '../../common/referer-check-edge.js';
import countryLookup from 'country-code-lookup';

/**
 * 将 IPinfo Lite 的数据结构转换为前端兼容的结构
 */
function modifyLiteJson(json) {
    const { ip, asn, as_name, country_code, country, continent } = json;

    let countryName = country;
    try {
        const lookup = countryLookup.byIso(country_code);
        if (lookup) countryName = lookup.country;
    } catch (e) {
        // 忽略错误
    }

    return {
        ip: ip || "",
        city: "N/A", 
        region: continent || "N/A", 
        country: country_code || "",
        country_name: countryName || "",
        country_code: country_code || "",
        latitude: 0,
        longitude: 0,
        asn: asn || "",
        org: as_name || ""
    };
}

export const onRequest = async (context) => {
    const { request, env } = context;
    const params = new URL(request.url).searchParams;

    // 1. Referer 检查
    const referer = request.headers.get('referer');
    if (!refererCheck(referer, env)) {
        return new Response(JSON.stringify({ error: referer ? 'Access denied' : 'What are you doing?' }), { status: 403 });
    }

    // 2. IP 检查
    const ipAddress = params.get('ip');
    if (!ipAddress) {
        return new Response(JSON.stringify({ error: 'No IP address provided' }), { status: 400 });
    }
    if (!isValidIP(ipAddress)) {
        return new Response(JSON.stringify({ error: 'Invalid IP address' }), { status: 400 });
    }

    // 3. Token 处理
    const tokenEnv = env.IPINFO_API_TOKEN;
    if (!tokenEnv) {
        return new Response(JSON.stringify({ error: 'IPinfo Lite Token is missing' }), { status: 500 });
    }
    
    const tokens = tokenEnv.split(',');
    const token = tokens[Math.floor(Math.random() * tokens.length)].trim();

    // 4. 构建 URL 并请求
    const url = `https://api.ipinfo.io/lite/${ipAddress}?token=${token}`;

    try {
        const response = await fetch(url);
        const originalJson = await response.json();
        const modifiedJson = modifyLiteJson(originalJson);
        return new Response(JSON.stringify(modifiedJson), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
};