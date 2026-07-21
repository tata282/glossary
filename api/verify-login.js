import { kv } from '@vercel/kv';
import { randomBytes } from 'crypto';

// 生成安全 token
function generateToken() {
  return randomBytes(32).toString('hex');
}

export default async function handler(req, res) {
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
    const storedCode = await kv.get(`code:${phone}`);
    if (!storedCode) {
      return res.status(400).json({ error: '验证码已过期，请重新获取' });
    }
    if (String(storedCode) !== String(code)) {
      return res.status(400).json({ error: '验证码错误' });
    }

    // 验证通过，删除验证码
    await kv.del(`code:${phone}`);

    // 检查用户是否已存在
    let user = await kv.get(`user:${phone}`);
    if (!user) {
      // 新用户，自动注册
      user = {
        phone: phone,
        displayName: phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'),
        createdAt: new Date().toISOString()
      };
      await kv.set(`user:${phone}`, user);

      // 初始化用户数据（预置分类）
      const defaultCategories = ['运输方式', '单证', '贸易术语', '海关', '仓储', '保险', '费用'];
      await kv.set(`categories:${phone}`, defaultCategories);
      await kv.set(`terms:${phone}`, []);
    }

    // 生成 token
    const token = generateToken();
    // token 有效期 30 天
    await kv.set(`token:${token}`, phone, { ex: 30 * 24 * 3600 });

    return res.status(200).json({
      success: true,
      token: token,
      phone: user.phone,
      displayName: user.displayName
    });
  } catch (e) {
    console.error('Verify login error:', e);
    return res.status(500).json({ error: '服务器错误' });
  }
}