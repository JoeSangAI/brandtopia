export const minimumChatLength = 100;
export const experimentRating = {
  question: '单看这件东西本身，先不管价格，你想要它吗？',
  choices: [
    { score: 1, label: '想要', description: '有的话会开心' },
    { score: 0, label: '无感', description: '有没有都行' },
    { score: -1, label: '不想要', description: '送我也不太想留' }
  ]
};

export function scoreIsValid(value) {
  return value === -1 || value === 0 || value === 1;
}

export function chatLength(chat) {
  return [...chat.replace(/\s/g, '')].length;
}

export function normalizedScores(products, answers) {
  if (!answers || Array.isArray(answers) || typeof answers !== 'object' ||
      Object.keys(answers).length !== products.length ||
      products.some(product => !scoreIsValid(answers[product.id]))) return null;
  return Object.fromEntries(products.map(product => [product.id, answers[product.id]]));
}

export function compareScores(products, actualScores, predictedScores) {
  const counts = [0, 0, 0];
  const rows = products.map(product => {
    const actual = actualScores[product.id];
    const predicted = predictedScores[product.id];
    const difference = predicted - actual;
    counts[Math.abs(difference)] += 1;
    return { product, actual, predicted, difference };
  });
  return { counts, rows };
}

export function roundLabel(id, date) {
  const localDay = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Shanghai' })
    .format(date).replaceAll('-', '');
  return 'T-' + localDay + '-' + id.slice(0, 6).toUpperCase();
}
