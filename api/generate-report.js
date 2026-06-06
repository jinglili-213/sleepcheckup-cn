function buildPrompt(data) {
  const signals = data && data.extraSignals ? data.extraSignals : {};
  const topReasons = Array.isArray(data && data.topReasons) ? data.topReasons : [];
  const answers = Array.isArray(data && data.answerSummary) ? data.answerSummary : [];
  const eye = data && data.eyeScanData ? data.eyeScanData : {};

  return [
    '你是一名中文睡眠健康自测报告撰写助手。',
    '请基于用户的自测数据生成一份温和、清晰、非医疗诊断性质的深度解读。',
    '要求：',
    '1. 使用中文，语气专业但像真人咨询师。',
    '2. 必须说明“仅为算法参考，不替代医生诊断”。',
    '3. 如果存在 OSA 风险、严重情绪风险或实际睡眠小于 3 小时，优先建议正规医疗评估，不推荐产品。',
    '4. 输出 Markdown，包含 3 个二级标题：① AI 检测发现、② 系统判断、③ 下一步建议。',
    '5. 不要输出“你的主要睡眠卡点”作为独立标题；如需提到卡点，只用一句话并入“② 系统判断”。',
    '6. 严格控制长度：“① AI 检测发现”最多 3 行；“② 系统判断”只写 3 个 bullet；“③ 下一步建议”只写 2-3 条。',
    '7. 每个 bullet 不超过 24 个汉字，不要写大段解释，不要展开科普。',
    '8. 不要编造药物治疗方案，不要承诺治愈。',
    '9. 不要输出代码块，不要使用 ```markdown，不要使用一级标题，直接从“## ① AI 检测发现”开始。',
    '',
    '用户关键指标：',
    JSON.stringify({
      sleepDebt: signals.sleepDebt,
      sleepAge: signals.sleepAge,
      insomniaType: signals.insomniaType,
      recoveryStatus: signals.recoveryStatus,
      actualSleep: signals.actualSleep,
      osaRisk: signals.osaRisk,
      osaFlagCount: signals.osaFlagCount,
      moodRisk: signals.moodRisk,
      moodFlagCount: signals.moodFlagCount,
      moodSevere: signals.moodSevere,
      severeSleepDeprivation: signals.severeSleepDeprivation,
      topReasons,
      eyeScanData: eye,
      answers: answers.slice(0, 14),
    }, null, 2),
  ].join('\n');
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  const apiKey = process.env.GLM_API_KEY;
  if (!apiKey) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'GLM_API_KEY is not configured' }));
    return;
  }

  try {
    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'glm-4-flash',
        stream: false,
        temperature: 0.65,
        max_tokens: 520,
        messages: [
          { role: 'system', content: '你只输出中文 Markdown 报告，不输出 JSON，不输出代码块。' },
          { role: 'user', content: buildPrompt(req.body || {}) },
        ],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      res.statusCode = response.status;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: text || `GLM API HTTP ${response.status}` }));
      return;
    }

    const json = await response.json();
    const content = json.choices && json.choices[0] && json.choices[0].message
      ? json.choices[0].message.content
      : '';

    if (!content) {
      res.statusCode = 502;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: 'AI response is empty' }));
      return;
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.write(`data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: error && error.message ? error.message : String(error) }));
  }
};
