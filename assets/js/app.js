/* ==========================================================================
   ALUZZA — app.js
   Front-end completo (sem back-end). Tudo que é "dado" vem de catalog.js e do
   localStorage. Pontos de integração estão marcados com  // API:
   ========================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------------------ config */
  const CFG = {
    FREE_SHIP: 299,            // frete grátis a partir de
    INSTALLMENTS: 6,           // parcelas sem juros
    PIX_OFF: 0.05,             // desconto no Pix
    FIRST_COUPON: 'BEMVINDA10',
    COUPONS: {
      BEMVINDA10: { type: 'pct', value: 10, label: '10% off na primeira compra' },
      ALUZZA15:   { type: 'pct', value: 15, min: 250, label: '15% off acima de R$ 250' },
      FRETEGRATIS:{ type: 'ship', label: 'Frete grátis' },
      SEMANA20:   { type: 'pct', value: 20, min: 300, label: 'Semana Aluzza: 20% off' }
    },
    WHATS: '5562992306476',
    WHATS_TXT: 'Oi, Aluzza! Vim pelo site e quero ajuda para escolher um modelo.',
    PROMO_END: Date.now() + 1000 * 60 * 60 * 51 + 1000 * 60 * 22, // contador da Semana Aluzza (demo)
    SIZES: ['34', '35', '36', '37', '38', '39']
  };

  const P = window.ALUZZA_CATALOG || [];
  const byId = Object.fromEntries(P.map(p => [p.id, p]));
  // categorias/subcategorias realmente presentes no catálogo (a navegação se adapta ao que existe)
  const hasCat = c => P.some(p => p.cat === c);
  const hasSub = s => P.some(p => p.sub === s);
  const EXTRA_CATS = ['sapatilhas', 'rasteiras', 'tenis'].filter(hasCat);
  const bySlug = Object.fromEntries(P.map(p => [p.slug, p]));

  /* ------------------------------------------------------------------ utils */
  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const money = v => 'R$ ' + (Math.round(v * 100) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const inst = v => `${CFG.INSTALLMENTS}x de ${money(v / CFG.INSTALLMENTS)} sem juros`;
  const pct = p => p.old ? Math.round((1 - p.price / p.old) * 100) : 0;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const qs = () => { const o = {}; new URLSearchParams(location.search).forEach((v, k) => o[k] = v); if (location.hash.length > 1) new URLSearchParams(location.hash.slice(1)).forEach((v, k) => { if (!(k in o)) o[k] = v; }); return o; };
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
    del(k) { try { localStorage.removeItem(k); } catch (e) {} }
  };
  const sess = {
    get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }
  };
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const url = {
    product: p => `produto.html?p=${p.slug}`,
    cat: (c, s) => `categoria.html?c=${c}${s ? '&s=' + s : ''}`
  };
  const CAT_NAMES = { saltos: 'Saltos', sapatilhas: 'Sapatilhas', rasteiras: 'Rasteiras & Papetes', tenis: 'Tênis', promocao: 'Promoção', novidades: 'Novidades', todos: 'Todos os modelos' };
  const SUB_NAMES = { scarpins: 'Scarpins', sandalias: 'Sandálias', anabelas: 'Anabelas', tamancos: 'Tamancos', sapatilhas: 'Sapatilhas', rasteiras: 'Rasteiras', papetes: 'Papetes', tenis: 'Tênis' };

  /* ------------------------------------------------------------------ ícones */
  const I = {
    search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    user: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/></svg>',
    heart: '<svg viewBox="0 0 24 24"><path d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 8 3.6 4.6 7 4.6c2 0 3.5 1.1 5 3 1.5-1.9 3-3 5-3 3.4 0 5.6 3.4 4.3 6.7C19.5 15.9 12 20.5 12 20.5z"/></svg>',
    bag: '<svg viewBox="0 0 24 24"><path d="M6 8h12l1 13H5L6 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
    menu: '<svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    close: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    chevD: '<svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>',
    arrR: '<svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    arrL: '<svg viewBox="0 0 24 24"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="m5 12 5 5L20 7"/></svg>',
    plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
    truck: '<svg viewBox="0 0 24 24"><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="1.6"/><circle cx="17" cy="18" r="1.6"/></svg>',
    swap: '<svg viewBox="0 0 24 24"><path d="M4 8h13l-3-3M20 16H7l3 3"/></svg>',
    shield: '<svg viewBox="0 0 24 24"><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3z"/><path d="m9 12 2 2 4-4"/></svg>',
    lock: '<svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="1.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
    hand: '<svg viewBox="0 0 24 24"><path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V12M11 11V4.5a1.5 1.5 0 0 1 3 0V12M14 11.5V6a1.5 1.5 0 0 1 3 0v8c0 3.5-2.5 6-6 6-2.5 0-4.3-1-5.6-3L4 13.2a1.4 1.4 0 0 1 2.3-1.6L8 13.5"/></svg>',
    card: '<svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18M7 14h4"/></svg>',
    pix: '<svg viewBox="0 0 24 24"><path d="m12 3 4.5 4.5L12 12 7.5 7.5zM12 12l4.5 4.5L12 21l-4.5-4.5zM7.5 7.5 3 12l4.5 4.5M16.5 7.5 21 12l-4.5 4.5"/></svg>',
    barcode: '<svg viewBox="0 0 24 24"><path d="M4 6v12M8 6v12M11 6v12M14 6v12M18 6v12M20 6v12"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="m12 2.8 2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4L2.8 9.5l6.4-.8z"/></svg>',
    camera: '<svg viewBox="0 0 24 24"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
    ruler: '<svg viewBox="0 0 24 24"><path d="m3 17 14-14 4 4L7 21zM9 11l2 2M12 8l2 2M15 5l2 2M6 14l2 2"/></svg>',
    eye: '<svg viewBox="0 0 24 24"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    flame: '<svg viewBox="0 0 24 24"><path d="M12 3c1 3 4 4.5 4 9a4 4 0 0 1-8 0c0-1.5.5-2.5 1-3 .3 1.2 1 2 2 2 0-3-1-5 1-8z"/></svg>',
    pin: '<svg viewBox="0 0 24 24"><path d="M12 21s-6-5.5-6-11a6 6 0 0 1 12 0c0 5.5-6 11-6 11z"/><circle cx="12" cy="10" r="2.3"/></svg>',
    phone: '<svg viewBox="0 0 24 24"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg>',
    mail: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
    clock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    box: '<svg viewBox="0 0 24 24"><path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/></svg>',
    gift: '<svg viewBox="0 0 24 24"><rect x="3" y="9" width="18" height="12"/><path d="M3 13h18M12 9v12M12 9c-3 0-5-1.5-5-3.5S9 3 10 4.5 12 9 12 9zm0 0c3 0 5-1.5 5-3.5S15 3 14 4.5 12 9 12 9z"/></svg>',
    spark: '<svg viewBox="0 0 24 24"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/></svg>',
    instagram: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8" fill="currentColor"/></svg>',
    facebook: '<svg viewBox="0 0 24 24"><path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8z"/></svg>',
    tiktok: '<svg viewBox="0 0 24 24"><path d="M14 4v10.5a3.5 3.5 0 1 1-3.5-3.5M14 4a5 5 0 0 0 5 5"/></svg>',
    whats: '<svg viewBox="0 0 24 24"><path d="M12 2.2A9.8 9.8 0 0 0 3.6 17l-1.4 5 5.2-1.4A9.8 9.8 0 1 0 12 2.2zm0 17.8a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 20zm4.4-6c-.2-.1-1.4-.7-1.6-.8s-.4-.1-.6.1-.6.8-.8 1-.3.2-.5.1a6.6 6.6 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.7-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 12 12 0 0 0 4.6 4c1.7.7 2.1.6 2.8.6a2.4 2.4 0 0 0 1.6-1.1 2 2 0 0 0 .1-1.1c0-.2-.2-.2-.5-.3z"/></svg>',
    trash: '<svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14"/></svg>',
    filter: '<svg viewBox="0 0 24 24"><path d="M4 6h16M7 12h10M10 18h4"/></svg>',
    orders: '<svg viewBox="0 0 24 24"><path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h6M9 17h6"/></svg>',
    home: '<svg viewBox="0 0 24 24"><path d="m3 11 9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/></svg>',
    logout: '<svg viewBox="0 0 24 24"><path d="M10 4H5v16h5M14 8l4 4-4 4M18 12H9"/></svg>',
    zoom: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5M8 11h6M11 8v6"/></svg>',
    info: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 10v6M12 7v.5"/></svg>',
    foot: '<svg viewBox="0 0 24 24"><path d="M9 3c-2.5 0-4 2.5-4 6 0 3 1 4.5 1 7 0 2 1.5 4 3.5 4s3-1.5 3-3.5c0-2-1-3.5-1-6 0-3.5 0-7.5-2.5-7.5z"/><circle cx="15.5" cy="5" r="1.2"/><circle cx="17.5" cy="8" r="1"/><circle cx="18.5" cy="11.5" r=".9"/></svg>'
  };
  const stars = (r, n) => `<span class="stars" aria-label="${r} de 5">${I.star.repeat(5)}</span>${n != null ? `<span>${r.toFixed(1)} (${n})</span>` : ''}`;

  /* ------------------------------------------------------------------ logo */
  const LOGO_PATHS = `<path d="M412.832 213.137C414.512 214.576 423.967 237.122 425.597 240.84L447.074 289.857C443.144 290.115 438.602 290.01 434.662 289.98C431.98 283.243 429.05 276.637 426.39 269.942C422.032 269.842 417.672 269.832 413.314 269.912L393.069 269.835C390.289 276.21 387.652 283.99 384.499 290.07C382.582 289.96 380.419 289.985 378.484 289.963C382.439 281.583 386.367 272.107 390.06 263.59L402.072 236.371C403.69 232.672 410.707 215.469 412.832 213.137ZM409.471 229.611C408.186 233.597 405.606 239.422 403.953 243.405L394.828 265.425C399.183 265.085 405.793 265.292 410.311 265.3C415.008 265.305 419.746 265.265 424.434 265.49C423.029 261.923 410.642 230.525 409.471 229.611Z" fill-rule="evenodd"/><path d="M85.8184 213.586C87.0814 215.033 93.4622 230.211 94.7314 233.136L110.539 269.232C113.331 275.612 116.679 283.868 119.708 289.968C115.561 290.015 111.414 290.022 107.267 289.992C104.753 284.197 100.979 275.56 98.834 269.772C94.8758 270.035 89.9078 269.91 85.873 269.915C79.1338 269.953 72.2502 269.728 65.542 269.905C62.7755 275.835 59.9149 283.72 57.2949 289.99C55.2164 290.018 53.1373 290.027 51.0586 290.022C59.0091 271.1 67.8206 252.105 75.9473 233.212C77.501 229.6 83.2162 215.968 85.0449 213.362L85.8184 213.586ZM82.1533 229.627C77.1467 241.525 72.2321 253.463 67.4102 265.438C71.3414 265.058 78.2391 265.347 82.4531 265.312C87.1883 265.338 92.1948 265.285 96.9072 265.465C95.7738 262.532 82.9493 230.179 82.1533 229.627Z" fill-rule="evenodd"/><path d="M321.603 215.485C326.91 215.712 333.745 215.508 339.142 215.497C351.075 215.459 363.005 215.492 374.938 215.598C370.44 223.315 364.58 231.91 359.663 239.568L330.245 285.38C340.365 284.368 350.655 284.02 360.795 283.078C363.967 282.785 367.275 282.55 370.46 282.45C370.72 284.855 371.085 287.067 371.48 289.445C371.443 289.62 371.335 289.77 371.255 289.93C362.04 290.325 350.947 289.955 341.517 290.013C333.777 290.06 322.163 290.38 314.878 289.772C318.823 282.53 326.095 271.727 330.658 264.65C339.932 250.28 349.113 235.846 358.195 221.354C355.02 220.848 350.955 220.02 347.805 220.045C339.492 220.111 330.905 222.353 322.622 223.12C322.5 220.958 321.97 217.58 321.603 215.485Z"/><path d="M257.435 215.584C263.07 215.754 270.19 215.51 275.983 215.496L310.427 215.541C309.098 218.566 306.878 221.777 305.065 224.595L296.04 238.504L265.95 285.413C269.65 284.795 276.982 284.542 280.955 284.27L306.158 282.342C306.435 284.64 306.822 287.108 307.147 289.413L307.155 289.585L306.862 289.905C304.727 290.125 301.598 289.992 299.375 289.992L285.302 290.008C274.937 290.018 260.603 290.442 250.57 289.835C253.573 284.822 256.675 279.865 259.855 274.962C271.33 257.29 282.312 239.221 293.875 221.617C282.185 217.946 270.383 221.796 258.283 223.104C258.137 220.827 257.71 217.898 257.435 215.584Z"/><path d="M183.923 215.485C187.78 215.527 191.637 215.527 195.493 215.482L195.457 251.417C195.465 260.187 193.961 275.227 200.838 281.61C207.646 287.925 223.639 287.85 230.189 281.115C237.656 273.437 235.982 258.317 235.981 248.221L235.957 215.489L240.921 215.492L240.959 220.303L240.951 250.415C240.956 257.595 241.406 266.313 239.9 273.2C236.224 288.865 220.893 292.668 207.031 291.165C182.626 288.52 183.709 268.925 183.954 249.832C184.097 238.692 184.069 226.652 183.923 215.485Z"/><path d="M130.808 215.488L141.803 215.512C142.259 238.135 141.297 261.582 141.969 283.985C144.738 284.68 148.698 285.757 151.504 285.617C158.598 285.265 166.099 283.58 173.122 282.457L172.575 286.39L171.897 290.08C158.341 289.845 144.357 290.002 130.768 289.995C131.076 265.36 130.807 240.163 130.808 215.488Z"/>`;
  const LOGO = `<svg viewBox="48 210 402 84" fill="currentColor" aria-label="Aluzza" role="img">${LOGO_PATHS}</svg>`;
  window.ALUZZA_LOGO = LOGO;

  /* ------------------------------------------------------------------ estado */
  const cart = {
    items: store.get('aluzza_cart', []),
    coupon: store.get('aluzza_coupon', null),
    save() { store.set('aluzza_cart', this.items); store.set('aluzza_coupon', this.coupon); renderCartBadge(); renderMiniCart(); },
    add(id, size, qty = 1) {
      const p = byId[id]; if (!p) return;
      const k = this.items.find(i => i.id === id && i.size === size);
      if (k) k.qty = Math.min(k.qty + qty, 10); else this.items.push({ id, size, qty });
      this.save();
      toast(`<img src="${mainImg(p)}" alt=""><div><b style="font-weight:500">${esc(p.name)} · ${esc(p.color)}</b><br><span style="opacity:.8">Tam. ${size} adicionado à sacola</span></div><a href="carrinho.html">Ver sacola</a>`, 3800);
      $('#cart-count') && $('#cart-count').classList.add('bump');
      setTimeout(() => $('#cart-count') && $('#cart-count').classList.remove('bump'), 500);
    },
    remove(id, size) { this.items = this.items.filter(i => !(i.id === id && i.size === size)); this.save(); },
    setQty(id, size, q) { const k = this.items.find(i => i.id === id && i.size === size); if (!k) return; k.qty = Math.max(1, Math.min(10, q)); this.save(); },
    clear() { this.items = []; this.coupon = null; this.save(); },
    count() { return this.items.reduce((a, i) => a + i.qty, 0); },
    subtotal() { return this.items.reduce((a, i) => a + (byId[i.id] ? byId[i.id].price * i.qty : 0), 0); },
    discount() {
      const c = this.coupon && CFG.COUPONS[this.coupon]; if (!c) return 0;
      const s = this.subtotal(); if (c.min && s < c.min) return 0;
      return c.type === 'pct' ? s * c.value / 100 : 0;
    },
    shipFree() { const c = this.coupon && CFG.COUPONS[this.coupon]; return this.subtotal() - this.discount() >= CFG.FREE_SHIP || (c && c.type === 'ship'); },
    total(ship = 0) { return this.subtotal() - this.discount() + (this.shipFree() ? 0 : ship); },
    applyCoupon(code) {
      code = (code || '').trim().toUpperCase();
      const c = CFG.COUPONS[code];
      if (!c) return { ok: false, msg: 'Cupom não encontrado. Confira o código e tente de novo.' };
      if (c.min && this.subtotal() < c.min) return { ok: false, msg: `Esse cupom vale para compras a partir de ${money(c.min)}.` };
      this.coupon = code; this.save();
      return { ok: true, msg: `Cupom aplicado: ${c.label}.` };
    }
  };
  const wish = {
    ids: store.get('aluzza_wish', []),
    has(id) { return this.ids.includes(id); },
    toggle(id) {
      const p = byId[id];
      if (this.has(id)) { this.ids = this.ids.filter(i => i !== id); toast(`${I.check}<span>Removido dos favoritos</span>`); }
      else { this.ids.push(id); toast(`${I.check}<span>${esc(p.name)} salvo nos favoritos</span><a href="favoritos.html">Ver</a>`); }
      store.set('aluzza_wish', this.ids); renderWishBadge();
      $$(`.pcard__wish[data-id="${id}"], .pdp-wish[data-id="${id}"]`).forEach(b => b.classList.toggle('is-on', this.has(id)));
    }
  };
  const user = {
    get() { return store.get('aluzza_user', null); },
    set(u) { store.set('aluzza_user', u); },
    out() { store.del('aluzza_user'); }
  };
  const seen = {
    push(id) { let l = store.get('aluzza_seen', []).filter(i => i !== id); l.unshift(id); store.set('aluzza_seen', l.slice(0, 12)); },
    list() { return store.get('aluzza_seen', []).map(i => byId[i]).filter(Boolean); }
  };

  /* ------------------------------------------------------------------ toast */
  function toast(html, ms = 2600) {
    let w = $('.toast-wrap'); if (!w) { w = document.createElement('div'); w.className = 'toast-wrap'; document.body.appendChild(w); }
    const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = html; w.appendChild(t);
    setTimeout(() => { t.classList.add('is-out'); setTimeout(() => t.remove(), 320); }, ms);
  }

  /* ------------------------------------------------------------------ overlay/drawers/modals */
  let overlay;
  function ensureOverlay() { if (!overlay) { overlay = document.createElement('div'); overlay.className = 'overlay'; document.body.appendChild(overlay); overlay.addEventListener('click', closeAll); } return overlay; }
  function openDrawer(id) { ensureOverlay().classList.add('is-open'); $(id).classList.add('is-open'); document.body.classList.add('is-locked'); }
  function closeAll() {
    $$('.drawer.is-open, .search-panel.is-open, .filters.is-open').forEach(d => d.classList.remove('is-open'));
    overlay && overlay.classList.remove('is-open');
    document.body.classList.remove('is-locked');
  }
  function openModal(id) { const m = $(id); if (!m) return; m.classList.add('is-open'); document.body.classList.add('is-locked'); }
  function closeModal(m) { m.classList.remove('is-open'); if (!$('.modal.is-open')) document.body.classList.remove('is-locked'); }
  document.addEventListener('click', e => {
    const c = e.target.closest('[data-close-modal]'); if (c) closeModal(c.closest('.modal'));
    if (e.target.classList.contains('modal__bg')) closeModal(e.target.closest('.modal'));
    if (e.target.closest('[data-close-drawer]')) closeAll();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeAll(); $$('.modal.is-open').forEach(closeModal); } });

  /* ------------------------------------------------------------------ header / footer */
  function renderHeader() {
    const mount = $('#site-header'); if (!mount) return;
    const u = user.get();
    const subs = [['scarpins', 'Scarpins'], ['sandalias', 'Sandálias'], ['anabelas', 'Anabelas'], ['tamancos', 'Tamancos']].filter(x => hasSub(x[0]));
    // imagens do mega menu (trocam conforme o hover nos links)
    const MEGA_IMGS = {
      def: ['assets/img/products/p2046-1.webp', 'Novo: Anabela Elisa'],
      sub: { scarpins: ['assets/img/products/p2047-1.webp', 'Scarpin Paola'], sandalias: ['assets/img/products/p2049-1.webp', 'Sandália Lauren'], anabelas: ['assets/img/products/p2046-1.webp', 'Anabela Elisa'], tamancos: ['assets/img/products/p1972-2.webp', 'Tamanco Marina'] },
      h: { baixo: ['assets/img/products/p2012-3.webp', 'Salto baixo · Tamanco Dulce'], medio: ['assets/img/products/p2079-2.webp', 'Salto médio · Tamanco Aline'], alto: ['assets/img/products/p2054-2.webp', 'Salto alto · Tamanco Zara'], plataforma: ['assets/img/products/p2046-3.webp', 'Plataforma · Anabela Elisa'] }
    };
    // quando poucas categorias extras existem, os modelos de salto sobem para o menu principal
    const topSubs = EXTRA_CATS.length < 2 ? subs.filter(x => ['tamancos', 'anabelas'].includes(x[0])) : [];
    const page = document.body.dataset.page; const q = qs();
    const act = (c) => (page === 'categoria' && q.c === c) ? ' is-active' : '';
    mount.innerHTML = `
    <div class="announce" id="announce">
      <div class="container">
        <div class="announce__track" id="announce-track"></div>
        <div class="announce__side">
          <a href="ajuda.html#rastreio">Rastrear pedido</a>
          <a href="ajuda.html">Ajuda</a>
          <a href="contato.html">Lojas e contato</a>
        </div>
      </div>
    </div>
    <header class="header" id="header">
      <div class="container header__row">
        <button class="icon-btn header__burger" id="open-menu" aria-label="Abrir menu">${I.menu}</button>
        <a class="header__logo" href="index.html" aria-label="Aluzza, página inicial">${LOGO}</a>
        <nav aria-label="Principal"><ul class="nav">
          <li><a class="nav__link${page === 'categoria' && q.c === 'novidades' ? ' is-active' : ''}" href="${url.cat('novidades')}">Novidades</a></li>
          <li><a class="nav__link${act('saltos')}" href="${url.cat('saltos')}">Saltos ${I.chevD}</a>
            <div class="mega">
              <div><h4>Por modelo</h4><ul>${subs.map(s => `<li><a href="${url.cat('saltos', s[0])}" data-img="${MEGA_IMGS.sub[s[0]][0]}" data-cap="${MEGA_IMGS.sub[s[0]][1]}">${s[1]}</a></li>`).join('')}<li><a href="${url.cat('saltos')}">Ver todos os saltos</a></li></ul></div>
              <div><h4>Por altura</h4><ul>${[['baixo', 'Salto baixo (até 5 cm)'], ['medio', 'Salto médio (6 a 8 cm)'], ['alto', 'Salto alto (9 cm ou mais)'], ['plataforma', 'Plataforma e anabela']].map(h => `<li><a href="${url.cat('saltos')}&h=${h[0]}" data-img="${MEGA_IMGS.h[h[0]][0]}" data-cap="${MEGA_IMGS.h[h[0]][1]}">${h[1]}</a></li>`).join('')}</ul></div>
              <a class="mega__img" href="${url.product(byId[2046])}" id="mega-img"><img src="${MEGA_IMGS.def[0]}" alt=""><span>${MEGA_IMGS.def[1]}</span></a>
            </div>
          </li>
          ${topSubs.map(x => `<li><a class="nav__link${page === 'categoria' && q.s === x[0] ? ' is-active' : ''}" href="${url.cat('saltos', x[0])}">${x[1]}</a></li>`).join('')}
          ${EXTRA_CATS.map(c => `<li><a class="nav__link${act(c)}" href="${url.cat(c)}">${CAT_NAMES[c]}</a></li>`).join('')}
          <li><a class="nav__link nav__link--promo${act('promocao')}" href="${url.cat('promocao')}">Promoção</a></li>
        </ul></nav>
        <div class="header__actions">
          <button class="header__search" id="open-search" aria-label="Buscar">${I.search}<span>Buscar por modelo, cor ou tamanho</span><kbd>/</kbd></button>
          <a class="icon-btn icon-btn--account" href="${u ? 'conta.html' : 'login.html'}" aria-label="${u ? 'Minha conta' : 'Entrar'}" title="${u ? 'Olá, ' + esc(u.name.split(' ')[0]) : 'Entrar ou criar conta'}">${I.user}</a>
          <a class="icon-btn" href="favoritos.html" aria-label="Favoritos">${I.heart}<span class="count" id="wish-count">0</span></a>
          <button class="icon-btn" id="open-cart" aria-label="Abrir sacola">${I.bag}<span class="count" id="cart-count">0</span></button>
        </div>
      </div>
    </header>
    <div class="search-panel" id="search-panel">
      <div class="container search-panel__inner">
        <form class="search-form" id="search-form" role="search">
          ${I.search}
          <input type="search" id="search-input" placeholder="O que você procura hoje?" autocomplete="off" aria-label="Buscar produtos">
          <button type="button" class="icon-btn" data-close-drawer aria-label="Fechar busca">${I.close}</button>
        </form>
        <div class="search-hints"><span>Buscas populares</span>${['Tamanco', 'Rasteira', 'Sapatilha', 'Salto baixo', 'Preto', 'Caramelo', 'Tamanho 38'].map(h => `<button class="chip" data-hint="${h}">${h}</button>`).join('')}</div>
        <div class="search-results" id="search-results"></div>
      </div>
    </div>
    <div class="drawer-layer">
    <aside class="drawer drawer--left" id="menu-drawer" aria-label="Menu">
      <div class="drawer__head"><a class="header__logo" href="index.html" style="margin:0;position:static;transform:none">${LOGO}</a><button class="icon-btn" data-close-drawer aria-label="Fechar">${I.close}</button></div>
      <div class="drawer__body">
        <ul class="mnav">
          <li><a href="${url.cat('novidades')}">Novidades ${I.arrR}</a></li>
          <li><button type="button" data-sub>Saltos ${I.chevD}</button><div class="mnav__sub">${subs.map(s => `<a href="${url.cat('saltos', s[0])}">${s[1]}</a>`).join('')}<a href="${url.cat('saltos')}">Ver todos</a></div></li>
          ${topSubs.map(x => `<li><a href="${url.cat('saltos', x[0])}">${x[1]} ${I.arrR}</a></li>`).join('')}
          ${EXTRA_CATS.map(c => `<li><a href="${url.cat(c)}">${CAT_NAMES[c]} ${I.arrR}</a></li>`).join('')}
          <li><a class="is-promo" href="${url.cat('promocao')}">Promoção ${I.arrR}</a></li>
        </ul>
        <div class="mnav__extra">
          <a href="${u ? 'conta.html' : 'login.html'}">${I.user} ${u ? 'Minha conta' : 'Entrar ou criar conta'}</a>
          <a href="favoritos.html">${I.heart} Favoritos</a>
          <a href="ajuda.html#rastreio">${I.box} Rastrear pedido</a>
          <a href="ajuda.html">${I.info} Trocas, frete e ajuda</a>
          <a href="sobre.html">${I.spark} Sobre a Aluzza</a>
        </div>
      </div>
      <div class="drawer__foot small muted">Atendimento seg. a sex., 8h às 18h · sáb., 8h às 12h</div>
    </aside>
    <aside class="drawer drawer--right" id="cart-drawer" aria-label="Sacola">
      <div class="drawer__head"><h3>Sua sacola <span class="muted" id="cart-drawer-count"></span></h3><button class="icon-btn" data-close-drawer aria-label="Fechar">${I.close}</button></div>
      <div class="drawer__body" id="mini-cart"></div>
      <div class="drawer__foot" id="mini-cart-foot"></div>
    </aside>
    </div>`;

    // announce rotation
    const msgs = [
      `Frete grátis a partir de ${money(CFG.FREE_SHIP)} para todo o Brasil`,
      `Primeira compra com 10% off <b>${CFG.FIRST_COUPON}</b>`,
      `Até ${CFG.INSTALLMENTS}x sem juros no cartão · 5% off no Pix`,
      'Troca grátis em até 30 dias',
      'Fabricação própria em Goiânia há 15 anos'
    ];
    const track = $('#announce-track');
    track.innerHTML = msgs.map((m, i) => `<div class="announce__item${i === 0 ? ' is-on' : ''}">${m}</div>`).join('');
    let ai = 0; setInterval(() => { const items = $$('.announce__item'); items[ai].classList.remove('is-on'); ai = (ai + 1) % items.length; items[ai].classList.add('is-on'); }, 4200);

    // interactions
    $('#open-menu').addEventListener('click', () => openDrawer('#menu-drawer'));
    $('#open-cart').addEventListener('click', () => { renderMiniCart(); openDrawer('#cart-drawer'); });
    $('#open-search').addEventListener('click', openSearch);
    document.addEventListener('keydown', e => { if (e.key === '/' && !/input|textarea/i.test(document.activeElement.tagName)) { e.preventDefault(); openSearch(); } });
    $$('.mnav [data-sub]').forEach(b => b.addEventListener('click', () => b.parentElement.classList.toggle('is-open')));
    const header = $('#header');
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
    renderCartBadge(); renderWishBadge(); initSearch();
    // mega menu: imagem acompanha o link em hover
    const mi = $('#mega-img'); if (mi) {
      const im = $('img', mi), cap = $('span', mi); let cur = im.getAttribute('src'), t;
      [...Object.values(MEGA_IMGS.sub), ...Object.values(MEGA_IMGS.h)].forEach(([src]) => { const i = new Image(); i.src = src; });
      const swap = (src, c, href) => { if (src === cur) { cap.textContent = c; return; } cur = src; clearTimeout(t); mi.classList.add('is-fading'); t = setTimeout(() => { im.src = src; cap.textContent = c; if (href) mi.href = href; im.onload = () => mi.classList.remove('is-fading'); setTimeout(() => mi.classList.remove('is-fading'), 400); }, 160); };
      $$('.mega a[data-img]').forEach(a => a.addEventListener('mouseenter', () => swap(a.dataset.img, a.dataset.cap, a.href)));
      $('.mega').addEventListener('mouseleave', () => swap(MEGA_IMGS.def[0], MEGA_IMGS.def[1], url.product(byId[2046])));
    }
  }

  function renderFooter() {
    const mount = $('#site-footer'); if (!mount) return;
    mount.innerHTML = `
    <footer class="footer">
      <div class="container">
        <div class="footer__grid">
          <div class="footer__brand">
            ${LOGO}
            <p>Calçados femininos com modelagem exclusiva, feitos pela Aluzza em Goiânia desde 2011. Beleza e conforto para a sua rotina.</p>
            <div class="footer__social">
              <a href="https://www.instagram.com/aluzzacalcados" target="_blank" rel="noopener" aria-label="Instagram">${I.instagram}</a>
              <a href="https://www.facebook.com/aluzzacalcados" target="_blank" rel="noopener" aria-label="Facebook">${I.facebook}</a>
              <a href="https://www.tiktok.com/@aluzzacalcados" target="_blank" rel="noopener" aria-label="TikTok">${I.tiktok}</a>
            </div>
          </div>
          <div><h4>Comprar</h4><ul>
            <li><a href="${url.cat('novidades')}">Novidades</a></li><li><a href="${url.cat('saltos')}">Saltos</a></li>${['tamancos', 'anabelas'].filter(hasSub).map(x => `<li><a href="${url.cat('saltos', x)}">${SUB_NAMES[x]}</a></li>`).join('')}${EXTRA_CATS.map(c => `<li><a href="${url.cat(c)}">${CAT_NAMES[c]}</a></li>`).join('')}<li><a href="${url.cat('promocao')}">Promoção</a></li><li><a href="${url.cat('todos')}">Todos os modelos</a></li>
          </ul></div>
          <div><h4>Ajuda</h4><ul>
            <li><a href="ajuda.html#trocas">Trocas e devoluções</a></li><li><a href="ajuda.html#frete">Frete e prazos</a></li><li><a href="ajuda.html#pagamento">Formas de pagamento</a></li><li><a href="ajuda.html#tamanhos">Guia de tamanhos</a></li><li><a href="ajuda.html#rastreio">Rastrear pedido</a></li><li><a href="ajuda.html#confiavel">A Aluzza é confiável?</a></li>
          </ul></div>
          <div><h4>A Aluzza</h4><ul>
            <li><a href="sobre.html">Nossa história</a></li><li><a href="sobre.html#fabricacao">Fabricação própria</a></li><li><a href="conta.html#clube">Clube Aluzza</a></li><li><a href="contato.html">Atacado e revenda</a></li><li><a href="contato.html">Fale com a gente</a></li><li><a href="ajuda.html#privacidade">Privacidade e termos</a></li>
          </ul></div>
          <div><h4>Atendimento</h4><ul class="footer__contact">
            <li>${I.whats}<span>(62) 99230-6476<br>WhatsApp e telefone</span></li>
            <li>${I.clock}<span>Seg. a sex., 8h às 18h<br>Sáb., 8h às 12h</span></li>
            <li>${I.pin}<span>Rua José Pedro Costa, Qd. 33A, Lt. 6<br>Setor Centro Oeste, Goiânia – GO<br>CEP 74560-465</span></li>
          </ul></div>
        </div>
        <div class="footer__bottom">
          <div>© ${new Date().getFullYear()} Aluzza Calçados · Leticia Guedes Comércio Atacadista Ltda. · Goiânia, GO</div>
          <div class="credit small">Site desenvolvido por <a href="https://zeph.com.br" target="_blank" rel="noopener">Zeph</a></div>
          <div class="footer__pay"><span>PIX</span><span>VISA</span><span>MASTER</span><span>ELO</span><span>AMEX</span><span>HIPER</span><span>BOLETO</span></div>
        </div>
      </div>
    </footer>
    <div class="wchat" id="wchat">
      <div class="wchat__box" id="wchat-box" role="dialog" aria-label="Conversa com o atendimento">
        <div class="wchat__head">
          <span class="wchat__avatar"><img src="assets/img/atendente.webp" alt="" onerror="this.replaceWith(Object.assign(document.createElement('b'),{textContent:'L'}))"><i></i></span>
          <div class="wchat__who"><b>Lívia · Atendimento Aluzza</b><span id="wchat-status">online agora</span></div>
          <button type="button" class="icon-btn" id="wchat-close" aria-label="Fechar conversa">${I.close}</button>
        </div>
        <div class="wchat__body" id="wchat-body"><div class="wchat__day">Hoje</div></div>
        <div class="wchat__quick" id="wchat-quick"></div>
        <form class="wchat__form" id="wchat-form"><input type="text" id="wchat-input" placeholder="Escreva sua mensagem" autocomplete="off" aria-label="Mensagem"><button type="submit" aria-label="Enviar">${I.arrR}</button></form>
      </div>
      <button type="button" class="wchat__btn" id="wchat-toggle" aria-label="Falar com o atendimento no WhatsApp">${I.whats}<span class="wchat__label">Ajuda no WhatsApp</span><span class="wchat__badge" id="wchat-badge" hidden>1</span></button>
    </div>
    <div class="modal popup" id="popup-news"><div class="modal__bg"></div><div class="modal__box">
      <div class="popup__img"><img src="${byId[2082].images[2]}" alt=""></div>
      <div class="popup__body">
        <button class="icon-btn modal__close" data-close-modal aria-label="Fechar">${I.close}</button>
        <span class="eyebrow">Primeira vez por aqui?</span>
        <h3>Ganhe 10% off na sua primeira compra</h3>
        <p>Deixe seu e-mail e receba o cupom na hora. Lançamentos e ofertas da Aluzza antes de todo mundo, sem spam.</p>
        <form id="popup-form"><input type="email" required placeholder="Seu melhor e-mail" aria-label="E-mail"><button class="btn btn--block" type="submit">Quero meu cupom</button></form>
        <div class="popup__code" hidden>Seu cupom: ${CFG.FIRST_COUPON}</div>
        <a class="popup__skip" href="#" data-close-modal>Agora não, obrigada</a>
      </div>
    </div></div>`;
    // popup (uma vez por sessão, após 14s, só se ainda não cadastrou)
    if (!sess.get('aluzza_popup') && !store.get('aluzza_news') && document.body.dataset.page !== 'checkout' && document.body.dataset.page !== 'pedido') {
      setTimeout(() => { if (!$('.modal.is-open') && !$('.drawer.is-open')) { openModal('#popup-news'); sess.set('aluzza_popup', '1'); } }, 14000);
    }
    $('#popup-form').addEventListener('submit', e => { e.preventDefault(); store.set('aluzza_news', true); $('#popup-form').hidden = true; $('.popup__code').hidden = false; toast(`${I.check}<span>Cupom ${CFG.FIRST_COUPON} liberado. Use no carrinho.</span>`); });
  }

  /* ------------------------------------------------------------------ badges / mini cart */
  function renderCartBadge() { const c = $('#cart-count'); if (!c) return; const n = cart.count(); c.textContent = n; c.classList.toggle('is-on', n > 0); }
  function renderWishBadge() { const c = $('#wish-count'); if (!c) return; c.textContent = wish.ids.length; c.classList.toggle('is-on', wish.ids.length > 0); }
  function shipBar(cls = '') {
    const s = cart.subtotal() - cart.discount(); const left = CFG.FREE_SHIP - s; const free = cart.shipFree();
    const w = Math.min(100, Math.round(s / CFG.FREE_SHIP * 100));
    return `<div class="ship-bar ${free ? 'is-free' : ''} ${cls}">${free ? `<b>Parabéns!</b> Seu pedido tem frete grátis.` : `Faltam <b>${money(left)}</b> para ganhar frete grátis`}<div class="ship-bar__track"><div class="ship-bar__fill" style="width:${w}%"></div></div></div>`;
  }
  function cartItemHTML(i, compact) {
    const p = byId[i.id]; if (!p) return '';
    return `<div class="cart-item" data-id="${p.id}" data-size="${i.size}">
      <a class="cart-item__img" href="${url.product(p)}"><img src="${mainImg(p)}" alt=""></a>
      <div>
        <div class="cart-item__name"><a href="${url.product(p)}">${esc(p.name)}</a></div>
        <div class="cart-item__meta">${esc(p.color)} · Tamanho ${i.size}</div>
        <div class="cart-item__row">
          <div class="qty"><button type="button" data-qty="-1" aria-label="Menos">−</button><span>${i.qty}</span><button type="button" data-qty="1" aria-label="Mais">+</button></div>
          <div class="price ${p.old ? 'price--promo' : ''}">${money(p.price * i.qty)}</div>
        </div>
        ${compact ? `<button type="button" class="cart-item__remove mt-8" data-remove>Remover</button>` : ''}
      </div></div>`;
  }
  function renderMiniCart() {
    const m = $('#mini-cart'), f = $('#mini-cart-foot'); if (!m) return;
    $('#cart-drawer-count').textContent = cart.count() ? `(${cart.count()})` : '';
    if (!cart.items.length) {
      m.innerHTML = `<div class="cart-empty">${I.bag}<p>Sua sacola está vazia.</p><p class="small">Que tal começar pelos mais vendidos?</p><a class="btn btn--sm mt-16" href="${url.cat('todos')}&sort=best">Ver mais vendidos</a></div>`;
      f.innerHTML = ''; return;
    }
    const sug = P.filter(p => !cart.items.some(i => i.id === p.id) && p.best).slice(0, 6);
    m.innerHTML = shipBar() + cart.items.map(i => cartItemHTML(i, true)).join('') +
      `<div class="upsell-mini"><h4>Complete a sacola</h4><div class="upsell-mini__list">${sug.map(p => `<a class="upsell-mini__item" href="${url.product(p)}"><img src="${mainImg(p)}" alt=""><p>${esc(p.name)}</p><span class="price">${money(p.price)}</span></a>`).join('')}</div></div>`;
    f.innerHTML = `<div class="summary-row"><span>Subtotal</span><span class="price">${money(cart.subtotal())}</span></div>
      ${cart.discount() ? `<div class="summary-row" style="color:var(--ok)"><span>Cupom ${cart.coupon}</span><span>− ${money(cart.discount())}</span></div>` : ''}
      <div class="summary-row small muted"><span>Frete</span><span>${cart.shipFree() ? 'Grátis' : 'calculado no checkout'}</span></div>
      <div class="summary-row summary-row--total"><span>Total</span><span class="price">${money(cart.total())}</span></div>
      <div class="small muted text-center" style="margin:6px 0 12px">ou ${inst(cart.total())}</div>
      <a class="btn btn--block btn--lg" href="checkout.html">Finalizar compra</a>
      <a class="link small" href="carrinho.html" style="margin:14px auto 0;display:table">Ver sacola completa</a>`;
    bindCartControls(m);
  }
  function bindCartControls(root) {
    $$('[data-qty]', root).forEach(b => b.addEventListener('click', () => { const it = b.closest('.cart-item'); const i = cart.items.find(x => x.id == it.dataset.id && x.size == it.dataset.size); cart.setQty(+it.dataset.id, it.dataset.size, i.qty + (+b.dataset.qty)); document.dispatchEvent(new Event('cart:change')); }));
    $$('[data-remove]', root).forEach(b => b.addEventListener('click', () => { const it = b.closest('.cart-item'); cart.remove(+it.dataset.id, it.dataset.size); toast(`${I.check}<span>Item removido da sacola</span>`); document.dispatchEvent(new Event('cart:change')); }));
  }

  /* ------------------------------------------------------------------ busca */
  function openSearch() { ensureOverlay().classList.add('is-open'); $('#search-panel').classList.add('is-open'); document.body.classList.add('is-locked'); setTimeout(() => $('#search-input').focus(), 200); }
  function searchProducts(q) {
    q = q.trim().toLowerCase(); if (q.length < 2) return [];
    const terms = q.split(/\s+/);
    return P.map(p => {
      const hay = `${p.name} ${p.color} ${p.type} ${p.sub} ${p.model} ${p.heel || ''} ${p.old ? 'promoção' : ''} ${p.new ? 'novidade' : ''} tamanho ${Object.keys(p.stock).filter(s => p.stock[s] > 0).join(' ')}`.toLowerCase();
      const score = terms.reduce((a, t) => a + (hay.includes(t) ? (p.name.toLowerCase().includes(t) ? 3 : 1) : -5), 0);
      return { p, score };
    }).filter(x => x.score > 0).sort((a, b) => b.score - a.score || (b.p.best - a.p.best)).map(x => x.p);
  }
  function initSearch() {
    const inp = $('#search-input'), res = $('#search-results'), form = $('#search-form');
    const run = () => { const r = searchProducts(inp.value); res.innerHTML = inp.value.trim().length < 2 ? '' : (r.length ? r.slice(0, 10).map(p => productCard(p, { mini: true })).join('') : `<div class="search-empty">Nada encontrado para “${esc(inp.value)}”. Tente “tamanco”, “scarpin preto” ou um tamanho.</div>`); };
    inp.addEventListener('input', run);
    form.addEventListener('submit', e => { e.preventDefault(); if (inp.value.trim()) location.href = `categoria.html?q=${encodeURIComponent(inp.value.trim())}`; });
    $$('[data-hint]').forEach(b => b.addEventListener('click', () => { inp.value = b.dataset.hint; run(); inp.focus(); }));
  }

  /* ------------------------------------------------------------------ product card */
  const BI = {
    spark: '<svg viewBox="0 0 24 24"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/></svg>',
    star: '<svg viewBox="0 0 24 24"><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/></svg>',
    clock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
    tag: '<svg viewBox="0 0 24 24"><path d="M3.5 12.5 12.5 3.5H20.5v8l-9 9z"/><circle cx="16.5" cy="7.5" r="1.3"/></svg>'
  };
  function badges(p) {
    const b = [];
    if (p.old) b.push(`<span class="badge badge--promo">${BI.tag}−${pct(p)}%</span>`);
    else if (p.new) b.push(`<span class="badge badge--new">${BI.spark}Novo</span>`);
    if (p.best && !p.old) b.push(`<span class="badge badge--best">${BI.star}Mais vendido</span>`);
    const low = Object.values(p.stock).filter(v => v > 0).length <= 2;
    if (low) b.push(`<span class="badge badge--low">${BI.clock}Últimas unidades</span>`);
    return b.join('');
  }
  const mainImg = p => p.pack || p.images[0];
  const hoverImg = p => p.pack ? p.images[0] : (p.images[1] || p.images[0]);
  function productCard(p, o = {}) {
    const fam = p.family.map(i => byId[i]).filter(Boolean);
    const others = fam.filter(f => f.id !== p.id);
    const sw = fam.slice(0, 5).map(f => `<button type="button" class="swatch ${f.id === p.id ? 'is-on' : ''}" style="background:${f.hex}" data-variant="${f.id}" title="${esc(f.color)}" aria-label="Ver na cor ${esc(f.color)}"></button>`).join('');
    return `<article class="pcard${o.mini ? ' pcard--mini' : ''}" data-id="${p.id}">
      <div class="pcard__top">
        <a class="pcard__media" href="${url.product(p)}" aria-label="${esc(p.name)} ${esc(p.color)}">
          <img src="${mainImg(p)}" alt="${esc(p.name)} ${esc(p.color)}" loading="lazy" width="720" height="960">
          <img class="alt" src="${hoverImg(p)}" alt="" loading="lazy" width="720" height="960">
          <div class="pcard__badges">${badges(p)}</div>
        </a>
        <button type="button" class="pcard__wish ${wish.has(p.id) ? 'is-on' : ''}" data-id="${p.id}" aria-label="Favoritar">${I.heart}</button>
        ${o.mini ? '' : `<div class="pcard__quick"><small>Compra rápida · escolha o tamanho</small><div class="pcard__sizes">${CFG.SIZES.map(s => `<button type="button" data-size="${s}" ${p.stock[s] ? '' : 'disabled'}>${s}</button>`).join('')}</div></div>`}
      </div>
      <div class="pcard__body">
        <div class="pcard__name"><a href="${url.product(p)}">${esc(p.name)}</a></div>
        <div class="pcard__colors">${sw}<span class="pcard__color-name">${esc(p.color)}${others.length ? ` · ${fam.length} cores` : ''}</span></div>
        <div class="pcard__price">${p.old ? `<span class="price--old">${money(p.old)}</span>` : ''}<span class="price ${p.old ? 'price--promo' : ''}">${money(p.price)}</span></div>
        ${o.mini ? '' : `<div class="pcard__inst">${inst(p.price)}</div>`}
      </div></article>`;
  }
  // clique na cor do card: troca o produto exibido (imagem, nome, preço, link) pela variante
  document.addEventListener('click', e => {
    const b = e.target.closest('.swatch[data-variant]'); if (!b) return;
    const card = b.closest('.pcard'); const q = byId[+b.dataset.variant]; if (!card || !q || +card.dataset.id === q.id) return;
    const mini = !$('.pcard__quick', card);
    const tmp = document.createElement('div'); tmp.innerHTML = productCard(q, { mini });
    const fresh = tmp.firstElementChild; fresh.classList.add('is-swapping');
    card.replaceWith(fresh); requestAnimationFrame(() => fresh.classList.remove('is-swapping'));
  });
  document.addEventListener('click', e => {
    const w = e.target.closest('.pcard__wish'); if (w) { wish.toggle(+w.dataset.id); return; }
    const s = e.target.closest('.pcard__sizes button'); if (s && !s.disabled) { cart.add(+s.closest('.pcard').dataset.id, s.dataset.size); }
  });

  /* ------------------------------------------------------------------ rails & reveal */
  function initRails() {
    $$('.rail').forEach(r => {
      const t = $('.rail__track', r); const prev = $('[data-prev]', r), next = $('[data-next]', r);
      const step = () => t.firstElementChild ? t.firstElementChild.getBoundingClientRect().width + 20 : 300;
      prev && prev.addEventListener('click', () => t.scrollBy({ left: -step() * 2, behavior: 'smooth' }));
      next && next.addEventListener('click', () => t.scrollBy({ left: step() * 2, behavior: 'smooth' }));
    });
  }
  function initReveal() {
    const els = $$('.rv, .rv-stagger'); if (!els.length) return;
    if (reducedMotion || !('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('is-in')); return; }
    const io = new IntersectionObserver(en => en.forEach(x => { if (x.isIntersecting) { x.target.classList.add('is-in'); io.unobserve(x.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    els.forEach(e => io.observe(e));
  }

  /* ------------------------------------------------------------------ preloader */
  function initPreloader() {
    const pl = $('#preloader'); if (!pl) return;
    document.body.classList.add('has-preloader');
    const fast = !!sess.get('aluzza_loaded');
    pl.innerHTML = `<div class="preloader__logo"><svg viewBox="48 210 402 84"><g class="outline">${LOGO_PATHS}</g><g class="fill">${LOGO_PATHS}</g></svg></div><div class="preloader__bar"><i></i></div><div class="preloader__num">0%</div><div class="preloader__tag">Calçados feitos em Goiânia · desde 2011</div>`;
    const fill = $('.fill', pl), bar = $('.preloader__bar i', pl), num = $('.preloader__num', pl);
    let p = 0; const dur = fast ? 700 : 1900; const t0 = performance.now();
    const tick = now => {
      p = Math.min(100, Math.round((now - t0) / dur * 100));
      const eased = 100 - Math.pow(1 - p / 100, 2) * 100;
      fill.style.clipPath = `inset(${100 - eased}% 0 0 0)`; bar.style.transform = `scaleX(${eased / 100})`; num.textContent = Math.round(eased) + '%';
      if (p < 100) requestAnimationFrame(tick); else setTimeout(done, 320);
    };
    const done = () => { pl.classList.add('is-done'); document.body.classList.add('is-ready'); sess.set('aluzza_loaded', '1'); setTimeout(() => pl.remove(), 1000); document.dispatchEvent(new Event('preloader:done')); };
    if (reducedMotion) { done(); } else requestAnimationFrame(tick);
  }

  /* ------------------------------------------------------------------ hero slider */
  function initHero() {
    const hero = $('#hero'); if (!hero) return;
    const slides = $$('.hero__slide', hero), dots = $$('.hero__dot', hero);
    let i = 0, timer;
    const durFor = s => $('video', s) ? 22000 : 7000;
    const go = n => {
      slides[i].classList.remove('is-on'); dots[i].classList.remove('is-on');
      const v = $('video', slides[i]); if (v) v.pause();
      i = (n + slides.length) % slides.length;
      slides[i].classList.add('is-on'); dots[i].style.setProperty('--dur', durFor(slides[i]) + 'ms');
      // reinicia animação do dot
      dots[i].classList.remove('is-on'); void dots[i].offsetWidth; dots[i].classList.add('is-on');
      const nv = $('video', slides[i]); if (nv) { nv.currentTime = 0; nv.play().catch(() => {}); }
      clearTimeout(timer); timer = setTimeout(() => go(i + 1), durFor(slides[i]));
    };
    dots.forEach((d, n) => d.addEventListener('click', () => go(n)));
    $('[data-prev]', hero).addEventListener('click', () => go(i - 1));
    $('[data-next]', hero).addEventListener('click', () => go(i + 1));
    hero.addEventListener('mouseenter', () => clearTimeout(timer));
    hero.addEventListener('mouseleave', () => { clearTimeout(timer); timer = setTimeout(() => go(i + 1), 3000); });
    // swipe
    let x0 = null; hero.addEventListener('touchstart', e => x0 = e.touches[0].clientX, { passive: true });
    hero.addEventListener('touchend', e => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 50) go(i + (dx < 0 ? 1 : -1)); x0 = null; });
    const start = () => { slides[i].classList.add('is-on'); dots[i].style.setProperty('--dur', durFor(slides[i]) + 'ms'); dots[i].classList.add('is-on'); const v = $('video', slides[i]); if (v) v.play().catch(() => {}); timer = setTimeout(() => go(1), durFor(slides[i])); };
    if (document.body.classList.contains('has-preloader') && !document.body.classList.contains('is-ready')) document.addEventListener('preloader:done', start, { once: true }); else start();
  }

  /* ------------------------------------------------------------------ páginas */
  const pages = {};

  /* ---------- HOME ---------- */
  pages.home = () => {
    initHero();
    const uniq = l => { const s = new Set(); return l.filter(p => { const k = p.type + p.model; if (s.has(k)) return false; s.add(k); return true; }); };
    $('#novidades').innerHTML = uniq(P.filter(p => p.new && !p.old)).slice(0, 8).map(p => productCard(p)).join('');
    $('#best').innerHTML = uniq(P.filter(p => p.best)).slice(0, 10).map(p => productCard(p)).join('');
    $('#promo').innerHTML = uniq(P.filter(p => p.old)).slice(0, 8).map(p => productCard(p)).join('');
    // compre por cor (família Marina)
    const fam = [1972, 1974, 2037, 1975].map(i => byId[i]).filter(Boolean);
    const media = $('#bycolor-media'), sw = $('#bycolor-swatches'), tag = $('#bycolor-tag');
    media.innerHTML = fam.map((p, n) => `<img src="${mainImg(p)}" alt="${esc(p.name)} ${esc(p.color)}" class="${n ? '' : 'is-on'}" loading="${n ? 'lazy' : 'eager'}">`).join('') + `<a class="bycolor__tag" id="bycolor-tag" href="${url.product(fam[0])}"><b>${esc(fam[0].name)}</b> · ${esc(fam[0].color)} · ${money(fam[0].price)} ${I.arrR}</a>`;
    sw.innerHTML = fam.map((p, n) => `<button type="button" class="${n ? '' : 'is-on'}" data-n="${n}" aria-label="${esc(p.color)}"><i style="background:${p.hex}"></i></button>`).join('') + `<span id="bycolor-name">${esc(fam[0].color)}</span>`;
    $$('button', sw).forEach(b => { b.addEventListener('mouseenter', pick); b.addEventListener('click', pick); });
    function pick() { const n = +this.dataset.n; $$('button', sw).forEach(x => x.classList.toggle('is-on', x === this)); $$('img', media).forEach((im, k) => im.classList.toggle('is-on', k === n)); $('#bycolor-name').textContent = fam[n].color; const t = $('#bycolor-tag'); t.href = url.product(fam[n]); t.innerHTML = `<b>${esc(fam[n].name)}</b> · ${esc(fam[n].color)} · ${money(fam[n].price)} ${I.arrR}`; }
    initCountdown();
    // etapas do ateliê (bloco "Feito aqui")
    const steps = $$('#atelier-steps li'); if (steps.length) {
      let k = 0, run = null; const lbl = $('#atelier-step'), bar = $('#atelier-bar');
      const tick = () => { k = (k + 1) % steps.length; steps.forEach((li, i) => { li.classList.toggle('is-on', i === k); li.classList.toggle('is-done', i < k); }); lbl.textContent = `${String(k + 1).padStart(2, '0')}/${String(steps.length).padStart(2, '0')}`; bar.style.width = ((k + 1) / steps.length * 100) + '%'; };
      const io = new IntersectionObserver(en => { en.forEach(e => { if (e.isIntersecting && !run) run = setInterval(tick, 1700); else if (!e.isIntersecting && run) { clearInterval(run); run = null; } }); }, { threshold: .3 });
      io.observe($('#atelier-steps'));
    }
    const recent = seen.list().slice(0, 8);
    if (recent.length) { $('#recent-wrap').hidden = false; $('#recent').innerHTML = recent.map(p => productCard(p)).join(''); }
  };
  function initCountdown() {
    const c = $('#countdown'); if (!c) return;
    const cells = $$('b', c);
    const tick = () => { let d = Math.max(0, CFG.PROMO_END - Date.now()); const h = Math.floor(d / 36e5), m = Math.floor(d % 36e5 / 6e4), s = Math.floor(d % 6e4 / 1e3); [h, m, s].forEach((v, i) => cells[i].textContent = String(v).padStart(2, '0')); };
    tick(); setInterval(tick, 1000);
  }

  /* ---------- CATEGORIA / BUSCA ---------- */
  pages.categoria = () => {
    const q = qs(); const c = q.c || (q.q ? 'busca' : 'todos'); const s = q.s || ''; const state = { sub: s ? [s] : [], sizes: [], colors: q.cor ? [q.cor] : [], heel: q.h ? [q.h] : [], min: '', max: '', sort: q.sort || 'relev', shown: 12 };
    const titles = {
      novidades: ['Novidades', 'Os lançamentos da semana, direto do nosso ateliê em Goiânia.'],
      saltos: ['Saltos', `${[['scarpins', 'Scarpins'], ['sandalias', 'Sandálias'], ['anabelas', 'Anabelas'], ['tamancos', 'Tamancos']].filter(x => hasSub(x[0])).map(x => x[1]).join(', ').replace(/, ([^,]*)$/, ' e $1')} com a altura certa para o seu dia.`],
      sapatilhas: ['Sapatilhas', 'As clássicas que resolvem qualquer look, com palmilha macia para andar o dia todo.'],
      rasteiras: ['Rasteiras & Papetes', 'Leves, confortáveis e com as cores do verão.'],
      tenis: ['Tênis', 'Para os dias de correria, sem abrir mão do estilo.'],
      promocao: ['Promoção', 'Modelos selecionados com desconto especial. Enquanto durar o estoque.'],
      todos: ['Todos os modelos', 'Tudo o que a Aluzza faz, em um só lugar.'],
      busca: [`Resultados para “${esc(q.q || '')}”`, '']
    };
    const t = titles[c] || titles.todos;
    const subName = s && SUB_NAMES[s];
    $('#plp-title').textContent = subName || t[0]; $('#plp-desc').textContent = subName ? `${subName} com modelagem exclusiva Aluzza.` : t[1];
    document.title = `${subName || t[0]} · Aluzza Calçados`;
    $('#bc-cat').textContent = t[0]; $('#bc-cat').href = url.cat(c);
    if (subName) { $('#bc-sub').hidden = false; $('#bc-sub-name').textContent = subName; }
    // banner por categoria
    const banners = { saltos: ['assets/img/banners/hero-editorial.webp', 'Saltos para usar o dia inteiro', 'Modelagem própria, palmilha acolchoada e altura na medida.'], rasteiras: ['assets/img/banners/hero-rasteiras.webp', 'Verão nos pés', 'Rasteiras e papetes com tiras macias e cores que combinam com tudo.'], promocao: ['assets/img/banners/hero-flatlay.webp', 'Semana Aluzza', 'Use SEMANA20 e ganhe 20% off acima de R$ 300.'] };
    if (banners[c] && !s) { const b = banners[c]; $('#plp-banner').hidden = false; $('#plp-banner').innerHTML = `<img src="${b[0]}" alt=""><div><h2>${b[1]}</h2><p>${b[2]}</p></div>`; }

    const base = () => {
      let l = P.slice();
      if (c === 'novidades') l = l.filter(p => p.new);
      else if (c === 'promocao') l = l.filter(p => p.old);
      else if (c === 'busca') l = searchProducts(q.q || '');
      else if (c !== 'todos') l = l.filter(p => p.cat === c);
      return l;
    };
    const heelClass = p => { if (p.type === 'Anabela') return 'plataforma'; const n = parseFloat((p.heel || '').replace(',', '.')); if (isNaN(n)) return 'baixo'; return n <= 5 ? 'baixo' : n <= 8 ? 'medio' : 'alto'; };
    const apply = () => {
      let l = base();
      if (state.sub.length) l = l.filter(p => state.sub.includes(p.sub));
      if (state.sizes.length) l = l.filter(p => state.sizes.some(z => p.stock[z] > 0));
      if (state.colors.length) l = l.filter(p => state.colors.includes(p.color));
      if (state.heel.length) l = l.filter(p => state.heel.includes(heelClass(p)));
      if (state.min) l = l.filter(p => p.price >= +state.min);
      if (state.max) l = l.filter(p => p.price <= +state.max);
      const sorts = { relev: (a, b) => (b.best - a.best) || (b.new - a.new), menor: (a, b) => a.price - b.price, maior: (a, b) => b.price - a.price, novos: (a, b) => (b.new - a.new) || b.id - a.id, best: (a, b) => (b.best - a.best) || b.reviews - a.reviews, desconto: (a, b) => pct(b) - pct(a) };
      return l.sort(sorts[state.sort] || sorts.relev);
    };
    // coleção sem produtos cadastrados (ex.: categoria ainda não integrada) → estado "em breve"
    if (!base().length && CAT_NAMES[c] && !['todos', 'novidades', 'promocao'].includes(c)) {
      $('#plp-grid').innerHTML = `<div class="plp-empty plp-soon" style="grid-column:1/-1">${I.spark}<h3>${esc(t[0])}: coleção chegando</h3><p>Estamos finalizando as fotos desta linha. Enquanto isso, veja os modelos de salto e os lançamentos da semana.</p><div class="plp-soon__actions"><a class="btn btn--primary btn--sm" href="${url.cat('saltos')}">Ver saltos</a><a class="btn btn--ghost btn--sm" href="${url.cat('novidades')}">Ver novidades</a></div></div>`;
      $('#plp-count').textContent = ''; $('#load-more-wrap').hidden = true; const tb = $('#plp-toolbar'); if (tb) tb.hidden = true; const fl = $('#filters'); if (fl) { fl.hidden = true; fl.closest('.plp').classList.add('plp--single'); }
      return;
    }
    // filtros
    const all = base();
    const subs = [...new Set(all.map(p => p.sub))];
    const colors = [...new Map(all.map(p => [p.color, p.hex])).entries()];
    const f = $('#filters');
    f.innerHTML = `<div class="filters__close"><span>Filtrar</span><button class="icon-btn" data-close-drawer aria-label="Fechar">${I.close}</button></div>
      ${subs.length > 1 ? `<details class="filters__group" open><summary>Modelo ${I.chevD}</summary><div class="filters__body">${subs.map(x => `<label class="check"><input type="checkbox" data-f="sub" value="${x}" ${state.sub.includes(x) ? 'checked' : ''}>${SUB_NAMES[x] || x}<small>${all.filter(p => p.sub === x).length}</small></label>`).join('')}</div></details>` : ''}
      <details class="filters__group" open><summary>Tamanho ${I.chevD}</summary><div class="filters__body"><div class="sizes-filter">${CFG.SIZES.map(z => `<button type="button" data-f="sizes" value="${z}" class="${state.sizes.includes(z) ? 'is-on' : ''}">${z}</button>`).join('')}</div><small class="muted">Mostra só o que tem no seu número.</small></div></details>
      <details class="filters__group" open><summary>Cor ${I.chevD}</summary><div class="filters__body"><div class="colors-filter">${colors.map(([n, h]) => `<button type="button" data-f="colors" value="${esc(n)}" title="${esc(n)}" class="${state.colors.includes(n) ? 'is-on' : ''}"><i style="background:${h}"></i></button>`).join('')}</div></div></details>
      ${c === 'saltos' || c === 'todos' ? `<details class="filters__group" ${state.heel.length ? 'open' : ''}><summary>Altura do salto ${I.chevD}</summary><div class="filters__body">${[['baixo', 'Baixo (até 5 cm)'], ['medio', 'Médio (6 a 8 cm)'], ['alto', 'Alto (9 cm ou mais)'], ['plataforma', 'Plataforma / anabela']].map(([v, n]) => `<label class="check"><input type="checkbox" data-f="heel" value="${v}" ${state.heel.includes(v) ? 'checked' : ''}>${n}</label>`).join('')}</div></details>` : ''}
      <details class="filters__group"><summary>Preço ${I.chevD}</summary><div class="filters__body"><div class="range"><input type="number" placeholder="mín" id="f-min" inputmode="numeric"><span>–</span><input type="number" placeholder="máx" id="f-max" inputmode="numeric"></div></div></details>`;
    f.addEventListener('change', e => { const el = e.target; if (!el.dataset.f) return; const arr = state[el.dataset.f]; if (el.checked) arr.push(el.value); else state[el.dataset.f] = arr.filter(v => v !== el.value); state.shown = 12; render(); });
    f.addEventListener('click', e => { const b = e.target.closest('button[data-f]'); if (!b) return; b.classList.toggle('is-on'); const arr = state[b.dataset.f]; state[b.dataset.f] = b.classList.contains('is-on') ? [...arr, b.value] : arr.filter(v => v !== b.value); state.shown = 12; render(); });
    $('#f-min').addEventListener('input', e => { state.min = e.target.value; render(); }); $('#f-max').addEventListener('input', e => { state.max = e.target.value; render(); });
    $('#sort').value = state.sort; $('#sort').addEventListener('change', e => { state.sort = e.target.value; render(); });
    $('#open-filters').addEventListener('click', () => { ensureOverlay().classList.add('is-open'); f.classList.add('is-open'); document.body.classList.add('is-locked'); });
    $('#load-more').addEventListener('click', () => { state.shown += 12; render(); });
    const render = () => {
      const l = apply(); const grid = $('#plp-grid');
      $('#plp-count').textContent = `${l.length} ${l.length === 1 ? 'modelo' : 'modelos'}`;
      const chips = [...state.sub.map(v => ['sub', v, SUB_NAMES[v] || v]), ...state.sizes.map(v => ['sizes', v, 'Tam. ' + v]), ...state.colors.map(v => ['colors', v, v]), ...state.heel.map(v => ['heel', v, 'Salto ' + v])];
      $('#active-filters').innerHTML = chips.map(([k, v, n]) => `<button class="chip" data-k="${k}" data-v="${esc(v)}">${esc(n)} ${I.close}</button>`).join('') + (chips.length ? `<button class="chip" data-k="all">Limpar tudo</button>` : '');
      grid.innerHTML = l.length ? l.slice(0, state.shown).map(p => productCard(p)).join('') : `<div class="plp-empty" style="grid-column:1/-1"><h3>Nenhum modelo com esses filtros</h3><p>Tente tirar um filtro ou ver todos os modelos.</p><a class="btn btn--ghost btn--sm mt-16" href="${url.cat('todos')}">Ver todos os modelos</a></div>`;
      const lm = $('#load-more-wrap'); lm.hidden = l.length <= state.shown;
      $('#lm-text').textContent = `Mostrando ${Math.min(state.shown, l.length)} de ${l.length}`; $('#lm-bar').style.width = Math.min(100, state.shown / l.length * 100) + '%';
    };
    $('#active-filters').addEventListener('click', e => { const b = e.target.closest('.chip'); if (!b) return; if (b.dataset.k === 'all') { state.sub = []; state.sizes = []; state.colors = []; state.heel = []; } else state[b.dataset.k] = state[b.dataset.k].filter(v => v !== b.dataset.v); $$('[data-f]', f).forEach(el => { if (el.tagName === 'INPUT') el.checked = state[el.dataset.f].includes(el.value); else el.classList.toggle('is-on', state[el.dataset.f].includes(el.value)); }); render(); });
    render();
  };

  /* ---------- PRODUTO ---------- */
  pages.produto = () => {
    const q = qs(); const p = bySlug[q.p] || byId[+q.id] || P[0];
    if (!p) return; seen.push(p.id);
    document.title = `${p.name} ${p.color} · Aluzza Calçados`;
    const fam = p.family.map(i => byId[i]).filter(Boolean);
    const low = Object.values(p.stock).filter(v => v > 0).length <= 2;
    const gallery = p.pack ? [p.pack, ...p.images] : p.images;
    $('#bc-cat').textContent = CAT_NAMES[p.cat]; $('#bc-cat').href = url.cat(p.cat); $('#bc-sub').textContent = SUB_NAMES[p.sub]; $('#bc-sub').href = url.cat(p.cat, p.sub); $('#bc-name').textContent = p.name;
    // galeria
    $('#gallery-thumbs').innerHTML = gallery.map((im, n) => `<button type="button" class="${n ? '' : 'is-on'}" data-n="${n}" aria-label="Foto ${n + 1}"><img src="${im}" alt=""></button>`).join('');
    $('#gallery-main').innerHTML = gallery.map((im, n) => `<img src="${im}" alt="${esc(p.name)} ${esc(p.color)}" class="${n ? '' : 'is-on'}">`).join('') + `<div class="pcard__badges">${badges(p)}</div>`;
    $('#gallery-mobile').innerHTML = gallery.map(im => `<img src="${im}" alt="${esc(p.name)} ${esc(p.color)}">`).join('');
    $('#gallery-dots').innerHTML = gallery.map((_, n) => `<i class="${n ? '' : 'is-on'}"></i>`).join('');
    const gm = $('#gallery-main');
    $$('#gallery-thumbs button').forEach(b => b.addEventListener('click', () => { $$('#gallery-thumbs button').forEach(x => x.classList.toggle('is-on', x === b)); $$('img', gm).forEach((im, n) => im.classList.toggle('is-on', n == b.dataset.n)); }));
    gm.addEventListener('mousemove', e => { const r = gm.getBoundingClientRect(); gm.style.setProperty('--zx', ((e.clientX - r.left) / r.width * 100) + '%'); gm.style.setProperty('--zy', ((e.clientY - r.top) / r.height * 100) + '%'); });
    gm.addEventListener('mouseenter', () => gm.classList.add('is-zoom')); gm.addEventListener('mouseleave', () => gm.classList.remove('is-zoom'));
    const gmob = $('#gallery-mobile'); gmob.addEventListener('scroll', () => { const n = Math.round(gmob.scrollLeft / (gmob.scrollWidth / gallery.length)); $$('#gallery-dots i').forEach((d, k) => d.classList.toggle('is-on', k === n)); }, { passive: true });
    // info
    $('#p-type').innerHTML = `${esc(p.type)} · ${esc(SUB_NAMES[p.sub])} ${p.new && !p.old ? `<span class="badge badge--new">${BI.spark}Novo</span>` : ''}${p.best ? `<span class="badge badge--best">${BI.star}Mais vendido</span>` : ''}`;
    $('#p-name').textContent = p.name;
    $('#p-rating').innerHTML = `${stars(p.rating)}<span>${p.rating.toFixed(1)}</span><a href="#avaliacoes">${p.reviews} avaliações</a>`;
    $('#p-price').innerHTML = `<span class="now">${money(p.price)}</span>${p.old ? `<span class="old">${money(p.old)}</span><span class="badge badge--promo">${BI.tag}−${pct(p)}%</span>` : ''}`;
    $('#p-pay').innerHTML = `<span>${inst(p.price)}</span><span><b>${money(p.price * (1 - CFG.PIX_OFF))} no Pix</b> (5% de desconto)</span>`;
    $('#p-colors').innerHTML = fam.map(f => `<a href="${url.product(f)}" class="${f.id === p.id ? 'is-on' : ''}" title="${esc(f.color)}" aria-label="${esc(f.color)}"><img src="${mainImg(f)}" alt=""></a>`).join('');
    $('#p-color-name').textContent = p.color + (fam.length > 1 ? ` · ${fam.length} cores` : '');
    let size = null;
    const sg = $('#p-sizes'), note = $('#size-note');
    sg.innerHTML = CFG.SIZES.map(s => `<button type="button" data-size="${s}" class="${p.stock[s] > 0 && p.stock[s] <= 3 ? 'is-low' : ''}" ${p.stock[s] ? '' : 'disabled'} aria-label="Tamanho ${s}${p.stock[s] ? '' : ', esgotado'}">${s}</button>`).join('');
    sg.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.disabled) { $('#notify-size').textContent = b.dataset.size; openModal('#modal-notify'); return; }
      size = b.dataset.size; $$('button', sg).forEach(x => x.classList.toggle('is-on', x === b));
      const st = p.stock[size]; note.className = 'size-note' + (st <= 3 ? ' is-low' : ''); note.innerHTML = st <= 3 ? `${I.flame} Restam só ${st} ${st === 1 ? 'par' : 'pares'} no ${size}` : `Tamanho ${size} selecionado · forma normal, compre a sua numeração habitual`;
      $('#sticky-size').textContent = `Tam. ${size}`;
    });
    note.textContent = 'Forma normal: compre a sua numeração habitual.';
    $('#p-social').innerHTML = `<span><i></i>${p.views} pessoas vendo agora</span><span>${I.flame} ${Math.max(3, Math.round(p.reviews / 6))} vendidos hoje</span>${low ? `<span>${I.spark} Últimas unidades</span>` : ''}`;
    // qty
    let qty = 1; const qEl = $('#p-qty span');
    $$('#p-qty button').forEach(b => b.addEventListener('click', () => { qty = Math.max(1, Math.min(10, qty + (+b.dataset.qty))); qEl.textContent = qty; }));
    const needSize = () => { if (size) return true; note.className = 'size-note is-error'; note.textContent = 'Escolha um tamanho para continuar.'; sg.scrollIntoView({ behavior: 'smooth', block: 'center' }); return false; };
    $('#add-cart').addEventListener('click', () => { if (needSize()) { cart.add(p.id, size, qty); } });
    $('#buy-now').addEventListener('click', () => { if (needSize()) { cart.add(p.id, size, qty); setTimeout(() => location.href = 'checkout.html', 350); } });
    $('#sticky-add').addEventListener('click', () => { if (needSize()) cart.add(p.id, size, qty); });
    const wb = $('#p-wish'); wb.dataset.id = p.id; wb.classList.toggle('is-on', wish.has(p.id)); wb.addEventListener('click', () => wish.toggle(p.id));
    // sticky mobile bar
    $('#sticky-img').src = mainImg(p); $('#sticky-name').textContent = `${p.name} · ${p.color}`; $('#sticky-price').textContent = money(p.price);
    document.body.classList.add('has-sticky-buy');
    const buyBox = $('#p-buy'); if ('IntersectionObserver' in window) { new IntersectionObserver(en => $('#sticky-buy').classList.toggle('is-on', !en[0].isIntersecting && en[0].boundingClientRect.top < 0), { threshold: 0 }).observe(buyBox); }
    // veja em você
    $('#tryon-btn').addEventListener('click', () => { $('#tryon-img').src = p.images[0]; openModal('#modal-tryon'); });
    $('#size-guide-btn').addEventListener('click', () => openModal('#modal-sizes'));
    $('#notify-form').addEventListener('submit', e => { e.preventDefault(); closeModal($('#modal-notify')); toast(`${I.check}<span>Pronto! Avisamos você quando o ${$('#notify-size').textContent} voltar.</span>`); });
    $('#tryon-form').addEventListener('submit', e => { e.preventDefault(); toast(`${I.check}<span>Você será avisada quando o Veja em você estiver disponível.</span>`); closeModal($('#modal-tryon')); });
    // frete
    $('#ship-form').addEventListener('submit', e => {
      e.preventDefault(); const cep = $('#ship-cep').value.replace(/\D/g, '');
      if (cep.length !== 8) { $('#ship-result').innerHTML = `<div class="small" style="color:var(--erro)">Digite um CEP válido com 8 números.</div>`; return; }
      const free = p.price * qty >= CFG.FREE_SHIP; const go = cep.startsWith('74') || cep.startsWith('75');
      const opts = go ? [['Entrega expressa em Goiânia', 'Até 1 dia útil', free ? 0 : 12.9], ['Retire na loja', 'Setor Centro Oeste · pronto em 2h', 0]] : [['PAC', '5 a 8 dias úteis', free ? 0 : 19.9], ['SEDEX', '2 a 4 dias úteis', 34.9]];
      $('#ship-result').innerHTML = `<div class="ship-options">${opts.map(o => `<div class="ship-option"><div><b>${o[0]}</b><small>${o[1]}</small></div><span class="${o[2] ? '' : 'free'}">${o[2] ? money(o[2]) : 'Grátis'}</span></div>`).join('')}</div>`;
    });
    $('#ship-cep').addEventListener('input', e => { e.target.value = e.target.value.replace(/\D/g, '').replace(/^(\d{5})(\d)/, '$1-$2').slice(0, 9); });
    // acordeão
    $('#p-desc').innerHTML = p.desc.map(d => `<p>${esc(d)}</p>`).join('');
    $('#p-spec').innerHTML = `<dt>Modelo</dt><dd>${esc(p.name)}</dd><dt>Cor</dt><dd>${esc(p.color)}</dd><dt>Salto</dt><dd>${esc(p.heel)}</dd><dt>Material</dt><dd>${esc(p.material)}</dd><dt>Forma</dt><dd>Normal (34 ao 39)</dd><dt>Fabricação</dt><dd>Própria, em Goiânia – GO</dd><dt>Código</dt><dd>${p.id}</dd>`;
    // reviews
    const names = ['Juliana M.', 'Carla S.', 'Fernanda R.', 'Patrícia L.', 'Ana Beatriz', 'Renata F.', 'Camila A.', 'Luciana T.'];
    const texts = [`Chegou rápido e é exatamente como na foto. Usei o dia inteiro no trabalho e não machucou nada.`, `Comprei a ${p.color.toLowerCase()} e já quero em outra cor. O acabamento é lindo e a palmilha é bem macia.`, `Numeração certinha, peguei meu número de sempre. Elogiaram muito no casamento da minha prima.`, `Terceiro par da Aluzza. Qualidade sempre igual, e o atendimento no WhatsApp é ótimo.`, `Achei que o salto ia incomodar, mas é super estável. Vale muito pelo preço.`];
    const rv = Array.from({ length: 4 }, (_, k) => ({ n: names[(p.id + k) % names.length], t: texts[(p.id + k * 3) % texts.length], s: k === 3 ? 4 : 5, d: ['há 3 dias', 'há 1 semana', 'há 2 semanas', 'há 1 mês'][k], tam: CFG.SIZES[(p.id + k) % 6] }));
    const dist = [78, 16, 4, 1, 1];
    $('#reviews-summary').innerHTML = `<div class="reviews-summary__big">${p.rating.toFixed(1)}</div><div>${stars(p.rating)}<div class="small muted mt-8">${p.reviews} avaliações · 96% recomendam</div></div><ul class="pdp-reviews__bars" style="grid-column:1/-1">${dist.map((v, k) => `<li><span>${5 - k}★</span><i><b style="width:${v}%"></b></i><span>${v}%</span></li>`).join('')}</ul>`;
    $('#reviews-list').innerHTML = rv.map(r => `<div class="pdp-review"><div class="pdp-review__head"><div>${stars(r.s)} <b>${r.n}</b> <span class="review__verified">${I.check} compra verificada</span></div><small>${r.d}</small></div><p>${r.t}</p><div class="pdp-review__meta"><span>Tamanho ${r.tam}</span><span>Cor ${esc(p.color)}</span><span>Forma: tamanho certo</span></div></div>`).join('');
    // relacionados
    const complete = P.filter(x => x.id !== p.id && x.type !== p.type && Math.abs(x.price - p.price) < 80).sort((a, b) => b.best - a.best).slice(0, 8);
    const also = P.filter(x => x.id !== p.id && x.sub === p.sub && !p.family.includes(x.id)).concat(P.filter(x => x.cat === p.cat && x.id !== p.id)).filter((x, i, a) => a.indexOf(x) === i).slice(0, 8);
    $('#complete').innerHTML = complete.map(x => productCard(x)).join('');
    $('#also').innerHTML = also.map(x => productCard(x)).join('');
    const recent = seen.list().filter(x => x.id !== p.id).slice(0, 8);
    if (recent.length) { $('#recent-wrap').hidden = false; $('#recent').innerHTML = recent.map(x => productCard(x)).join(''); }
    // tabela de tamanhos
    $('#size-table-body').innerHTML = [['34', '23'], ['35', '23,5'], ['36', '24'], ['37', '24,5'], ['38', '25'], ['39', '25,5']].map(([s, cm]) => `<tr><td>${s}</td><td>${cm} cm</td><td>${(parseFloat(cm.replace(',', '.')) - 0.5).toString().replace('.', ',')} – ${cm} cm</td></tr>`).join('');
    initRails();
  };

  /* ---------- CARRINHO ---------- */
  pages.carrinho = () => {
    const render = () => {
      const list = $('#cart-list'), side = $('#cart-side');
      if (!cart.items.length) {
        list.innerHTML = `<div class="cart-empty">${I.bag}<h3 style="font-family:var(--font-ui);font-weight:500;font-size:20px;color:var(--texto);margin-bottom:6px">Sua sacola está vazia</h3><p>Salve seus favoritos ou comece pelos mais vendidos.</p><div class="flex mt-24" style="justify-content:center"><a class="btn" href="${url.cat('todos')}&sort=best">Ver mais vendidos</a><a class="btn btn--ghost" href="favoritos.html">Meus favoritos</a></div></div>`;
        side.innerHTML = ''; side.hidden = true; return;
      }
      side.hidden = false;
      list.innerHTML = shipBar() + `<div class="cart-table">` + cart.items.map(i => { const p = byId[i.id]; return cartItemHTML(i).replace('</div></div>', `<button type="button" class="cart-item__remove" data-remove>${I.trash.replace('<svg', '<svg style="width:14px;height:14px;display:inline;vertical-align:-2px;margin-right:4px;stroke:currentColor;fill:none;stroke-width:1.8"')} Remover</button></div></div>`); }).join('') + `</div>`;
      bindCartControls(list);
      const c = cart.coupon;
      side.innerHTML = `<h3>Resumo do pedido</h3>
        <div class="summary-row"><span>Subtotal (${cart.count()} ${cart.count() > 1 ? 'itens' : 'item'})</span><span class="price">${money(cart.subtotal())}</span></div>
        ${cart.discount() ? `<div class="summary-row" style="color:var(--ok)"><span>Cupom ${c}</span><span>− ${money(cart.discount())}</span></div>` : ''}
        <div class="summary-row"><span>Frete</span><span>${cart.shipFree() ? '<span style="color:var(--ok)">Grátis</span>' : '<span class="muted small">calculado no checkout</span>'}</span></div>
        <div class="summary-row summary-row--total"><span>Total</span><span class="price">${money(cart.total())}</span></div>
        <div class="small muted" style="text-align:right">ou ${inst(cart.total())}<br><span style="color:var(--ok)">${money(cart.total() * (1 - CFG.PIX_OFF))} no Pix</span></div>
        <form class="coupon" id="coupon-form"><input type="text" placeholder="Cupom de desconto" id="coupon-input" value="${c || ''}" aria-label="Cupom"><button class="btn btn--ghost btn--sm" type="submit">Aplicar</button></form>
        <div class="coupon-msg" id="coupon-msg"></div>
        <a class="btn btn--block btn--lg mt-16" href="checkout.html">Finalizar compra</a>
        <a class="link small" href="${url.cat('todos')}" style="margin:16px auto 0;display:table">Continuar comprando</a>
        <div class="secure">${I.lock} Compra 100% segura · dados protegidos</div>`;
      $('#coupon-form').addEventListener('submit', e => { e.preventDefault(); const r = cart.applyCoupon($('#coupon-input').value); const m = $('#coupon-msg'); m.textContent = r.msg; m.className = 'coupon-msg ' + (r.ok ? 'ok' : 'err'); if (r.ok) setTimeout(render, 600); });
    };
    render();
    document.addEventListener('cart:change', render);
    $('#cart-upsell').innerHTML = P.filter(p => p.best && !cart.items.some(i => i.id === p.id)).slice(0, 8).map(p => productCard(p)).join('');
    initRails();
  };

  /* ---------- CHECKOUT ---------- */
  pages.checkout = () => {
    if (!cart.items.length) { location.replace('carrinho.html'); return; }
    const u = user.get() || {};
    let step = 0, ship = { opt: null, price: 0 }, pay = 'pix';
    const steps = $$('.checkout-steps button'), panels = $$('.step');
    const show = n => { step = n; steps.forEach((b, i) => { b.classList.toggle('is-on', i === n); b.classList.toggle('is-done', i < n); }); panels.forEach((p, i) => p.classList.toggle('is-on', i === n)); window.scrollTo({ top: 0, behavior: 'smooth' }); renderSummary(); };
    steps.forEach((b, i) => b.addEventListener('click', () => { if (i < step) show(i); }));
    // prefill
    if (u.name) { $('#f-nome').value = u.name; $('#f-email').value = u.email || ''; }
    // máscaras
    const mask = (el, fn) => el.addEventListener('input', () => el.value = fn(el.value));
    mask($('#f-cpf'), v => v.replace(/\D/g, '').slice(0, 11).replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2'));
    mask($('#f-tel'), v => v.replace(/\D/g, '').slice(0, 11).replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2'));
    mask($('#f-cep'), v => v.replace(/\D/g, '').slice(0, 8).replace(/^(\d{5})(\d)/, '$1-$2'));
    mask($('#c-num'), v => v.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 '));
    mask($('#c-val'), v => v.replace(/\D/g, '').slice(0, 4).replace(/^(\d{2})(\d)/, '$1/$2'));
    mask($('#c-cvv'), v => v.replace(/\D/g, '').slice(0, 4));
    const valid = ids => { let ok = true; ids.forEach(id => { const el = $('#' + id), f = el.closest('.field'); const bad = !el.value.trim() || (el.type === 'email' && !/^\S+@\S+\.\S+$/.test(el.value)); f.classList.toggle('is-error', bad); if (bad) ok = false; }); return ok; };
    // CEP lookup (demo)  // API: trocar por consulta ViaCEP/Correios
    const CEPS = { 74: ['Goiânia', 'GO'], 75: ['Anápolis', 'GO'], '01': ['São Paulo', 'SP'], '02': ['São Paulo', 'SP'], '03': ['São Paulo', 'SP'], '04': ['São Paulo', 'SP'], '05': ['São Paulo', 'SP'], 20: ['Rio de Janeiro', 'RJ'], 21: ['Rio de Janeiro', 'RJ'], 22: ['Rio de Janeiro', 'RJ'], 30: ['Belo Horizonte', 'MG'], 31: ['Belo Horizonte', 'MG'], 40: ['Salvador', 'BA'], 41: ['Salvador', 'BA'], 50: ['Recife', 'PE'], 60: ['Fortaleza', 'CE'], 70: ['Brasília', 'DF'], 80: ['Curitiba', 'PR'], 90: ['Porto Alegre', 'RS'] };
    $('#f-cep').addEventListener('blur', () => {
      const cep = $('#f-cep').value.replace(/\D/g, ''); if (cep.length !== 8) return;
      const c = CEPS[cep.slice(0, 2)] || ['Sua cidade', 'UF'];
      $('#f-cidade').value = c[0]; $('#f-uf').value = c[1]; if (!$('#f-rua').value) { $('#f-rua').value = cep.startsWith('74') ? 'Rua T-63' : 'Rua das Flores'; $('#f-bairro').value = cep.startsWith('74') ? 'Setor Bueno' : 'Centro'; }
      $('#f-num').focus();
      const free = cart.shipFree(); const go = cep.startsWith('74') || cep.startsWith('75');
      const opts = go ? [['exp', 'Entrega expressa em Goiânia', 'Chega amanhã', free ? 0 : 12.9], ['loja', 'Retirar na loja', 'Setor Centro Oeste · pronto em 2h', 0]] : [['pac', 'PAC', 'Chega em 5 a 8 dias úteis', free ? 0 : 19.9], ['sedex', 'SEDEX', 'Chega em 2 a 4 dias úteis', 34.9]];
      $('#ship-opts').innerHTML = opts.map((o, i) => `<label class="pay-method ${i === 0 ? 'is-on' : ''}" data-opt="${o[0]}" data-price="${o[3]}"><div class="pay-method__head"><span class="radio"></span>${I.truck}<div><div>${o[1]}</div><div class="small muted" style="font-weight:400">${o[2]}</div></div><span class="tag" style="${o[3] ? 'color:var(--texto);background:var(--off)' : ''}">${o[3] ? money(o[3]) : 'Grátis'}</span></div></label>`).join('');
      ship = { opt: opts[0][1], price: opts[0][3] }; $('#ship-opts').hidden = false; $('#ship-hint').hidden = true; renderSummary();
      $$('#ship-opts .pay-method').forEach(l => l.addEventListener('click', () => { $$('#ship-opts .pay-method').forEach(x => x.classList.toggle('is-on', x === l)); ship = { opt: $('div div', l).textContent, price: +l.dataset.price }; renderSummary(); }));
    });
    $('#to-step-2').addEventListener('click', () => { if (valid(['f-nome', 'f-email', 'f-cpf', 'f-tel'])) show(1); });
    $('#to-step-3').addEventListener('click', () => { if (!valid(['f-cep', 'f-rua', 'f-num', 'f-bairro', 'f-cidade', 'f-uf'])) return; if (!ship.opt) { toast(`${I.info}<span>Escolha uma forma de entrega.</span>`); return; } show(2); });
    $('#back-1').addEventListener('click', () => show(0)); $('#back-2').addEventListener('click', () => show(1));
    $$('#pay-methods .pay-method').forEach(l => l.addEventListener('click', () => { $$('#pay-methods .pay-method').forEach(x => x.classList.toggle('is-on', x === l)); pay = l.dataset.pay; renderSummary(); }));
    $('#coupon-form-ck').addEventListener('submit', e => { e.preventDefault(); const r = cart.applyCoupon($('#coupon-ck').value); const m = $('#coupon-msg-ck'); m.textContent = r.msg; m.className = 'coupon-msg ' + (r.ok ? 'ok' : 'err'); renderSummary(); });
    const total = () => { const t = cart.total(ship.price); return pay === 'pix' ? t * (1 - CFG.PIX_OFF) : t; };
    function renderSummary() {
      $('#ck-items').innerHTML = cart.items.map(i => cartItemHTML(i).replace(/<div class="qty">.*?<\/div>/, `<span class="small muted">Qtd. ${i.qty}</span>`)).join('');
      $('#ck-sub').textContent = money(cart.subtotal());
      $('#ck-disc-row').hidden = !cart.discount(); $('#ck-disc').textContent = '− ' + money(cart.discount());
      $('#ck-ship').textContent = ship.opt ? (cart.shipFree() && ship.price === 0 ? 'Grátis' : ship.price ? money(ship.price) : 'Grátis') : 'a calcular';
      $('#ck-pix-row').hidden = pay !== 'pix'; $('#ck-pix').textContent = '− ' + money(cart.total(ship.price) * CFG.PIX_OFF);
      $('#ck-total').textContent = money(total());
      $('#ck-inst').textContent = pay === 'pix' ? 'à vista no Pix' : `ou ${inst(total())}`;
    }
    $('#place-order').addEventListener('click', () => {
      if (pay === 'card' && !valid(['c-num', 'c-nome', 'c-val', 'c-cvv'])) return;
      const btn = $('#place-order'); btn.disabled = true; btn.textContent = 'Processando pagamento…';
      // API: enviar pedido ao back-end / gateway
      setTimeout(() => {
        const n = 'ALZ' + String(Date.now()).slice(-6);
        const order = { n, date: new Date().toISOString(), items: cart.items.slice(), total: total(), pay, ship, name: $('#f-nome').value, email: $('#f-email').value, address: `${$('#f-rua').value}, ${$('#f-num').value} – ${$('#f-bairro').value}, ${$('#f-cidade').value}/${$('#f-uf').value}`, coupon: cart.coupon };
        const orders = store.get('aluzza_orders', []); orders.unshift(order); store.set('aluzza_orders', orders);
        if (!user.get()) user.set({ name: order.name, email: order.email });
        cart.clear(); location.href = `pedido.html?n=${n}`;
      }, 1600);
    });
    renderSummary();
  };

  /* ---------- PEDIDO (confirmação) ---------- */
  pages.pedido = () => {
    const n = qs().n; const o = store.get('aluzza_orders', []).find(x => x.n === n) || store.get('aluzza_orders', [])[0];
    if (!o) { $('#confirm').innerHTML = `<h1>Pedido não encontrado</h1><p>Confira o número do pedido ou acesse a sua conta.</p><div class="confirm__actions"><a class="btn" href="conta.html">Minha conta</a></div>`; return; }
    $('#order-num').textContent = 'Pedido ' + o.n; $('#order-name').textContent = o.name.split(' ')[0];
    $('#order-mail').textContent = o.email; $('#order-addr').textContent = o.address; $('#order-ship').textContent = o.ship.opt || 'Entrega padrão';
    $('#order-items').innerHTML = o.items.map(i => cartItemHTML(i).replace(/<div class="qty">.*?<\/div>/, `<span class="small muted">Qtd. ${i.qty}</span>`)).join('');
    $('#order-total').textContent = money(o.total);
    $('#pix-box').hidden = o.pay !== 'pix';
    $('#order-pay').textContent = { pix: 'Pix (5% de desconto aplicado)', card: `Cartão de crédito em até ${CFG.INSTALLMENTS}x sem juros`, boleto: 'Boleto bancário' }[o.pay];
    const copy = $('#copy-pix'); copy && copy.addEventListener('click', () => { const t = $('#pix-code').textContent; (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => toast(`${I.check}<span>Código Pix copiado</span>`)).catch(() => { const r = document.createRange(); r.selectNodeContents($('#pix-code')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); toast(`${I.info}<span>Selecione e copie o código</span>`); }); });
    $('#wa-share').href = `https://wa.me/${CFG.WHATS}?text=${encodeURIComponent(`Oi! Acabei de fazer o pedido ${o.n} no site. Pode me confirmar o prazo?`)}`;
  };

  /* ---------- LOGIN ---------- */
  pages.login = () => {
    const tabs = $$('.tabs button'), forms = [$('#form-login'), $('#form-cad')];
    tabs.forEach((t, i) => t.addEventListener('click', () => { tabs.forEach((x, k) => x.classList.toggle('is-on', k === i)); forms.forEach((f, k) => f.hidden = k !== i); }));
    if (qs().cadastro) tabs[1].click();
    const go = () => { const back = qs().next || 'conta.html'; location.href = back; };
    forms[0].addEventListener('submit', e => { e.preventDefault(); const email = $('#l-email').value; const nome = email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()); user.set({ name: nome, email }); toast(`${I.check}<span>Bem-vinda de volta, ${nome.split(' ')[0]}!</span>`); setTimeout(go, 600); }); // API: autenticação real
    forms[1].addEventListener('submit', e => { e.preventDefault(); user.set({ name: $('#c-nome-cad').value, email: $('#c-email-cad').value }); toast(`${I.check}<span>Conta criada! Seu cupom ${CFG.FIRST_COUPON} já está liberado.</span>`); setTimeout(go, 700); });
    const forgot = $('.auth__row a'); forgot && forgot.addEventListener('click', e => { e.preventDefault(); toast(`${I.check}<span>Enviamos um link de redefinição para o seu e-mail.</span>`); });
    $$('.btn--google').forEach(b => b.addEventListener('click', () => { user.set({ name: 'Mariana Souza', email: 'mariana@gmail.com' }); toast(`${I.check}<span>Conectada com o Google</span>`); setTimeout(go, 600); }));
  };

  /* ---------- CONTA ---------- */
  pages.conta = () => {
    const u = user.get(); if (!u) { location.replace('login.html?next=conta.html'); return; }
    $('#acc-name').textContent = u.name; $('#acc-email').textContent = u.email; $('#acc-ini').textContent = u.name.split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase();
    $('#acc-hello').textContent = `Olá, ${u.name.split(' ')[0]}`;
    const nav = $$('.account__nav [data-panel]'), panels = $$('.account__panel');
    const show = id => { nav.forEach(b => b.classList.toggle('is-on', b.dataset.panel === id)); panels.forEach(p => p.classList.toggle('is-on', p.id === 'panel-' + id)); };
    nav.forEach(b => b.addEventListener('click', () => show(b.dataset.panel)));
    show(location.hash.slice(1) || 'pedidos');
    $('#logout').addEventListener('click', () => { user.out(); toast(`${I.check}<span>Você saiu da conta</span>`); setTimeout(() => location.href = 'index.html', 500); });
    // pedidos: reais (localStorage) + exemplos
    const demo = [{ n: 'ALZ204118', date: '2026-10-02', items: [{ id: 2046, size: '37', qty: 1 }, { id: 2070, size: '37', qty: 1 }], total: 499.9, status: 'ok' }, { n: 'ALZ203877', date: '2026-08-19', items: [{ id: 1972, size: '36', qty: 2 }], total: 320, status: 'ok' }].map(o => ({ ...o, items: o.items.filter(i => byId[i.id]) })).filter(o => o.items.length);
    const orders = store.get('aluzza_orders', []).map(o => ({ ...o, status: 'wait' })).concat(demo);
    const st = { ok: ['status--ok', 'Entregue'], ship: ['status--ship', 'A caminho'], wait: ['status--wait', 'Aguardando pagamento'] };
    $('#orders').innerHTML = orders.map(o => `<div class="order-card"><div class="order-card__head"><div><b>${o.n}</b><small>${new Date(o.date).toLocaleDateString('pt-BR')}</small></div><span class="status ${st[o.status][0]}">${st[o.status][1]}</span></div><div class="order-card__items">${o.items.map(i => byId[i.id] ? `<img src="${mainImg(byId[i.id])}" alt="${esc(byId[i.id].name)}" title="${esc(byId[i.id].name)} · ${i.size}">` : '').join('')}</div><div class="order-card__foot"><span>${o.items.reduce((a, i) => a + i.qty, 0)} ${o.items.reduce((a, i) => a + i.qty, 0) > 1 ? 'itens' : 'item'} · <b class="price">${money(o.total)}</b></span><div class="flex"><a class="link small" href="pedido.html?n=${o.n}">Ver detalhes</a>${o.status === 'ok' && byId[o.items[0].id] ? `<a class="link small" href="${url.product(byId[o.items[0].id])}">Comprar de novo</a>` : ''}</div></div></div>`).join('');
    $('#d-nome').value = u.name; $('#d-email').value = u.email;
    $$('#panel-enderecos .address-card button, #panel-enderecos .btn').forEach(b => b.addEventListener('click', () => openModal('#modal-endereco')));
    $('#form-endereco') && $('#form-endereco').addEventListener('submit', e => { e.preventDefault(); closeModal($('#modal-endereco')); toast(`${I.check}<span>Endereço salvo</span>`); });
    $('#form-dados').addEventListener('submit', e => { e.preventDefault(); user.set({ ...u, name: $('#d-nome').value, email: $('#d-email').value }); toast(`${I.check}<span>Dados atualizados</span>`); });
    const w = wish.ids.map(i => byId[i]).filter(Boolean);
    $('#acc-wish').innerHTML = w.length ? w.map(p => productCard(p)).join('') : `<div class="wish-empty" style="grid-column:1/-1">${I.heart}<p>Você ainda não salvou favoritos.</p></div>`;
  };

  /* ---------- FAVORITOS ---------- */
  pages.favoritos = () => {
    const render = () => { const w = wish.ids.map(i => byId[i]).filter(Boolean); $('#wish-count-title').textContent = w.length ? `${w.length} ${w.length > 1 ? 'modelos salvos' : 'modelo salvo'}` : 'Nenhum modelo salvo ainda'; $('#wish-grid').innerHTML = w.length ? w.map(p => productCard(p)).join('') : `<div class="wish-empty" style="grid-column:1/-1">${I.heart}<p>Toque no coração de um produto para salvar aqui.</p><a class="btn btn--ghost btn--sm mt-16" href="${url.cat('novidades')}">Ver novidades</a></div>`; };
    render(); document.addEventListener('click', e => { if (e.target.closest('.pcard__wish')) setTimeout(render, 50); });
    $('#wish-sug').innerHTML = P.filter(p => p.best && !wish.has(p.id)).slice(0, 8).map(p => productCard(p)).join(''); initRails();
  };

  /* ---------- CONTATO / AJUDA / SOBRE ---------- */
  pages.contato = () => { $('#contact-form').addEventListener('submit', e => { e.preventDefault(); e.target.hidden = true; $('#contact-ok').hidden = false; }); };
  pages.ajuda = () => { $('#track-form') && $('#track-form').addEventListener('submit', e => { e.preventDefault(); $('#track-result').hidden = false; }); };
  pages.sobre = () => { $('#sobre-prods').innerHTML = P.filter(p => p.best).slice(0, 8).map(p => productCard(p)).join(''); initRails(); };

  /* ------------------------------------------------------------------ mini-chat WhatsApp */
  function initWhatsChat() {
    const root = $('#wchat'); if (!root) return;
    const box = $('#wchat-box'), body = $('#wchat-body'), quick = $('#wchat-quick'), form = $('#wchat-form'), input = $('#wchat-input'), badge = $('#wchat-badge'), status = $('#wchat-status');
    const page = document.body.dataset.page; const q = qs(); const prod = page === 'produto' ? (bySlug[q.p] || null) : null;
    const now = () => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const scroll = () => { body.scrollTop = body.scrollHeight; };
    const bubble = (text, who) => { const d = document.createElement('div'); d.className = 'wchat__msg wchat__msg--' + who; d.innerHTML = `<p>${text}</p><time>${now()}${who === 'me' ? ' ✓✓' : ''}</time>`; body.appendChild(d); scroll(); return d; };
    const typing = ms => new Promise(r => { const t = document.createElement('div'); t.className = 'wchat__msg wchat__msg--agent wchat__typing'; t.innerHTML = '<i></i><i></i><i></i>'; body.appendChild(t); status.textContent = 'digitando…'; scroll(); setTimeout(() => { t.remove(); status.textContent = 'online agora'; r(); }, ms); });
    const waLink = msg => `https://wa.me/${CFG.WHATS}?text=${encodeURIComponent(msg)}`;
    let started = false, open = false;
    const hello = prod ? `Oi! Eu sou a Lívia, do atendimento da Aluzza 😊 Vi que você está olhando o <b>${esc(prod.name)} ${esc(prod.color)}</b>.` : 'Oi! Eu sou a Lívia, do atendimento da Aluzza 😊';
    const chips = [prod ? 'Qual tamanho eu peço?' : 'Dúvida de tamanho', 'Status do meu pedido', 'Troca ou devolução', prod ? 'Tem em outra cor?' : 'Quero ajuda para escolher'];
    async function start() {
      started = true;
      await typing(1200); bubble(hello, 'agent');
      await typing(1600); bubble('Posso te ajudar com tamanho, pedido ou a escolher um modelo. Me conta o que você precisa e eu continuo com você pelo WhatsApp, tá?', 'agent');
      quick.innerHTML = chips.map(c => `<button type="button">${c}</button>`).join('');
      $$('button', quick).forEach(b => b.addEventListener('click', () => send(b.textContent)));
    }
    async function send(text) {
      text = (text || '').trim(); if (!text) return;
      quick.innerHTML = ''; bubble(esc(text), 'me'); input.value = '';
      const ctx = prod ? ` Estou vendo o ${prod.name} ${prod.color} (cód. ${prod.id}).` : '';
      const msg = `Oi, Lívia! Vim pelo site da Aluzza.${ctx} ${text}`;
      await typing(1400);
      const d = bubble(`Perfeito! Já estou com a sua conversa aqui. Toque no botão abaixo para continuar comigo no WhatsApp, respondo em instantes.`, 'agent');
      const a = document.createElement('a'); a.className = 'wchat__cta'; a.href = waLink(msg); a.target = '_blank'; a.rel = 'noopener'; a.innerHTML = `${I.whats} Continuar no WhatsApp`; d.appendChild(a); scroll();
    }
    const toggle = o => { open = o; root.classList.toggle('is-open', o); badge.hidden = true; if (o) { if (!started) start(); setTimeout(() => input.focus(), 400); } };
    $('#wchat-toggle').addEventListener('click', () => toggle(!open));
    $('#wchat-close').addEventListener('click', () => toggle(false));
    form.addEventListener('submit', e => { e.preventDefault(); if (!started) { start().then(() => send(input.value)); } else send(input.value); });
    // chama atenção depois de um tempo, uma vez por sessão
    if (!sess.get('aluzza_wchat_nudge')) setTimeout(() => { if (!open) { badge.hidden = false; root.classList.add('is-nudge'); sess.set('aluzza_wchat_nudge', '1'); } }, 9000);
  }

  /* ------------------------------------------------------------------ boot */
  document.addEventListener('DOMContentLoaded', () => {
    document.documentElement.classList.remove('no-js');
    renderHeader(); renderFooter();
    initPreloader();
    const page = document.body.dataset.page; if (pages[page]) pages[page]();
    initRails(); initReveal();
    const pg = document.querySelector('.page'); if (!$('#preloader') && pg) { pg.classList.add('page-fade'); pg.addEventListener('animationend', () => pg.classList.remove('page-fade'), { once: true }); }
    // newsletter forms genéricas
    $$('[data-newsletter]').forEach(f => f.addEventListener('submit', e => { e.preventDefault(); store.set('aluzza_news', true); f.innerHTML = `<p style="color:var(--ok);font-weight:500">${I.check.replace('<svg', '<svg style="width:18px;height:18px;display:inline;vertical-align:-3px;stroke:currentColor;fill:none;stroke-width:2"')} Pronto! Seu cupom ${CFG.FIRST_COUPON} vale na primeira compra.</p>`; }));
    $$('[data-open-modal]').forEach(b => b.addEventListener('click', () => openModal(b.dataset.openModal)));
    // rótulo dos selects customizados acompanha a opção escolhida
    $$('.select select').forEach(sel => { const lab = sel.nextElementSibling; const sync = () => { if (lab && lab.tagName === 'SPAN' && sel.selectedIndex >= 0 && !sel.dataset.keepLabel) lab.textContent = sel.options[sel.selectedIndex].text; }; sel.addEventListener('change', sync); if (sel.id !== 'sort' || qs().sort) sync(); });
    initWhatsChat();
  });

  window.Aluzza = { cart, wish, user, productCard, money, P, CFG, openModal, toast, I };
})();
