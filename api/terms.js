import { kv } from '@vercel/kv';
import { authenticate } from './_auth.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const phone = await authenticate(req);
  if (!phone) {
    return res.status(401).json({ error: '未登录' });
  }

  try {
    if (req.method === 'GET') {
      const terms = await kv.get(`terms:${phone}`) || [];
      const categories = await kv.get(`categories:${phone}`) || ['运输方式', '单证', '贸易术语', '海关', '仓储', '保险', '费用'];
      return res.status(200).json({ terms, categories });
    }

    if (req.method === 'POST') {
      const data = req.body;
      if (data && Array.isArray(data.terms)) {
        await kv.set(`terms:${phone}`, data.terms);
      }
      if (data && Array.isArray(data.categories)) {
        await kv.set(`categories:${phone}`, data.categories);
      }
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error('Terms API error:', e);
    return res.status(500).json({ error: '服务器错误' });
  }
}