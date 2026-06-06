const { postToFeishu, sendJson } = require('./_feishu');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  try {
    const body = req.body || {};
    const payload = body.msg_type
      ? body
      : {
          msg_type: 'text',
          content: {
            text: `🔔 客户咨询请求\n${JSON.stringify(body, null, 2)}`,
          },
        };

    const result = await postToFeishu(payload);
    sendJson(res, result.ok ? 200 : result.status, result.data);
  } catch (error) {
    sendJson(res, 500, { error: error && error.message ? error.message : String(error) });
  }
};
