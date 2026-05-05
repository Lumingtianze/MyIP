import { refererCheck } from '../../common/referer-check-edge.js';

// 验证环境变量是否存在，以进行前端功能的开启和关闭
export const onRequest = async (context) => {
    const { request, env } = context;

    // 限制请求方法
    if (request.method !== 'GET') {
        return new Response(JSON.stringify({ message: 'Method Not Allowed' }), { status: 405 });
    }

    // 限制只能从指定域名访问
    const referer = request.headers.get('referer');
    if (!refererCheck(referer, env)) {
        return new Response(JSON.stringify({ error: referer ? 'Access denied' : 'What are you doing?' }), { status: 403 });
    }

    // 检查是否是原始站点
    const hostname = referer ? new URL(referer).hostname : '';
    const originalSite = hostname === 'ipcheck.ing' || hostname === 'www.ipcheck.ing' || hostname === 'localtest.ipcheck.ing';

    // 检查 Cloudflare Pages 环境变量
    const envConfigs = {
        map: env.GOOGLE_MAP_API_KEY,
        ipInfo: env.IPINFO_API_TOKEN,
        cloudFlare: env.CLOUDFLARE_API,
    };

    let result = {};
    for (const key in envConfigs) {
        result[key] = !!envConfigs[key];
    }

    return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
};