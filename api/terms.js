import { kv } from '@vercel/kv';

// 内存存储回退
const memoryTerms = {};
const memoryCategories = {};
let kvAvailable = true;

// 认证（支持 KV 和内存两种模式）
async function authenticate(req) {
  const auth = req.headers['authorization'] || '';
  let token = '';
  if (auth.startsWith('Bearer ')) {
    token = auth.substring(7);
  }
  if (!token) {
    const cookie = req.headers['cookie'] || '';
    const match = cookie.match(/token=([^;]+)/);
    if (match) token = match[1];
  }
  if (!token) return null;

  if (kvAvailable) {
    try {
      const phone = await kv.get(`token:${token}`);
      if (phone) return phone;
    } catch (e) {
      console.error('KV auth error:', e.message);
      kvAvailable = false;
    }
  }

  // 内存模式无法跨请求保持 session，返回 null
  return null;
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const phone = await authenticate(req);
  if (!phone) {
    return res.status(401).json({ error: '未登录' });
  }

  try {
    if (req.method === 'GET') {
      let terms = null;
      let categories = null;

      if (kvAvailable) {
        try {
          terms = await kv.get(`terms:${phone}`);
          categories = await kv.get(`categories:${phone}`);
        } catch (e) {
          console.error('KV get error:', e.message);
          kvAvailable = false;
        }
      }

      if (!kvAvailable) {
        terms = memoryTerms[phone] || [];
        categories = memoryCategories[phone] || ['运输方式', '单证', '贸易术语', '海关', '仓储', '保险', '费用'];
      }

      return res.status(200).json({
        terms: terms || [],
        categories: categories || ['运输方式', '单证', '贸易术语', '海关', '仓储', '保险', '费用']
      });
    }

    if (req.method === 'POST') {
      const data = req.body;
      if (data && Array.isArray(data.terms)) {
        if (kvAvailable) {
          try {
            await kv.set(`terms:${phone}`, data.terms);
          } catch (e) {
            console.error('KV set terms error:', e.message);
            kvAvailable = false;
          }
        }
        if (!kvAvailable) {
          memoryTerms[phone] = data.terms;
        }
      }
      if (data && Array.isArray(data.categories)) {
        if (kvAvailable) {
          try {
            await kv.set(`categories:${phone}`, data.categories);
          } catch (e) {
            console.error('KV set categories error:', e.message);
            kvAvailable = false;
          }
        }
        if (!kvAvailable) {
          memoryCategories[phone] = data.categories;
        }
      }
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error('Terms API error:', e);
    return res.status(500).json({ error: '服务器错误: ' + e.message });
  }
}