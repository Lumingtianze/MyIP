import { isValidIP } from '../../common/valid-ip.js';
import { refererCheck } from '../../common/referer-check-edge.js';

export const onRequest = async (context) => {
    const { request, env } = context;
    const query = new URL(request.url).searchParams.get('q');
    const referer = request.headers.get('referer');

    if (!refererCheck(referer, env)) {
        return new Response(JSON.stringify({ error: 'Access denied' }), { status: 403 });
    }

    if (!query) {
        return new Response(JSON.stringify({ error: 'No query provided' }), { status: 400 });
    }

    try {
        const isIP = isValidIP(query);
        const rdapUrl = isIP 
            ? `https://rdap.db.ripe.net/ip/${query}` 
            : `https://rdap.org/domain/${query}`;

        const response = await fetch(rdapUrl, {
            headers: { 
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36'
            }
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            return new Response(JSON.stringify({ 
                error: 'RDAP server error', 
                message: errData.description || `Server returned ${response.status}` 
            }), { status: response.status });
        }

        const data = await response.json();
        // 确保前端拿到的是包装过的数据
        return new Response(JSON.stringify({
            type: isIP ? 'ip' : 'domain',
            data: data
        }), { headers: { 'Content-Type': 'application/json' } });

    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
};