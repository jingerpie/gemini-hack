// Batch: turn catalog product photos into three.js build(THREE) models with Gemini.
// Usage: node server/catalog-models.mjs [--per-kind N] [--kind sofa,bed] [--force] [--concurrency N]
//        node server/catalog-models.mjs --fix fixes.json
//   fixes.json: [{ "modelFile": "stool/01-x.build.js", "feedback": "what looks wrong", "render": "/abs/render.png" (optional) }]
//   Sends photo + current render + current code + feedback, overwrites the model file.
// Writes <kind>/<image-basename>.build.js next to each image and sets `modelFile` in catalog.json.
import fs from 'node:fs';
import path from 'node:path';
import { SERVER_DIR, generateContent, textOf, scrub } from './lib.mjs';
import { cleanCode, validateCode, DIRECT_MODEL } from './asset.mjs';

const CATALOG_DIR = path.join(SERVER_DIR, '..', 'catalog', 'mock-shop');
const CATALOG = path.join(CATALOG_DIR, 'catalog.json');
const SYSTEM = fs.readFileSync(path.join(SERVER_DIR, 'prompts', 'codegen.txt'), 'utf8');

const arg = (name, dflt) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : dflt; };
const PER_KIND = +arg('--per-kind', 1);
const KINDS = arg('--kind', '') ? new Set(arg('--kind').split(',')) : null;
const FORCE = process.argv.includes('--force');
const CONCURRENCY = +arg('--concurrency', 20);
const MODEL = arg('--model', DIRECT_MODEL);
const FIXES = arg('--fix', '') ? JSON.parse(fs.readFileSync(arg('--fix'), 'utf8')) : null;

const modelPathFor = e => e.imageFile.replace(/\.(png|jpe?g|webp)$/i, '.build.js');

function prompt(e) {
  return `Build a three.js model of the product in the attached photo.
Product: ${e.name} (${e.productType}, category: ${e.kind}).
Match the photo closely: silhouette, proportions, number and shape of legs/arms/cushions/drawers, materials and colors.
Pick a realistic real-world size for this kind of product and state it as named constants at the top of the function.
Respond with only the code in a single \`\`\`javascript block, no explanation.`;
}

function fixPrompt(e, fix) {
  const current = fs.readFileSync(path.join(CATALOG_DIR, modelPathFor(e)), 'utf8');
  return `${prompt(e)}

This is a FIX of an existing model. The first image is the product photo${fix.render ? '; the second image is a render of the current model' : ''}.
A reviewer compared them and found these problems:
${fix.feedback}

Fix those problems so the model matches the photo. Keep everything else that already looks right.
Current code:
\`\`\`javascript
${current.slice(0, 30000)}
\`\`\``;
}

async function buildOne(e, fix) {
  const img = fs.readFileSync(path.join(CATALOG_DIR, e.imageFile)).toString('base64');
  const mime = /\.png$/i.test(e.imageFile) ? 'image/png' : 'image/jpeg';
  const base = fix ? fixPrompt(e, fix) : prompt(e);
  const images = [{ inlineData: { mimeType: mime, data: img } }];
  if (fix?.render) images.push({ inlineData: { mimeType: 'image/png', data: fs.readFileSync(fix.render).toString('base64') } });
  let text = base;
  let last = '';
  for (let attempt = 1; attempt <= 3; attempt++) {
    const js = await generateContent(MODEL, {
      systemInstruction: { parts: [{ text: SYSTEM }] },
      contents: [{ role: 'user', parts: [...images, { text }] }],
      generationConfig: { thinkingConfig: { thinkingLevel: 'low' }, maxOutputTokens: 32768 },
    }, { timeoutMs: 150000 });
    const code = cleanCode(textOf(js));
    const v = validateCode(code);
    if (v.ok) return { code, v, attempt };
    last = v.error;
    text = base + `\n\nA previous attempt failed validation with: ${v.error}\nPrevious code:\n\`\`\`javascript\n${code.slice(0, 20000)}\n\`\`\`\nReturn the corrected complete code only.`;
  }
  throw new Error('invalid code after 3 attempts: ' + last);
}

async function pool(items, n, fn) {
  const out = []; let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length) { const k = i++; out[k] = await fn(items[k]); }
  }));
  return out;
}

const catalog = JSON.parse(fs.readFileSync(CATALOG, 'utf8'));
const seen = {};
const fixFor = e => FIXES?.find(f => f.modelFile === modelPathFor(e));
const jobs = catalog.filter(e => {
  if (FIXES) return !!fixFor(e);
  if (KINDS && !KINDS.has(e.kind)) return false;
  seen[e.kind] = (seen[e.kind] || 0) + 1;
  if (seen[e.kind] > PER_KIND) return false;
  return FORCE || !fs.existsSync(path.join(CATALOG_DIR, modelPathFor(e)));
});
console.log(`[models] ${jobs.length} jobs, model ${MODEL}, concurrency ${CONCURRENCY}`);

const t0 = Date.now();
const results = await pool(jobs, CONCURRENCY, async e => {
  const t = Date.now();
  try {
    const r = await buildOne(e, fixFor(e));
    const rel = modelPathFor(e);
    fs.writeFileSync(path.join(CATALOG_DIR, rel), r.code);
    console.log(`OK   ${e.kind.padEnd(14)} ${rel}  ${r.v.meshes} meshes, bbox ${r.v.bbox.x}x${r.v.bbox.y}x${r.v.bbox.z} m, try ${r.attempt}, ${((Date.now() - t) / 1000).toFixed(0)}s`);
    return { e, rel };
  } catch (err) {
    console.log(`FAIL ${e.kind.padEnd(14)} ${e.imageFile}: ${scrub(err.message).slice(0, 200)}`);
    return { e, rel: null };
  }
});

// Re-read catalog.json before writing so concurrent edits to it are kept.
const fresh = JSON.parse(fs.readFileSync(CATALOG, 'utf8'));
for (const entry of fresh) {
  if (fs.existsSync(path.join(CATALOG_DIR, modelPathFor(entry)))) entry.modelFile = modelPathFor(entry);
}
fs.writeFileSync(CATALOG, JSON.stringify(fresh, null, 2) + '\n');
const ok = results.filter(r => r.rel).length;
console.log(`[models] done: ${ok}/${jobs.length} ok in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
