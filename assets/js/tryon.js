/* Aluzza · Provador virtual "Veja em você"
 * Usado pelo site estático e pelo tema Shopify.
 * window.AluzzaTryon.init({ endpoint, product:{name,color,heel,images:[...]}, siblings:[{color,hex,image,url}], onPickSize, whats })
 */
(function () {
  'use strict';
  const $ = (s, c) => (c || document).querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const IC = {
    cam: '<svg viewBox="0 0 24 24"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
    up: '<svg viewBox="0 0 24 24"><path d="M12 16V4M6 10l6-6 6 6M4 20h16"/></svg>',
    spark: '<svg viewBox="0 0 24 24"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/></svg>',
    dl: '<svg viewBox="0 0 24 24"><path d="M12 4v12M6 10l6 6 6-6M4 20h16"/></svg>',
    share: '<svg viewBox="0 0 24 24"><circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M8.2 10.8l7.6-4.6M8.2 13.2l7.6 4.6"/></svg>',
    swap: '<svg viewBox="0 0 24 24"><path d="M4 7h13l-3-3M20 17H7l3 3"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="m5 12 5 5L20 7"/></svg>',
    lock: '<svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
    bag: '<svg viewBox="0 0 24 24"><path d="M6 8h12l1 13H5L6 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
    foot: '<svg viewBox="0 0 24 24"><path d="M9 3c-2.5 0-4 2.5-4 6 0 3 1 4.5 1 7 0 2 1.5 4 3.5 4s3-1.5 3-3.5c0-2-1-3.5-1-6 0-3.5 0-7.5-2.5-7.5z"/><circle cx="15.5" cy="5" r="1.2"/><circle cx="17.5" cy="8" r="1"/><circle cx="18.5" cy="11.5" r=".9"/></svg>',
    wa: '<svg viewBox="0 0 24 24"><path d="M12 2.2A9.8 9.8 0 0 0 3.6 17l-1.4 5 5.2-1.4A9.8 9.8 0 1 0 12 2.2zm0 17.8a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 20zm4.4-6c-.2-.1-1.4-.7-1.6-.8s-.4-.1-.6.1-.6.8-.8 1-.3.2-.5.1a6.6 6.6 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.7-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 12 12 0 0 0 4.6 4c1.7.7 2.1.6 2.8.6a2.4 2.4 0 0 0 1.6-1.1 2 2 0 0 0 .1-1.1c0-.2-.2-.2-.5-.3z"/></svg>'
  };
  const abs = u => { try { return new URL(u, location.href).href; } catch (e) { return u; } };
  const LOADING_MSGS = ['Analisando a foto do seu pé…', 'Ajustando o modelo ao seu pé…', 'Acertando luz e sombras…', 'Quase lá, finalizando a prévia…'];
  const TIPS = ['Pé descalço ou de meia fina, com o chão aparecendo.', 'Foto de cima ou de lado, a uns 60 cm do pé.', 'Luz natural ajuda. Evite sombras fortes e fundo bagunçado.'];

  const state = { opts: null, photo: null, photoBlob: null, result: null, pick: 0, busy: false, step: 'upload', timer: null };

  function init(opts) {
    state.opts = opts; state.pick = 0; state.photo = null; state.result = null;
    const siblings = (opts.siblings && opts.siblings.length ? opts.siblings : [{ color: opts.product.color, hex: opts.product.hex || '#999', image: opts.product.images[0], url: location.href }]);
    const cur = siblings.findIndex(s => s.color === opts.product.color); state.pick = cur < 0 ? 0 : cur;
    opts._siblings = siblings;
    const box = $('#alz-dialog-tryon .alz-dialog__box'); if (!box) return;
    box.innerHTML = `<button class="icon-btn alz-dialog__close" data-close-alz-dialog aria-label="Fechar"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button><div class="tryon tryon--app" id="tryon-app"></div>`;
    render(opts.endpoint ? 'upload' : 'soon');
    const btn = $('#tryon-btn'); if (btn) { const b = $('.badge', btn); if (b) { b.textContent = opts.endpoint ? 'Novo' : 'Em breve'; } }
  }

  function picked() { return state.opts._siblings[state.pick]; }

  function render(step) {
    state.step = step; const o = state.opts; const p = picked(); const app = $('#tryon-app'); if (!app) return;
    app.dataset.step = step;
    const sw = o._siblings.length > 1 ? `<div class="tryon__colors" aria-label="Escolha a cor">${o._siblings.map((s, i) => `<button type="button" class="swatch swatch--lg ${i === state.pick ? 'is-on' : ''}" style="background:${s.hex || '#bbb'}" data-pick="${i}" title="${esc(s.color)}" aria-label="${esc(s.color)}"></button>`).join('')}<span class="tryon__color-name">${esc(p.color)}</span></div>` : '';
    const privacy = `<p class="tryon__privacy">${IC.lock} Sua foto é usada só para gerar esta prévia e não fica guardada.</p>`;
    let stage = '', side = '';
    if (step === 'soon') {
      stage = `<img class="tryon__bg" src="${esc(p.image)}" alt=""><div class="tryon__frame">${IC.foot}Posicione o pé dentro da marcação</div><div class="tryon__scan"></div>`;
      side = `<span class="eyebrow">Veja em você</span><h3>Experimente antes de comprar</h3><p>Aponte a câmera do celular para o seu pé e veja como este modelo fica em você, na cor escolhida.</p>
        <ol class="tryon__steps"><li><b>1</b><span>Abra o site no celular e toque em Veja em você.</span></li><li><b>2</b><span>Tire uma foto do pé, com o chão aparecendo.</span></li><li><b>3</b><span>Troque de cor e salve a foto.</span></li></ol>
        <form class="tryon__actions" id="tryon-form"><button class="btn" type="submit">Quero ser avisada quando lançar</button><button class="btn btn--ghost" type="button" data-close-alz-dialog>Voltar ao produto</button></form>
        <p class="small mt-16">A prova virtual está em fase final de testes. Enquanto isso, a primeira troca de tamanho é grátis.</p>`;
    } else if (step === 'upload') {
      stage = `<img class="tryon__bg" src="${esc(p.image)}" alt=""><label class="tryon__drop" for="tryon-file">${IC.cam}<b>Tirar ou enviar foto do pé</b><span>JPG, PNG ou HEIC · até 10 MB</span></label><input type="file" id="tryon-file" accept="image/*" capture="environment" hidden>`;
      side = `<span class="eyebrow">Veja em você</span><h3>${esc(o.product.name)} <small>${esc(p.color)}</small></h3><p>Mande uma foto do seu pé e a gente mostra como o modelo fica em você, na cor que escolher.</p>${sw}
        <ul class="tryon__tips">${TIPS.map(t => `<li>${IC.check}<span>${t}</span></li>`).join('')}</ul>
        <div class="tryon__actions"><label class="btn" for="tryon-file">${IC.cam} Tirar foto agora</label><label class="btn btn--ghost" for="tryon-file-gal">${IC.up} Escolher da galeria</label><input type="file" id="tryon-file-gal" accept="image/*" hidden></div>${privacy}`;
    } else if (step === 'preview') {
      stage = `<img class="tryon__photo" src="${state.photo}" alt="Sua foto"><button type="button" class="tryon__retake" data-retake>${IC.swap} Trocar foto</button>`;
      side = `<span class="eyebrow">Veja em você</span><h3>${esc(o.product.name)} <small>${esc(p.color)}</small></h3><p>Foto pronta. Escolha a cor e toque em experimentar. Leva uns 15 segundos.</p>${sw}
        <div class="tryon__actions"><button class="btn btn--lg" type="button" data-go>${IC.spark} Experimentar no meu pé</button><button class="btn btn--ghost" type="button" data-retake>Trocar a foto</button></div>${privacy}`;
    } else if (step === 'loading') {
      stage = `<img class="tryon__photo is-dim" src="${state.photo}" alt=""><div class="tryon__scan"></div><div class="tryon__loader"><span class="tryon__spin"></span><b id="tryon-msg">${LOADING_MSGS[0]}</b><small>Não feche esta janela</small></div>`;
      side = `<span class="eyebrow">Veja em você</span><h3>${esc(o.product.name)} <small>${esc(p.color)}</small></h3><p>Estamos colocando o ${esc(o.product.name)} no seu pé. Enquanto isso, veja o passo a passo da prova.</p>
        <ol class="tryon__steps"><li class="is-on"><b>1</b><span>Reconhecer o pé e o ângulo da foto</span></li><li><b>2</b><span>Ajustar o modelo, a cor e o salto</span></li><li><b>3</b><span>Acertar luz e sombras para ficar real</span></li></ol>${privacy}`;
    } else if (step === 'result') {
      stage = `<div class="tryon__compare" id="tryon-compare" style="--x:100%"><img src="${state.result}" alt="Você com o ${esc(o.product.name)}"><div class="tryon__before"><img src="${state.photo}" alt="Antes"></div><div class="tryon__handle" aria-hidden="true"></div><span class="tryon__tag tryon__tag--a">antes</span><span class="tryon__tag tryon__tag--b">com o ${esc(o.product.name)}</span><input type="range" min="0" max="100" value="100" class="tryon__range" aria-label="Comparar antes e depois"></div>`;
      side = `<span class="eyebrow">Ficou assim em você</span><h3>${esc(o.product.name)} <small>${esc(p.color)}</small></h3><p>Arraste a foto para comparar. Quer ver em outra cor? É só tocar na bolinha.</p>${sw}
        <div class="tryon__actions tryon__actions--grid"><button class="btn" type="button" data-size>${IC.bag} Escolher o tamanho</button><button class="btn btn--ghost" type="button" data-save>${IC.dl} Salvar foto</button><button class="btn btn--ghost" type="button" data-share>${IC.share} Compartilhar</button><button class="btn btn--ghost" type="button" data-retake>${IC.swap} Outra foto</button></div>
        <p class="small muted mt-12">É uma prévia gerada por IA: caimento e brilho podem variar um pouco do produto real. A primeira troca de tamanho é grátis.</p>`;
    } else if (step === 'error') {
      stage = `<img class="tryon__photo is-dim" src="${state.photo || p.image}" alt=""><div class="tryon__loader tryon__loader--err">${IC.foot}<b>${esc(state.error || 'Não deu certo desta vez.')}</b></div>`;
      side = `<span class="eyebrow">Veja em você</span><h3>Vamos tentar de novo?</h3><p>${esc(state.error || 'Não conseguimos gerar a prévia agora.')}</p>
        <ul class="tryon__tips">${TIPS.map(t => `<li>${IC.check}<span>${t}</span></li>`).join('')}</ul>
        <div class="tryon__actions"><button class="btn" type="button" data-go>Tentar de novo</button><button class="btn btn--ghost" type="button" data-retake>Trocar a foto</button>${o.whats ? `<a class="btn btn--ghost" href="https://wa.me/${o.whats}?text=${encodeURIComponent('Oi! Tentei usar o Veja em você no site e não funcionou. Pode me ajudar com o ' + o.product.name + ' ' + p.color + '?')}" target="_blank" rel="noopener">${IC.wa} Falar com a Lívia</a>` : ''}</div>`;
    }
    app.innerHTML = `<div class="tryon__stage">${stage}</div><div class="tryon__side">${side}</div>`;
    bind(app);
    if (window.fixWidows) try { window.fixWidows(app); } catch (e) {}
  }

  function bind(app) {
    const o = state.opts;
    app.querySelectorAll('input[type=file]').forEach(inp => inp.addEventListener('change', e => { const f = e.target.files && e.target.files[0]; if (f) loadPhoto(f); }));
    app.querySelectorAll('[data-pick]').forEach(b => b.addEventListener('click', () => { state.pick = +b.dataset.pick; if (state.step === 'result') { run(); } else render(state.step); }));
    app.querySelectorAll('[data-retake]').forEach(b => b.addEventListener('click', () => { state.photo = null; state.result = null; render('upload'); }));
    app.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', run));
    const r = $('.tryon__range', app); if (r) { const c = $('#tryon-compare'); r.addEventListener('input', () => c.style.setProperty('--x', r.value + '%')); }
    const sv = $('[data-save]', app); if (sv) sv.addEventListener('click', save);
    const sh = $('[data-share]', app); if (sh) sh.addEventListener('click', share);
    const sz = $('[data-size]', app); if (sz) sz.addEventListener('click', () => { closeDialog(); if (o.onPickSize) o.onPickSize(picked()); });
    const f = $('#tryon-form', app); if (f) f.addEventListener('submit', e => { e.preventDefault(); closeDialog(); if (o.toast) o.toast('Você será avisada quando o Veja em você estiver disponível.'); });
    // drag & drop
    const drop = $('.tryon__drop', app); if (drop) { ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('is-over'); })); ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('is-over'); })); drop.addEventListener('drop', e => { const f = e.dataTransfer.files && e.dataTransfer.files[0]; if (f) loadPhoto(f); }); }
  }

  function closeDialog() { const m = $('#alz-dialog-tryon'); if (m) { m.classList.remove('is-open'); if (!document.querySelector('.alz-dialog.is-open')) document.body.classList.remove('is-locked'); } }

  async function loadPhoto(file) {
    if (!/^image\//.test(file.type) && !/\.(heic|heif)$/i.test(file.name)) { state.error = 'Esse arquivo não é uma imagem.'; render('error'); return; }
    if (file.size > 25 * 1024 * 1024) { state.error = 'A foto é muito pesada. Tente uma menor.'; render('error'); return; }
    try {
      const url = await downscale(file, 1280, 0.86);
      state.photo = url; state.result = null; render('preview');
    } catch (e) {
      state.error = 'Não consegui abrir essa foto. Tente outra (JPG ou PNG).'; render('error');
    }
  }

  async function downscale(file, max, q) {
    let bmp;
    try { bmp = await createImageBitmap(file, { imageOrientation: 'from-image' }); }
    catch (e) { bmp = await new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = URL.createObjectURL(file); }); }
    const w = bmp.width, h = bmp.height; const s = Math.min(1, max / Math.max(w, h));
    const c = document.createElement('canvas'); c.width = Math.round(w * s); c.height = Math.round(h * s);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', q);
  }

  async function run() {
    if (state.busy || !state.photo) return; const o = state.opts; const p = picked();
    state.busy = true; render('loading');
    let k = 0; state.timer = setInterval(() => { k = (k + 1) % LOADING_MSGS.length; const m = $('#tryon-msg'); if (m) m.textContent = LOADING_MSGS[k]; const li = document.querySelectorAll('#tryon-app .tryon__steps li'); li.forEach((l, i) => l.classList.toggle('is-on', i === Math.min(k, 2))); }, 4500);
    const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), 100000);
    try {
      const res = await fetch(o.endpoint.replace(/\/$/, '') + '/tryon', { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: ctl.signal, body: JSON.stringify({ photo: state.photo, product: [p.image].concat(p.image2 ? [p.image2] : []).map(abs), name: o.product.name, color: p.color, heel: o.product.heel || '' }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j.image) throw new Error(j.message || 'Não conseguimos gerar a prévia agora. Tente de novo em instantes.');
      state.result = j.image; render('result');
      if (o.onResult) try { o.onResult(p); } catch (e) {}
    } catch (e) {
      state.error = e.name === 'AbortError' ? 'Demorou mais que o normal. Tente de novo.' : (e.message || 'Não deu certo desta vez.');
      render('error');
    } finally { clearInterval(state.timer); clearTimeout(to); state.busy = false; }
  }

  function filename() { const o = state.opts; return ('aluzza-' + o.product.name + '-' + picked().color).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-') + '.jpg'; }
  async function resultBlob() { const r = await fetch(state.result); return await r.blob(); }
  async function save() {
    try { const b = await resultBlob(); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = filename(); document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000); if (state.opts.toast) state.opts.toast('Foto salva.'); } catch (e) { window.open(state.result, '_blank'); }
  }
  async function share() {
    const o = state.opts; const p = picked(); const text = `Olha como ficou o ${o.product.name} ${p.color} da Aluzza em mim 😍 ${p.url || location.href}`;
    try {
      const b = await resultBlob(); const file = new File([b], filename(), { type: b.type || 'image/jpeg' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], text, title: 'Veja em você · Aluzza' }); return; }
    } catch (e) { if (e && e.name === 'AbortError') return; }
    await save();
    window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank');
  }

  window.AluzzaTryon = { init, open() { const m = $('#alz-dialog-tryon'); if (m) { m.classList.add('is-open'); document.body.classList.add('is-locked'); } } };
})();
