import { generateProfile, MODELS, predictRatings, probeGateway, PROMPT_VERSION } from '../prediction.mjs';
import { chatLength, compareScores, experimentRating, minimumChatLength, normalizedScores, roundLabel } from '../experiment.mjs';

const holdMs = 2 * 60 * 60 * 1000;
const leaseMs = 35 * 1000;
// An HTTP Worker's post-response work is limited to 30 seconds. Leave time
// for D1 to save either the result or the timeout.
const backgroundMs = 27 * 1000;

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function send(content, mime, status = 200) {
  return new Response(content, {
    status,
    headers: {
      'Content-Type': mime + '; charset=utf-8',
      'Cache-Control': 'no-store',
      'Referrer-Policy': 'no-referrer',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'self'; style-src 'self' 'unsafe-inline'; frame-ancestors 'none'"
    }
  });
}

function json(value, status) {
  return send(JSON.stringify(value), 'application/json', status);
}

async function bodyOf(request) {
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > 1024 * 1024) {
      throw new HttpError(413, '记录过长，请缩短后重试。');
    }
    const value = JSON.parse(raw || '{}');
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error();
    return value;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(400, '提交的内容格式有误。');
  }
}

function loadRound(db, owner, id) {
  return db.prepare('SELECT * FROM rounds WHERE id = ? AND owner = ? AND expires_at > ?')
    .bind(id, owner, Date.now()).first();
}

function roundView(row) {
  const products = JSON.parse(row.products_json);
  return {
    id: row.id,
    label: row.label,
    mode: 'tokendance',
    catalogSize: products.length,
    minimumChatLength,
    rating: JSON.parse(row.rating_json),
    stage: row.submitted_at ? 'complete' : row.sealed_at ? 'rating' : 'chat',
    ...(row.sealed_at ? { products } : {})
  };
}

async function addRound(db, owner) {
  const id = crypto.randomUUID();
  const now = Date.now();
  const label = roundLabel(id, new Date(now));
  await db.batch([
    db.prepare('DELETE FROM rounds WHERE owner = ? AND expires_at <= ?').bind(owner, now),
    db.prepare('INSERT INTO rounds (id, owner, label, expires_at, products_json, rating_json) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(id, owner, label, now + holdMs, JSON.stringify(hostedCatalog), JSON.stringify(experimentRating))
  ]);
  return roundView(await loadRound(db, owner, id));
}

async function sealRound(db, owner, row, body) {
  if (row.sealed_at) return row;
  const transcript = typeof body.chat === 'string' ? body.chat.trim() : '';
  if (chatLength(transcript) < minimumChatLength) {
    throw new HttpError(400, '再多记一点，至少 ' + minimumChatLength + ' 字。');
  }
  const now = Date.now();
  const sealed = await db.prepare(`
    UPDATE rounds SET transcript = ?, sealed_at = ?, profile_prompt = ?, rating_prompt = ?,
      prompt_version = ?, prediction_status = 'queued', lease_until = ?
    WHERE id = ? AND owner = ? AND sealed_at IS NULL AND expires_at > ?
    RETURNING *
  `).bind(transcript, new Date(now).toISOString(), hostedPrompts.profile, hostedPrompts.rating,
    PROMPT_VERSION, now + leaseMs, row.id, owner, now).first();
  const current = sealed ?? await loadRound(db, owner, row.id);
  if (!current) throw new HttpError(404, '这场临时测试已不可用。');
  return current;
}

async function submitRound(db, owner, row, body) {
  if (!row.sealed_at) throw new HttpError(409, '请先提交闲聊记录。');
  if (row.submitted_at) return roundView(row);
  const scores = normalizedScores(JSON.parse(row.products_json), body.scores);
  if (!scores) throw new HttpError(400, '请为每件商品选一个档位再提交。');
  await db.prepare('UPDATE rounds SET response_json = ?, submitted_at = ? WHERE id = ? AND owner = ? AND submitted_at IS NULL')
    .bind(JSON.stringify(scores), new Date().toISOString(), row.id, owner).run();
  return roundView(await loadRound(db, owner, row.id));
}

function getComparison(row) {
  if (!row.submitted_at) throw new HttpError(409, '提交本人选择后即可查看对照。');
  if (['queued', 'running'].includes(row.prediction_status) && (row.lease_until ?? 0) <= Date.now()) {
    return { status: 'failed', errorCode: 'interrupted', mode: 'tokendance' };
  }
  if (row.prediction_status === 'failed') {
    return { status: 'failed', errorCode: row.error_code, stage: row.error_stage, mode: 'tokendance' };
  }
  if (row.prediction_status !== 'complete') return { status: 'pending', mode: 'tokendance' };
  const result = JSON.parse(row.prediction_json);
  const { rows, counts } = compareScores(JSON.parse(row.products_json), JSON.parse(row.response_json), result.scores);
  return {
    status: 'complete', mode: 'tokendance', rows, counts,
    profile: JSON.parse(row.profile_json).profile, label: row.label,
    sealedAt: row.sealed_at, submittedAt: row.submitted_at, predictionAt: row.prediction_at,
    model: MODELS.tokendance, promptVersion: row.prompt_version
  };
}

async function retryRound(env, ctx, owner, row) {
  if (!row.sealed_at) throw new HttpError(409, '请先提交闲聊记录。');
  const now = Date.now();
  const reset = await env.DB.prepare(`
    UPDATE rounds SET prediction_status = 'queued', run_id = NULL, lease_until = ?,
      error_code = NULL, error_stage = NULL WHERE id = ? AND owner = ? AND expires_at > ?
      AND (prediction_status = 'failed'
        OR (prediction_status IN ('queued', 'running') AND COALESCE(lease_until, 0) <= ?))
    RETURNING *
  `).bind(now + leaseMs, row.id, owner, now, now).first();
  if (reset) {
    startPrediction(env, ctx, owner, reset);
  } else if (row.submitted_at) {
    return getComparison(await loadRound(env.DB, owner, row.id));
  }
  return { status: 'pending', mode: 'tokendance' };
}

function startPrediction(env, ctx, owner, row) {
  if (row.prediction_status !== 'queued') return;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), backgroundMs);
  ctx.waitUntil(performWork(env.DB, owner, row, env.TOKENDANCE_API_KEY, controller.signal)
    .catch(error => console.error('不能保存预测记录', row.label, error.name))
    .finally(() => clearTimeout(timer)));
}

async function performWork(db, owner, row, key, signal) {
  const runId = crypto.randomUUID();
  const now = Date.now();
  const claimed = await db.prepare(`
    UPDATE rounds SET prediction_status = 'running', lease_until = ?, run_id = ?
    WHERE id = ? AND owner = ? AND prediction_status = 'queued' AND expires_at > ?
    RETURNING *
  `).bind(now + leaseMs, runId, row.id, owner, now).first();
  if (!claimed) return;

  let stage = 'profile';
  try {
    let saved = claimed.profile_json ? JSON.parse(claimed.profile_json) : null;
    if (!saved) {
      const result = await generateProfile(claimed.transcript, claimed.profile_prompt, 'tokendance', key, signal);
      saved = { ...result, createdAt: new Date().toISOString() };
      const written = await db.prepare('UPDATE rounds SET profile_json = ? WHERE id = ? AND owner = ? AND run_id = ?')
        .bind(JSON.stringify(saved), row.id, owner, runId).run();
      if (written.meta.changes !== 1) return;
    }
    stage = 'ratings';
    const result = await predictRatings(
      saved.profile, JSON.parse(claimed.products_json), JSON.parse(claimed.rating_json),
      claimed.rating_prompt, 'tokendance', key, signal
    );
    const written = await db.prepare(`
      UPDATE rounds SET prediction_status = 'complete', prediction_json = ?, prediction_at = ?
      WHERE id = ? AND owner = ? AND run_id = ?
    `).bind(JSON.stringify(result), new Date().toISOString(), row.id, owner, runId).run();
    if (written.meta.changes === 1) console.info('预测完成', row.label, Date.now() - now, result.thinkingMode);
  } catch (error) {
    await db.prepare(`
      UPDATE rounds SET prediction_status = 'failed', error_code = ?, error_stage = ?
      WHERE id = ? AND owner = ? AND run_id = ?
    `).bind(error.kind || 'request', stage, row.id, owner, runId).run();
    console.error('预测失败', row.label, stage, error.kind || 'request',
      error.requestId ?? '', error.detail ?? '');
  }
}

async function handleRequest(request, env, ctx) {
  try {
    const { pathname, searchParams } = new URL(request.url);
    const asset = request.method === 'GET' && hostedAssets[pathname];
    if (asset) return send(asset.content, asset.mime);
    if (request.method === 'GET' && pathname === '/api/health') {
      const health = { version: 'v0.1', mode: 'tokendance', storageReady: Boolean(env.DB), modelReady: Boolean(env.TOKENDANCE_API_KEY) };
      if (searchParams.get('gateway') === '1') health.gateway = await probeGateway();
      return json(health);
    }
    const owner = request.headers.get('oai-authenticated-user-id');
    if (!owner) throw new HttpError(401, '请登录有权访问此站点的账号。');
    if (!env.DB || !env.TOKENDANCE_API_KEY) throw new HttpError(503, '站点的数据库或模型密钥尚未就绪。');
    if (request.method === 'POST' && pathname === '/api/rounds') return json(await addRound(env.DB, owner), 201);

    const route = pathname.match(/^\/api\/rounds\/([0-9a-f-]{36})(?:\/(chat|ratings|comparison|retry))?$/);
    if (!route) throw new HttpError(404, '找不到该页面或测试。');
    const [, id, action] = route;
    const row = await loadRound(env.DB, owner, id);
    if (!row) throw new HttpError(404, '这场临时测试已不可用。');
    if (request.method === 'GET' && !action) return json(roundView(row));
    if (request.method === 'GET' && action === 'comparison') return json(getComparison(row));
    if (request.method === 'POST' && action === 'chat') {
      const sealed = await sealRound(env.DB, owner, row, await bodyOf(request));
      startPrediction(env, ctx, owner, sealed);
      return json(roundView(sealed));
    }
    if (request.method === 'POST' && action === 'ratings') {
      return json(await submitRound(env.DB, owner, row, await bodyOf(request)));
    }
    if (request.method === 'POST' && action === 'retry') {
      return json(await retryRound(env, ctx, owner, row));
    }
    throw new HttpError(405, '该操作不可用。');
  } catch (error) {
    if (error instanceof HttpError) return json({ error: error.message }, error.status);
    console.error('处理请求失败', error.name);
    return json({ error: '暂时无法保存，请重试。' }, 500);
  }
}

export default { fetch: handleRequest };
