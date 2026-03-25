import { isValidIP } from '@/utils/valid-ip.js';

/**
 * 从 Upai (又拍云) 获取 IP 地址
 * 逻辑：请求又拍云节点探测接口，返回当前访问的真实 IP
 */
const getIPFromUpai = async () => {
    const source = "Upaiyun"; // 统一 Source 名称
    try {
        const unixTime = Date.now();
        const url = `https://pubstatic.b0.upaiyun.com/?_upnode&t=${unixTime}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error("Network response was not ok");
        }

        const data = await response.json();
        const ip = data.remote_addr;

        if (isValidIP(ip)) {
            return { 
                ip: ip, 
                source: source 
            };
        } else {
            console.error("Invalid IP from Upaiyun:", ip);
            return { ip: null, source: source };
        }
    } catch (error) {
        console.error("Error fetching IP from Upaiyun:", error);
        return {
            ip: null,
            source: source
        };
    }
};

export { getIPFromUpai };