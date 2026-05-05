function refererCheck(referer, env) {
    // 在 Cloudflare 中，环境变量通过 env 对象传递
    // 如果没有传 env，则尝试从全局获取
    const domainsString = (env && env.ALLOWED_DOMAINS) || "";
    const allowedDomains = ['localhost', ...domainsString.split(',').map(d => d.trim())];

    if (referer) {
        try {
            const domain = new URL(referer).hostname;
            return allowedDomains.includes(domain);
        } catch (e) {
            return false;
        }
    }
    return false; 
}

export { refererCheck };