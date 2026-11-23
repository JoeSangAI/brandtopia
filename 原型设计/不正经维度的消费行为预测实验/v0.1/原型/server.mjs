import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MODELS, PROMPT_VERSION, generateProfile, predictRatings } from './prediction.mjs';
import { chatLength, compareScores, experimentRating, minimumChatLength, normalizedScores, roundLabel } from './experiment.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.BRANDTOPIA_PORT || 47623);
const mode = process.env.BRANDTOPIA_MODE || 'demo';
const apiKey = process.env.TOKENDANCE_API_KEY?.trim();
const qa = process.env.BRANDTOPIA_QA === '1';

if (!Object.hasOwn(MODELS, mode) || (mode === 'tokendance' && !apiKey)) {
  throw new Error('TokenDance 模式需要在服务端提供 TOKENDANCE_API_KEY。');
}
const runtime = join(here, '.runtime', (qa ? 'qa-' : '') + mode);
const roundFolder = join(runtime, 'rounds');
const profileFolder = join(runtime, 'profiles');
const responseFolder = join(runtime, 'responses');
mkdirSync(roundFolder, { recursive: true });
mkdirSync(profileFolder, { recursive: true });
mkdirSync(responseFolder, { recursive: true });

const products = JSON.parse(readFileSync(join(here, '示例商品.json'), 'utf8'));
const prompts = {
  profile: readFileSync(join(here, 'prompts', '访谈画像.md'), 'utf8').trim(),
  rating: readFileSync(join(here, 'prompts', '商品偏好预测.md'), 'utf8').trim()
};
const running = new Set();
let predictionQueue = Promise.resolve();

class RequestError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function recordPath(folder, id) {
  return join(folder, id + '.json');
}

function readRecord(folder, id) {
  const file = recordPath(folder, id);
  return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null;
}

function writeRecord(folder, id, record) {
  const file = recordPath(folder, id);
  const staging = file + '.partial';
  writeFileSync(staging, JSON.stringify(record, null, 2) + '\n', 'utf8');
  renameSync(staging, file);
}

function roundView(round) {
  const response = readRecord(responseFolder, round.id);
  return {
    id: round.id,
    label: round.label,
    stage: response ? 'complete' : round.material ? 'rating' : 'chat',
    catalogSize: round.products.length,
    minimumChatLength,
    mode,
    rating: round.rating,
    ...(round.material ? { products: round.products } : {})
  };
}

function createRound() {
  const id = randomUUID();
  const now = new Date();
  const round = {
    id,
    label: roundLabel(id, now),
    createdAt: now.toISOString(),
    products,
    rating: experimentRating,
    material: null,
    prediction: null
  };
  writeRecord(roundFolder, id, round);
  return roundView(round);
}

function queuePrediction(round) {
  const request = {
    status: 'pending',
    attempt: (round.prediction?.attempt || 0) + 1,
    queuedAt: new Date().toISOString(),
    mode,
    model: MODELS[mode],
    promptVersion: round.material.promptVersion
  };
  round.prediction = request;
  writeRecord(roundFolder, round.id, round);
  running.add(round.id);

  predictionQueue = predictionQueue.then(async () => {
    const startedAt = new Date().toISOString();
    let stage = 'profile';
    try {
      let savedProfile = readRecord(profileFolder, round.id);
      if (!savedProfile) {
        const result = await generateProfile(round.material.chat, round.material.prompts.profile, mode, apiKey);
        savedProfile = {
          ...result,
          createdAt: new Date().toISOString(),
          model: request.model,
          promptVersion: request.promptVersion
        };
        writeRecord(profileFolder, round.id, savedProfile);
      }
      stage = 'ratings';
      const result = await predictRatings(
        savedProfile.profile, round.products, round.rating, round.material.prompts.rating, mode, apiKey
      );
      const latest = readRecord(roundFolder, round.id);
      latest.prediction = {
        ...request,
        ...result,
        startedAt,
        finishedAt: new Date().toISOString(),
        status: 'complete'
      };
      writeRecord(roundFolder, round.id, latest);
    } catch (error) {
      const latest = readRecord(roundFolder, round.id);
      latest.prediction = {
        ...request,
        startedAt,
        finishedAt: new Date().toISOString(),
        status: 'failed',
        stage,
        errorCode: error.kind || 'request',
        requestId: error.requestId || null
      };
      writeRecord(roundFolder, round.id, latest);
      console.info('预测失败', round.label, latest.prediction.errorCode);
    } finally {
      running.delete(round.id);
    }
  }).catch(() => {
    console.error('预测记录写入失败', round.label);
  });
}

function sealChat(round, body) {
  if (round.material) return roundView(round);
  const chat = typeof body.chat === 'string' ? body.chat.trim() : '';
  if (chatLength(chat) < minimumChatLength) {
    throw new RequestError(400, '再多记一点，至少 ' + minimumChatLength + ' 字。');
  }
  round.material = { chat, sealedAt: new Date().toISOString(), prompts, promptVersion: PROMPT_VERSION };
  queuePrediction(round);
  return roundView(round);
}

function saveRatings(round, body) {
  if (!round.material) throw new RequestError(409, '请先提交闲聊记录。');
  if (readRecord(responseFolder, round.id)) return roundView(round);
  const scores = normalizedScores(round.products, body.scores);
  if (!scores) {
    throw new RequestError(400, '请为每件商品选一个档位再提交。');
  }
  writeRecord(responseFolder, round.id, { scores, submittedAt: new Date().toISOString() });
  return roundView(round);
}

function readComparison(round) {
  const response = readRecord(responseFolder, round.id);
  if (!response) throw new RequestError(409, '提交本人选择后即可查看对照。');
  const prediction = round.prediction;
  if (prediction.status === 'pending') {
    return running.has(round.id) ? { status: 'pending', mode } : { status: 'failed', mode, errorCode: 'interrupted' };
  }
  if (prediction.status === 'failed') {
    return { status: 'failed', mode, errorCode: prediction.errorCode, stage: prediction.stage };
  }
  const { counts, rows } = compareScores(round.products, response.scores, prediction.scores);
  return {
    status: 'complete',
    mode,
    rows,
    counts,
    profile: readRecord(profileFolder, round.id).profile,
    label: round.label,
    sealedAt: round.material.sealedAt,
    predictionAt: prediction.finishedAt,
    submittedAt: response.submittedAt,
    model: prediction.model,
    promptVersion: prediction.promptVersion
  };
}

function retry(round) {
  const comparison = readComparison(round);
  if (comparison.status === 'failed') {
    queuePrediction(round);
    return { status: 'pending', mode };
  }
  return comparison;
}

async function jsonBody(request) {
  const chunks = [];
  let length = 0;
  for await (const chunk of request) {
    length += chunk.length;
    if (length > 1024 * 1024) throw new RequestError(413, '记录过长，请缩短后重试。');
    chunks.push(chunk);
  }
  try {
    const body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error();
    return body;
  } catch {
    throw new RequestError(400, '提交的内容格式有误。');
  }
}

const assets = new Map([
  ['/', [join(here, 'public', 'index.html'), 'text/html']],
  ['/style.css', [join(here, 'public', 'style.css'), 'text/css']],
  ['/app.js', [join(here, 'public', 'app.js'), 'text/javascript']],
  ['/topics.js', [join(here, 'public', 'topics.mjs'), 'text/javascript']],
  ['/report', [join(here, '..', '设计与汇报', '汇报.html'), 'text/html']],
  [encodeURI('/原型/prompts/访谈画像.md'), [join(here, 'prompts', '访谈画像.md'), 'text/plain']],
  [encodeURI('/原型/prompts/商品偏好预测.md'), [join(here, 'prompts', '商品偏好预测.md'), 'text/plain']]
]);

function send(response, status, type, content) {
  response.writeHead(status, {
    'Content-Type': type + '; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'Content-Security-Policy': "default-src 'self'; style-src 'self' 'unsafe-inline'; frame-ancestors 'none'"
  });
  response.end(content);
}

function json(response, data, status = 200) {
  send(response, status, 'application/json', JSON.stringify(data));
}

createServer(async (request, response) => {
  try {
    const pathname = new URL(request.url, 'http://127.0.0.1').pathname;
    const asset = request.method === 'GET' && assets.get(pathname);
    if (asset) return send(response, 200, asset[1], readFileSync(asset[0]));
    if (request.method === 'GET' && pathname === '/api/health') return json(response, { version: 'v0.1', mode });
    if (request.method === 'POST' && pathname === '/api/rounds') return json(response, createRound(), 201);

    const route = pathname.match(/^\/api\/rounds\/([0-9a-f-]{36})(?:\/(chat|ratings|comparison|retry))?$/);
    if (!route) throw new RequestError(404, '找不到该页面或测试。');
    const [, id, action] = route;
    const body = request.method === 'POST' ? await jsonBody(request) : null;
    const round = readRecord(roundFolder, id);
    if (!round) throw new RequestError(404, '这场测试记录已不可用。');
    if (request.method === 'GET' && !action) return json(response, roundView(round));
    if (request.method === 'POST' && action === 'chat') return json(response, sealChat(round, body));
    if (request.method === 'POST' && action === 'ratings') return json(response, saveRatings(round, body));
    if (request.method === 'GET' && action === 'comparison') return json(response, readComparison(round));
    if (request.method === 'POST' && action === 'retry') return json(response, retry(round));
    throw new RequestError(405, '该操作不可用。');
  } catch (error) {
    if (error instanceof RequestError) return json(response, { error: error.message }, error.status);
    console.error('请求处理失败', error.code || error.name);
    return json(response, { error: '暂时无法保存，请重试。' }, 500);
  }
}).listen(port, '127.0.0.1', () => {
  console.info('原型 v0.1 · ' + mode + ' · http://127.0.0.1:' + port + '/');
});
