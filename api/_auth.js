import { kv } from '@vercel/kv';

// 验证 token，返回手机号或 null
export async function authenticate(req) {
  const auth = req.headers['authorization'] || '';
  if (auth.startsWith('Bearer ')) {
    const token = auth.substring(7);
    const phone = await kv.get(`token:${token}`);
    return phone || null;
  }
  // 也支持 Cookie
  const cookie = req.headers['cookie'] || '';
  const match = cookie.match(/token=([^;]+)/);
  if (match) {
    const phone = await kv.get(`token:${match[1]}`);
    return phone || null;
  }
  return null;
}