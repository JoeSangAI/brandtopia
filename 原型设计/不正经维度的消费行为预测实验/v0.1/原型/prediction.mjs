
import { portraitTopics } from './public/topics.mjs';
import { scoreIsValid } from './experiment.mjs';

export const MODELS = {
  demo: '演示分数',
  tokendance: 'deepseek-v4.1-flash-1017'
};
export const PROMPT_VERSION = 'v0.1';
const endpoint = 'https://tokendance.space/gateway/v1/chat/completions';
const thinkingMode = 'disabled';

function pause(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

function predictionError(kind, requestId = null, detail = null) {
  return Object.assign(new Error(kind), { kind, requestId, detail });
}

function transportDetail(error, apiKey) {
  const detail = [error.name, error.cause?.code, error.message]
    .filter(part => typeof part === 'string')
    .join(' ');
  return (apiKey ? detail.replaceAll(apiKey, '[secret]') : detail)
    .replace(/https?:\/\/\S+/g, '[url]').replace(/\s+/g, ' ').slice(0, 180);
}

function parseContent(content, requestId) {
  try {
    if (typeof content !== 'string') throw new Error();
    const json = content.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    const output = JSON.parse(json);
    if (!output || typeof output !== 'object' || Array.isArray(output)) throw new Error();
    return output;
  } catch {
    throw predictionError('invalid-output', requestId);
  }
}

async function requestModel(prompt, material, apiKey, signal = AbortSignal.timeout(45000)) {
  let response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      redirect: 'manual',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + apiKey },
      signal,
      body: JSON.stringify({
        model: MODELS.tokendance,
        thinking: { type: thinkingMode },
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: JSON.stringify(material) }
        ],
        stream: false
      })
    });
  } catch (error) {
    throw predictionError(signal.aborted ? 'timeout' : 'network', null, transportDetail(error, apiKey));
  }
  const requestId = response.headers.get('x-request-id');
  if (!response.ok) {
    if (response.status >= 300 && response.status < 400) throw predictionError('redirect', requestId, response.status);
    const code = { 401: 'auth', 402: 'quota', 403: 'access', 429: 'rate' }[response.status];
    throw predictionError(code || 'upstream', requestId, response.status);
  }
  let result;
  try {
    result = await response.json();
  } catch {
    throw predictionError(signal.aborted ? 'timeout' : 'invalid-output', requestId);
  }
  const trace = requestId || result.id || null;
  return {
    output: parseContent(result.choices?.[0]?.message?.content, trace),
    requestId: trace,
    usage: result.usage ? {
      input: result.usage.prompt_tokens ?? null,
      output: result.usage.completion_tokens ?? null
    } : null
  };
}

export async function generateProfile(chat, prompt, mode, apiKey, signal) {
  if (mode === 'demo') {
    await pause(650);
    return {
      profile: {
        sections: [
          { topic: 'daily', text: '周末基本都在家，会和家人一起做饭。最喜欢周日慢慢煮粥，边煮边听播客。' },
          { topic: 'works', text: '会重看《海街日记》，喜欢它里面每个人都被好好照顾到了。' },
          { topic: 'activities', text: '断断续续玩了好几年《星露谷物语》，喜欢按自己的节奏种地，不用和谁比。' }
        ]
      },
      requestId: null,
      usage: null
    };
  }
  const topics = portraitTopics.map(({ id, title }) => ({ id, title }));
  const { output, requestId, usage } = await requestModel(prompt, { transcript: chat, topics }, apiKey, signal);
  if (!Array.isArray(output.sections)) {
    throw predictionError('invalid-output', requestId);
  }
  const sections = new Map();
  for (const section of output.sections) {
    if (!section || !topics.some(topic => topic.id === section.topic) ||
        sections.has(section.topic) || typeof section.text !== 'string' || !section.text.trim()) {
      throw predictionError('invalid-output', requestId);
    }
    sections.set(section.topic, section.text.trim());
  }
  return {
    profile: {
      sections: topics.filter(({ id }) => sections.has(id)).map(({ id }) => ({ topic: id, text: sections.get(id) }))
    },
    requestId,
    usage,
    thinkingMode
  };
}

export async function predictRatings(profile, products, rating, prompt, mode, apiKey, signal) {
  if (mode === 'demo') {
    await pause(750);
    const sampleScores = [0, 1, 1, 1, 1, 0, 0, -1, 1, 0];
    return {
      scores: Object.fromEntries(products.map((product, index) => [product.id, sampleScores[index]])),
      requestId: null,
      usage: null
    };
  }
  const material = {
    profile: profile.sections.map(section => ({
      topic: portraitTopics.find(topic => topic.id === section.topic).title,
      text: section.text
    })),
    products: products.map(({ id, name, description }) => ({ id, name, description })),
    rating
  };
  const { output, requestId, usage } = await requestModel(prompt, material, apiKey, signal);
  if (!Array.isArray(output.ratings) || output.ratings.length !== products.length) {
    throw predictionError('invalid-output', requestId);
  }
  const scores = new Map();
  for (const entry of output.ratings) {
    if (!entry || scores.has(entry.product_id) || !scoreIsValid(entry.score)) {
      throw predictionError('invalid-output', requestId);
    }
    scores.set(entry.product_id, entry.score);
  }
  if (products.some(product => !scores.has(product.id))) throw predictionError('invalid-output', requestId);
  return { scores: Object.fromEntries(scores), requestId, usage, thinkingMode };
}
