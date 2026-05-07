const { parseTask } = require('../services/aiService');

exports.parseTask = async (req, res, next) => {
  try {
    const { text } = req.body || {};
    if (!text) return res.status(400).json({ error: 'text is required in body' });
    const parsed = await parseTask(text);
    return res.json({ success: true, task: parsed });
  } catch (err) {
    // respond with more info for the frontend to show inline errors when possible
    const payload = { message: err.message || 'AI parse error' };
    if (err.raw) payload.raw = err.raw;
    return res.status(500).json(payload);
  }
};
