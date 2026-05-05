import { isValidIP } from '../../common/valid-ip.js';
import { refererCheck } from '../../common/referer-check.js';

export default async (req, res) => {
    const referer = req.headers.referer;
    if (!refererCheck(referer)) {
        return res.status(403).json({ error: 'Access denied' });
    }

    const query = req.query.q;
    const isIP = isValidIP(query);
    const rdapUrl = isIP ? `https://rdap.db.ripe.net/ip/${query}` : `https://rdap.org/domain/${query}`;

    try {
        const response = await fetch(rdapUrl, {
            headers: { 
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36'
            }
        });

        if (!response.ok) {
            return res.status(response.status).json({ error: 'RDAP error' });
        }

        const data = await response.json();
        res.json({ type: isIP ? 'ip' : 'domain', data });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};