import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const read = file => readFileSync(join(here, file), 'utf8');
const assets = {
  '/': { mime: 'text/html', content: read('public/index.html') },
  '/style.css': { mime: 'text/css', content: read('public/style.css') },
  '/app.js': { mime: 'text/javascript', content: read('public/app.js') },
  '/topics.js': { mime: 'text/javascript', content: read('public/topics.mjs') }
};
const prompts = {
  profile: read('prompts/访谈画像.md').trim(),
  rating: read('prompts/商品偏好预测.md').trim()
};

// The hosting target accepts a single Worker ES module. Internal imports below
// are already included in dependency order, and the browser modules are assets.
const imports = new Set([
  "import { portraitTopics } from './public/topics.mjs';",
  "import { scoreIsValid } from './experiment.mjs';",
  "import { generateProfile, MODELS, predictRatings, probeGateway, PROMPT_VERSION } from '../prediction.mjs';",
  "import { chatLength, compareScores, experimentRating, minimumChatLength, normalizedScores, roundLabel } from '../experiment.mjs';"
]);
function inlineModule(file) {
  return read(file).split(/\r?\n/).filter(line => {
    if (!line.startsWith('import ')) return true;
    if (!imports.has(line)) throw new Error('Unhandled Worker import in ' + file);
    return false;
  }).join('\n').replace(/^export (?=(?:const|(?:async )?function)\b)/gm, '');
}

const output = [
  'const hostedAssets = ' + JSON.stringify(assets) + ';',
  'const hostedCatalog = ' + JSON.stringify(JSON.parse(read('示例商品.json'))) + ';',
  'const hostedPrompts = ' + JSON.stringify(prompts) + ';',
  ...['public/topics.mjs', 'experiment.mjs', 'prediction.mjs', 'worker/index.mjs'].map(inlineModule)
].join('\n\n');
const destination = join(here, 'dist', 'server', 'index.js');
mkdirSync(dirname(destination), { recursive: true });
writeFileSync(destination, output + '\n', 'utf8');
const manifest = join(here, 'dist', '.openai', 'hosting.json');
mkdirSync(dirname(manifest), { recursive: true });
copyFileSync(join(here, '.openai', 'hosting.json'), manifest);
console.info('Worker build written to dist/server/index.js');
