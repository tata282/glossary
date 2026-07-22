import { kv } from '@vercel/kv';

let kvAvailable = true;

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
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

    if (!token) {
      return res.status(200).json({ authenticated: false });
    }

    let phone = null;
    if (kvAvailable) {
      try {
        phone = await kv.get(`token:${token}`);
      } catch (e) {
        console.error('KV check-auth error:', e.message);
        kvAvailable = false;
      }
    }

    if (phone) {
      let user = null;
      try {
        user = await kv.get(`user:${phone}`);
      } catch (e) {
        // ignore
      }
      return res.status(200).json({
        authenticated: true,
        phone: phone,
        displayName: user ? user.displayName : phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
      });
    }

    return res.status(200).json({ authenticated: false });
  } catch (e) {
    console.error('Check auth error:', e);
    return res.status(200).json({ authenticated: false });
  }
}