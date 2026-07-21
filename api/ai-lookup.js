// 豆包 AI 术语查询接口
// 需配置环境变量：DOUBAO_API_KEY, DOUBAO_ENDPOINT_ID

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.DOUBAO_API_KEY;
  const endpointId = process.env.DOUBAO_ENDPOINT_ID;

  if (!apiKey || !endpointId) {
    return res.status(200).json({
      success: false,
      error: '未配置豆包 API，请在 Vercel 环境变量中设置 DOUBAO_API_KEY 和 DOUBAO_ENDPOINT_ID'
    });
  }

  try {
    const { term } = req.body || {};
    if (!term || !term.trim()) {
      return res.status(400).json({ error: '请提供术语名称' });
    }

    const prompt = `你是一个物流关务领域的专业助手。请查找以下术语的详细信息，严格按照JSON格式返回，不要返回任何其他内容：

术语：${term.trim()}

请返回如下JSON格式（不要加markdown代码块标记）：
{
  "term": "术语中文名",
  "abbreviation": "英文缩写（如B/L、FOB等，没有则填空字符串）",
  "fullName": "英文全称（如Bill of Lading，没有则填空字符串）",
  "category": "分类（从以下选择最合适的：运输方式、单证、贸易术语、海关、仓储、保险、费用）",
  "description": "详细解释（50-200字，专业准确）"
}

注意：
1. abbreviation 是常见的行业缩写，如 B/L、FOB、CIF 等
2. fullName 是英文完整名称
3. category 必须从给定列表中选择
4. description 要专业、准确、完整`;

    const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: endpointId,
        messages: [
          { role: 'system', content: '你是物流关务领域的专业助手，只返回JSON格式的数据，不要返回任何解释或markdown标记。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Doubao API error:', response.status, errText);
      return res.status(200).json({ success: false, error: 'AI 服务请求失败' });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // 解析 JSON（去除可能的 markdown 代码块标记）
    let jsonStr = content.trim();
    jsonStr = jsonStr.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');

    let result;
    try {
      result = JSON.parse(jsonStr);
    } catch (e) {
      console.error('Parse AI response failed:', jsonStr);
      return res.status(200).json({ success: false, error: 'AI 返回格式异常，请重试' });
    }

    return res.status(200).json({
      success: true,
      data: {
        term: result.term || term.trim(),
        abbreviation: result.abbreviation || '',
        fullName: result.fullName || '',
        category: result.category || '',
        description: result.description || ''
      }
    });
  } catch (e) {
    console.error('AI lookup error:', e);
    return res.status(500).json({ error: '服务器错误' });
  }
}