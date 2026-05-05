import { refererCheck } from '../../common/referer-check-edge.js';

// 创建一个用于设置 headers 的通用函数
function createFetchOptions(env) {
    return {
        headers: {
            'Authorization': `Bearer ${env.CLOUDFLARE_API}`,
            'Content-Type': 'application/json'
        }
    };
}

// ASN 信息
async function getASNInfo(asn, env) {
    try {
        const url = `https://api.cloudflare.com/client/v4/radar/entities/asns/${asn}`;
        const options = createFetchOptions(env);
        const response = await fetch(url, options);
        const json = await response.json();
        return json;
    } catch (error) {
        console.error(error);
        throw new Error('Failed to fetch ASN info');
    }
};

// IP 版本分布
async function getASNIPVersion(asn, env) {
    try {
        const url = `https://api.cloudflare.com/client/v4/radar/http/summary/ip_version?asn=${asn}&dateRange=7d`;
        const options = createFetchOptions(env);
        const response = await fetch(url, options);
        const json = await response.json();
        return json;
    } catch (error) {
        console.error(error);
        throw new Error('Failed to fetch ASN IP version');
    }
};

// HTTP 协议分布
async function getASNHTTPProtocol(asn, env) {
    try {
        const url = `https://api.cloudflare.com/client/v4/radar/http/summary/http_protocol?asn=${asn}&dateRange=7d`;
        const options = createFetchOptions(env);
        const response = await fetch(url, options);
        const json = await response.json();
        return json;
    } catch (error) {
        console.error(error);
        throw new Error('Failed to fetch ASN HTTP protocol');
    }
};

// 设备分布
async function getASNDeviceType(asn, env) {
    try {
        const url = `https://api.cloudflare.com/client/v4/radar/http/summary/device_type?asn=${asn}&dateRange=7d`;
        const options = createFetchOptions(env);
        const response = await fetch(url, options);
        const json = await response.json();
        return json;
    } catch (error) {
        console.error(error);
        throw new Error('Failed to fetch ASN device type');
    }
};

// 机器人分布
async function getASNBotType(asn, env) {
    try {
        const url = `https://api.cloudflare.com/client/v4/radar/http/summary/bot_class?asn=${asn}&dateRange=7d`;
        const options = createFetchOptions(env);
        const response = await fetch(url, options);
        const json = await response.json();
        return json;
    } catch (error) {
        console.error(error);
        throw new Error('Failed to fetch ASN bot type');
    }
};

// 验证 asn 是否合法
function isValidASN(asn) {
    return /^[0-9]+$/.test(asn);
};


// 格式化输出
function formatData(data) {
    const { asnName, asnOrgName, estimatedUsers, IPv4_Pct, IPv6_Pct, HTTP_Pct, HTTPS_Pct, Desktop_Pct, Mobile_Pct, Bot_Pct, Human_Pct } = data;
    const formattedData = {
        asnName,
        asnOrgName,
        estimatedUsers: estimatedUsers ? parseFloat(estimatedUsers).toLocaleString() : 'N/A',
        IPv4_Pct: `${(parseFloat(IPv4_Pct || 0) * 100).toFixed(2)}%`,
        IPv6_Pct: `${(parseFloat(IPv6_Pct || 0) * 100).toFixed(2)}%`,
        HTTP_Pct: `${(parseFloat(HTTP_Pct || 0) * 100).toFixed(2)}%`,
        HTTPS_Pct: `${(parseFloat(HTTPS_Pct || 0) * 100).toFixed(2)}%`,
        Desktop_Pct: `${(parseFloat(Desktop_Pct || 0) * 100).toFixed(2)}%`,
        Mobile_Pct: `${(parseFloat(Mobile_Pct || 0) * 100).toFixed(2)}%`,
        Bot_Pct: `${(parseFloat(Bot_Pct || 0) * 100).toFixed(2)}%`,
        Human_Pct: `${(parseFloat(Human_Pct || 0) * 100).toFixed(2)}%`
    };

    return formattedData;
}

// 过滤不存在的字段
function filterData(data) {
    for (const key in data) {
        if (data[key] === 'NaN' || data[key] === 'NaN%' || data[key] === 'N/A') {
            delete data[key];
        }
    }
    return data;
}

// 导出 Pages Function 处理函数
export const onRequest = async (context) => {
    const { request, env } = context;
    const params = new URL(request.url).searchParams;

    // 限制只能从指定域名访问
    const referer = request.headers.get('referer');
    if (!refererCheck(referer, env)) {
        return new Response(JSON.stringify({ error: referer ? 'Access denied' : 'What are you doing?' }), { status: 403 });
    }

    const asn = params.get('asn');
    if (!asn) {
        return new Response(JSON.stringify({ error: 'No ASN provided' }), { status: 400 });
    }
    if (!isValidASN(asn)) {
        return new Response(JSON.stringify({ error: 'Invalid ASN' }), { status: 400 });
    }

    try {
        const results = await Promise.allSettled([
            getASNInfo(asn, env),
            getASNIPVersion(asn, env),
            getASNHTTPProtocol(asn, env),
            getASNDeviceType(asn, env),
            getASNBotType(asn, env)
        ]);

        const response = results.map(result => {
            return result.status === 'fulfilled' ? result.value : { error: 'Failed to fetch data' };
        });

        // 清洗数据
        function cleanUpResponseData(data) {
            return {
                asnName: data[0]?.result?.asn?.name,
                asnOrgName: data[0]?.result?.asn?.orgName,
                estimatedUsers: data[0]?.result?.asn?.estimatedUsers?.estimatedUsers,
                IPv4_Pct: data[1]?.result?.summary_0?.IPv4,
                IPv6_Pct: data[1]?.result?.summary_0?.IPv6,
                HTTP_Pct: data[2]?.result?.summary_0?.http,
                HTTPS_Pct: data[2]?.result?.summary_0?.https,
                Desktop_Pct: data[3]?.result?.summary_0?.desktop,
                Mobile_Pct: data[3]?.result?.summary_0?.mobile,
                Bot_Pct: data[4]?.result?.summary_0?.bot,
                Human_Pct: data[4]?.result?.summary_0?.human
            };
        }

        const cleanedResponse = cleanUpResponseData(response);
        const finalResponse = formatData(cleanedResponse);
        filterData(finalResponse);

        return new Response(JSON.stringify(finalResponse), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
    }
};