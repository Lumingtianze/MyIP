import { get } from 'https';
import { isValidIP } from '../../common/valid-ip.js';
import { refererCheck } from '../../common/referer-check.js';
import countryLookup from 'country-code-lookup';

export default async (req, res) => {
    // 1. Referer 检查
    const referer = req.headers.referer;
    if (!refererCheck(referer)) {
        return res.status(403).json({ error: referer ? 'Access denied' : 'What are you doing?' });
    }

    // 2. IP 检查
    const ipAddress = req.query.ip;
    if (!ipAddress) {
        return res.status(400).json({ error: 'No IP address provided' });
    }
    if (!isValidIP(ipAddress)) {
        return res.status(400).json({ error: 'Invalid IP address' });
    }

    // 3. Token 处理
    const tokenEnv = process.env.IPINFO_API_TOKEN;
    if (!tokenEnv) {
        return res.status(500).json({ error: 'IPinfo Lite Token is missing in Environment Variables' });
    }
    
    const tokens = tokenEnv.split(',');
    const token = tokens[Math.floor(Math.random() * tokens.length)].trim();

    // 4. 构建 IPinfo Lite URL
    const url = `https://api.ipinfo.io/lite/${ipAddress}?token=${token}`;

    get(url, apiRes => {
        let data = '';
        apiRes.on('data', chunk => data += chunk);
        apiRes.on('end', async () => {
            try {
                const originalJson = JSON.parse(data);
                
                const modifiedJson = modifyLiteJson(originalJson);

                res.json(modifiedJson);
            } catch (e) {
                res.status(500).json({ error: 'Error parsing JSON' });
            }
        });
    }).on('error', (e) => {
        res.status(500).json({ error: e.message });
    });
};

/**
 * 将 IPinfo Lite 的数据结构转换为 MyIP 前端兼容的结构
 */
function modifyLiteJson(json) {
    // Lite 的字段名与 Standard 版完全不同
    const { 
        ip, 
        asn, 
        as_name, 
        country_code, 
        country, 
        continent 
    } = json;

    // 尝试通过 country_code 获取更准确的国家名
    let countryName = country;
    try {
        const lookup = countryLookup.byIso(country_code);
        if (lookup) countryName = lookup.country;
    } catch (e) {
        // 忽略错误，使用自带的
    }

    return {
        ip: ip || "",
        // Lite 版没有城市和地区，必须给个默认值防止前端 crash
        city: "N/A", 
        region: continent || "N/A", 
        country: country_code || "",
        country_name: countryName || "",
        country_code: country_code || "",
        // Lite 版没有经纬度，给个 0,0 坐标
        latitude: 0,
        longitude: 0,
        asn: asn || "",
        // 映射 org 字段
        org: as_name || ""
    };
}