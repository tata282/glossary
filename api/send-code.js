import { kv } from '@vercel/kv';

// 生成6位随机验证码
function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// 验证手机号格式（中国大陆）
function isValidPhone(phone) {
  return /^1[3-9]\d{9}$/.test(phone);
}

// 发送短信验证码（阿里云短信）
// 需配置环境变量：ALI_ACCESS_KEY_ID, ALI_ACCESS_KEY_SECRET, ALI_SMS_SIGN_NAME, ALI_SMS_TEMPLATE_CODE
async function sendSms(phone, code) {
  const accessKeyId = process.env.ALI_ACCESS_KEY_ID;
  const accessKeySecret = process.env.ALI_ACCESS_KEY_SECRET;
  const signName = process.env.ALI_SMS_SIGN_NAME;
  const templateCode = process.env.ALI_SMS_TEMPLATE_CODE;

  if (!accessKeyId || !accessKeySecret) {
    // 未配置阿里云短信，使用开发模式（验证码直接返回）
    console.log(`[DEV MODE] Phone: ${phone}, Code: ${code}`);
    return { success: true, dev: true, code: code };
  }

  try {
    const Core = await import('@alicloud/openapi-client');
    const Dysmsapi = await import('@alicloud/dysmsapi20170525');

    const config = new Core.Config({
      accessKeyId: accessKeyId,
      accessKeySecret: accessKeySecret,
      endpoint: 'dysmsapi.aliyuncs.com'
    });
    const client = new Dysmsapi.default(config);
    const sendReq = new Dysmsapi.SendSmsRequest({
      phoneNumbers: phone,
      signName: signName || '物流术语库',
      templateCode: templateCode || 'SMS_123456789',
      templateParam: JSON.stringify({ code: code })
    });
    const resp = await client.sendSms(sendReq);
    if (resp.body.code === 'OK') {
      return { success: true };
    } else {
      return { success: false, error: resp.body.message };
    }
  } catch (e) {
    console.error('SMS send error:', e.message);
    return { success: false, error: '短信发送失败，请稍后重试' };
  }
}

export default async function handler(req, res) {
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

    // 检查发送频率（60秒内不能重复发送）
    const rateKey = `rate:${phone}`;
    const lastSent = await kv.get(rateKey);
    if (lastSent) {
      return res.status(429).json({ error: '发送太频繁，请60秒后重试' });
    }

    // 生成验证码
    const code = generateCode();

    // 存储验证码（5分钟有效）
    await kv.set(`code:${phone}`, code, { ex: 300 });
    // 设置发送频率限制
    await kv.set(rateKey, Date.now(), { ex: 60 });

    // 发送短信
    const result = await sendSms(phone, code);

    if (!result.success) {
      return res.status(500).json({ error: result.error || '发送失败' });
    }

    return res.status(200).json({
      success: true,
      message: '验证码已发送',
      // 开发模式下返回验证码，生产环境不返回
      ...(result.dev ? { code: result.code } : {})
    });
  } catch (e) {
    console.error('Send code error:', e);
    return res.status(500).json({ error: '服务器错误' });
  }
}