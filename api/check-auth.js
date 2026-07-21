import { kv } from '@vercel/kv';
import { authenticate } from './_auth.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const phone = await authenticate(req);
  if (phone) {
    const user = await kv.get(`user:${phone}`);
    return res.status(200).json({
      authenticated: true,
      phone: phone,
      displayName: user ? user.displayName : phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
    });
  }

  return res.status(200).json({ authenticated: false });
}