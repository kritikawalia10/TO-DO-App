const OpenAI = require('openai');

let client = null;
let isGroq = false;
if (process.env.OPENAI_API_KEY) {
  try {
    const key = process.env.OPENAI_API_KEY.trim();
    isGroq = key.startsWith('gsk_');
    const baseURL = isGroq ? 'https://api.groq.com/openai/v1' : undefined;
    console.log('AI Service Init - Key Starts With:', key.substring(0, 5), 'isGroq:', isGroq, 'baseURL:', baseURL);
    client = new OpenAI({ 
      apiKey: key,
      baseURL: baseURL
    });
  } catch (err) {
    console.error('AI Service Init Error:', err);
    client = null;
  }
} else {
  console.log('AI Service Init - No OPENAI_API_KEY found in process.env');
}

/**
 * Parse free-form task text into structured fields using a Chat model.
 * Returns an object like: { title, description, dueDate, priority, tags }
 */
async function parseTask(text) {
  if (!text) return null;
  if (!client) throw new Error('OPENAI_API_KEY is not configured on the server. Set OPENAI_API_KEY in .env or env vars.');
  const tryParse = (content) => {
    if (!content) throw new Error('Empty response from model');
    // remove common fencing and whitespace
    let cleaned = content.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
    // try direct parse
    try { return JSON.parse(cleaned); } catch (e) {}
    // try to extract JSON object with regex
    const m = cleaned.match(/(\{[\s\S]*\})/);
    if (m) {
      try { return JSON.parse(m[1]); } catch (e) {}
    }
    // as a last resort, fail with raw content
    const err = new Error('Failed to parse AI response as JSON');
    err.raw = content;
    throw err;
  };
  // improved few-shot prompt with examples and strict instructions
  const system = `You are an assistant that extracts structured task data from a user's natural-language description.
Rules:
- Output a SINGLE valid JSON object and nothing else.
- Keys must be: title, description, dueDate, priority, tags.
- title: short human-readable title (string) or null if none.
- description: longer text (string) or null.
- dueDate: ISO 8601 datetime string (e.g. 2026-04-14T09:00:00Z) or null.
- priority: one of "low", "medium", "high", or null.
- tags: an array of short strings, may be empty.
- If a field cannot be determined, set it to null (or [] for tags).
Respond ONLY with the JSON object. Do not add commentary or markdown.`;

  const examples = [
    {
      user: 'Email Sarah next Tuesday at 9am to follow up on the contract, high priority, tag: work',
      assistant: { title: 'Email Sarah about contract', description: 'Follow up on the contract with Sarah.', dueDate: null, priority: 'high', tags: ['work'] }
    },
    {
      user: 'Buy groceries: milk, eggs, and bread tomorrow morning',
      assistant: { title: 'Buy groceries', description: 'Milk, eggs, and bread', dueDate: null, priority: null, tags: ['shopping'] }
    }
  ];

  const messages = [ { role: 'system', content: system } ];
  // add examples as few-shot
  for (const ex of examples) {
    messages.push({ role: 'user', content: `Example input: ${ex.user}` });
    messages.push({ role: 'assistant', content: JSON.stringify(ex.assistant) });
  }
  messages.push({ role: 'user', content: `Input: "${text.replace(/"/g, '\\"')}"\n\nReturn only the JSON object.` });

  const model = isGroq ? 'llama-3.1-8b-instant' : 'gpt-3.5-turbo';

  const resp1 = await client.chat.completions.create({ model, messages, max_tokens: 500, temperature: 0 });
  const content1 = resp1?.choices?.[0]?.message?.content || '';

  // try parse and normalize, with one retry using stricter instruction
  let parsed = null;
  try { parsed = tryParse(content1); }
  catch (err1) {
    const fallbackSystem = 'Output ONLY a single valid JSON object with keys: title, description, dueDate, priority, tags. No commentary.';
    const fallbackMessages = [{ role: 'system', content: fallbackSystem }, { role: 'user', content: `Input: "${text.replace(/"/g, '\\"')}"` }];
    const resp2 = await client.chat.completions.create({ model, messages: fallbackMessages, max_tokens: 500, temperature: 0 });
    const content2 = resp2?.choices?.[0]?.message?.content || '';
    try { parsed = tryParse(content2); }
    catch (err2) {
      const err = new Error('AI parse failed after retries');
      err.raw = `${content1}\n---retry---\n${content2}`;
      throw err;
    }
  }

  // normalize output fields
  const normalize = (obj) => {
    if (!obj || typeof obj !== 'object') throw new Error('Parsed result not an object');
    const out = { title: null, description: null, dueDate: null, priority: null, tags: [] };
    // title
    if (obj.title && String(obj.title).trim().length > 0) out.title = String(obj.title).trim();
    // description
    if (obj.description && String(obj.description).trim().length > 0) out.description = String(obj.description).trim();
    // dueDate: try parse
    if (obj.dueDate) {
      const d = new Date(obj.dueDate);
      if (!isNaN(d.getTime())) out.dueDate = d.toISOString();
      else out.dueDate = null;
    }
    // priority: normalize common words
    if (obj.priority) {
      const p = String(obj.priority).toLowerCase();
      if (p.includes('high')) out.priority = 'high';
      else if (p.includes('medium') || p.includes('med')) out.priority = 'medium';
      else if (p.includes('low')) out.priority = 'low';
      else out.priority = null;
    }
    // tags
    if (Array.isArray(obj.tags)) out.tags = obj.tags.map(t => String(t).trim()).filter(Boolean);
    else if (obj.tags && typeof obj.tags === 'string') {
      out.tags = obj.tags.split(/[;,\n]/).map(t => t.trim()).filter(Boolean);
    }
    return out;
  };

  return normalize(parsed);
}

module.exports = { parseTask };
