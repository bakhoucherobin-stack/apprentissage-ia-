/* =========================================================
   PIZZA FOOD — aperçu 3D de la commande (Three.js r128)
   Chaque pizza est générée à partir de ses ingrédients :
   pâte, sauce, fromage fondu (texture peinte), garnitures
   en volume, 8 parts qui se détachent.
   ========================================================= */
(() => {
  'use strict';
  const T = window.THREE;
  const P = window.PF_PIZZA;

  const SIZE_R = { Junior: 1.0, Senior: 1.22, Mega: 1.45 };
  const rand = (a, b) => a + Math.random() * (b - a);
  const ease = t => 1 - Math.pow(1 - t, 3);
  const bounce = t => {
    const n = 7.5625, d = 2.75;
    if (t < 1 / d) return n * t * t;
    if (t < 2 / d) return n * (t -= 1.5 / d) * t + .75;
    if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + .9375;
    return n * (t -= 2.625 / d) * t + .984375;
  };

  /* ---------- Textures peintes ---------- */
  function topTexture(rec) {
    const c = document.createElement('canvas'); c.width = c.height = 512;
    const g = c.getContext('2d');
    const col = P.SAUCES[rec.sauce] || P.SAUCES.tomato;
    const cx = 256;
    // sauce
    const sg = g.createRadialGradient(cx, cx, 40, cx, cx, 256);
    sg.addColorStop(0, col.sauce); sg.addColorStop(1, col.dark);
    g.fillStyle = sg; g.fillRect(0, 0, 512, 512);
    // fromage fondu : grosses taches en dégradé
    for (let i = 0; i < 70; i++) {
      const a = Math.random() * 6.28, d = Math.sqrt(Math.random()) * 205, r = rand(30, 70);
      const x = cx + Math.cos(a) * d, y = cx + Math.sin(a) * d;
      const cg = g.createRadialGradient(x - r * .2, y - r * .2, 2, x, y, r);
      cg.addColorStop(0, '#fff3b0'); cg.addColorStop(.55, col.cheese); cg.addColorStop(1, 'rgba(255,199,0,0)');
      g.fillStyle = cg; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
    }
    // gratiné
    for (let i = 0; i < 160; i++) {
      const a = Math.random() * 6.28, d = Math.sqrt(Math.random()) * 220;
      g.fillStyle = `rgba(${150 + Math.random() * 40},${70 + Math.random() * 30},10,${rand(.15, .45)})`;
      g.beginPath(); g.ellipse(cx + Math.cos(a) * d, cx + Math.sin(a) * d, rand(2, 9), rand(2, 6), Math.random() * 3, 0, 7); g.fill();
    }
    // sauce qui perce
    for (let i = 0; i < 26; i++) {
      const a = Math.random() * 6.28, d = Math.sqrt(Math.random()) * 200;
      g.fillStyle = col.sauce; g.globalAlpha = .75;
      g.beginPath(); g.arc(cx + Math.cos(a) * d, cx + Math.sin(a) * d, rand(5, 14), 0, 7); g.fill();
    }
    g.globalAlpha = 1;
    if (rec.toppings.includes('oregano') || rec.toppings.includes('basil')) {
      for (let i = 0; i < 220; i++) { const a = Math.random() * 6.28, d = Math.sqrt(Math.random()) * 230; g.fillStyle = '#2e7d32'; g.fillRect(cx + Math.cos(a) * d, cx + Math.sin(a) * d, 2, 2); }
    }
    const tex = new T.CanvasTexture(c);
    tex.encoding = T.sRGBEncoding;
    tex.anisotropy = 4;
    return tex;
  }
  function crustTexture() {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const g = c.getContext('2d');
    g.fillStyle = '#e0a04c'; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${140 + Math.random() * 60},${70 + Math.random() * 40},20,${rand(.1, .35)})`; g.fillRect(Math.random() * 256, Math.random() * 256, rand(1, 5), rand(1, 4)); }
    const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.wrapS = t.wrapT = T.RepeatWrapping; return t;
  }
  function woodTexture() {
    const c = document.createElement('canvas'); c.width = 1024; c.height = 1024;
    const g = c.getContext('2d');
    g.fillStyle = '#9c5a2c'; g.fillRect(0, 0, 1024, 1024);
    for (let i = 0; i < 140; i++) {
      g.strokeStyle = `rgba(${60 + Math.random() * 40},${25 + Math.random() * 20},8,${rand(.15, .45)})`;
      g.lineWidth = rand(1, 5);
      g.beginPath(); const y = Math.random() * 1024; g.moveTo(0, y);
      for (let x = 0; x <= 1024; x += 64) g.lineTo(x, y + Math.sin(x / 90 + i) * rand(2, 10));
      g.stroke();
    }
    const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; return t;
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

  /* ---------- Une pizza en 8 parts ---------- */
  function makePizza(rec, R, photo) {
    const root = new T.Group();
    const crust = crustTexture();
    let top;
    if (photo) { top = new T.TextureLoader().load(photo); top.encoding = T.sRGBEncoding; top.anisotropy = 4; }
    else top = topTexture(rec);
    const crustMat = new T.MeshStandardMaterial({ map: crust, color: 0xffffff, roughness: .85 });
    const topMat = new T.MeshStandardMaterial({ map: top, roughness: .45, metalness: 0 });
    const sideMat = new T.MeshStandardMaterial({ color: 0xe8b064, roughness: .9 });
    const tops = rec.toppings.filter(t => t !== 'honey' && t !== 'oregano');
    // Avec la vraie photo, quelques garnitures en relief suffisent
    const perSlice = photo ? 0 : Math.max(3, Math.min(7, Math.round(36 / Math.max(1, tops.length) / 8 * tops.length)));
    const slices = [];
    for (let i = 0; i < 8; i++) {
      const th0 = i * Math.PI / 4, thL = Math.PI / 4, mid = th0 + thL / 2;
      const s = new T.Group();
      const base = new T.Mesh(new T.CylinderGeometry(R * .97, R, .14, 18, 1, false, th0, thL), crustMat);
      base.position.y = .07; base.castShadow = base.receiveShadow = true; s.add(base);
      const cheese = new T.Mesh(new T.CylinderGeometry(R * .86, R * .86, .04, 18, 1, false, th0, thL), [sideMat, topMat, sideMat]);
      cheese.position.y = .16; cheese.receiveShadow = true; s.add(cheese);
      // bord de pâte : un tube qui suit l'arc
      const pts = [];
      for (let k = 0; k <= 10; k++) { const a = th0 + thL * k / 10; pts.push(new T.Vector3(Math.sin(a) * R * .9, .17, Math.cos(a) * R * .9)); }
      const rim = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 16, R * .085, 10, false), crustMat);
      rim.castShadow = true; s.add(rim);
      // garnitures
      for (let k = 0; k < perSlice && tops.length; k++) {
        const t = topping(tops[(i + k) % tops.length]);
        if (!t) continue;
        const a = th0 + thL * rand(.2, .8), d = R * rand(.2, .72);
        t.position.set(Math.sin(a) * d, .2, Math.cos(a) * d);
        t.rotation.y += Math.random() * 6.28;
        s.add(t);
      }
      if (rec.toppings.includes('honey')) {
        const hp = [];
        for (let k = 0; k <= 6; k++) { const a = th0 + thL * k / 6, d = R * (.35 + .15 * Math.sin(k * 1.7)); hp.push(new T.Vector3(Math.sin(a) * d, .19, Math.cos(a) * d)); }
        s.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(hp), 12, .022, 6), mat('hon', 0xf6b100, { roughness: .15, transparent: true, opacity: .9 })));
      }
      s.userData = { dx: Math.sin(mid), dz: Math.cos(mid), lift: 0 };
      root.add(s); slices.push(s);
    }
    root.userData.slices = slices;
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
        <canvas class="o3d__canvas" aria-label="Aperçu 3D de vos pizzas" data-cursor="Tourne !"></canvas>
        <p class="o3d__title"><span>Ta commande</span><b>en 3D</b></p>
        <p class="o3d__hint"><span class="o3d__hint-long">Glisse pour tourner · molette pour zoomer · </span>clique une pizza pour la découper</p>
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
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;

    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(34, 1, .1, 100);

    scene.add(new T.HemisphereLight(0xfff1d6, 0x7a2410, .75));
    const sun = new T.DirectionalLight(0xffffff, 1.25);
    sun.position.set(5, 11, 6); sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 30 });
    sun.shadow.bias = -.0005;
    scene.add(sun);
    const warm = new T.PointLight(0xff7a2a, .8, 30); warm.position.set(-6, 3, 5); scene.add(warm);

    // Disposition : pizzas en couronne, le reste au centre
    const pizzas = items.filter(i => i.pizza), others = items.filter(i => !i.pizza);
    const objects = [];
    const ringR = pizzas.length <= 1 ? 0 : Math.max(1.9, pizzas.length * .78);
    const boardR = Math.max(3.2, ringR + 1.9, pizzas.length === 1 && others.length ? 3.6 : 0);

    const board = new T.Mesh(new T.CylinderGeometry(boardR, boardR + .08, .3, 72), [
      new T.MeshStandardMaterial({ color: 0x7a3f1d, roughness: .8 }),
      new T.MeshStandardMaterial({ map: woodTexture(), roughness: .7 }),
      new T.MeshStandardMaterial({ color: 0x5b2e14 })
    ]);
    board.position.y = -.15; board.receiveShadow = true; scene.add(board);
    const shadowFloor = new T.Mesh(new T.PlaneGeometry(60, 60), new T.ShadowMaterial({ opacity: .28 }));
    shadowFloor.rotation.x = -Math.PI / 2; shadowFloor.position.y = -.31; shadowFloor.receiveShadow = true; scene.add(shadowFloor);

    pizzas.forEach((it, i) => {
      const R = SIZE_R[it.size] || 1.2;
      const pz = makePizza(P.recipe(it.product), R, (window.PF_PHOTOS || {})[it.product.id]);
      const a = (i / pizzas.length) * Math.PI * 2;
      const x = Math.sin(a) * ringR, z = Math.cos(a) * ringR;
      pz.position.set(x, 0, z);
      pz.userData.home = new T.Vector3(x, 0, z);
      pz.userData.R = R;
      pz.userData.index = it.index;
      pz.userData.drop = i * .14;
      const lab = new T.Sprite(new T.SpriteMaterial({ map: labelTexture(it.product.n, `${it.size}${it.qty > 1 ? ' × ' + it.qty : ''}`), depthTest: false }));
      lab.scale.set(1.55, .48, 1); lab.position.set(0, .95, 0); lab.renderOrder = 10;
      pz.add(lab);
      if (it.free) {
        const b = new T.Sprite(new T.SpriteMaterial({ map: burstTexture('OFFERTE'), depthTest: false }));
        b.scale.set(1.05, 1.05, 1); b.renderOrder = 11; scene.add(b);
        pz.userData.badge = b;
      }
      scene.add(pz);
      objects.push(pz);
    });
    others.slice(0, 9).forEach((it, i, arr) => {
      const g = makeStandee(it.product.img, stage, it.product.n);
      // Autour d'une pizza seule, au centre de la couronne sinon
      const ring = pizzas.length === 1 ? 2.55 : pizzas.length > 1 ? (arr.length > 1 ? ringR * .42 : 0) : (arr.length > 1 ? 1.7 : 0);
      const a = (i / arr.length) * Math.PI * 2 + (pizzas.length === 1 ? Math.PI / 2 : .4);
      const x = Math.sin(a) * ring, z = Math.cos(a) * ring;
      g.position.set(x, 0, z);
      g.userData.home = new T.Vector3(x, 0, z);
      g.userData.index = it.index;
      g.userData.drop = (pizzas.length + i) * .12;
      g.userData.bob = Math.random() * 6;
      const sh = new T.Mesh(new T.CircleGeometry(.45, 24), new T.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: .22 }));
      sh.rotation.x = -Math.PI / 2; sh.position.y = .01; g.add(sh);
      scene.add(g);
      objects.push(g);
    });

    // Caméra en orbite
    const orbit = { theta: .5, phi: .95, r: Math.max(9, boardR * 2.7), tTheta: .5, tPhi: .95, tR: Math.max(9, boardR * 2.7) };
    const ray = new T.Raycaster(), ptr = new T.Vector2(-9, -9);
    let hovered = null, dragging = false, moved = 0, lastX = 0, lastY = 0, idle = 0, highlight = -1;

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
        orbit.tTheta -= dx * .008; orbit.tPhi = Math.min(1.35, Math.max(.35, orbit.tPhi - dy * .006));
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
          const v = o.position.clone(); v.y += .4; v.project(camera);
          const r = canvas.getBoundingClientRect();
          P.burst(r.left + (v.x + 1) / 2 * r.width, r.top + (1 - v.y) / 2 * r.height, P.bitsFor(items.find(i => i.index === o.userData.index).product), { count: 30, power: 11 });
        }
      }
    });
    canvas.addEventListener('wheel', e => { e.preventDefault(); orbit.tR = Math.min(boardR * 4, Math.max(5, orbit.tR + e.deltaY * .01)); idle = 0; }, { passive: false });

    // Survol du ticket → la pizza correspondante saute
    wrap.querySelectorAll('[data-o3d]').forEach(row => {
      row.addEventListener('pointerenter', () => { highlight = +row.dataset.o3d; });
      row.addEventListener('pointerleave', () => { highlight = -1; });
    });

    function resize() {
      const w = stage.clientWidth, h = stage.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    resize();
    addEventListener('resize', resize);

    const t0 = performance.now();
    let raf;
    function frame(now) {
      const t = (now - t0) / 1000;
      idle += 1 / 60;
      if (!dragging && idle > 2.5) orbit.tTheta += .0025;
      orbit.theta += (orbit.tTheta - orbit.theta) * .08;
      orbit.phi += (orbit.tPhi - orbit.phi) * .08;
      orbit.r += (orbit.tR - orbit.r) * .08;
      camera.position.set(Math.sin(orbit.theta) * Math.sin(orbit.phi) * orbit.r, Math.cos(orbit.phi) * orbit.r, Math.cos(orbit.theta) * Math.sin(orbit.phi) * orbit.r);
      camera.lookAt(0, .2, 0);

      objects.forEach(o => {
        const u = o.userData;
        // Chute avec rebond à l'ouverture
        const p = Math.min(1, Math.max(0, (t - u.drop) / 1.1));
        const hl = highlight === u.index;
        o.position.y = (1 - bounce(p)) * 7 + (hl ? .35 + Math.sin(t * 8) * .12 : 0);
        if (u.slices) {
          o.rotation.y = (1 - ease(p)) * 4 + t * .12;
          const target = u.open ? .55 : (o === hovered || hl ? .22 : 0);
          u.cut = (u.cut || 0) + (target - (u.cut || 0)) * .12;
          u.slices.forEach((s, i) => {
            const sd = s.userData;
            const lift = u.open && i === 0 ? 1 : 0;
            sd.lift += (lift - sd.lift) * .1;
            s.position.set(sd.dx * (u.cut + sd.lift * .6), sd.lift * .9, sd.dz * (u.cut + sd.lift * .6));
            s.rotation.x = sd.lift * -.35 * sd.dz; s.rotation.z = sd.lift * .35 * sd.dx;
          });
          if (u.badge) u.badge.position.set(o.position.x + u.R * .8, o.position.y + 2.05 + Math.sin(t * 3) * .08, o.position.z);
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
      renderer.render(scene, camera);
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    state = { wrap, renderer, raf: () => raf, resize, onKey, onClose, scene };
  }

  function close(silent) {
    if (!state) return;
    const s = state; state = null;
    cancelAnimationFrame(s.raf());
    removeEventListener('resize', s.resize);
    document.removeEventListener('keydown', s.onKey);
    s.wrap.classList.remove('is-open');
    setTimeout(() => {
      s.scene.traverse(o => { if (o.geometry) o.geometry.dispose(); });
      s.renderer.dispose();
      s.wrap.remove();
    }, silent ? 0 : 600);
    document.body.classList.remove('is-locked');
    if (!silent && s.onClose) s.onClose();
  }

  window.PF_ORDER3D = { open, close };
})();
