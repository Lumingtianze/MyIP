import { isValidIP } from '@/utils/valid-ip.js';

// 从 ident.me 获取 IPv4 地址
const getIPFromIdentMe_V4 = async () => {
    const source = "ident.me IPv4";
    try {
        const response = await fetch("https://v4.ident.me");
        if (!response.ok) throw new Error("Network response was not ok");
        const ip = (await response.text()).trim();
        
        if (isValidIP(ip)) {
            return { ip: ip, source: source };
        } else {
            console.error("Invalid IP from ident.me IPv4:", ip);
            return { ip: null, source: source };
        }
    } catch (error) {
        console.error("Error fetching IP from ident.me IPv4:", error);
        return { ip: null, source: source };
    }
};

export { getIPFromIdentMe_V4 };