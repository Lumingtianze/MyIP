import { isValidIP } from '@/utils/valid-ip.js';

// 从 Amazon AWS 获取 IP 地址
const getIPFromAmazon = async () => {
    const source = "Amazon AWS";
    try {
        const response = await fetch("https://checkip.amazonaws.com");
        if (!response.ok) {
            throw new Error("Network response was not ok");
        }
        const text = await response.text();
        const ip = text.trim(); // AWS 返回值带有换行符，必须 trim()
        
        if (isValidIP(ip)) {
            return {
                ip: ip,
                source: source
            };
        } else {
            console.error("Invalid IP from Amazon AWS:", ip);
            return { ip: null, source: source };
        }
    } catch (error) {
        console.error("Error fetching IP from Amazon AWS:", error);
        return { ip: null, source: source };
    }
};

export { getIPFromAmazon };