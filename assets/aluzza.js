/* Aluzza — tema Shopify · JS do front (sacola AJAX, UI, chat, favoritos, filtros) */
(function () {
  'use strict';
  const C = window.ALZ || {};
  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const store = { get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
  const sess = { get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} } };
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const money = cents => {
    const v = (Number(cents) || 0) / 100; const fmt = C.moneyFormat || 'R$ {{amount_with_comma_separator}}';
    const br = v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const us = v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return fmt.replace(/\{\{\s*amount_with_comma_separator\s*\}\}/, br).replace(/\{\{\s*amount_no_decimals_with_comma_separator\s*\}\}/, Math.round(v).toLocaleString('pt-BR')).replace(/\{\{\s*amount\s*\}\}/, us).replace(/\{\{\s*amount_no_decimals\s*\}\}/, Math.round(v).toLocaleString('en-US'));
  };
  const inst = cents => `${C.installments || 6}x de ${money(cents / (C.installments || 6))} sem juros`;
  const I = {
    heart: '<svg viewBox="0 0 24 24"><path d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 8 3.6 4.6 7 4.6c2 0 3.5 1.1 5 3 1.5-1.9 3-3 5-3 3.4 0 5.6 3.4 4.3 6.7C19.5 15.9 12 20.5 12 20.5z"/></svg>',
    bag: '<svg viewBox="0 0 24 24"><path d="M6 8h12l1 13H5L6 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="m5 12 5 5L20 7"/></svg>',
    arrR: '<svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    flame: '<svg viewBox="0 0 24 24"><path d="M12 3c1 3 4 4.5 4 9a4 4 0 0 1-8 0c0-1.5.5-2.5 1-3 .3 1.2 1 2 2 2 0-3-1-5 1-8z"/></svg>',
    whats: '<svg viewBox="0 0 24 24"><path d="M12 2.2A9.8 9.8 0 0 0 3.6 17l-1.4 5 5.2-1.4A9.8 9.8 0 1 0 12 2.2zm0 17.8a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 20zm4.4-6c-.2-.1-1.4-.7-1.6-.8s-.4-.1-.6.1-.6.8-.8 1-.3.2-.5.1a6.6 6.6 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.7-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 12 12 0 0 0 4.6 4c1.7.7 2.1.6 2.8.6a2.4 2.4 0 0 0 1.6-1.1 2 2 0 0 0 .1-1.1c0-.2-.2-.2-.5-.3z"/></svg>',
    bSpark: '<svg viewBox="0 0 24 24"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/></svg>',
    bStar: '<svg viewBox="0 0 24 24"><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/></svg>',
    bClock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
    bTag: '<svg viewBox="0 0 24 24"><path d="M3.5 12.5 12.5 3.5H20.5v8l-9 9z"/><circle cx="16.5" cy="7.5" r="1.3"/></svg>'
  };
  const HEX = { preto: '#1a1a1a', 'off-white': '#f1ece3', branco: '#ffffff', bege: '#d9c4a6', nude: '#e3c3a8', caramelo: '#b5713a', cafe: '#5a3a26', marrom: '#6b4426', vermelho: '#b3261e', amarelo: '#e9c349', dourado: '#c9a24a', dourada: '#c9a24a', ouro: '#c9a24a', 'ouro-light': '#e0cf9a', prata: '#c0c0c0', rose: '#d9a39a', 'rose-gold': '#d9a39a', fendy: '#8a6a4f', malbec: '#5c1f2b', palha: '#d8c7a0' };
  const imgUrl = (u, w) => { if (!u) return ''; const base = String(u).split('?')[0]; return base.replace(/(\.[a-z]+)$/i, `_${w}x${Math.round(w * 4 / 3)}_crop_center$1`); };

  /* ---------- toast ---------- */
  function toast(html, ms = 2600) {
    let w = $('#toast-wrap'); if (!w) { w = document.createElement('div'); w.className = 'toast-wrap'; w.id = 'toast-wrap'; document.body.appendChild(w); }
    const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = html; w.appendChild(t);
    setTimeout(() => { t.classList.add('is-out'); setTimeout(() => t.remove(), 320); }, ms);
  }

  /* ---------- overlay / drawers / modais ---------- */
  let overlay;
  function ensureOverlay() { if (!overlay) { overlay = document.createElement('div'); overlay.className = 'overlay'; document.body.appendChild(overlay); overlay.addEventListener('click', closeAll); } return overlay; }
  function openDrawer(id) { ensureOverlay().classList.add('is-open'); $(id).classList.add('is-open'); document.body.classList.add('is-locked'); }
  function closeAll() { $$('.drawer.is-open, .search-panel.is-open, .filters.is-open').forEach(d => d.classList.remove('is-open')); overlay && overlay.classList.remove('is-open'); document.body.classList.remove('is-locked'); }
  function openModal(id) { const m = $(id); if (!m) return; m.classList.add('is-open'); document.body.classList.add('is-locked'); }
  function closeModal(m) { if (!m) return; m.classList.remove('is-open'); if (!$('.alz-dialog.is-open')) document.body.classList.remove('is-locked'); }
  document.addEventListener('click', e => {
    const c = e.target.closest('[data-close-alz-dialog]'); if (c) { e.preventDefault(); closeModal(c.closest('.alz-dialog')); }
    if (e.target.classList && e.target.classList.contains('alz-dialog__bg')) closeModal(e.target.closest('.alz-dialog'));
    if (e.target.closest('[data-close-drawer]')) closeAll();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeAll(); $$('.alz-dialog.is-open').forEach(closeModal); } });

  /* ---------- favoritos (handles) ---------- */
  const wish = {
    list: store.get('aluzza_wish', []),
    has(h) { return this.list.includes(h); },
    toggle(h, name) {
      if (this.has(h)) { this.list = this.list.filter(x => x !== h); toast(`${I.check}<span>Removido dos favoritos</span>`); }
      else { this.list.push(h); toast(`${I.check}<span>${esc(name || 'Modelo')} salvo nos favoritos</span><a href="/pages/favoritos">Ver</a>`); }
      store.set('aluzza_wish', this.list); this.paint();
    },
    paint() { const c = $('#wish-count'); if (c) { c.textContent = this.list.length; c.classList.toggle('is-on', this.list.length > 0); } $$('[data-wish]').forEach(b => b.classList.toggle('is-on', this.has(b.dataset.wish))); }
  };
  const seen = { push(h) { let l = store.get('aluzza_seen', []).filter(x => x !== h); l.unshift(h); store.set('aluzza_seen', l.slice(0, 12)); }, list() { return store.get('aluzza_seen', []); } };

  /* ---------- produto (JSON) → card ---------- */
  const splitTitle = t => { const p = String(t || '').split(' – '); return { name: p[0], color: p[1] || '' }; };
  const prodCache = {};
  async function getProduct(h) { if (prodCache[h]) return prodCache[h]; const r = await fetch(`${C.root || '/'}products/${h}.js`.replace('//products', '/products')); if (!r.ok) throw new Error('404'); const j = await r.json(); prodCache[h] = j; return j; }
  function cardHTML(p, o = {}) {
    const t = splitTitle(p.title); const imgs = (p.images || []).map(i => typeof i === 'string' ? i : i.src);
    const variants = p.variants || []; const avail = variants.filter(v => v.available).length;
    const old = p.compare_at_price && p.compare_at_price > p.price ? p.compare_at_price : 0; const pct = old ? Math.round((1 - p.price / old) * 100) : 0;
    const tags = p.tags || [];
    const badges = (old ? `<span class="badge badge--promo">${I.bTag}−${pct}%</span>` : (tags.includes('novo') ? `<span class="badge badge--new">${I.bSpark}Novo</span>` : '')) + (tags.includes('mais-vendido') && !old ? `<span class="badge badge--best">${I.bStar}Mais vendido</span>` : '') + (avail <= 2 ? `<span class="badge badge--low">${I.bClock}Últimas unidades</span>` : '');
    const url = p.url || `/products/${p.handle}`;
    return `<article class="pcard${o.mini ? ' pcard--mini' : ''}" data-handle="${esc(p.handle)}" data-id="${p.id}">
      <div class="pcard__top">
        <a class="pcard__media" href="${url}" aria-label="${esc(p.title)}"><img src="${imgUrl(imgs[0], 720)}" alt="${esc(p.title)}" loading="lazy" width="720" height="960"><img class="alt" src="${imgUrl(imgs[1] || imgs[0], 720)}" alt="" loading="lazy" width="720" height="960"><div class="pcard__badges">${badges}</div></a>
        <button type="button" class="pcard__wish ${wish.has(p.handle) ? 'is-on' : ''}" data-wish="${esc(p.handle)}" aria-label="Favoritar">${I.heart}</button>
        ${o.mini ? '' : `<div class="pcard__quick"><small>Compra rápida · escolha o tamanho</small><div class="pcard__sizes">${variants.map(v => `<button type="button" data-size="${esc(v.title)}" data-variant="${v.id}" ${v.available ? '' : 'disabled'}>${esc(v.title)}</button>`).join('')}</div></div>`}
      </div>
      <div class="pcard__body">
        <div class="pcard__name"><a href="${url}">${esc(t.name)}</a></div>
        <div class="pcard__colors" data-handle="${esc(p.handle)}"><span class="pcard__color-name">${esc(t.color)}</span></div>
        <div class="pcard__price">${old ? `<span class="price--old">${money(old)}</span>` : ''}<span class="price ${old ? 'price--promo' : ''}">${money(p.price)}</span></div>
        ${o.mini ? '' : `<div class="pcard__inst">${inst(p.price)}</div>`}
      </div></article>`;
  }
  // bolinhas de cor (famílias) nos cards já renderizados
  function paintSwatches(root) {
    const F = window.ALZ_FAMILIES || {};
    $$('.pcard__colors[data-handle]', root).forEach(el => {
      if (el.dataset.done) return; el.dataset.done = '1';
      const f = F[el.dataset.handle]; if (!f || f.s.length < 2) return;
      const name = $('.pcard__color-name', el);
      const sw = f.s.slice(0, 5).map(([h, col, hex]) => `<button type="button" class="swatch ${h === el.dataset.handle ? 'is-on' : ''}" style="background:${hex}" data-variant-handle="${h}" title="${esc(col)}" aria-label="Ver na cor ${esc(col)}"></button>`).join('');
      el.insertAdjacentHTML('afterbegin', sw); if (name) name.textContent = `${name.textContent} · ${f.s.length} cores`;
    });
  }
  document.addEventListener('click', async e => {
    const b = e.target.closest('.swatch[data-variant-handle]'); if (!b) return;
    const card = b.closest('.pcard'); const h = b.dataset.variantHandle; if (!card || card.dataset.handle === h) return;
    try { const p = await getProduct(h); const mini = !$('.pcard__quick', card); const tmp = document.createElement('div'); tmp.innerHTML = cardHTML(p, { mini }); const fresh = tmp.firstElementChild; fresh.classList.add('is-swapping'); card.replaceWith(fresh); paintSwatches(fresh.parentElement); fixWidows(fresh); requestAnimationFrame(() => fresh.classList.remove('is-swapping')); } catch (err) { location.href = `/products/${h}`; }
  });
  document.addEventListener('click', e => {
    const w = e.target.closest('[data-wish]'); if (w) { const card = w.closest('.pcard'); const nm = card ? $('.pcard__name', card).textContent : (C.product ? splitTitle(C.product.title).name : ''); wish.toggle(w.dataset.wish, nm); return; }
    const s = e.target.closest('.pcard__sizes button'); if (s && !s.disabled) { cart.add(+s.dataset.variant, 1, s.closest('.pcard')); }
  });

  /* ---------- sacola (Shopify AJAX) ---------- */
  const cart = {
    data: null,
    async fetch() { const r = await fetch('/cart.js', { headers: { Accept: 'application/json' } }); this.data = await r.json(); this.paint(); return this.data; },
    async add(variantId, qty, cardEl) {
      try {
        const r = await fetch('/cart/add.js', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ items: [{ id: variantId, quantity: qty || 1 }] }) });
        const j = await r.json(); if (!r.ok) { toast(`<span>${esc(j.description || j.message || 'Não foi possível adicionar.')}</span>`); return false; }
        const it = j.items ? j.items[0] : j; const t = splitTitle(it.product_title);
        toast(`<img src="${imgUrl(it.image, 120)}" alt=""><div><b style="font-weight:500">${esc(t.name)}${t.color ? ' · ' + esc(t.color) : ''}</b><br><span style="opacity:.8">Tam. ${esc(it.variant_title)} adicionado à sacola</span></div><a href="${C.cartUrl || '/cart'}">Ver sacola</a>`, 3800);
        await this.fetch(); const c = $('#cart-count'); if (c) { c.classList.add('bump'); setTimeout(() => c.classList.remove('bump'), 500); }
        return true;
      } catch (e) { toast('<span>Erro ao adicionar. Tente de novo.</span>'); return false; }
    },
    async change(key, qty) { const r = await fetch('/cart/change.js', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ id: key, quantity: qty }) }); this.data = await r.json(); this.paint(); return this.data; },
    paint() {
      const d = this.data; if (!d) return;
      const c = $('#cart-count'); if (c) { c.textContent = d.item_count; c.classList.toggle('is-on', d.item_count > 0); }
      this.renderMini();
    },
    shipBar() {
      const d = this.data; const s = d.total_price; const free = s >= C.freeShip; const w = Math.min(100, Math.round(s / C.freeShip * 100));
      return `<div class="ship-bar ${free ? 'is-free' : ''}">${free ? `<b>Parabéns!</b> Seu pedido tem frete grátis.` : `Faltam <b>${money(C.freeShip - s)}</b> para ganhar frete grátis`}<div class="ship-bar__track"><div class="ship-bar__fill" style="width:${w}%"></div></div></div>`;
    },
    itemHTML(i) {
      const t = splitTitle(i.product_title);
      return `<div class="cart-item" data-key="${i.key}">
        <a class="cart-item__img" href="${i.url}"><img src="${imgUrl(i.image, 220)}" alt=""></a>
        <div><div class="cart-item__name"><a href="${i.url}">${esc(t.name)}</a></div><div class="cart-item__meta">${esc(t.color)}${t.color ? ' · ' : ''}Tamanho ${esc(i.variant_title)}</div>
        <div class="cart-item__row"><div class="qty"><button type="button" data-qty="-1" aria-label="Menos">−</button><span>${i.quantity}</span><button type="button" data-qty="1" aria-label="Mais">+</button></div><div class="price ${i.original_line_price > i.final_line_price ? 'price--promo' : ''}">${money(i.final_line_price)}</div></div>
        <button type="button" class="cart-item__remove mt-8" data-remove>Remover</button></div></div>`;
    },
    renderMini() {
      const m = $('#mini-cart'), f = $('#mini-cart-foot'); if (!m || !this.data) return; const d = this.data;
      const cc = $('#cart-drawer-count'); if (cc) cc.textContent = d.item_count ? `(${d.item_count})` : '';
      if (!d.items.length) { m.innerHTML = `<div class="cart-empty">${I.bag}<p>Sua sacola está vazia.</p><p class="small">Que tal começar pelos mais vendidos?</p><a class="btn btn--sm mt-16" href="/collections/all">Ver modelos</a></div>`; f.innerHTML = ''; return; }
      m.innerHTML = this.shipBar() + d.items.map(i => this.itemHTML(i)).join('') + `<div class="upsell-mini" id="upsell-mini" hidden><h4>Complete a sacola</h4><div class="upsell-mini__list"></div></div>`;
      f.innerHTML = `<div class="summary-row"><span>Subtotal</span><span class="price">${money(d.items_subtotal_price)}</span></div>${d.total_discount ? `<div class="summary-row" style="color:var(--ok)"><span>Descontos</span><span>− ${money(d.total_discount)}</span></div>` : ''}<div class="summary-row small muted"><span>Frete</span><span>${d.total_price >= C.freeShip ? 'Grátis' : 'calculado no checkout'}</span></div><div class="summary-row summary-row--total"><span>Total</span><span class="price">${money(d.total_price)}</span></div><div class="small muted text-center" style="margin:6px 0 12px">ou ${inst(d.total_price)}</div><a class="btn btn--block btn--lg" href="/checkout">Finalizar compra</a><a class="link small" href="${C.cartUrl || '/cart'}" style="margin:14px auto 0;display:table">Ver sacola completa</a>`;
      this.bind(m);
      // sugestões
      const first = d.items[0];
      fetch(`/recommendations/products.json?product_id=${first.product_id}&limit=6`).then(r => r.json()).then(j => { const list = (j.products || []).filter(p => !d.items.some(i => i.product_id === p.id)).slice(0, 6); const u = $('#upsell-mini'); if (!u || !list.length) return; $('.upsell-mini__list', u).innerHTML = list.map(p => `<a class="upsell-mini__item" href="${p.url}"><img src="${imgUrl(p.featured_image, 160)}" alt=""><p>${esc(splitTitle(p.title).name)}</p><span class="price">${money(p.price)}</span></a>`).join(''); u.hidden = false; }).catch(() => {});
    },
    bind(root) {
      $$('[data-qty]', root).forEach(b => b.addEventListener('click', async () => { const it = b.closest('.cart-item'); const line = this.data.items.find(x => x.key === it.dataset.key); if (!line) return; await this.change(it.dataset.key, Math.max(0, line.quantity + (+b.dataset.qty))); if (document.body.dataset.page === 'cart') location.reload(); }));
      $$('[data-remove]', root).forEach(b => b.addEventListener('click', async () => { const it = b.closest('.cart-item'); await this.change(it.dataset.key, 0); toast(`${I.check}<span>Item removido da sacola</span>`); if (document.body.dataset.page === 'cart') location.reload(); }));
    }
  };

  /* ---------- header ---------- */
  function initHeader() {
    const track = $('#announce-track'); if (track) { let ai = 0; const items = $$('.announce__item', track); if (items.length > 1) setInterval(() => { items[ai].classList.remove('is-on'); ai = (ai + 1) % items.length; items[ai].classList.add('is-on'); }, 4200); }
    $('#open-menu') && $('#open-menu').addEventListener('click', () => openDrawer('#menu-drawer'));
    $('#open-cart') && $('#open-cart').addEventListener('click', () => { cart.fetch(); openDrawer('#cart-drawer'); });
    $('#open-search') && $('#open-search').addEventListener('click', openSearch);
    document.addEventListener('keydown', e => { if (e.key === '/' && !/input|textarea/i.test(document.activeElement.tagName)) { e.preventDefault(); openSearch(); } });
    $$('.mnav [data-sub]').forEach(b => b.addEventListener('click', () => b.parentElement.classList.toggle('is-open')));
    const header = $('#header'); if (header) { const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 10); window.addEventListener('scroll', onScroll, { passive: true }); onScroll(); }
    const mi = $('#mega-img'); if (mi) {
      const im = $('img', mi), cap = $('span', mi); let cur = im.getAttribute('src'), t; const def = [mi.dataset.def, mi.dataset.defcap, mi.getAttribute('href')];
      $$('.mega a[data-img]').forEach(a => { const i = new Image(); i.src = a.dataset.img; });
      const swap = (src, c, href) => { if (!src || src === cur) { if (c) cap.textContent = c; return; } cur = src; clearTimeout(t); mi.classList.add('is-fading'); t = setTimeout(() => { im.src = src; cap.textContent = c; if (href) mi.href = href; im.onload = () => mi.classList.remove('is-fading'); setTimeout(() => mi.classList.remove('is-fading'), 400); }, 160); };
      $$('.mega a[data-img]').forEach(a => a.addEventListener('mouseenter', () => swap(a.dataset.img, a.dataset.cap, a.href)));
      $('.mega').addEventListener('mouseleave', () => swap(def[0], def[1], def[2]));
    }
    initSearch();
  }
  function openSearch() { ensureOverlay().classList.add('is-open'); $('#search-panel').classList.add('is-open'); document.body.classList.add('is-locked'); setTimeout(() => $('#search-input').focus(), 200); }
  function initSearch() {
    const inp = $('#search-input'), res = $('#search-results'); if (!inp) return; let t;
    const run = async () => { const q = inp.value.trim(); if (q.length < 2) { res.innerHTML = ''; return; }
      try { const r = await fetch(`${C.searchUrl || '/search'}/suggest.json?q=${encodeURIComponent(q)}&resources[type]=product&resources[limit]=10&resources[options][unavailable_products]=last`); const j = await r.json(); const list = (j.resources && j.resources.results && j.resources.results.products) || [];
        res.innerHTML = list.length ? list.map(p => { const tt = splitTitle(p.title); return `<article class="pcard pcard--mini" data-handle="${esc(p.handle)}"><div class="pcard__top"><a class="pcard__media" href="${p.url}"><img src="${imgUrl(p.featured_image && p.featured_image.url || p.image, 480)}" alt="${esc(p.title)}" loading="lazy"><img class="alt" src="${imgUrl(p.featured_image && p.featured_image.url || p.image, 480)}" alt=""></a></div><div class="pcard__body"><div class="pcard__name"><a href="${p.url}">${esc(tt.name)}</a></div><div class="pcard__colors"><span class="pcard__color-name">${esc(tt.color)}</span></div><div class="pcard__price"><span class="price">${money(Math.round(parseFloat(p.price) * 100))}</span></div></div></article>`; }).join('') : `<div class="search-empty">Nada encontrado para “${esc(q)}”. Tente “tamanco”, “scarpin preto” ou um tamanho.</div>`;
      } catch (e) { res.innerHTML = ''; } };
    inp.addEventListener('input', () => { clearTimeout(t); t = setTimeout(run, 220); });
    $$('[data-hint]').forEach(b => b.addEventListener('click', () => { inp.value = b.dataset.hint; run(); inp.focus(); }));
  }

  /* ---------- rails / reveal / preloader / hero ---------- */
  function initRails(root) {
    $$('.rail', root).forEach(r => { if (r.dataset.ok) return; r.dataset.ok = '1'; const t = $('.rail__track', r); const nav = r.previousElementSibling && r.previousElementSibling.querySelector('.rail__nav') || r.parentElement.querySelector('.rail__nav'); const prev = nav && $('[data-prev]', nav), next = nav && $('[data-next]', nav); const step = () => t.firstElementChild ? t.firstElementChild.getBoundingClientRect().width + 20 : 300; prev && prev.addEventListener('click', () => t.scrollBy({ left: -step() * 2, behavior: 'smooth' })); next && next.addEventListener('click', () => t.scrollBy({ left: step() * 2, behavior: 'smooth' })); });
  }
  function initReveal() {
    const els = $$('.rv, .rv-stagger'); if (!els.length) return;
    if (reducedMotion || !('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('is-in')); return; }
    const io = new IntersectionObserver(en => en.forEach(x => { if (x.isIntersecting) { x.target.classList.add('is-in'); io.unobserve(x.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    els.forEach(e => io.observe(e));
  }
  function initPreloader() {
    const pl = $('#preloader'); if (!pl) return;
    const logo = $('.header__logo svg'); const paths = logo ? logo.innerHTML : '';
    document.body.classList.add('has-preloader');
    const fast = !!sess.get('aluzza_loaded');
    pl.innerHTML = `<div class="preloader__logo"><svg viewBox="186 433 1019 214"><g class="outline">${paths}</g><g class="fill">${paths}</g></svg></div><div class="preloader__bar"><i></i></div><div class="preloader__num">0%</div><div class="preloader__tag">Calçados feitos em Goiânia · desde 2011</div>`;
    const fill = $('.fill', pl), bar = $('.preloader__bar i', pl), num = $('.preloader__num', pl);
    let p = 0; const dur = fast ? 600 : 1700; const t0 = performance.now();
    const tick = now => { p = Math.min(100, Math.round((now - t0) / dur * 100)); const eased = 100 - Math.pow(1 - p / 100, 2) * 100; fill.style.clipPath = `inset(${100 - eased}% 0 0 0)`; bar.style.transform = `scaleX(${eased / 100})`; num.textContent = Math.round(eased) + '%'; if (p < 100) requestAnimationFrame(tick); else setTimeout(done, 320); };
    const done = () => { pl.classList.add('is-done'); document.body.classList.add('is-ready'); sess.set('aluzza_loaded', '1'); setTimeout(() => pl.remove(), 1000); document.dispatchEvent(new Event('preloader:done')); };
    if (reducedMotion) done(); else requestAnimationFrame(tick);
  }
  function initHero() {
    const hero = $('#hero'); if (!hero) return;
    const slides = $$('.hero__slide', hero), dots = $$('.hero__dot', hero); if (!slides.length) return;
    let i = 0, timer; const durFor = s => $('video', s) ? 22000 : 7000;
    const go = n => { slides[i].classList.remove('is-on'); dots[i] && dots[i].classList.remove('is-on'); const v = $('video', slides[i]); if (v) v.pause(); i = (n + slides.length) % slides.length; slides[i].classList.add('is-on'); if (dots[i]) { dots[i].style.setProperty('--dur', durFor(slides[i]) + 'ms'); dots[i].classList.remove('is-on'); void dots[i].offsetWidth; dots[i].classList.add('is-on'); } const nv = $('video', slides[i]); if (nv) { nv.currentTime = 0; nv.play().catch(() => {}); } clearTimeout(timer); timer = setTimeout(() => go(i + 1), durFor(slides[i])); };
    dots.forEach((d, n) => d.addEventListener('click', () => go(n)));
    $('[data-prev]', hero) && $('[data-prev]', hero).addEventListener('click', () => go(i - 1));
    $('[data-next]', hero) && $('[data-next]', hero).addEventListener('click', () => go(i + 1));
    hero.addEventListener('mouseenter', () => clearTimeout(timer)); hero.addEventListener('mouseleave', () => { clearTimeout(timer); timer = setTimeout(() => go(i + 1), 3000); });
    let x0 = null; hero.addEventListener('touchstart', e => x0 = e.touches[0].clientX, { passive: true }); hero.addEventListener('touchend', e => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 50) go(i + (dx < 0 ? 1 : -1)); x0 = null; });
    const start = () => { slides[i].classList.add('is-on'); if (dots[i]) { dots[i].style.setProperty('--dur', durFor(slides[i]) + 'ms'); dots[i].classList.add('is-on'); } const v = $('video', slides[i]); if (v) { v.muted = true; v.play().catch(() => {}); } timer = setTimeout(() => go(1), durFor(slides[i])); };
    if (document.body.classList.contains('has-preloader') && !document.body.classList.contains('is-ready')) document.addEventListener('preloader:done', start, { once: true }); else start();
  }
  function initCountdown() {
    const c = $('#countdown'); if (!c) return; const cells = $$('b', c);
    let end = Date.parse((c.dataset.end || '').replace(' ', 'T')); if (!end || isNaN(end)) { const k = 'aluzza_promo_end'; end = +store.get(k, 0); if (!end || end < Date.now()) { end = Date.now() + 48 * 36e5; store.set(k, end); } }
    const tick = () => { let d = Math.max(0, end - Date.now()); const h = Math.floor(d / 36e5), m = Math.floor(d % 36e5 / 6e4), s = Math.floor(d % 6e4 / 1e3); [h, m, s].forEach((v, i) => cells[i] && (cells[i].textContent = String(v).padStart(2, '0'))); };
    tick(); setInterval(tick, 1000);
  }
  function initAtelier() {
    const steps = $$('#atelier-steps li'); if (!steps.length) return; let k = 0, run = null; const lbl = $('#atelier-step'), bar = $('#atelier-bar');
    const tick = () => { k = (k + 1) % steps.length; steps.forEach((li, i) => { li.classList.toggle('is-on', i === k); li.classList.toggle('is-done', i < k); }); lbl.textContent = `${String(k + 1).padStart(2, '0')}/${String(steps.length).padStart(2, '0')}`; bar.style.width = ((k + 1) / steps.length * 100) + '%'; };
    new IntersectionObserver(en => en.forEach(e => { if (e.isIntersecting && !run) run = setInterval(tick, 1700); else if (!e.isIntersecting && run) { clearInterval(run); run = null; } }), { threshold: .3 }).observe($('#atelier-steps'));
  }
  function initBycolor() {
    const sw = $('#bycolor-swatches'), media = $('#bycolor-media'); if (!sw || !media) return;
    const pick = function () { const n = +this.dataset.n; $$('button', sw).forEach(x => x.classList.toggle('is-on', x === this)); $$('img', media).forEach((im, k) => im.classList.toggle('is-on', k === n)); $('#bycolor-name').textContent = this.dataset.color; const t = $('#bycolor-tag'); t.href = this.dataset.url; $('#bycolor-tag-color').textContent = this.dataset.color; $('#bycolor-tag-price').textContent = this.dataset.price; };
    $$('button', sw).forEach(b => { b.addEventListener('mouseenter', pick); b.addEventListener('click', pick); });
  }
  async function initRecent() {
    const track = $('[data-recent]'); if (!track) return; const cur = C.product && C.product.handle; const list = seen.list().filter(h => h !== cur).slice(0, 8); if (!list.length) return;
    const ps = (await Promise.all(list.map(h => getProduct(h).catch(() => null)))).filter(Boolean); if (!ps.length) return;
    track.innerHTML = ps.map(p => cardHTML(p)).join(''); paintSwatches(track); fixWidows(track); $('#recent-wrap').hidden = false; initRails();
  }
  async function initRecs() {
    $$('[data-recs]').forEach(async sec => { try { const r = await fetch(`/recommendations/products.json?product_id=${sec.dataset.recs}&limit=${sec.dataset.limit || 8}`); const j = await r.json(); const ps = (j.products || []); if (ps.length >= 3) { const t = $('[data-recs-track]', sec); t.innerHTML = ps.map(p => cardHTML(p)).join(''); paintSwatches(t); fixWidows(t); } } catch (e) {} });
  }

  /* ---------- produto ---------- */
  function initProduct() {
    const pdp = $('#pdp'); if (!pdp) return; const handle = pdp.dataset.handle; seen.push(handle);
    const gm = $('#gallery-main');
    $$('#gallery-thumbs button').forEach(b => b.addEventListener('click', () => { $$('#gallery-thumbs button').forEach(x => x.classList.toggle('is-on', x === b)); $$('img', gm).forEach((im, n) => im.classList.toggle('is-on', n == b.dataset.n)); }));
    gm.addEventListener('mousemove', e => { const r = gm.getBoundingClientRect(); gm.style.setProperty('--zx', ((e.clientX - r.left) / r.width * 100) + '%'); gm.style.setProperty('--zy', ((e.clientY - r.top) / r.height * 100) + '%'); });
    gm.addEventListener('mouseenter', () => gm.classList.add('is-zoom')); gm.addEventListener('mouseleave', () => gm.classList.remove('is-zoom'));
    const gmob = $('#gallery-mobile'); const n = $$('img', gmob).length; gmob.addEventListener('scroll', () => { const k = Math.round(gmob.scrollLeft / (gmob.scrollWidth / n)); $$('#gallery-dots i').forEach((d, i) => d.classList.toggle('is-on', i === k)); }, { passive: true });
    // cores da família
    const F = window.ALZ_FAMILIES || {}; const fam = F[handle]; const cl = $('#p-colors');
    const curT = splitTitle(C.product.title); const curImg = pdp.dataset.pack || ($('#gallery-main img') || {}).src || '';
    const tryonInit = sibs => { if (!window.AluzzaTryon) return; AluzzaTryon.init({ endpoint: C.tryon || '', whats: C.whats, toast: t => toast(`${I.check}<span>${esc(t)}</span>`),
      product: { name: curT.name, color: curT.color, heel: pdp.dataset.heel || '', hex: pdp.dataset.hex || '', images: [curImg] },
      siblings: sibs, onPickSize: () => { const g = $('#p-sizes'); g.scrollIntoView({ behavior: 'smooth', block: 'center' }); g.classList.add('is-pulse'); setTimeout(() => g.classList.remove('is-pulse'), 1600); } }); };
    tryonInit([{ color: curT.color, hex: pdp.dataset.hex || '#999', image: curImg, url: location.href }]);
    if (fam && fam.s.length > 1) { Promise.all(fam.s.map(([h]) => getProduct(h).catch(() => null))).then(ps => { ps = ps.filter(Boolean); cl.innerHTML = ps.map(p => { const t = splitTitle(p.title); return `<a href="${p.url}" class="${p.handle === handle ? 'is-on' : ''}" title="${esc(t.color)}" aria-label="${esc(t.color)}"><img src="${imgUrl(p.images[1] || p.images[0], 160)}" alt=""></a>`; }).join(''); $('#p-color-name').textContent = `${curT.color} · ${fam.s.length} cores`;
      // completa o #MinhaAluzza com fotos de uso das outras cores (Liquid só enxerga 50 produtos)
      const ug = $('.ugc[data-ugc-dyn]'); if (ug && ug.children.length < 6) { const have = new Set([...ug.querySelectorAll('img')].map(i => i.src.split('?')[0].replace(/_\d+x\d+(_crop_center)?/, ''))); ps.filter(p => p.handle !== handle).forEach(p => p.images.slice(1, 3).forEach(src => { const key = src.split('?')[0]; if (ug.children.length < 6 && !have.has(key)) { have.add(key); ug.insertAdjacentHTML('beforeend', `<a href="${ug.dataset.ugcUrl}" target="_blank" rel="noopener"><img src="${imgUrl(src, 500).replace(/_500x\d+_crop_center/, '_500x500_crop_center')}" alt="" loading="lazy">${$('.ugc svg') ? $('.ugc svg').outerHTML : ''}</a>`); } })); }
      tryonInit(ps.map(p => { const t = splitTitle(p.title); const hx = (fam.s.find(x => x[0] === p.handle) || [])[2] || '#999'; return { color: t.color, hex: hx, image: imgUrl(p.images[1] || p.images[0], 1000), image2: imgUrl(p.images[0], 1000), url: location.origin + p.url }; })); }); }
    // tamanhos
    let size = null, variant = null; const sg = $('#p-sizes'), note = $('#size-note');
    sg.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; if (b.disabled) { $('#notify-size').textContent = b.dataset.size; openModal('#alz-dialog-notify'); return; } size = b.dataset.size; variant = +b.dataset.variant; $$('button', sg).forEach(x => x.classList.toggle('is-on', x === b)); const st = +b.dataset.qty; note.className = 'size-note' + (st > 0 && st <= 3 ? ' is-low' : ''); note.innerHTML = st > 0 && st <= 3 ? `${I.flame} Restam só ${st} ${st === 1 ? 'par' : 'pares'} no ${size}` : `Tamanho ${size} selecionado · forma normal, compre a sua numeração habitual`; $('#sticky-size').textContent = `Tam. ${size}`; });
    let qty = 1; const qEl = $('#p-qty span'); $$('#p-qty button').forEach(b => b.addEventListener('click', () => { qty = Math.max(1, Math.min(10, qty + (+b.dataset.qty))); qEl.textContent = qty; }));
    const needSize = () => { if (variant) return true; note.className = 'size-note is-error'; note.textContent = 'Escolha um tamanho para continuar.'; sg.scrollIntoView({ behavior: 'smooth', block: 'center' }); return false; };
    $('#add-cart').addEventListener('click', async () => { if (needSize()) { const b = $('#add-cart'); b.disabled = true; await cart.add(variant, qty); b.disabled = false; } });
    $('#sticky-add').addEventListener('click', () => { if (needSize()) cart.add(variant, qty); });
    $('#buy-now').addEventListener('click', async () => { if (needSize()) { const ok = await cart.add(variant, qty); if (ok) setTimeout(() => location.href = '/checkout', 300); } });
    document.body.classList.add('has-sticky-buy');
    const buyBox = $('#p-buy'); if ('IntersectionObserver' in window) new IntersectionObserver(en => $('#sticky-buy').classList.toggle('is-on', !en[0].isIntersecting && en[0].boundingClientRect.top < 0), { threshold: 0 }).observe(buyBox);
    $('#tryon-btn').addEventListener('click', () => openModal('#alz-dialog-tryon'));
    $('#size-guide-btn').addEventListener('click', () => openModal('#alz-dialog-sizes'));
    $('#notify-form').addEventListener('submit', e => { e.preventDefault(); closeModal($('#alz-dialog-notify')); toast(`${I.check}<span>Pronto! Avisamos você quando o ${$('#notify-size').textContent} voltar.</span>`); });
    const price = () => { const el = $('#p-price .now'); return el ? parseFloat(el.textContent.replace(/[^\d,]/g, '').replace(',', '.')) * 100 : 0; };
    $('#ship-form').addEventListener('submit', e => { e.preventDefault(); const cep = $('#ship-cep').value.replace(/\D/g, ''); if (cep.length !== 8) { $('#ship-result').innerHTML = `<div class="small" style="color:var(--erro)">Digite um CEP válido com 8 números.</div>`; return; } const free = price() * qty >= C.freeShip; const go = cep.startsWith('74') || cep.startsWith('75'); const opts = go ? [['Entrega expressa em Goiânia', 'Até 1 dia útil', free ? 0 : 1290], ['Retire na loja', 'Setor Centro Oeste · pronto em 2h', 0]] : [['PAC', '5 a 8 dias úteis', free ? 0 : 1990], ['SEDEX', '2 a 4 dias úteis', 3490]]; $('#ship-result').innerHTML = `<div class="ship-options">${opts.map(o => `<div class="ship-option"><div><b>${o[0]}</b><small>${o[1]}</small></div><span class="${o[2] ? '' : 'free'}">${o[2] ? money(o[2]) : 'Grátis'}</span></div>`).join('')}</div>`; });
    $('#ship-cep').addEventListener('input', e => { e.target.value = e.target.value.replace(/\D/g, '').replace(/^(\d{5})(\d)/, '$1-$2').slice(0, 9); });
  }

  /* ---------- coleção: filtros por tag, ordenação, ver mais ---------- */
  function initCollection() {
    const plp = $('#plp'); if (!plp) return;
    const base = plp.dataset.base.replace(/\/$/, ''); let tags = plp.dataset.tags ? plp.dataset.tags.split(',').filter(Boolean) : []; const sort = plp.dataset.sort;
    const go = (t, s) => { const u = new URL(location.href); const path = base + (t.length ? '/' + t.join('+') : ''); const sb = s === undefined ? u.searchParams.get('sort_by') : s; location.href = path + (sb && sb !== 'manual' ? `?sort_by=${sb}` : ''); };
    $$('[data-tag]', plp).forEach(el => el.addEventListener(el.tagName === 'INPUT' ? 'change' : 'click', () => { const t = el.dataset.tag; go(tags.includes(t) ? tags.filter(x => x !== t) : [...tags, t]); }));
    $$('[data-sort]', plp).forEach(el => el.addEventListener('change', () => go(tags, el.dataset.sort)));
    $$('[data-remove-tag]').forEach(b => b.addEventListener('click', () => go(tags.filter(x => x !== b.dataset.removeTag))));
    const sel = $('[data-sort-select]'); sel && sel.addEventListener('change', () => go(tags, sel.value));
    $('#open-filters') && $('#open-filters').addEventListener('click', () => { ensureOverlay().classList.add('is-open'); $('#filters').classList.add('is-open'); document.body.classList.add('is-locked'); });
    const lm = $('#load-more'); if (lm) lm.addEventListener('click', async e => { e.preventDefault(); lm.textContent = 'Carregando…'; try { const r = await fetch(lm.href); const html = await r.text(); const doc = new DOMParser().parseFromString(html, 'text/html'); const grid = $('#plp-grid'); $$('#plp-grid > *', doc).forEach(c => grid.appendChild(c)); paintSwatches(grid); fixWidows(grid); wish.paint(); const next = $('#load-more', doc); const txt = $('#lm-text', doc), bar = $('#lm-bar', doc); if (txt) $('#lm-text').textContent = txt.textContent; if (bar) $('#lm-bar').style.width = bar.style.width; if (next) { lm.href = next.href; lm.textContent = 'Ver mais modelos'; } else lm.remove(); } catch (err) { location.href = lm.href; } });
    // cores dos filtros
    $$('.colors-filter i[data-color]').forEach(i => { const k = i.dataset.color.replace('cor-', ''); i.style.background = HEX[k] || '#cbbba8'; });
  }

  /* ---------- sacola (página) ---------- */
  function initCartPage() {
    if (document.body.dataset.page !== 'cart') return;
    cart.fetch().then(() => { const sb = $('[data-shipbar]'); if (sb && cart.data) sb.outerHTML = cart.shipBar(); });
    cart.bind($('#cart-list'));
    const f = $('#coupon-form'); if (f) f.addEventListener('submit', e => { e.preventDefault(); const code = $('#coupon-input').value.trim().toUpperCase(); if (!code) return; $('#coupon-msg').textContent = 'Aplicando cupom…'; location.href = `/discount/${encodeURIComponent(code)}?redirect=${encodeURIComponent(C.cartUrl || '/cart')}`; });
  }

  /* ---------- favoritos (página) ---------- */
  async function initWishPage() {
    const g = $('[data-wish-grid]'); if (!g) return; const list = wish.list; const t = $('#wish-count-title');
    if (!list.length) { if (t) t.textContent = 'Nenhum modelo salvo ainda.'; return; }
    const ps = (await Promise.all(list.map(h => getProduct(h).catch(() => null)))).filter(Boolean);
    if (t) t.textContent = `${ps.length} ${ps.length === 1 ? 'modelo salvo' : 'modelos salvos'}`;
    g.innerHTML = ps.map(p => cardHTML(p)).join(''); paintSwatches(g); fixWidows(g); wish.paint();
  }

  /* ---------- mini-chat WhatsApp ---------- */
  function initWhatsChat() {
    const root = $('#wchat'); if (!root) return;
    const body = $('#wchat-body'), quick = $('#wchat-quick'), form = $('#wchat-form'), input = $('#wchat-input'), badge = $('#wchat-badge'), status = $('#wchat-status');
    const prod = C.product ? splitTitle(C.product.title) : null; const agent = (status.previousElementSibling && status.previousElementSibling.textContent.split(' · ')[0]) || 'Lívia';
    const now = () => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); const scroll = () => { body.scrollTop = body.scrollHeight; };
    const bubble = (text, who) => { const d = document.createElement('div'); d.className = 'wchat__msg wchat__msg--' + who; d.innerHTML = `<p>${text}</p><time>${now()}${who === 'me' ? ' ✓✓' : ''}</time>`; body.appendChild(d); scroll(); return d; };
    const typing = ms => new Promise(r => { const t = document.createElement('div'); t.className = 'wchat__msg wchat__msg--agent wchat__typing'; t.innerHTML = '<i></i><i></i><i></i>'; body.appendChild(t); status.textContent = 'digitando…'; scroll(); setTimeout(() => { t.remove(); status.textContent = 'online agora'; r(); }, ms); });
    const waLink = msg => `https://wa.me/${C.whats}?text=${encodeURIComponent(msg)}`;
    let started = false, open = false;
    const hello = prod ? `Oi! Eu sou a ${agent}, do atendimento da Aluzza 😊 Vi que você está olhando o <b>${esc(prod.name)} ${esc(prod.color)}</b>.` : `Oi! Eu sou a ${agent}, do atendimento da Aluzza 😊`;
    const chips = [prod ? 'Qual tamanho eu peço?' : 'Dúvida de tamanho', 'Status do meu pedido', 'Troca ou devolução', prod ? 'Tem em outra cor?' : 'Quero ajuda para escolher'];
    async function start() { started = true; await typing(1200); bubble(hello, 'agent'); await typing(1600); bubble('Posso te ajudar com tamanho, pedido ou a escolher um modelo. Me conta o que você precisa e eu continuo com você pelo WhatsApp, tá?', 'agent'); quick.innerHTML = chips.map(c => `<button type="button">${c}</button>`).join(''); $$('button', quick).forEach(b => b.addEventListener('click', () => send(b.textContent))); }
    async function send(text) { text = (text || '').trim(); if (!text) return; quick.innerHTML = ''; bubble(esc(text), 'me'); input.value = ''; const ctx = prod ? ` Estou vendo o ${prod.name} ${prod.color}.` : ''; const msg = `Oi, ${agent}! Vim pelo site da Aluzza.${ctx} ${text}`; await typing(1400); const d = bubble(`Perfeito! Já estou com a sua conversa aqui. Toque no botão abaixo para continuar comigo no WhatsApp, respondo em instantes.`, 'agent'); const a = document.createElement('a'); a.className = 'wchat__cta'; a.href = waLink(msg); a.target = '_blank'; a.rel = 'noopener'; a.innerHTML = `${I.whats} Continuar no WhatsApp`; d.appendChild(a); scroll(); }
    const toggle = o => { open = o; root.classList.toggle('is-open', o); badge.hidden = true; if (o) { if (!started) start(); setTimeout(() => input.focus(), 400); } };
    $('#wchat-toggle').addEventListener('click', () => toggle(!open)); $('#wchat-close').addEventListener('click', () => toggle(false));
    form.addEventListener('submit', e => { e.preventDefault(); if (!started) start().then(() => send(input.value)); else send(input.value); });
    if (!sess.get('aluzza_wchat_nudge')) setTimeout(() => { if (!open) { badge.hidden = false; root.classList.add('is-nudge'); sess.set('aluzza_wchat_nudge', '1'); } }, 9000);
  }

  /* ---------- popup do cupom ---------- */
  function initPopup() {
    const m = $('#alz-cupom-news'); if (!m) return; const pg = document.body.dataset.page;
    if (!sess.get('aluzza_cupom') && !store.get('aluzza_news') && pg !== 'cart' && !/customers/.test(pg || '')) setTimeout(() => { if (!$('.alz-dialog.is-open') && !$('.drawer.is-open')) { openModal('#alz-cupom-news'); sess.set('aluzza_cupom', '1'); } }, 14000);
    const f = $('#alz-cupom-form'); if (f) f.addEventListener('submit', async e => { e.preventDefault(); try { await fetch(f.action, { method: 'POST', body: new FormData(f) }); } catch (err) {} store.set('aluzza_news', true); f.hidden = true; $('.alz-cupom__code').hidden = false; toast(`${I.check}<span>Cupom ${C.coupon} liberado. Use no carrinho.</span>`); });
  }

  /* ---------- tipografia: sem viúvas ---------- */
  const WIDOW_SEL = 'h1,h2,h3,h4,p,li,dd,small,figcaption,label,.lead,.pcard__name,.story__points span,.trust__item span,.wchat__msg,.hero p';
  function fixWidows(root) {
    const els = root && root.matches && root.matches(WIDOW_SEL) ? [root] : []; els.push(...((root || document).querySelectorAll ? (root || document).querySelectorAll(WIDOW_SEL) : []));
    els.forEach(el => { if (el.dataset.widowed || el.closest('.sr-only, select, textarea, code, pre, script')) return; let t = el.lastChild; while (t && t.nodeType !== 3 && t.previousSibling) t = t.previousSibling; if (!t || t.nodeType !== 3) return; const txt = t.nodeValue; if (txt.trim().split(/\s+/).length < 3) return; const tail = (txt.match(/\s+$/) || [''])[0]; t.nodeValue = txt.replace(/\s+(\S+)\s+(\S+)\s*$/, ' $1 $2' + tail); el.dataset.widowed = '1'; });
  }

  /* ---------- ajuda: rastreio demo ---------- */
  function initHelp() { const f = $('#track-form'); if (f) f.addEventListener('submit', e => { e.preventDefault(); const r = $('#track-result'); if (r) r.hidden = false; }); $$('.select select').forEach(sel => { const lab = sel.nextElementSibling; const sync = () => { if (lab && lab.tagName === 'SPAN' && sel.selectedIndex >= 0) lab.textContent = sel.options[sel.selectedIndex].text; }; sel.addEventListener('change', sync); if (sel.id !== 'sort') sync(); }); }

  /* ---------- boot ---------- */
  document.addEventListener('DOMContentLoaded', () => {
    initHeader(); initPreloader(); initHero(); initReveal(); initRails(); initCountdown(); initAtelier(); initBycolor();
    initProduct(); initCollection(); initCartPage(); initWishPage(); initRecent(); initRecs(); initWhatsChat(); initPopup(); initHelp();
    paintSwatches(document); wish.paint(); cart.fetch().catch(() => {});
    const pg = $('.page'); if (!$('#preloader') && pg) { pg.classList.add('page-fade'); pg.addEventListener('animationend', () => pg.classList.remove('page-fade'), { once: true }); }
    fixWidows(document); setTimeout(() => fixWidows(document), 1200);
    new MutationObserver(muts => muts.forEach(m => m.addedNodes.forEach(n => { if (n.nodeType === 1) { fixWidows(n); paintSwatches(n); } }))).observe(document.body, { childList: true, subtree: true });
    // theme editor: re-inicializa rails/reveal ao recarregar seção
    document.addEventListener('shopify:section:load', e => { initRails(e.target); initReveal(); paintSwatches(e.target); fixWidows(e.target); });
  });
  window.Aluzza = { cart, wish, toast, openModal, cardHTML, money };
})();
