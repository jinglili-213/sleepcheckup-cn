const crypto = require('crypto');

function signPayload(payload) {
  const secret = process.env.FEISHU_BOT_SECRET;
  if (!secret) return payload;

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const stringToSign = `${timestamp}\n${secret}`;
  const sign = crypto
    .createHmac('sha256', stringToSign)
    .update('')
    .digest('base64');

  return { timestamp, sign, ...payload };
}

async function postToFeishu(payload) {
  const webhook = process.env.FEISHU_WEBHOOK_URL;
  if (!webhook) {
    return { ok: false, status: 500, data: { error: 'FEISHU_WEBHOOK_URL is not configured' } };
  }

  const response = await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(signPayload(payload)),
  });

  let data;
  const text = await response.text();
  try {
    data = JSON.parse(text);
  } catch (_) {
    data = { raw: text };
  }

  return { ok: response.ok, status: response.status, data };
}

function sendJson(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data));
}

module.exports = { postToFeishu, sendJson };
