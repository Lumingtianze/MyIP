import { refererCheck } from '../../common/referer-check-edge.js';

// 验证请求合法性
function isValidRequest(searchParams) {
    const isLatitudeValid = /^-?\d+(\.\d+)?$/.test(searchParams.get('latitude'));
    const isLongitudeValid = /^-?\d+(\.\d+)?$/.test(searchParams.get('longitude'));
    const isLanguageValid = /^[a-z]{2}$/.test(searchParams.get('language'));

    return isLatitudeValid && isLongitudeValid && isLanguageValid;
}

// 定义白天模式和黑暗模式样式字符串
const styles = {
    Dark: [
        "feature:all|element:geometry.fill|color:0x242f3e",
        "feature:all|element:labels.text.stroke|color:0x242f3e",
        "feature:all|element:labels.text.fill|color:0x746855",
        "feature:administrative.locality|element:labels.text.fill|color:0xd59563",
        "feature:poi|element:labels.text.fill|color:0xd59563",
        "feature:poi.park|element:geometry|color:0x263c3f",
        "feature:poi.park|element:labels.text.fill|color:0x6b9a76",
        "feature:road|element:geometry|color:0x38414e",
        "feature:road|element:geometry.stroke|color:0x212a37",
        "feature:road|element:labels.text.fill|color:0x9ca5b3",
        "feature:road.highway|element:geometry|color:0x746855",
        "feature:road.highway|element:geometry.stroke|color:0x1f2835",
        "feature:road.highway|element:labels.text.fill|color:0xf3d19c",
        "feature:transit|element:geometry|color:0x2f3948",
        "feature:transit.station|element:labels.text.fill|color:0xd59563",
        "feature:water|element:geometry|color:0x17263c",
        "feature:water|element:labels.text.fill|color:0x515c6d",
        "feature:all|element:labels.text.stroke|color:0x17263c"
    ]
};

// Cloudflare Pages Functions 导出
export const onRequest = async (context) => {
    const { request, env } = context;
    const urlObj = new URL(request.url);
    const params = urlObj.searchParams;

    // 限制只能从指定域名访问
    const referer = request.headers.get('referer');
    if (!refererCheck(referer, env)) {
        return new Response(JSON.stringify({ error: referer ? 'Access denied' : 'What are you doing?' }), { status: 403 });
    }

    // 检查请求是否合法
    if (!isValidRequest(params)) {
        return new Response(JSON.stringify({ error: 'Invalid request' }), { status: 400 });
    }

    const latitude = params.get('latitude');
    const longitude = params.get('longitude');
    const language = params.get('language');
    const CanvasMode = params.get('CanvasMode');

    const mapSize = '500x400';
    const fmt = 'jpg';
    const scale = 2;
    const zoom = 3;

    // 从 env 中获取 API Key
    const apiKeys = (env.GOOGLE_MAP_API_KEY || '').split(',');
    const apiKey = apiKeys[Math.floor(Math.random() * apiKeys.length)];

    let styleParam = '';
    if (CanvasMode === 'Dark') {
        styleParam = styles.Dark.join('&style=');
    }

    const url = `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&markers=color:blue%7C${latitude},${longitude}&scale=${scale}&zoom=${zoom}&maptype=roadmap&language=${language}&format=${fmt}&size=${mapSize}&style=${styleParam}&key=${apiKey}`;

    // 使用 fetch 替代 http.get，并直接将响应流传回前端
    try {
        const apiRes = await fetch(url);
        return new Response(apiRes.body, apiRes);
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
};