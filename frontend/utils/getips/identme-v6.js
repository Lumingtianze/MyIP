import { isValidIP } from '@/utils/valid-ip.js';

// 从 ident.me 获取 IPv6 地址
const getIPFromIdentMe_V6 = async () => {
    const source = "ident.me IPv6";
    try {
        const response = await fetch("https://6.ident.me");
        if (!response.ok) throw new Error("Network response was not ok");
        const ip = (await response.text()).trim();
        
        if (isValidIP(ip)) {
            return { ip: ip, source: source };
        } else {
            console.error("Invalid IP from ident.me IPv6:", ip);
            return { ip: null, source: source };
        }
    } catch (error) {
        console.error("Error fetching IP from ident.me IPv6:", error);
        return { ip: null, source: source };
    }
};

export { getIPFromIdentMe_V6 };
