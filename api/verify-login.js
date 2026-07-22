import { kv } from '@vercel/kv';
import { randomBytes } from 'crypto';

// 生成安全 token
function generateToken() {
  return randomBytes(32).toString('hex');
}

// 内存存储（KV不可用时的回退）
const memoryCodes = {};
const memorySessions = {};
const memoryUsers = {};
const memoryTerms = {};
const memoryCategories = {};

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
    const { phone, code } = req.body || {};

    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ error: '请输入有效的手机号' });
    }
    if (!code || !/^\d{6}$/.test(code)) {
      return res.status(400).json({ error: '请输入6位验证码' });
    }

    // 验证码校验
    let storedCode = null;
    if (kvAvailable) {
      try {
        storedCode = await kv.get(`code:${phone}`);
      } catch (e) {
        console.error('KV read error:', e.message);
        kvAvailable = false;
      }
    }

    // KV不可用时，从内存中查找（开发模式：任何6位验证码都通过）
    if (!kvAvailable) {
      // 开发模式：直接通过验证
      console.log(`[DEV MODE] Login bypass for phone: ${phone}`);
    } else {
      if (!storedCode) {
        return res.status(400).json({ error: '验证码已过期，请重新获取' });
      }
      if (String(storedCode) !== String(code)) {
        return res.status(400).json({ error: '验证码错误' });
      }
      // 验证通过，删除验证码
      try { await kv.del(`code:${phone}`); } catch (e) { /* ignore */ }
    }

    // 检查/创建用户
    let user = null;
    if (kvAvailable) {
      try {
        user = await kv.get(`user:${phone}`);
        if (!user) {
          user = {
            phone: phone,
            displayName: phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'),
            createdAt: new Date().toISOString()
          };
          await kv.set(`user:${phone}`, user);
          const defaultCategories = ['运输方式', '单证', '贸易术语', '海关', '仓储', '保险', '费用'];
          await kv.set(`categories:${phone}`, defaultCategories);
          await kv.set(`terms:${phone}`, []);
        }
      } catch (e) {
        console.error('KV user error:', e.message);
        kvAvailable = false;
      }
    }

    if (!kvAvailable) {
      // 内存模式
      if (!memoryUsers[phone]) {
        memoryUsers[phone] = {
          phone: phone,
          displayName: phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
        };
        memoryCategories[phone] = ['运输方式', '单证', '贸易术语', '海关', '仓储', '保险', '费用'];
        memoryTerms[phone] = [];
      }
      user = memoryUsers[phone];
    }

    // 生成 token
    const token = generateToken();

    if (kvAvailable) {
      try {
        await kv.set(`token:${token}`, phone, { ex: 30 * 24 * 3600 });
      } catch (e) {
        console.error('KV token error:', e.message);
        kvAvailable = false;
      }
    }

    if (!kvAvailable) {
      memorySessions[token] = phone;
    }

    return res.status(200).json({
      success: true,
      token: token,
      phone: user.phone || phone,
      displayName: user.displayName || phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
    });
  } catch (e) {
    console.error('Verify login error:', e);
    return res.status(500).json({ error: '服务器错误: ' + e.message });
  }
}