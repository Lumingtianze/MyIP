import { refererCheck } from '../../common/referer-check-edge.js';

// DoH 服务列表
const dohServers = {
    'Google': 'https://dns.google/resolve?',
    'Cloudflare': 'https://cloudflare-dns.com/dns-query?ct=application/dns-json&',
    'AdGuard': 'https://dns.adguard.com/resolve?',
    'AliDNS': 'https://dns.alidns.com/resolve?',
};

const resolveDoh = async (hostname, type, name, url) => {
    try {
        const response = await fetch(`${url}name=${hostname}&type=${type}`, {
            headers: { 'Accept': 'application/dns-json' }
        });
        const data = await response.json();
        let addresses = data.Answer ? data.Answer.map(answer => answer.data) : ['N/A'];
        
        if (type === 'MX' && data.Answer) {
            // MX 记录特殊处理，模拟 Node dns 的返回格式
            addresses = data.Answer.map(ans => ans.data).join(', ');
        }
        
        return { [name]: addresses };
    } catch (error) {
        return { [name]: `N/A` };
    }
};

export const onRequest = async (context) => {
    const { request, env } = context;
    const params = new URL(request.url).searchParams;
    const referer = request.headers.get('referer');

    if (request.method !== 'GET') {
        return new Response(JSON.stringify({ message: 'Method Not Allowed' }), { status: 405 });
    }

    if (!refererCheck(referer, env)) {
        return new Response(JSON.stringify({ error: 'Access denied' }), { status: 403 });
    }

    const hostname = params.get('hostname');
    const type = params.get('type') || 'A';

    if (!hostname || !hostname.includes('.')) {
        return new Response(JSON.stringify({ error: 'Invalid hostname' }), { status: 400 });
    }

    // 在 Edge 环境中，将所有的查询都通过 DoH 并行执行
    const dohPromises = Object.entries(dohServers).map(([name, url]) => resolveDoh(hostname, type, name, url));

    try {
        const result_doh = await Promise.all(dohPromises);
        return new Response(JSON.stringify({
            hostname,
            result_doh: result_doh
        }), { headers: { 'Content-Type': 'application/json' } });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
};