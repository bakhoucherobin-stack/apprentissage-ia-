/* =========================================================
   PIZZA FOOD — aperçu 3D de la commande (Three.js r128)
   Chaque pizza est modelée en relief : pâte épaisse au bord
   gonflé et irrégulier, fromage bombé (le relief suit la
   vraie photo de la pizza), mie alvéolée visible sur les
   coupes, filaments de fromage qui s'étirent et coulent
   quand les parts se séparent, vapeur qui monte.
   ========================================================= */
(() => {
  'use strict';
  const T = window.THREE;
  const P = window.PF_PIZZA;

  const SIZE_R = { Junior: 1.0, Senior: 1.22, Mega: 1.45 };
  const TAU = Math.PI * 2;
  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  const mix = (a, b, t) => a + (b - a) * t;
  const ease = t => 1 - Math.pow(1 - t, 3);
  const bounce = t => {
    const n = 7.5625, d = 2.75;
    if (t < 1 / d) return n * t * t;
    if (t < 2 / d) return n * (t -= 1.5 / d) * t + .75;
    if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + .9375;
    return n * (t -= 2.625 / d) * t + .984375;
  };
  const rgb = h => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  const loadImg = src => new Promise(res => { if (!src) return res(null); const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
  const tick = () => new Promise(r => setTimeout(r, 0));

  /* ---------- Bruit procédural (valeur, fbm, cellules) ---------- */
  function hash(i, j, s) {
    let n = (Math.imul(i, 374761393) + Math.imul(j, 668265263) + Math.imul(s, 1442695041)) | 0;
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }
  function noise(x, y, s, p) {
    let xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    let xj = xi + 1, yj = yi + 1;
    if (p) { const m = q => ((q % p) + p) % p; xi = m(xi); yi = m(yi); xj = m(xj); yj = m(yj); }
    const a = hash(xi, yi, s), b = hash(xj, yi, s), c = hash(xi, yj, s), d = hash(xj, yj, s);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function fbm(x, y, s, o = 4, p) {
    let t = 0, a = .5, f = 1, n = 0;
    for (let i = 0; i < o; i++) { t += a * noise(x * f, y * f, s + i * 17, p ? p * f : 0); n += a; a *= .5; f *= 2; }
    return t / n;
  }
  let WID = 0;
  function worley(x, y, s) {
    const xi = Math.floor(x), yi = Math.floor(y);
    let d1 = 9;
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
      const cx = xi + i, cy = yi + j;
      const dx = cx + hash(cx, cy, s) - x, dy = cy + hash(cx, cy, s + 7) - y, d = dx * dx + dy * dy;
      if (d < d1) { d1 = d; WID = hash(cx, cy, s + 13); }
    }
    return Math.sqrt(d1);
  }

  /* ---------- Forme du bord (en rayon de pizza = 1) ---------- */
  const D = 1.04;                       // la texture couvre un disque un peu plus large que la pizza
  const RIM = { rc: .91, a: .09, yc: .1, bLo: .1 };
  const RF = RIM.rc - RIM.a;            // pied intérieur du bord (.82)
  const CHEESE_Y = .108;
  const LUT = 720;
  // Bord fait main : un peu ovale, gonflé par endroits (périodique autour de la pizza)
  function rimLUT(seed) {
    const wob = new Float32Array(LUT), up = new Float32Array(LUT);
    for (let i = 0; i < LUT; i++) {
      const th = i / LUT * TAU, c = Math.cos(th), s = Math.sin(th);
      wob[i] = 1 + (fbm(c * 1.4 + 3, s * 1.4 + 3, seed, 3) - .5) * .06;
      up[i] = .15 * (1 + (fbm(c * 2.4 + 9, s * 2.4 + 9, seed + 5, 3) - .5) * .9);
    }
    return th => {
      let f = ((th % TAU) + TAU) % TAU / TAU * LUT;
      const i = Math.floor(f) % LUT, j = (i + 1) % LUT; f -= Math.floor(f);
      return { wob: wob[i] + (wob[j] - wob[i]) * f, bUp: up[i] + (up[j] - up[i]) * f };
    };
  }

  /* ---------- Surface d'une pizza : couleur, relief et brillance ----------
     Avec la photo du produit, le relief est déduit de la photo
     (le fromage clair gonfle, la sauce se creuse). */
  function buildSurface(rec, img, seed, S) {
    const col = P.SAUCES[rec.sauce] || P.SAUCES.tomato;
    const sA = rgb(col.sauce), sB = rgb(col.dark), cC = rgb(col.cheese);
    const rim = rimLUT(seed);
    let photo = null;
    if (img) {
      const c = document.createElement('canvas'); c.width = c.height = S;
      const g = c.getContext('2d');
      const half = (RF + .07) / D * S / 2;
      g.drawImage(img, S / 2 - half, S / 2 - half, half * 2, half * 2);
      const id = g.getImageData(0, 0, S, S), src = id.data, out = new Uint8ClampedArray(src);
      // netteté : la photo d'origine est petite, on accentue ses détails une fois agrandie
      for (let y = 1; y < S - 1; y++) for (let x = 1; x < S - 1; x++) {
        const o = (y * S + x) * 4;
        for (let c = 0; c < 3; c++) {
          const n = src[o - 4 + c] + src[o + 4 + c] + src[o - S * 4 + c] + src[o + S * 4 + c];
          out[o + c] = src[o + c] + (src[o + c] - n / 4) * 1.1;
        }
      }
      photo = out;
    }
    const mk = () => { const c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d'); return { c, g, d: g.createImageData(S, S) }; };
    const C = mk(), B = mk(), Rg = mk();
    const G = 96, H = new Float32Array(G * G), Hn = new Float32Array(G * G);
    const herbs = rec.toppings.includes('oregano') || rec.toppings.includes('basil');
    for (let py = 0; py < S; py++) {
      const v = (2 * (py + .5) / S - 1) * D;
      for (let px = 0; px < S; px++) {
        const u = (2 * (px + .5) / S - 1) * D;
        const o = (py * S + px) * 4;
        const rho = Math.sqrt(u * u + v * v);
        if (rho > D) { C.d.data[o] = 190; C.d.data[o + 1] = 120; C.d.data[o + 2] = 56; C.d.data[o + 3] = 255; B.d.data[o] = B.d.data[o + 1] = B.d.data[o + 2] = 128; B.d.data[o + 3] = 255; Rg.d.data[o] = Rg.d.data[o + 1] = Rg.d.data[o + 2] = 204; Rg.d.data[o + 3] = 255; continue; }
        const th = Math.atan2(u, v);
        const rn = rho / rim(th).wob;
        let r = 0, g = 0, b = 0, h = .5, ro = .5, cm = 1;
        // ----- zone garnie -----
        if (rn < RF + .06) {
          const en = rn > RF - .08 ? fbm(u * 9, v * 9, seed + 40, 3) : .5;
          cm = smooth(RF - .016 + (en - .5) * .06, RF + .012 + (en - .5) * .06, rn);
          let tr, tg, tb, th2, tro;
          if (photo) {
            tr = photo[o]; tg = photo[o + 1]; tb = photo[o + 2];
            const lum = (tr * .3 + tg * .55 + tb * .15) / 255;
            // photo un peu plus riche : saturation et contraste, hautes lumières retenues
            const L0 = lum * 255;
            tr = clamp(L0 + (tr - L0) * 1.3, 0, 255); tg = clamp(L0 + (tg - L0) * 1.3, 0, 255); tb = clamp(L0 + (tb - L0) * 1.3, 0, 255);
            const knee = q => q > 196 ? 196 + (q - 196) * .45 : q;
            tr = knee(tr - 6); tg = knee(tg - 9); tb = knee(tb - 14);
            // un peu de sauce visible au ras du bord, comme au sortir du four
            const ring = smooth(RF - .06, RF, rn) * .45;
            tr = mix(tr, sA[0], ring); tg = mix(tg, sA[1], ring); tb = mix(tb, sA[2], ring);
            th2 = lum; tro = .62 - lum * .32;
          } else {
            const n1 = fbm(u * 3.2, v * 3.2, seed, 4), n2 = fbm(u * 11, v * 11, seed + 3, 3);
            const cov = smooth(.42, .5, n1 * .75 + n2 * .25 + .1 - Math.max(0, rn - .6) * .7);
            const sv = fbm(u * 7, v * 7, seed + 11, 3);
            const sr = mix(sA[0], sB[0], sv * .7), sg = mix(sA[1], sB[1], sv * .7), sb = mix(sA[2], sB[2], sv * .7);
            let cr = mix(255, cC[0], n2 * .8), cg = mix(244, cC[1], n2 * .8), cb = mix(200, cC[2], n2 * .8);
            // bulles dorées du gratiné
            const d = worley(u * 15, v * 15, seed + 21), id = WID;
            const bub = id > .45 ? smooth(.42, .12, d) : 0;
            const ringB = bub * (1 - bub) * 4;
            const toast = smooth(.6, .78, fbm(u * 5 + 7, v * 5 + 7, seed + 9, 3));
            cr = mix(cr, 196, toast * .6 + ringB * .5); cg = mix(cg, 128, toast * .6 + ringB * .5); cb = mix(cb, 52, toast * .6 + ringB * .5);
            tr = mix(sr, cr, cov); tg = mix(sg, cg, cov); tb = mix(sb, cb, cov);
            // huile orangée au bord du fromage
            const oil = cov * (1 - cov) * 4;
            tr = mix(tr, 236, oil * .35); tg = mix(tg, 120, oil * .35); tb = mix(tb, 20, oil * .35);
            if (herbs && hash(px, py, seed + 3) > .992) { tr = 46; tg = 110; tb = 40; }
            th2 = cov * (.55 + n2 * .35) + bub * .35 + .1;
            tro = mix(.55, .3, cov) - oil * .15;
          }
          r = tr; g = tg; b = tb; h = th2; ro = tro;
          const gi = Math.min(G - 1, (px * G / S) | 0), gj = Math.min(G - 1, (py * G / S) | 0);
          H[gj * G + gi] += th2; Hn[gj * G + gi]++;
        }
        // ----- croûte -----
        if (cm > 0) {
          const t = (rn - RF) / (2 * RIM.a);
          const bake = fbm(u * 6, v * 6, seed + 7, 3);
          const crown = clamp(1 - Math.abs(t - .42) / .6);
          let br = clamp(crown * (.45 + bake * 1.1) - .1);
          let cr = mix(228, 150, br), cg = mix(164, 78, br), cb = mix(84, 28, br);
          // pied du bord plus clair, là où la pâte touchait le fromage
          const foot = smooth(.16, 0, t) * .45;
          cr = mix(cr, 240, foot); cg = mix(cg, 196, foot); cb = mix(cb, 120, foot);
          // taches « léopard » du four
          const d = worley(u * 30, v * 30, seed + 9), id = WID;
          if (id > .78) { const k = smooth(.26, .07, d) * (.4 + crown * .6); cr = mix(cr, 88, k); cg = mix(cg, 42, k); cb = mix(cb, 16, k); }
          // pores de la pâte + farine
          const pore = smooth(.72, .86, noise(u * 70, v * 70, seed + 2));
          cr *= 1 - pore * .04; cg *= 1 - pore * .05; cb *= 1 - pore * .06;
          if (hash(px, py, seed + 8) > .994) { cr = mix(cr, 250, .7); cg = mix(cg, 240, .7); cb = mix(cb, 222, .7); }
          const ch = .55 + (bake - .5) * .6 + (fbm(u * 22, v * 22, seed + 4, 2) - .5) * .35 - pore * .12;
          r = mix(r, cr, cm); g = mix(g, cg, cm); b = mix(b, cb, cm);
          h = mix(h, ch, cm); ro = mix(ro, .72 - br * .12, cm);
        }
        C.d.data[o] = r; C.d.data[o + 1] = g; C.d.data[o + 2] = b; C.d.data[o + 3] = 255;
        const hv = clamp(h) * 255;
        B.d.data[o] = B.d.data[o + 1] = B.d.data[o + 2] = hv; B.d.data[o + 3] = 255;
        Rg.d.data[o] = Rg.d.data[o + 1] = Rg.d.data[o + 2] = clamp(ro, .05, 1) * 255; Rg.d.data[o + 3] = 255;
      }
    }
    C.g.putImageData(C.d, 0, 0); B.g.putImageData(B.d, 0, 0); Rg.g.putImageData(Rg.d, 0, 0);
    // Relief du fromage pour la géométrie : centré, normalisé puis lissé
    let m = 0, n = 0;
    for (let i = 0; i < G * G; i++) if (Hn[i]) { H[i] /= Hn[i]; m += H[i]; n++; }
    m /= n || 1;
    let sd = 0; for (let i = 0; i < G * G; i++) if (Hn[i]) sd += (H[i] - m) ** 2;
    sd = Math.sqrt(sd / (n || 1)) || 1;
    const Hs = new Float32Array(G * G);
    for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) {
      let acc = 0, k = 0;
      for (let y = -1; y <= 1; y++) for (let x = -1; x <= 1; x++) {
        const ii = i + x, jj = j + y;
        if (ii < 0 || jj < 0 || ii >= G || jj >= G || !Hn[jj * G + ii]) continue;
        acc += clamp((H[jj * G + ii] - m) / sd, -2.4, 2.6); k++;
      }
      Hs[j * G + i] = k ? acc / k * .013 : 0;
    }
    const hAt = (u, v) => {
      const gx = clamp((u / D * .5 + .5) * G - .5, 0, G - 1.001), gy = clamp((v / D * .5 + .5) * G - .5, 0, G - 1.001);
      const i = gx | 0, j = gy | 0, fx = gx - i, fy = gy - j;
      const a = Hs[j * G + i], b = Hs[j * G + i + 1], c = Hs[(j + 1) * G + i], d = Hs[(j + 1) * G + i + 1];
      return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
    };
    const tex = (c, srgb) => { const t = new T.CanvasTexture(c); t.flipY = false; if (srgb) t.encoding = T.sRGBEncoding; return t; };
    return { map: tex(C.c, true), bump: tex(B.c), rough: tex(Rg.c), hAt, rim, seed };
  }

  /* ---------- Textures partagées : flanc de la croûte, mie, bois ---------- */
  function crustSideTextures() {
    const S = 256, c = document.createElement('canvas'), b = document.createElement('canvas');
    c.width = c.height = b.width = b.height = S;
    const g = c.getContext('2d'), gb = b.getContext('2d');
    const dc = g.createImageData(S, S), db = gb.createImageData(S, S);
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const u = x / S * 8, v = y / S * 8;
      const bake = fbm(u, v, 31, 4, 8), pore = smooth(.7, .86, noise(x / S * 48, y / S * 48, 5, 48));
      const br = clamp(bake * 1.2 - .25);
      const o = (y * S + x) * 4;
      dc.data[o] = mix(222, 150, br) * (1 - pore * .08); dc.data[o + 1] = mix(160, 78, br) * (1 - pore * .1); dc.data[o + 2] = mix(84, 30, br) * (1 - pore * .12); dc.data[o + 3] = 255;
      db.data[o] = db.data[o + 1] = db.data[o + 2] = clamp(.5 + (bake - .5) * .7 - pore * .15) * 255; db.data[o + 3] = 255;
    }
    g.putImageData(dc, 0, 0); gb.putImageData(db, 0, 0);
    const t1 = new T.CanvasTexture(c), t2 = new T.CanvasTexture(b);
    t1.encoding = T.sRGBEncoding;
    [t1, t2].forEach(t => { t.wrapS = t.wrapT = T.RepeatWrapping; });
    return { map: t1, bump: t2 };
  }
  // Coupe d'une part : dessous doré, mie alvéolée, filet de sauce, fromage fondu
  const crumbCache = {};
  function crumbTextures(sauce) {
    if (crumbCache[sauce]) return crumbCache[sauce];
    const W = 256, Hh = 128, YM = .32;
    const col = rgb((P.SAUCES[sauce] || P.SAUCES.tomato).sauce);
    const c = document.createElement('canvas'), b = document.createElement('canvas');
    c.width = b.width = W; c.height = b.height = Hh;
    const g = c.getContext('2d'), gb = b.getContext('2d');
    const dc = g.createImageData(W, Hh), db = gb.createImageData(W, Hh);
    for (let py = 0; py < Hh; py++) for (let px = 0; px < W; px++) {
      const rn = px / W * D, y = (py + .5) / Hh * YM;
      const o = (py * W + px) * 4;
      // alvéoles de la mie, plus grosses dans le bord
      const big = rn > RF ? 1.6 : 1;
      const d = worley(rn * 46 / big, y * 70 / big, 77);
      const hole = smooth(.34, .18, d);
      let r = mix(238, 196, hole), gg = mix(210, 150, hole), bb = mix(160, 96, hole), h = .6 - hole * .5;
      const skin = smooth(.024, .006, y);                          // dessous cuit
      r = mix(r, 178, skin); gg = mix(gg, 106, skin); bb = mix(bb, 46, skin);
      if (rn < RF + .01) {
        const sauceK = smooth(.068, .074, y) * (1 - smooth(.082, .088, y));
        r = mix(r, col[0], sauceK); gg = mix(gg, col[1], sauceK); bb = mix(bb, col[2], sauceK);
        const ch = smooth(.082, .09, y);
        r = mix(r, 255, ch); gg = mix(gg, mix(222, 196, smooth(.09, .14, y)), ch); bb = mix(bb, 120, ch); h = mix(h, .75, ch);
      } else {
        // peau dorée du bord gonflé
        const e = Math.hypot((rn - RIM.rc) / RIM.a, (y - RIM.yc) / (y > RIM.yc ? .15 : RIM.bLo));
        const k = smooth(.78, .95, e);
        r = mix(r, 196, k); gg = mix(gg, 120, k); bb = mix(bb, 50, k);
      }
      dc.data[o] = r; dc.data[o + 1] = gg; dc.data[o + 2] = bb; dc.data[o + 3] = 255;
      db.data[o] = db.data[o + 1] = db.data[o + 2] = clamp(h) * 255; db.data[o + 3] = 255;
    }
    g.putImageData(dc, 0, 0); gb.putImageData(db, 0, 0);
    const t1 = new T.CanvasTexture(c), t2 = new T.CanvasTexture(b);
    t1.flipY = t2.flipY = false; t1.encoding = T.sRGBEncoding;
    return (crumbCache[sauce] = { map: t1, bump: t2, YM });
  }
  function woodTextures() {
    const S = 1024, c = document.createElement('canvas'); c.width = c.height = S;
    const g = c.getContext('2d');
    const d = g.createImageData(S, S);
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const u = x / S, v = y / S;
      const warp = fbm(u * 3, v * 3, 51, 3) * 2.2;
      const ring = Math.sin((v * 26 + warp * 3 + fbm(u * 1.5, v * 9, 52, 2)) * Math.PI);
      const grain = noise(u * 6, v * 380, 53) * .5 + noise(u * 3, v * 120, 54) * .5;
      const k = clamp(.5 + ring * .22 + (grain - .5) * .5);
      const o = (y * S + x) * 4;
      d.data[o] = mix(96, 160, k); d.data[o + 1] = mix(50, 94, k); d.data[o + 2] = mix(22, 48, k); d.data[o + 3] = 255;
    }
    g.putImageData(d, 0, 0);
    // farine et semoule saupoudrées sur la planche
    for (let i = 0; i < 700; i++) {
      const a = Math.random() * TAU, r = Math.sqrt(Math.random()) * S * .48;
      g.fillStyle = Math.random() < .7 ? `rgba(250,240,220,${rand(.15, .45)})` : `rgba(235,190,90,${rand(.2, .5)})`;
      g.beginPath(); g.arc(S / 2 + Math.cos(a) * r, S / 2 + Math.sin(a) * r, rand(.5, 1.6), 0, 7); g.fill();
    }
    const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding;
    const b = new T.CanvasTexture(c);
    return { map: t, bump: b };
  }
  function softTexture() {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.4, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    return new T.CanvasTexture(c);
  }
  // Éclairage d'ambiance : une boîte à lumière chaude se reflète dans le fromage
  function studioEnv(renderer) {
    const env = new T.Scene();
    const room = new T.Mesh(new T.BoxGeometry(24, 14, 24), new T.MeshBasicMaterial({ color: 0x3a2418, side: T.BackSide }));
    room.position.y = 5; env.add(room);
    const panel = (w, h, c, k, pos) => {
      const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: c }));
      m.material.color.multiplyScalar(k); m.position.set(...pos); m.lookAt(0, 0, 0); env.add(m);
    };
    panel(9, 6, 0xfff0d8, 5, [-5, 9, 5]);
    panel(5, 7, 0xe4ecff, 2, [8, 5, -4]);
    panel(14, 2.5, 0xff8a3a, 1.6, [0, 1.5, 10]);
    panel(10, 10, 0xfff6e8, 1.2, [0, 12, 0]);
    const pm = new T.PMREMGenerator(renderer);
    const tex = pm.fromScene(env, .03).texture;
    pm.dispose();
    env.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
    return tex;
  }

  function labelTexture(text, sub, color = '#ffc700') {
    const c = document.createElement('canvas'); c.width = 512; c.height = 160;
    const g = c.getContext('2d');
    g.fillStyle = '#292a2c';
    g.beginPath(); g.roundRect ? g.roundRect(6, 20, 500, 120, 60) : g.rect(6, 20, 500, 120); g.fill();
    g.fillStyle = color; g.textAlign = 'center'; g.font = '700 46px "Bowlby One SC", Impact, sans-serif';
    g.fillText(text.slice(0, 18), 256, 82);
    if (sub) { g.fillStyle = '#fee3c1'; g.font = '700 30px Manrope, sans-serif'; g.fillText(sub, 256, 122); }
    const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; return t;
  }
  function burstTexture(text) {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const g = c.getContext('2d');
    g.translate(128, 128); g.beginPath();
    for (let i = 0; i < 36; i++) { const a = i / 36 * Math.PI * 2, r = i % 2 ? 100 : 124; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
    g.closePath(); g.fillStyle = '#ff4100'; g.fill(); g.lineWidth = 6; g.strokeStyle = '#292a2c'; g.stroke();
    g.rotate(-.2); g.fillStyle = '#ffc700'; g.textAlign = 'center'; g.font = '700 44px "Bowlby One SC", Impact, sans-serif'; g.fillText(text, 0, 16);
    const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; return t;
  }

  /* ---------- Garnitures en volume ---------- */
  const M = {};
  const mat = (k, color, o = {}) => (M[k] = M[k] || new T.MeshStandardMaterial(Object.assign({ color, roughness: .55, metalness: 0 }, o)));
  function topping(type) {
    let m;
    switch (type) {
      case 'pepperoni': m = new T.Mesh(new T.CylinderGeometry(.14, .14, .03, 20), mat('pep', 0xc41e00, { roughness: .4 })); break;
      case 'chorizo': m = new T.Mesh(new T.CylinderGeometry(.1, .1, .03, 16), mat('cho', 0xb8250c, { roughness: .4 })); break;
      case 'olive': m = new T.Mesh(new T.TorusGeometry(.06, .032, 10, 18), mat('oli', 0x1d1d1f, { roughness: .25 })); m.rotation.x = Math.PI / 2; break;
      case 'mushroom': {
        m = new T.Group();
        const cap = new T.Mesh(new T.SphereGeometry(.1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat('mus', 0xf1dcc0)); cap.scale.y = .45;
        const st = new T.Mesh(new T.CylinderGeometry(.035, .04, .05, 10), mat('mus2', 0xe8cfae)); st.position.y = -.02;
        m.add(cap, st); break;
      }
      case 'basil': case 'artichoke': m = new T.Mesh(new T.SphereGeometry(.12, 14, 8), mat(type, type === 'basil' ? 0x1f8a4c : 0x9fb53a, { roughness: .35 })); m.scale.set(1, .12, .55); break;
      case 'ham': m = new T.Mesh(new T.BoxGeometry(.22, .025, .17), mat('ham', 0xf7a6a0)); break;
      case 'bacon': m = new T.Mesh(new T.BoxGeometry(.16, .035, .1), mat('bac', 0xe0624a)); break;
      case 'tomato': {
        m = new T.Group();
        m.add(new T.Mesh(new T.CylinderGeometry(.13, .13, .03, 20), mat('tom', 0xe8240b, { roughness: .3 })));
        const inn = new T.Mesh(new T.CylinderGeometry(.09, .09, .032, 16), mat('tom2', 0xff6a3d, { roughness: .3 })); m.add(inn); break;
      }
      case 'pepper': m = new T.Mesh(new T.TorusGeometry(.1, .022, 8, 16, Math.PI * 1.2), mat('ppr', 0x2e9b45, { roughness: .3 })); m.rotation.x = Math.PI / 2; break;
      case 'onion': m = new T.Mesh(new T.TorusGeometry(.09, .016, 8, 22), mat('oni', 0xb04a8a, { roughness: .35 })); m.rotation.x = Math.PI / 2; break;
      case 'beef': case 'kebab': m = new T.Mesh(new T.DodecahedronGeometry(.06), mat('bee', 0x6b2a14, { roughness: .8 })); m.scale.y = .6; break;
      case 'chicken': case 'tenders': m = new T.Mesh(new T.BoxGeometry(.16, .05, .11), mat('chi', type === 'tenders' ? 0xd98a2b : 0xf0d2a0, { roughness: .8 })); break;
      case 'egg': {
        m = new T.Group();
        const w = new T.Mesh(new T.CylinderGeometry(.22, .24, .02, 24), mat('egw', 0xfffaf0, { roughness: .3 })); m.add(w);
        const y = new T.Mesh(new T.SphereGeometry(.08, 16, 10), mat('egy', 0xffa000, { roughness: .2 })); y.scale.y = .55; y.position.y = .02; m.add(y); break;
      }
      case 'goat': case 'whitecheese': m = new T.Mesh(new T.CylinderGeometry(.12, .12, .045, 18), mat('goa', 0xfffbef, { roughness: .9 })); break;
      case 'pineapple': m = new T.Mesh(new T.CylinderGeometry(.13, .13, .04, 3), mat('pin', 0xffe14d, { roughness: .4 })); break;
      case 'potato': case 'cheddar': m = new T.Mesh(new T.BoxGeometry(.09, .07, .09), mat(type, type === 'potato' ? 0xf3dd5a : 0xff9d00, { roughness: .6 })); break;
      case 'merguez': m = new T.Mesh(new T.CylinderGeometry(.045, .045, .26, 12), mat('mer', 0x8f1d0b, { roughness: .45 })); m.rotation.z = Math.PI / 2; break;
      case 'anchovy': case 'tuna': case 'salmon': m = new T.Mesh(new T.SphereGeometry(.12, 12, 8), mat(type, { anchovy: 0x8a7b6e, tuna: 0xe9b89a, salmon: 0xff8a65 }[type], { roughness: .35 })); m.scale.set(1, .18, .4); break;
      case 'truffle': case 'walnut': case 'caper': m = new T.Mesh(new T.IcosahedronGeometry(type === 'caper' ? .035 : .05), mat(type, { truffle: 0x2a1a12, walnut: 0x8a5a2b, caper: 0x6f8f2c }[type], { roughness: .9 })); break;
      case 'shrimp': m = new T.Mesh(new T.TorusGeometry(.08, .03, 8, 14, Math.PI * 1.3), mat('shr', 0xff8a65, { roughness: .4 })); m.rotation.x = Math.PI / 2; break;
      case 'aubergine': case 'avocado': m = new T.Mesh(new T.CylinderGeometry(.12, .12, .03, 18), mat(type, type === 'aubergine' ? 0xe8d9a8 : 0xb9d46a, { roughness: .5 })); break;
      case 'corn': m = new T.Mesh(new T.SphereGeometry(.035, 8, 6), mat('corn', 0xffd23f, { roughness: .4 })); break;
      default: return null;
    }
    m.traverse(o => { if (o.isMesh) o.castShadow = true; });
    return m;
  }


  /* ---------- Une part : dessus (fromage + bord), flanc/dessous, coupes ---------- */
  function gridGeo(rows) {
    const nj = rows.length, nk = rows[0].length;
    const pos = new Float32Array(nj * nk * 3), uv = new Float32Array(nj * nk * 2), idx = [];
    rows.forEach((row, j) => row.forEach((p, k) => {
      const o = j * nk + k;
      pos[o * 3] = p[0]; pos[o * 3 + 1] = p[1]; pos[o * 3 + 2] = p[2];
      uv[o * 2] = p[3]; uv[o * 2 + 1] = p[4];
    }));
    for (let j = 0; j < nj - 1; j++) for (let k = 0; k < nk - 1; k++) {
      const a = j * nk + k, b = a + 1, c = a + nk, d = c + 1;
      idx.push(a, b, c, b, d, c);
    }
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.BufferAttribute(pos, 3));
    g.setAttribute('uv', new T.BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }

  function sliceProfile(th, surf, hs) {
    const { wob, bUp } = surf.rim(th);
    const sn = Math.sin(th), cs = Math.cos(th);
    const top = [], side = [];
    const NC = 30, NR = 16, NS = 8;
    for (let k = 0; k <= NC; k++) {
      const rn = RF * Math.pow(k / NC, .8), r = rn * wob;
      const fade = 1 - smooth(RF - .14, RF - .01, rn);
      top.push([r, (CHEESE_Y + surf.hAt(r * sn, r * cs) * fade) * hs]);
    }
    for (let k = 1; k <= NR; k++) {
      const ph = Math.PI * .96 * (1 - k / NR);
      top.push([(RIM.rc + RIM.a * Math.cos(ph)) * wob, (RIM.yc + bUp * Math.pow(Math.sin(ph), .72)) * hs]);
    }
    for (let k = 0; k <= NS; k++) {
      const ph = -Math.PI / 2 * k / NS;
      side.push([(RIM.rc + RIM.a * Math.pow(Math.cos(ph), .8)) * wob, (RIM.yc + RIM.bLo * Math.sin(ph)) * hs]);
    }
    for (const f of [.66, .33, 0]) side.push([RIM.rc * wob * f, 0]);
    return { top, side };
  }

  function buildSlice(i, R, surf, mats) {
    const A = 12, th0 = i * Math.PI / 4, thL = Math.PI / 4, hs = .85 + .15 * R;
    const topRows = [], sideRows = [], profs = [];
    for (let j = 0; j <= A; j++) {
      const th = th0 + thL * j / A, sn = Math.sin(th), cs = Math.cos(th);
      const p = sliceProfile(th, surf, hs);
      profs.push(p);
      topRows.push(p.top.map(([r, y]) => [r * R * sn, y, r * R * cs, r * sn / D * .5 + .5, r * cs / D * .5 + .5]));
      let len = 0;
      sideRows.push(p.side.map(([r, y], k, arr) => {
        if (k) len += Math.hypot(r - arr[k - 1][0], y - arr[k - 1][1]);
        return [r * R * sn, y, r * R * cs, th * R * 1.6, len * 3];
      }));
    }
    const s = new T.Group();
    const top = new T.Mesh(gridGeo(topRows), mats.top);
    const side = new T.Mesh(gridGeo(sideRows), mats.side);
    top.castShadow = top.receiveShadow = side.castShadow = side.receiveShadow = true;
    // Coupes : le profil complet, triangulé, de chaque côté de la part
    const pos = [], uv = [], nor = [], idx = [];
    [[0, th0], [A, th0 + thL]].forEach(([j, th], side_) => {
      const p = profs[j], sn = Math.sin(th), cs = Math.cos(th);
      const contour = p.top.concat(p.side.slice(1));
      const n = side_ ? [cs, 0, -sn] : [-cs, 0, sn];
      const base = pos.length / 3;
      contour.forEach(([r, y]) => {
        pos.push(r * R * sn, y, r * R * cs);
        uv.push(r / D, y / hs / mats.cutYM);
        nor.push(...n);
      });
      const tris = T.ShapeUtils.triangulateShape(contour.map(([r, y]) => new T.Vector2(r, y)), []);
      tris.forEach(([a, b, c]) => {
        // oriente chaque triangle vers l'extérieur de la part
        const P3 = q => new T.Vector3(pos[(base + q) * 3], pos[(base + q) * 3 + 1], pos[(base + q) * 3 + 2]);
        const fa = P3(a), nrm = P3(b).sub(fa).cross(P3(c).sub(fa));
        if (nrm.x * n[0] + nrm.z * n[2] < 0) idx.push(base + a, base + c, base + b);
        else idx.push(base + a, base + b, base + c);
      });
    });
    const cg = new T.BufferGeometry();
    cg.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    cg.setAttribute('normal', new T.Float32BufferAttribute(nor, 3));
    cg.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
    cg.setIndex(idx);
    const cut = new T.Mesh(cg, mats.cut);
    cut.receiveShadow = true;
    s.add(top, side, cut);
    return s;
  }

  /* ---------- Filaments de fromage ---------- */
  const SEG = 18, RAD = 7;
  function tubeGeo() {
    const n = (SEG + 1) * (RAD + 1), g = new T.BufferGeometry(), idx = [];
    g.setAttribute('position', new T.BufferAttribute(new Float32Array(n * 3), 3).setUsage(T.DynamicDrawUsage));
    g.setAttribute('normal', new T.BufferAttribute(new Float32Array(n * 3), 3).setUsage(T.DynamicDrawUsage));
    for (let i = 0; i < SEG; i++) for (let j = 0; j < RAD; j++) {
      const a = i * (RAD + 1) + j, b = a + RAD + 1;
      idx.push(a, a + 1, b, b, a + 1, b + 1);
    }
    g.setIndex(idx);
    return g;
  }
  const _t = new T.Vector3(), _n = new T.Vector3(), _b = new T.Vector3(), _up = new T.Vector3(0, 1, 0), _x = new T.Vector3(1, 0, 0);
  function setTube(g, pts, rad) {
    const P_ = g.attributes.position.array, N_ = g.attributes.normal.array;
    for (let i = 0; i <= SEG; i++) {
      _t.subVectors(pts[Math.min(SEG, i + 1)], pts[Math.max(0, i - 1)]).normalize();
      _n.crossVectors(_t, Math.abs(_t.y) > .9 ? _x : _up).normalize();
      _b.crossVectors(_t, _n);
      for (let j = 0; j <= RAD; j++) {
        const a = j / RAD * TAU, c = Math.cos(a), s = Math.sin(a), o = (i * (RAD + 1) + j) * 3;
        const nx = _n.x * c + _b.x * s, ny = _n.y * c + _b.y * s, nz = _n.z * c + _b.z * s;
        N_[o] = nx; N_[o + 1] = ny; N_[o + 2] = nz;
        P_[o] = pts[i].x + nx * rad[i]; P_[o + 1] = pts[i].y + ny * rad[i]; P_[o + 2] = pts[i].z + nz * rad[i];
      }
    }
    g.attributes.position.needsUpdate = true;
    g.attributes.normal.needsUpdate = true;
  }
  function makeStrands(root, slices, surf, R, mat) {
    const hs = .85 + .15 * R, list = [];
    const yAt = (r, th) => (CHEESE_Y + surf.hAt(r * Math.sin(th), r * Math.cos(th))) * hs - .008;
    const at = (r, th) => new T.Vector3(Math.sin(th) * r * R, yAt(r, th), Math.cos(th) * r * R);
    const add = o => {
      o.mesh = new T.Mesh(tubeGeo(), mat);
      o.mesh.frustumCulled = false; o.mesh.visible = false; o.mesh.castShadow = true;
      o.pts = Array.from({ length: SEG + 1 }, () => new T.Vector3());
      o.rad = new Float32Array(SEG + 1);
      o.ph = Math.random() * TAU;
      root.add(o.mesh); list.push(o);
    };
    // entre chaque paire de parts voisines (la part 0 est celle qu'on soulève)
    for (let i = 0; i < 8; i++) {
      const j = (i + 1) % 8, th = (i + 1) * Math.PI / 4, lifted = i === 0 || j === 0;
      const n = lifted ? 6 : 1;
      for (let k = 0; k < n; k++) {
        const r = rand(.14, .76), dt = rand(.004, .02);
        add({ A: slices[i], B: slices[j], pa: at(r, th - dt), pb: at(r + rand(-.06, .06), th + dt), r0: rand(.013, .024) * R * (lifted ? 1.15 : .9), max: lifted ? rand(1.5, 2.6) : rand(.42, .75) });
      }
    }
    // gouttes qui pendent sous la part soulevée
    for (let k = 0; k < 6; k++) {
      const th = k % 2 ? Math.PI / 4 - .01 : .01, r = rand(.2, .8);
      add({ A: slices[0], pa: at(r, th), drip: rand(.1, .26), r0: rand(.012, .02) * R });
    }
    return list;
  }
  const _a = new T.Vector3(), _bb = new T.Vector3(), _c = new T.Vector3();
  function updateStrands(list, t, active) {
    for (const s of list) {
      if (!active) { s.mesh.visible = false; continue; }
      _a.copy(s.pa).applyMatrix4(s.A.matrix);
      let L;
      if (s.drip) {
        const lift = s.A.userData.lift;
        L = s.drip * lift * (1 + Math.sin(t * 2.2 + s.ph) * .12);
        if (L < .012) { s.mesh.visible = false; continue; }
        for (let i = 0; i <= SEG; i++) {
          const q = i / SEG, sw = Math.sin(t * 2.6 + s.ph + q * 2) * .012 * q;
          s.pts[i].set(_a.x + sw, _a.y - L * q, _a.z + sw * .6);
          // fil qui s'affine puis goutte arrondie au bout
          const bulb = q > .82 ? Math.sqrt(Math.max(0, 1 - ((q - .82) / .18) ** 2)) * 1.25 : 0;
          s.rad[i] = s.r0 * Math.max(bulb, q > .82 ? 0 : .95 - q * .55);
        }
      } else {
        _bb.copy(s.pb).applyMatrix4(s.B.matrix);
        L = _a.distanceTo(_bb);
        if (L < .02 || L > s.max) { s.mesh.visible = false; continue; }
        const appear = smooth(.02, .07, L), snap = 1 - smooth(s.max * .78, s.max, L);
        const sag = Math.min(.5, .1 * L + .3 * L * L);
        _c.addVectors(_a, _bb).multiplyScalar(.5);
        _c.x += Math.sin(t * 1.7 + s.ph) * .03 * L; _c.z += Math.cos(t * 1.3 + s.ph) * .03 * L;
        _c.y -= sag * 2;
        const thin = clamp(.09 / L, .16, .9);
        for (let i = 0; i <= SEG; i++) {
          const q = i / SEG, w0 = (1 - q) * (1 - q), w1 = 2 * (1 - q) * q, w2 = q * q;
          s.pts[i].set(_a.x * w0 + _c.x * w1 + _bb.x * w2, _a.y * w0 + _c.y * w1 + _bb.y * w2, _a.z * w0 + _c.z * w1 + _bb.z * w2);
          s.rad[i] = s.r0 * appear * snap * (thin + (1 - thin) * Math.pow(Math.abs(2 * q - 1), 1.6));
        }
      }
      setTube(s.mesh.geometry, s.pts, s.rad);
      s.mesh.visible = true;
    }
  }

  /* ---------- Une pizza complète en 8 parts ---------- */
  function makePizza(rec, R, surf, shared, aniso) {
    const root = new T.Group();
    [surf.map, surf.bump, surf.rough].forEach(t => { t.anisotropy = aniso; });
    const crumb = crumbTextures(rec.sauce);
    const mats = {
      top: new T.MeshStandardMaterial({ map: surf.map, bumpMap: surf.bump, bumpScale: .04, roughnessMap: surf.rough, roughness: 1, metalness: 0, envMapIntensity: .55 }),
      side: shared.side,
      cut: new T.MeshStandardMaterial({ map: crumb.map, bumpMap: crumb.bump, bumpScale: .02, roughness: .88, side: T.DoubleSide, envMapIntensity: .5 }),
      cutYM: crumb.YM
    };
    const hs = .85 + .15 * R;
    const tops = rec.toppings.filter(t => t !== 'honey' && t !== 'oregano');
    const perSlice = surf.photo ? 0 : Math.max(3, Math.min(7, tops.length * 2));
    const slices = [];
    for (let i = 0; i < 8; i++) {
      const th0 = i * Math.PI / 4, thL = Math.PI / 4, mid = th0 + thL / 2;
      const s = buildSlice(i, R, surf, mats);
      for (let k = 0; k < perSlice && tops.length; k++) {
        const t = topping(tops[(i + k) % tops.length]);
        if (!t) continue;
        const a = th0 + thL * rand(.2, .8), d = rand(.2, .7);
        t.position.set(Math.sin(a) * d * R, (CHEESE_Y + surf.hAt(Math.sin(a) * d, Math.cos(a) * d)) * hs + .02, Math.cos(a) * d * R);
        t.rotation.y += Math.random() * TAU;
        s.add(t);
      }
      s.userData = { dx: Math.sin(mid), dz: Math.cos(mid), lift: 0 };
      root.add(s); slices.push(s);
    }
    root.userData.slices = slices;
    root.userData.strands = makeStrands(root, slices, surf, R, shared.cheese);
    root.userData.mats = mats;
    return root;
  }

  // Les autres produits sont des images HTML placées sur la scène :
  // une texture WebGL depuis un fichier local serait bloquée par le navigateur.
  function makeStandee(src, stage, name) {
    const g = new T.Group();
    const img = document.createElement('img');
    img.className = 'o3d__thing';
    img.src = src; img.alt = name;
    stage.appendChild(img);
    g.userData.dom = img;
    return g;
  }

  /* =======================================================
     SCÈNE
     ======================================================= */
  let state = null;

  function open({ items, ticketHTML, onClose }) {
    close(true);
    const wrap = document.createElement('div');
    wrap.className = 'o3d';
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-modal', 'true');
    wrap.setAttribute('aria-label', 'Votre commande en 3D');
    wrap.innerHTML = `
      <div class="o3d__stage">
        <div class="o3d__burst" aria-hidden="true"></div>
        <canvas class="o3d__canvas" aria-label="Aperçu 3D de vos pizzas"></canvas>
        <p class="o3d__title"><span>Ta commande</span><b>en 3D</b></p>
        <p class="o3d__oven" aria-live="polite"><i></i><span>Le four chauffe…</span></p>
        <div class="o3d__tools" role="toolbar" aria-label="Commandes de la vue 3D">
          <button type="button" data-act="cut" aria-pressed="false"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="6" cy="18" r="3"/><circle cx="18" cy="18" r="3"/><path d="M8 16 19 4M16 16 5 4"/></svg><span>Découper</span></button>
          <button type="button" data-act="top" aria-pressed="false"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/></svg><span>Vue du dessus</span></button>
          <button type="button" data-act="reset"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v5h5"/></svg><span>Recentrer</span></button>
        </div>
        <p class="o3d__hint"><span class="o3d__hint-long">Glisse pour tourner · molette pour zoomer · </span>clique une pizza pour la découper et t'approcher</p>
      </div>
      <aside class="o3d__ticket">${ticketHTML}</aside>
      <button class="o3d__close" type="button" aria-label="Fermer l'aperçu 3D">×</button>`;
    document.body.appendChild(wrap);
    document.body.classList.add('is-locked');
    requestAnimationFrame(() => wrap.classList.add('is-open'));
    wrap.querySelector('.o3d__close').addEventListener('click', () => close());
    const onKey = e => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);

    const canvas = wrap.querySelector('canvas');
    const stage = wrap.querySelector('.o3d__stage');
    const renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.outputEncoding = T.sRGBEncoding;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = .92;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    renderer.physicallyCorrectLights = false;
    const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());

    const scene = new T.Scene();
    scene.environment = studioEnv(renderer);
    const camera = new T.PerspectiveCamera(34, 1, .1, 100);

    // Lumière rasante : elle creuse le relief du fromage et du bord
    scene.add(new T.HemisphereLight(0xfff1d6, 0x6a2410, .28));
    const sun = new T.DirectionalLight(0xfff0dc, 1.65);
    sun.position.set(7, 6, 4); sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 34 });
    sun.shadow.bias = -.0004; sun.shadow.normalBias = .02;
    scene.add(sun);
    const back = new T.DirectionalLight(0xffd2a8, .55); back.position.set(-6, 4, -7); scene.add(back);
    const warm = new T.PointLight(0xff7a2a, .6, 30); warm.position.set(-6, 3, 5); scene.add(warm);

    const shared = {
      side: (() => { const t = crustSideTextures(); return new T.MeshStandardMaterial({ map: t.map, bumpMap: t.bump, bumpScale: .03, roughness: .82, envMapIntensity: .5 }); })(),
      cheese: new T.MeshStandardMaterial({ color: 0xe9a93a, roughness: .32, metalness: 0, emissive: 0x5a2c00, emissiveIntensity: .18, envMapIntensity: .8 })
    };

    const pizzas = items.filter(i => i.pizza), others = items.filter(i => !i.pizza);
    const objects = [];
    const ringR = pizzas.length <= 1 ? 0 : Math.max(1.9, pizzas.length * .78);
    const boardR = Math.max(3.2, ringR + 1.9, pizzas.length === 1 && others.length ? 3.6 : 0);

    // Planche en bois avec farine
    const wood = woodTextures();
    const board = new T.Mesh(new T.CylinderGeometry(boardR, boardR + .08, .3, 96), [
      new T.MeshStandardMaterial({ color: 0x7a3f1d, roughness: .7 }),
      new T.MeshStandardMaterial({ map: wood.map, bumpMap: wood.bump, bumpScale: .012, roughness: .6, envMapIntensity: .4 }),
      new T.MeshStandardMaterial({ color: 0x5b2e14 })
    ]);
    board.position.y = -.15; board.receiveShadow = true; scene.add(board);
    const shadowFloor = new T.Mesh(new T.PlaneGeometry(60, 60), new T.ShadowMaterial({ opacity: .3 }));
    shadowFloor.rotation.x = -Math.PI / 2; shadowFloor.position.y = -.31; shadowFloor.receiveShadow = true; scene.add(shadowFloor);

    // Vapeur qui monte des pizzas chaudes
    const soft = softTexture();
    const steam = [];

    const S = pizzas.length <= 5 ? 512 : 384;
    const oven = wrap.querySelector('.o3d__oven');
    let alive = true, t0 = performance.now();
    const now = () => (performance.now() - t0) / 1000;

    // Les pizzas sortent du four une par une (la texture se calcule entre deux images)
    (async () => {
      await tick();
      for (let i = 0; i < pizzas.length; i++) {
        const it = pizzas[i];
        const img = await loadImg((window.PF_PHOTOS || {})[it.product.id]);
        if (!alive) return;
        const rec = P.recipe(it.product);
        const surf = buildSurface(rec, img, 101 + it.product.id * 7 + i, S);
        surf.photo = !!img;
        const R = SIZE_R[it.size] || 1.2;
        const pz = makePizza(rec, R, surf, shared, aniso);
        const a = (i / pizzas.length) * TAU;
        const x = Math.sin(a) * ringR, z = Math.cos(a) * ringR;
        pz.position.set(x, 7, z);
        Object.assign(pz.userData, { home: new T.Vector3(x, 0, z), R, index: it.index, drop: now() });
        const lab = new T.Sprite(new T.SpriteMaterial({ map: labelTexture(it.product.n, `${it.size}${it.qty > 1 ? ' × ' + it.qty : ''}`), depthTest: false }));
        lab.scale.set(1.55, .48, 1); lab.position.set(0, 1.05, 0); lab.renderOrder = 10;
        pz.add(lab); pz.userData.label = lab;
        if (it.free) {
          const b = new T.Sprite(new T.SpriteMaterial({ map: burstTexture('OFFERTE'), depthTest: false }));
          b.scale.set(1.05, 1.05, 1); b.renderOrder = 11; scene.add(b);
          pz.userData.badge = b;
        }
        for (let k = 0; k < 5; k++) {
          const sp = new T.Sprite(new T.SpriteMaterial({ map: soft, color: 0xfff8ee, transparent: true, opacity: 0, depthWrite: false }));
          sp.userData = { pz, ph: k / 5 * 3.2 + Math.random(), ox: rand(-.45, .45) * R, oz: rand(-.45, .45) * R };
          scene.add(sp); steam.push(sp);
        }
        scene.add(pz);
        objects.push(pz);
        await tick();
      }
      oven.classList.add('is-done');
    })();

    others.slice(0, 9).forEach((it, i, arr) => {
      const g = makeStandee(it.product.img, stage, it.product.n);
      const ring = pizzas.length === 1 ? 2.55 : pizzas.length > 1 ? (arr.length > 1 ? ringR * .42 : 0) : (arr.length > 1 ? 1.7 : 0);
      const a = (i / arr.length) * TAU + (pizzas.length === 1 ? Math.PI / 2 : .4);
      const x = Math.sin(a) * ring, z = Math.cos(a) * ring;
      g.position.set(x, 0, z);
      Object.assign(g.userData, { home: new T.Vector3(x, 0, z), index: it.index, drop: .3 + i * .12, bob: Math.random() * 6 });
      const sh = new T.Mesh(new T.CircleGeometry(.45, 24), new T.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: .22 }));
      sh.rotation.x = -Math.PI / 2; sh.position.y = .01; g.add(sh);
      scene.add(g);
      objects.push(g);
    });
    if (!pizzas.length) oven.classList.add('is-done');

    // Caméra en orbite, qui peut s'approcher d'une pizza
    const RB = Math.max(9, boardR * 2.7);
    let R0 = RB;
    const orbit = { theta: .5, phi: .95, r: R0, tTheta: .5, tPhi: .95, tR: R0, target: new T.Vector3(0, .2, 0), tTarget: new T.Vector3(0, .2, 0) };
    const ray = new T.Raycaster(), ptr = new T.Vector2(-9, -9);
    let hovered = null, focused = null, dragging = false, moved = 0, lastX = 0, lastY = 0, idle = 0, highlight = -1, allCut = false, topView = false;

    const tools = wrap.querySelector('.o3d__tools');
    const setPressed = (act, on) => tools.querySelector(`[data-act="${act}"]`).setAttribute('aria-pressed', String(on));
    function focus(o) {
      focused = o;
      if (o) { orbit.tTarget.set(o.position.x, .35, o.position.z); orbit.tR = Math.max(4.2, o.userData.R * 4.4); orbit.tPhi = Math.min(orbit.tPhi, .82); }
      else { orbit.tTarget.set(0, .2, 0); orbit.tR = R0; }
      idle = 0;
    }
    tools.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      const act = b.dataset.act;
      if (act === 'cut') {
        allCut = !allCut; setPressed('cut', allCut);
        objects.forEach(o => { if (o.userData.slices) o.userData.open = allCut; });
      } else if (act === 'top') {
        topView = !topView; setPressed('top', topView);
        orbit.tPhi = topView ? .12 : .95;
      } else {
        topView = false; setPressed('top', false); focus(null); orbit.tPhi = .95;
      }
    });

    const pickables = () => objects.filter(o => o.userData.slices);
    function pick(e) {
      const r = canvas.getBoundingClientRect();
      ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ptr, camera);
      const hit = ray.intersectObjects(pickables(), true)[0];
      if (!hit) return null;
      let o = hit.object; while (o && !o.userData.slices) o = o.parent; return o;
    }
    canvas.addEventListener('pointerdown', e => { dragging = true; moved = 0; lastX = e.clientX; lastY = e.clientY; canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener('pointermove', e => {
      if (dragging) {
        const dx = e.clientX - lastX, dy = e.clientY - lastY; moved += Math.abs(dx) + Math.abs(dy);
        orbit.tTheta -= dx * .008; orbit.tPhi = Math.min(1.35, Math.max(.1, orbit.tPhi - dy * .006));
        lastX = e.clientX; lastY = e.clientY; idle = 0;
      } else {
        hovered = pick(e);
        canvas.style.cursor = hovered ? 'pointer' : 'grab';
      }
    });
    canvas.addEventListener('pointerup', e => {
      dragging = false;
      if (moved < 6) {
        const o = pick(e);
        if (o) {
          o.userData.open = !o.userData.open;
          focus(o.userData.open ? o : null);
          const v = o.position.clone(); v.y += .4; v.project(camera);
          const r = canvas.getBoundingClientRect();
          P.burst(r.left + (v.x + 1) / 2 * r.width, r.top + (1 - v.y) / 2 * r.height, P.bitsFor(items.find(i => i.index === o.userData.index).product), { count: 8, power: 11 });
        } else focus(null);
      }
    });
    canvas.addEventListener('wheel', e => { e.preventDefault(); orbit.tR = Math.min(boardR * 4, Math.max(3.2, orbit.tR + e.deltaY * .01)); idle = 0; }, { passive: false });

    // Survol du ticket → la pizza correspondante saute
    wrap.querySelectorAll('[data-o3d]').forEach(row => {
      row.addEventListener('pointerenter', () => { highlight = +row.dataset.o3d; });
      row.addEventListener('pointerleave', () => { highlight = -1; });
      // halo qui suit le curseur sur la ligne du ticket
      row.addEventListener('pointermove', e => { const r = row.getBoundingClientRect(); row.style.setProperty('--mx', `${e.clientX - r.left}px`); row.style.setProperty('--my', `${e.clientY - r.top}px`); });
    });

    function resize() {
      const w = stage.clientWidth, h = stage.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      // écran étroit (téléphone) : on recule pour tout voir
      const was = R0; R0 = RB * Math.max(1, 1.1 / camera.aspect);
      if (!focused && Math.abs(orbit.tR - was) < .01) orbit.tR = orbit.r = R0;
    }
    resize();
    addEventListener('resize', resize);

    let raf, lastT = 0;
    function frame() {
      const t = now(), dt = Math.min(.1, t - lastT); lastT = t;
      // lissages indépendants de la cadence d'affichage
      const k = a => 1 - Math.pow(1 - a, dt * 60);
      idle += dt;
      if (!dragging && idle > 2.5) orbit.tTheta += .0022 * dt * 60;
      orbit.theta += (orbit.tTheta - orbit.theta) * k(.08);
      orbit.phi += (orbit.tPhi - orbit.phi) * k(.08);
      orbit.r += (orbit.tR - orbit.r) * k(.07);
      orbit.target.lerp(orbit.tTarget, k(.07));
      camera.position.set(
        orbit.target.x + Math.sin(orbit.theta) * Math.sin(orbit.phi) * orbit.r,
        orbit.target.y + Math.cos(orbit.phi) * orbit.r,
        orbit.target.z + Math.cos(orbit.theta) * Math.sin(orbit.phi) * orbit.r);
      camera.lookAt(orbit.target);

      objects.forEach(o => {
        const u = o.userData;
        // Chute avec rebond
        const p = clamp((t - u.drop) / 1.1);
        const hl = highlight === u.index;
        o.position.y = (1 - bounce(p)) * 7 + (hl ? .35 + Math.sin(t * 8) * .12 : 0);
        if (u.slices) {
          o.rotation.y = (1 - ease(p)) * 4 + t * .1;
          // ouverte : la part 0 se soulève, les autres s'écartent à peine ; « Découper » éclate tout
          const target = allCut ? .4 : u.open ? .09 : (o === hovered || hl ? .12 : 0);
          u.cut = (u.cut || 0) + (target - (u.cut || 0)) * k(.09);
          u.slices.forEach((s, i) => {
            const sd = s.userData;
            const lift = u.open && i === 0 ? 1 : 0;
            sd.lift += (lift - sd.lift) * k(.06);
            const out = u.cut + sd.lift * .5;
            s.position.set(sd.dx * out, sd.lift * .62, sd.dz * out);
            // la part soulevée penche vers l'extérieur
            s.rotation.x = sd.lift * -.28 * sd.dz; s.rotation.z = sd.lift * .28 * sd.dx;
            s.updateMatrix();
          });
          updateStrands(u.strands, t, u.cut > .006 || u.slices[0].userData.lift > .01);
          if (u.label) u.label.material.opacity += ((focused === o ? 0 : 1) - u.label.material.opacity) * k(.1);
          if (u.badge) u.badge.position.set(o.position.x + u.R * .8, o.position.y + 2.1 + Math.sin(t * 3) * .08, o.position.z);
        } else {
          o.position.y += Math.sin(t * 2 + u.bob) * .06;
          const v = o.position.clone(); v.y += .05;
          const dist = camera.position.distanceTo(v);
          v.project(camera);
          const sx = (v.x + 1) / 2 * stage.clientWidth, sy = (1 - v.y) / 2 * stage.clientHeight;
          const k = Math.min(1.15, 8 / dist) * (hl ? 1.3 : 1);
          u.dom.style.transform = `translate(${sx.toFixed(1)}px, ${sy.toFixed(1)}px) translate(-50%, -100%) scale(${k.toFixed(3)})`;
          u.dom.style.zIndex = String(1000 - Math.round(dist * 10));
        }
      });
      steam.forEach(sp => {
        const d = sp.userData, pz = d.pz, q = ((t * .32 + d.ph) % 3.2) / 3.2;
        const landed = clamp((t - pz.userData.drop - 1.2) / 1.5);
        sp.position.set(pz.position.x + d.ox + Math.sin(t * .9 + d.ph * 3) * .25 * q, pz.position.y + .3 + q * 2.1, pz.position.z + d.oz);
        const sc = (.5 + q * 1.4) * pz.userData.R;
        sp.scale.set(sc, sc, 1);
        sp.material.opacity = Math.sin(q * Math.PI) * .16 * landed;
      });
      renderer.render(scene, camera);
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    state = { wrap, renderer, raf: () => raf, resize, onKey, onClose, scene, kill: () => { alive = false; } };
  }

  function close(silent) {
    if (!state) return;
    const s = state; state = null;
    s.kill();
    cancelAnimationFrame(s.raf());
    removeEventListener('resize', s.resize);
    document.removeEventListener('keydown', s.onKey);
    s.wrap.classList.remove('is-open');
    setTimeout(() => {
      const seen = new Set();
      s.scene.traverse(o => {
        if (o.geometry) o.geometry.dispose();
        [].concat(o.material || []).forEach(m => {
          if (seen.has(m)) return; seen.add(m);
          ['map', 'bumpMap', 'roughnessMap'].forEach(k => { if (m[k] && !Object.values(crumbCache).some(c => c.map === m[k] || c.bump === m[k])) m[k].dispose(); });
          m.dispose();
        });
      });
      if (s.scene.environment) s.scene.environment.dispose();
      s.renderer.dispose();
      s.wrap.remove();
    }, silent ? 0 : 600);
    document.body.classList.remove('is-locked');
    if (!silent && s.onClose) s.onClose();
  }

  window.PF_ORDER3D = { open, close };
})();
