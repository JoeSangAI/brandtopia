import { interviewTopics, portraitTopics } from '/topics.js';

const storageKey = 'brandtopia-v0.1';
const onHostedSite = location.protocol === 'https:';
const app = document.getElementById('app');
const progress = document.getElementById('progress');
const dialog = document.getElementById('confirm-dialog');
const steps = [
  ['welcome', '开场'], ['chat', '闲聊'], ['handoff', '过渡'], ['rating', '表态'], ['complete', '完成']
];
const example = '周末基本都在家，和家人一起做饭，我负责切菜和洗碗。最喜欢的是周日早上慢慢煮一锅粥，边煮边听播客。电影里隔一阵会重看《海街日记》，喜欢它什么大事都没发生，但每个人都被好好照顾到了。小说常翻的是汪曾祺的散文，写吃的那几篇看了很多遍。游戏玩得不多，但《星露谷物语》断断续续玩了好几年，喜欢按自己的节奏种地，不用和谁比。小时候暑假住在外婆家，每天下午帮外婆择菜，听她讲街坊的事，现在想起来觉得那是最踏实的一段日子。';
const colors = { 1: '#D9763C', 0: '#8C9198', '-1': '#4F6D8F' };
const relationLabels = ['一致', '差一档', '方向相反'];
const chineseTime = new Intl.DateTimeFormat('zh-CN', {
  timeZone: 'Asia/Shanghai', dateStyle: 'short', timeStyle: 'medium'
});

function blankDraft() {
  return { id: null, visitor: null, screen: 'welcome', chat: '', topics: [], scores: {}, index: 0, review: false, edit: false };
}

function loadDraft() {
  try {
    const storage = onHostedSite ? sessionStorage : localStorage;
    return { ...blankDraft(), ...JSON.parse(storage.getItem(storageKey) || '{}') };
  } catch {
    return blankDraft();
  }
}

let draft = loadDraft();
let round;
let loading = false;
let problem = '';
let lastScreen;
let advancing = false;
let revealRequested = false;
let comparison;
let pollTimer;
let comparisonRound;

function remember() {
  try {
    const storage = onHostedSite ? sessionStorage : localStorage;
    storage.setItem(storageKey, JSON.stringify(draft));
  } catch {
    // The form can still be submitted when browser storage is unavailable.
  }
}

function escape(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[character]));
}

function request(path, body) {
  const options = body === undefined ? {} : {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  };
  if (draft.visitor) options.headers = { ...options.headers, 'X-Brandtopia-Visitor': draft.visitor };
  return fetch(path, options).then(async response => {
    const result = await response.json();
    if (!response.ok) {
      const error = new Error(result.error || '暂时连不上，请再试一次。');
      error.status = response.status;
      throw error;
    }
    return result;
  });
}

function roundUrl(suffix = '') {
  return '/api/rounds/' + round.id + suffix;
}

function useRound(next) {
  round = next;
  draft.id = next.id;
  if (next.visitor) draft.visitor = next.visitor;
  if (next.stage === 'complete') {
    draft.screen = 'complete';
    draft.chat = '';
    draft.scores = {};
  } else if (next.stage === 'rating') {
    draft.screen = draft.screen === 'rating' ? 'rating' : 'handoff';
    draft.chat = '';
    draft.index = Math.max(0, Math.min(draft.index, round.catalogSize - 1));
  } else if (draft.screen !== 'chat') {
    draft.screen = 'welcome';
  }
  remember();
  if (next.stage === 'complete') void refreshComparison();
}

async function connect() {
  if (draft.id) {
    try {
      useRound(await request('/api/rounds/' + draft.id));
      return;
    } catch (error) {
      if (error.status !== 404 && error.status !== 401) throw error;
      draft = blankDraft();
    }
  }
  useRound(await request('/api/rounds', {}));
}

function act(callback) {
  if (loading) return;
  loading = true;
  problem = '';
  render();
  Promise.resolve().then(callback).catch(error => {
    problem = error.message || '暂时无法保存，请重试。';
  }).finally(() => {
    loading = false;
    render();
  });
}

function go(screen) {
  draft.screen = screen;
  remember();
  render();
}

function hostBar() {
  const demo = round.mode === 'demo' ? '<span class="demo-tag">流程演示</span>' : '';
  return `<div class="hostbar"><span class="host-tag">主持人</span><span>${escape(round.label)}</span>${demo}</div>`;
}

function welcome() {
  return `<section class="wrap w960">${hostBar()}
    <div class="card intro-card">
      <h1>聊聊你喜欢的事</h1>
      <p class="lead">你平时喜欢看什么、玩什么？也可以聊聊家里的日常，或者一件你从小就喜欢做的事。挑你愿意分享的说就好。聊完后，再凭自己的感受给几件东西选个答案。</p>
      <p class="muted">系统会根据我们聊的内容，猜一猜你对这几件东西的态度，之后和你自己的选择对照着看。</p>
      <div class="actions"><button class="btn-primary" data-action="begin">开始聊</button></div>
    </div>
  </section>`;
}

function chat() {
  const cards = interviewTopics.map(({ title, question }, index) => {
    const marked = draft.topics.includes(index);
    return `<button class="topic ${marked ? 'done' : ''}" data-action="mark" data-index="${index}" aria-pressed="${marked}">
      <span class="tt">${title}</span><span class="tq">${question}</span><span class="ck" aria-hidden="true">✓</span>
    </button>`;
  }).join('');
  return `<section class="wrap w960">${hostBar()}
    <div class="cols">
      <div class="card"><h2>可以顺着聊的话题</h2>${cards}<p class="small">挑几题聊就好。</p></div>
      <div class="card">
        <h2><label for="chatInput">闲聊记录</label></h2>
        <p class="tip">提交前请略去收入、职业、消费观念、购买记录和针对具体商品的购买理由。</p>
        <textarea id="chatInput" rows="14" placeholder="在这里打字，或直接粘贴整段访谈文字。"></textarea>
        <div class="row"><span id="chatCount"></span>${round.mode === 'demo' ? '<button type="button" class="link" data-action="example">填入示例文字</button>' : ''}</div>
        <div class="actions between"><span id="chatHint" class="muted"></span><button class="btn-primary" id="submitChat" data-action="seal" disabled>提交闲聊记录</button></div>
      </div>
    </div>
  </section>`;
}

function updateChat() {
  const length = [...draft.chat.replace(/\s/g, '')].length;
  document.getElementById('chatCount').textContent = '已记 ' + length + ' 字';
  document.getElementById('chatHint').textContent = length < round.minimumChatLength
    ? '再多记一点，至少 ' + round.minimumChatLength + ' 字' : '';
  document.getElementById('submitChat').disabled = loading || length < round.minimumChatLength;
}

function handoff() {
  const blocks = round.rating.choices.map(choice => `<div class="blk" style="--c:${colors[choice.score]}">
    <b>${escape(choice.label)}</b><span>${escape(choice.description)}</span>
  </div>`).join('');
  return `<section class="wrap w640 center">
    <h1>聊得很开心，谢谢你。</h1>
    <p class="lead">接下来给你看 ${round.catalogSize} 件东西。单看东西本身，先不管价格，凭第一感觉选就好。</p>
    <div class="blocks">${blocks}</div><p class="muted">没有对错，也不用想太久。</p>
    <div class="actions center"><button class="btn-primary" data-action="rate">开始看</button></div>
  </section>`;
}

function choiceFor(score) {
  return round.rating.choices.find(choice => choice.score === score);
}

function firstMissing() {
  return round.products.findIndex(product => draft.scores[product.id] === undefined);
}

function dots() {
  const items = round.products.map((product, index) => {
    const marker = !draft.review && draft.index === index ? 'cur' : draft.scores[product.id] !== undefined ? 'done' : '';
    return `<span class="dot ${marker}"></span>`;
  }).join('');
  return `<span class="dots" aria-hidden="true">${items}</span>`;
}

function rating() {
  if (draft.review) return review();
  const product = round.products[draft.index];
  const current = draft.scores[product.id];
  const choices = round.rating.choices.map(choice => {
    const selected = current === choice.score;
    return `<button class="choice ${selected ? 'on' : ''}" data-action="pick" data-score="${choice.score}"
      style="--c:${colors[choice.score]}" aria-pressed="${selected}" ${advancing ? 'disabled' : ''}>
      <span class="lab">${escape(choice.label)}</span><span class="sub">${escape(choice.description)}</span>
    </button>`;
  }).join('');
  return `<section class="wrap w640">
    <div class="rowbar"><span>第 ${draft.index + 1} 件 / 共 ${round.catalogSize} 件</span>${dots()}</div>
    <div class="card item">
      <div class="pic" aria-hidden="true">${escape(product.icon)}</div>
      <h1 class="pname">${escape(product.name)}</h1><p class="pdesc">${escape(product.description)}</p>
    </div>
    <p class="q">${escape(round.rating.question)}</p>
    <div class="choices" aria-label="选择你的态度">${choices}</div>
    <nav class="item-foot" aria-label="回看商品">
      ${draft.index > 0 ? '<button class="textbtn" data-action="previous">上一件</button>' : ''}
      ${draft.edit ? '<button class="textbtn" data-action="review">回到一览</button>' : ''}
    </nav>
  </section>`;
}

function review() {
  const missing = firstMissing();
  const cards = round.products.map((product, index) => {
    const option = choiceFor(draft.scores[product.id]);
    const tag = option ? `<span class="tg" style="--c:${colors[option.score]}">${escape(option.label)}</span>` : '<span class="tg">还没选</span>';
    return `<button class="ovc ${option ? '' : 'miss'}" data-action="edit" data-index="${index}">
      <span class="ic" aria-hidden="true">${escape(product.icon)}</span><span class="nm">${escape(product.name)}</span>${tag}
    </button>`;
  }).join('');
  return `<section class="wrap w640 center">
    <h1 class="review-title">看一眼，没问题就提交</h1>
    <div class="rowbar overview-bar"><span>一览 · 共 ${round.catalogSize} 件</span>${dots()}</div>
    ${missing < 0 ? '' : `<p class="warn">还差第 ${missing + 1} 件</p>`}
    <div class="ov">${cards}</div>
    <div class="actions between"><button class="textbtn" data-action="review-first">从第一件重新看</button>
      <button class="btn-primary" data-action="submit" ${loading || missing >= 0 ? 'disabled' : ''}>提交我的选择</button>
    </div>
  </section>`;
}

function compareCard(row) {
  const rank = Math.abs(row.difference);
  const actual = choiceFor(row.actual);
  const predicted = choiceFor(row.predicted);
  const formatted = row.difference > 0 ? '+' + row.difference : String(row.difference).replace('-', '−');
  return `<article class="comparison-card" data-product="${escape(row.product.id)}">
    <header class="comparison-head">
      <div class="comparison-icon" aria-hidden="true">${escape(row.product.icon)}</div>
      <h3>${escape(row.product.name)}</h3>
    </header>
    <div class="comparison-sides">
      <div class="comparison-person"><span>你选的</span><strong data-score="${actual.score}">${escape(actual.label)}</strong></div>
      <div class="comparison-person"><span>模型猜的</span><strong data-score="${predicted.score}">${escape(predicted.label)}</strong></div>
    </div>
    <footer><span class="relation relation-${rank}">${relationLabels[rank]}</span><span class="muted">分差 ${formatted}</span></footer>
  </article>`;
}

function comparisonView() {
  if (comparison.status === 'failed') {
    const messages = {
      auth: 'TokenDance 没有通过密钥鉴权。',
      quota: 'TokenDance 当前额度不足。',
      access: 'TokenDance 当前密钥无权调用这个模型。',
      rate: 'TokenDance 暂时限制了调用频率。',
      network: '暂时连不上 TokenDance。',
      redirect: 'TokenDance 网关返回了跳转，暂时无法调用。',
      timeout: '这次模型响应超时。',
      interrupted: '这次后台处理被中断。',
      'invalid-output': comparison.stage === 'profile' ? '这次画像的格式有误。' : '这次模型未返回有效的商品选择。'
    };
    const message = messages[comparison.errorCode] || '这次没猜出来。';
    return `<section class="wrap w960 cmp card">${hostBar()}
      <h2>${message}</h2><p class="muted">你的选择已经保存。</p>
      <div class="actions"><button class="btn-primary" data-action="retry" ${loading ? 'disabled' : ''}>按原材料重试</button></div>
    </section>`;
  }
  const { counts, rows, profile } = comparison;
  const counter = counts.map((count, index) => `<div class="cnt"><strong class="n relation-${index}">${count}</strong><div class="l">${relationLabels[index]}</div></div>`).join('');
  const sections = profile.sections.map(section => {
    const title = portraitTopics.find(topic => topic.id === section.topic)?.title || '其他';
    return `<li><strong>${escape(title)}</strong><p>${escape(section.text)}</p></li>`;
  }).join('');
  const modeLabel = comparison.mode === 'demo' ? '<span class="demo-tag">演示分数</span>' : '';
  const timestamps = [
    ['测试编号', comparison.label],
    ['闲聊封存', chineseTime.format(new Date(comparison.sealedAt))],
    ['本人提交', chineseTime.format(new Date(comparison.submittedAt))],
    ['预测完成', chineseTime.format(new Date(comparison.predictionAt))],
    ['模型', comparison.model], ['提示词版本', comparison.promptVersion]
  ].map(([label, value]) => `<span>${label} ${escape(value)}</span>`).join('');
  return `<section class="wrap w960 cmp card" id="comparison">${hostBar()}
    <h2 class="concl">${rows.length} 件里，猜中了 ${counts[0]} 件。${modeLabel}</h2>
    <p class="ref">三档等概率随机猜，${rows.length} 件期望猜中 ${(rows.length / 3).toFixed(1)} 件。</p>
    <div class="counts">${counter}</div>
    <div class="comparison-grid">${rows.map(compareCard).join('')}</div>
    <details class="prof"><summary>访谈画像</summary>
      <div class="profbody">${sections ? `<ul>${sections}</ul>` : '<p>这段闲聊里没有可归入的话题内容。</p>'}
        <p class="muted">${comparison.mode === 'demo' ? '示例访谈整理' : '按话题整理受访者实际提到的内容。'}</p>
      </div>
    </details>
    <div class="result-meta">${timestamps}</div>
  </section>`;
}

function complete() {
  const shown = revealRequested && comparison?.status === 'complete';
  const failed = revealRequested && comparison?.status === 'failed';
  const waiting = revealRequested && !shown && !failed;
  return `<section class="wrap w960 finish">
    <div class="finish-split">
      <div class="card finish-card"><div class="finish-check" aria-hidden="true">✓</div><h1>已经记下了，谢谢你。</h1></div>
      ${shown ? `<div class="card reveal-card"><h2>模型的猜测</h2><p class="muted">下方可以逐件对照。</p></div>`
        : `<div class="card sealed-card">
          <div class="seal-strip" aria-hidden="true"></div>
          <h2>模型的猜测</h2>
          <button class="btn-primary" data-action="reveal" ${waiting || failed ? 'disabled' : ''}>现在来看一看模型是怎么猜的</button>
          ${waiting ? '<p class="muted" role="status">结果准备好后自动揭晓。</p>' : ''}
        </div>`}
    </div>
    ${shown || failed ? comparisonView() : ''}
    <div class="actions"><button class="textbtn" data-action="new-round" ${loading ? 'disabled' : ''}>开始下一场</button></div>
  </section>`;
}

function render() {
  if (!round) {
    app.innerHTML = `<section class="wrap w640 center card"><h1>聊聊你喜欢的事</h1>
      <p class="muted">${problem ? escape(problem) : '正在准备这场交流。'}</p>
      ${problem ? '<div class="actions center"><button class="btn-primary" data-action="connect">重新连接</button></div>' : ''}
    </section>`;
    return;
  }
  const views = { welcome, chat, handoff, rating, complete };
  progress.innerHTML = steps.map(([key, label]) => `<span ${key === draft.screen ? 'class="cur" aria-current="step"' : ''}>${label}</span>`).join('');
  app.classList.toggle('enter', lastScreen !== draft.screen);
  lastScreen = draft.screen;
  app.innerHTML = views[draft.screen]() + (problem ? `<p class="warn" role="alert">${escape(problem)}</p>` : '');
  if (draft.screen === 'chat') {
    document.getElementById('chatInput').value = draft.chat;
    updateChat();
  }
}

function confirm(title, body, confirmLabel, proceed) {
  if (dialog.open) return;
  dialog.innerHTML = `<form method="dialog">
    <h2 id="confirm-heading">${title}</h2><p>${body}</p>
    <div class="dlg-actions"><button class="btn-ghost" value="cancel" autofocus>再看看</button>
      <button class="btn-primary" value="yes">${confirmLabel}</button></div>
  </form>`;
  dialog.setAttribute('aria-labelledby', 'confirm-heading');
  dialog.returnValue = 'cancel';
  dialog.addEventListener('close', () => {
    if (dialog.returnValue === 'yes') proceed();
  }, { once: true });
  dialog.showModal();
}

async function refreshComparison() {
  const openRound = round.id;
  if (comparisonRound === openRound) return;
  comparisonRound = openRound;
  clearTimeout(pollTimer);
  try {
    const result = await request(roundUrl('/comparison'));
    if (round.id !== openRound) return;
    const previous = comparison?.status;
    comparison = result;
    if (revealRequested && previous !== result.status) render();
    if (comparison.status === 'pending') pollTimer = setTimeout(refreshComparison, 1000);
  } catch {
    if (round.id !== openRound) return;
    comparison = { status: 'failed', errorCode: 'request' };
    if (revealRequested) render();
  } finally {
    if (comparisonRound === openRound) comparisonRound = undefined;
  }
}

function pick(score) {
  if (advancing) return;
  draft.scores[round.products[draft.index].id] = score;
  advancing = true;
  remember();
  render();
  setTimeout(() => {
    if (draft.edit || draft.index === round.catalogSize - 1) {
      draft.review = true;
      draft.edit = false;
    } else {
      draft.index += 1;
    }
    advancing = false;
    remember();
    render();
  }, 400);
}

const commands = {
  connect: () => act(connect),
  begin: () => go('chat'),
  mark(button) {
    const index = Number(button.dataset.index);
    draft.topics = draft.topics.includes(index) ? draft.topics.filter(value => value !== index) : [...draft.topics, index];
    remember();
    button.classList.toggle('done');
    button.setAttribute('aria-pressed', String(draft.topics.includes(index)));
  },
  example() {
    draft.chat = example;
    remember();
    document.getElementById('chatInput').value = example;
    updateChat();
  },
  seal() {
    confirm('确认提交这段闲聊？', '提交后会封存这段文字，用来生成画像。', '确认提交', () => {
      act(async () => useRound(await request(roundUrl('/chat'), { chat: draft.chat })));
    });
  },
  rate: () => go('rating'),
  pick: button => pick(Number(button.dataset.score)),
  previous() {
    if (advancing || draft.index === 0) return;
    draft.index -= 1;
    remember();
    render();
  },
  review() {
    if (advancing) return;
    draft.review = true;
    draft.edit = false;
    remember();
    render();
  },
  edit(button) {
    draft.index = Number(button.dataset.index);
    draft.review = false;
    draft.edit = true;
    remember();
    render();
  },
  'review-first'() {
    draft.index = 0;
    draft.review = false;
    draft.edit = false;
    remember();
    render();
  },
  submit() {
    if (firstMissing() >= 0) return;
    confirm('提交你的选择？', '这十件商品的选择会作为本场记录保存。', '确定提交', () => {
      act(async () => useRound(await request(roundUrl('/ratings'), { scores: draft.scores })));
    });
  },
  reveal() {
    revealRequested = true;
    render();
    if (!comparison) void refreshComparison();
  },
  retry() {
    act(async () => {
      comparison = await request(roundUrl('/retry'), {});
      await refreshComparison();
    });
  },
  'new-round'() {
    act(async () => {
      const next = await request('/api/rounds', {});
      clearTimeout(pollTimer);
      draft = blankDraft();
      revealRequested = false;
      comparison = undefined;
      useRound(next);
    });
  }
};

app.addEventListener('input', event => {
  if (event.target.id !== 'chatInput') return;
  draft.chat = event.target.value;
  remember();
  updateChat();
});

app.addEventListener('click', event => {
  const button = event.target.closest('button[data-action]');
  if (!button || button.disabled || loading) return;
  commands[button.dataset.action]?.(button);
});

act(connect);
