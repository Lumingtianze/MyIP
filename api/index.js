// api/index.js (Vercel 入口)
export default async function handler(req, res) {
  // 获取请求路径，例如 /api/whois -> action = whois
  const url = new URL(req.url, `http://${req.headers.host}`);
  const action = url.pathname.split('/').pop(); 

  try {
    // 动态加载对应的处理逻辑
    const module = await import(`./_lib/${action}.js`);
    
    // 调用原文件里的默认导出函数
    if (module.default) {
      return await module.default(req, res);
    } else {
      res.status(404).send('Action not found');
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: `API ${action} Error`, message: e.message });
  }
}