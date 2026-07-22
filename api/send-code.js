import { kv } from '@vercel/kv';

// 生成6位随机验证码
function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// 验证手机号格式（中国大陆）
function isValidPhone(phone) {
  return /^1[3-9]\d{9}$/.test(phone);
}

// KV 是否可用
let kvAvailable = true;

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { phone } = req.body || {};

    if (!phone || !isValidPhone(phone)) {
      return res.status(400).json({ error: '请输入有效的手机号' });
    }

    // 生成验证码
    const code = generateCode();

    // 尝试使用 KV 存储
    if (kvAvailable) {
      try {
        // 检查发送频率（60秒内不能重复发送）
        const rateKey = `rate:${phone}`;
        const lastSent = await kv.get(rateKey);
        if (lastSent) {
          return res.status(429).json({ error: '发送太频繁，请60秒后重试' });
        }

        // 存储验证码（5分钟有效）
        await kv.set(`code:${phone}`, code, { ex: 300 });
        // 设置发送频率限制
        await kv.set(rateKey, Date.now(), { ex: 60 });
      } catch (kvError) {
        console.error('KV error, falling back to dev mode:', kvError.message);
        kvAvailable = false;
      }
    }

    // 开发模式：验证码直接返回（KV不可用时也用开发模式）
    console.log(`[DEV MODE] Phone: ${phone}, Code: ${code}`);
    return res.status(200).json({
      success: true,
      message: '验证码已发送',
      code: code
    });
  } catch (e) {
    console.error('Send code error:', e);
    return res.status(500).json({ error: '服务器错误: ' + e.message });
  }
}