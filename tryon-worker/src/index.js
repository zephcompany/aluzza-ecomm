/**
 * Aluzza · Provador virtual ("Veja em você")
 * Cloudflare Worker: recebe a foto do pé da cliente + a imagem do calçado
 * e devolve uma foto gerada com o modelo calçado, usando um modelo de edição
 * de imagem por API. A chave fica só aqui no servidor.
 *
 * POST /tryon  { photo: dataURL, product: [url,...] | url, name, color }
 *   -> { image: dataURL, provider, ms }
 * GET  /       -> { ok, provider, model }
 *
 * Variáveis (wrangler secret put ...):
 *   GEMINI_API_KEY   chave do Google AI Studio (provider gemini, padrão)
 *   FAL_KEY          chave do fal.ai (provider fal, opcional)
 *   PROVIDER         "gemini" | "fal"   (padrão gemini)
 *   GEMINI_MODEL     padrão "gemini-2.5-flash-image"
 *   ALLOWED_ORIGINS  lista separada por vírgula; vazio = qualquer origem
 */

const DEFAULTS = {
  PROVIDER: 'gemini',
  GEMINI_MODEL: 'gemini-2.5-flash-image',
  FAL_MODEL: 'fal-ai/nano-banana/edit',
  MAX_PHOTO_BYTES: 7 * 1024 * 1024,
  TIMEOUT_MS: 90_000,
};

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get('Origin') || '';
    const cors = corsHeaders(origin, env);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

    const url = new URL(request.url);
    if (request.method === 'GET' && (url.pathname === '/' || url.pathname === '/health')) {
      return json({ ok: true, service: 'aluzza-tryon', provider: provider(env), model: env.GEMINI_MODEL || DEFAULTS.GEMINI_MODEL }, 200, cors);
    }
    if (request.method !== 'POST' || url.pathname !== '/tryon') return json({ error: 'not_found' }, 404, cors);

    if (!originAllowed(origin, env)) return json({ error: 'origin_not_allowed' }, 403, cors);

    // limite simples por IP (binding opcional de Rate Limiting)
    if (env.RL) {
      const ip = request.headers.get('CF-Connecting-IP') || 'anon';
      const { success } = await env.RL.limit({ key: ip });
      if (!success) return json({ error: 'rate_limited', message: 'Muitas tentativas seguidas. Espere um minuto e tente de novo.' }, 429, cors);
    }

    let body;
    try { body = await request.json(); } catch { return json({ error: 'bad_json' }, 400, cors); }

    const photo = parseDataUrl(body.photo);
    if (!photo) return json({ error: 'photo_required', message: 'Envie uma foto do seu pé.' }, 400, cors);
    if (photo.bytes > DEFAULTS.MAX_PHOTO_BYTES) return json({ error: 'photo_too_large', message: 'A foto é muito grande. Tente uma menor.' }, 413, cors);

    const productUrls = (Array.isArray(body.product) ? body.product : [body.product]).filter(u => typeof u === 'string' && /^https?:\/\//i.test(u)).slice(0, 2);
    if (!productUrls.length) return json({ error: 'product_required' }, 400, cors);

    const t0 = Date.now();
    try {
      const products = await Promise.all(productUrls.map(u => fetchImage(u)));
      const prompt = buildPrompt(body);
      const result = provider(env) === 'fal'
        ? await viaFal(env, prompt, photo, products)
        : await viaGemini(env, prompt, photo, products);
      return json({ image: `data:${result.mime};base64,${result.b64}`, provider: provider(env), ms: Date.now() - t0 }, 200, cors);
    } catch (err) {
      const msg = String(err && err.message || err);
      const status = /safety|blocked/i.test(msg) ? 422 : /quota|429|RESOURCE_EXHAUSTED/i.test(msg) ? 429 : 502;
      return json({ error: 'generation_failed', message: friendly(msg), detail: msg.slice(0, 300) }, status, cors);
    }
  },
};

/* ---------- prompt ---------- */
function buildPrompt(b) {
  const name = clean(b.name) || 'the shoes';
  const color = clean(b.color);
  const heel = clean(b.heel);
  return [
    `You are a photo retoucher for a women's shoe store. Edit the FIRST image, which is a real photo sent by a customer of her own feet/legs.`,
    `Task: make her wear the shoes shown in the product image(s) that follow (${name}${color ? `, color ${color}` : ''}${heel ? `, heel ${heel}` : ''}). Remove any footwear she is currently wearing and place these exact shoes on her feet, both feet if both are visible.`,
    `Keep EVERYTHING else identical: her skin tone, legs, toes, pose, nail polish, the floor, background, framing, camera angle and lighting. Match the shoes' perspective, scale and foot position precisely, with contact shadows and natural occlusion of toes and straps. Preserve the shoe's true design, materials, heel height and color from the product image; do not invent a different shoe.`,
    `Photorealistic result, same resolution and aspect ratio as the first image. Return only the edited photo, no text, no collage, no borders.`,
  ].join(' ');
}
const clean = s => (typeof s === 'string' ? s.replace(/[^\p{L}\p{N} .,’'()-]/gu, '').slice(0, 80) : '');

/* ---------- providers ---------- */
async function viaGemini(env, prompt, photo, products) {
  if (!env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY não configurada');
  const model = env.GEMINI_MODEL || DEFAULTS.GEMINI_MODEL;
  const parts = [
    { text: prompt },
    { inline_data: { mime_type: photo.mime, data: photo.b64 } },
    ...products.map(p => ({ inline_data: { mime_type: p.mime, data: p.b64 } })),
  ];
  const res = await fetchWithTimeout(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
    body: JSON.stringify({
      contents: [{ role: 'user', parts }],
      generationConfig: { responseModalities: ['IMAGE'], temperature: 0.4 },
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`gemini ${res.status}: ${data?.error?.message || 'erro'}`);
  const cand = data.candidates && data.candidates[0];
  if (!cand) throw new Error(`gemini: sem resposta (${data?.promptFeedback?.blockReason || 'blocked'})`);
  const img = (cand.content?.parts || []).find(p => p.inlineData || p.inline_data);
  if (!img) throw new Error(`gemini: sem imagem (${cand.finishReason || 'safety'})`);
  const d = img.inlineData || img.inline_data;
  return { mime: d.mimeType || d.mime_type || 'image/png', b64: d.data };
}

async function viaFal(env, prompt, photo, products) {
  if (!env.FAL_KEY) throw new Error('FAL_KEY não configurada');
  const model = env.FAL_MODEL || DEFAULTS.FAL_MODEL;
  const res = await fetchWithTimeout(`https://fal.run/${model}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Key ${env.FAL_KEY}` },
    body: JSON.stringify({ prompt, image_urls: [`data:${photo.mime};base64,${photo.b64}`, ...products.map(p => `data:${p.mime};base64,${p.b64}`)], num_images: 1, output_format: 'jpeg' }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`fal ${res.status}: ${data?.detail || data?.error || 'erro'}`);
  const u = data.images && data.images[0] && data.images[0].url;
  if (!u) throw new Error('fal: sem imagem');
  const img = await fetchImage(u);
  return img;
}

/* ---------- helpers ---------- */
function provider(env) { return (env.PROVIDER || DEFAULTS.PROVIDER).toLowerCase() === 'fal' ? 'fal' : 'gemini'; }

function parseDataUrl(s) {
  if (typeof s !== 'string') return null;
  const m = s.match(/^data:(image\/(?:jpeg|png|webp|heic|heif));base64,([A-Za-z0-9+/=]+)$/i);
  if (!m) return null;
  return { mime: m[1].toLowerCase(), b64: m[2], bytes: Math.floor(m[2].length * 3 / 4) };
}

async function fetchImage(u) {
  const res = await fetchWithTimeout(u, { headers: { Accept: 'image/*' }, cf: { cacheTtl: 86400, cacheEverything: true } });
  if (!res.ok) throw new Error(`imagem do produto indisponível (${res.status})`);
  const mime = (res.headers.get('content-type') || 'image/jpeg').split(';')[0].trim();
  const buf = await res.arrayBuffer();
  return { mime: /^image\//.test(mime) ? mime : 'image/jpeg', b64: toB64(buf) };
}

function toB64(buf) {
  const bytes = new Uint8Array(buf); let bin = ''; const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  return btoa(bin);
}

async function fetchWithTimeout(url, init) {
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), DEFAULTS.TIMEOUT_MS);
  try { return await fetch(url, { ...init, signal: ctl.signal }); } finally { clearTimeout(t); }
}

function originAllowed(origin, env) {
  const list = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  if (!list.length) return true;           // sem lista = aberto (útil em testes)
  if (!origin) return false;
  if (origin === 'null') return list.includes('null'); // iframes em sandbox (ex.: artifact)
  return list.some(p => p === '*' || origin === p || (p.startsWith('*.') && origin.endsWith(p.slice(1))));
}

function corsHeaders(origin, env) {
  return {
    'Access-Control-Allow-Origin': originAllowed(origin, env) && origin ? origin : '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

function json(obj, status, headers) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers } });
}

function friendly(msg) {
  if (/safety|blocked|PROHIBITED/i.test(msg)) return 'Não deu pra gerar com essa foto. Tente uma foto só dos pés, com o chão aparecendo e boa luz.';
  if (/quota|429|RESOURCE_EXHAUSTED|rate/i.test(msg)) return 'Muita gente experimentando agora. Tente de novo em instantes.';
  if (/não configurada/i.test(msg)) return 'O provador ainda não foi ativado nesta loja.';
  if (/abort|timeout/i.test(msg)) return 'Demorou mais que o normal. Tente de novo.';
  return 'Não conseguimos gerar a prévia agora. Tente de novo em instantes.';
}
