// NovahWeb · portada: el cielo, el istmo, el cometa (el único momento de autor) y el selector de negocio.
// Todo lo que se mueve usa transform y opacity con WAAPI. El cielo se pinta una vez (y otra si cambia el ancho).
(() => {
  const reducir = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const portada = document.querySelector('.portada');
  if (!portada) return;
  const cielo = portada.querySelector('.cielo');
  const cometa = portada.querySelector('.cometa');
  const ANG = -27 * Math.PI / 180; // la estela apunta arriba a la derecha
  const tema = matchMedia('(prefers-color-scheme: dark)');
  let oscuro = tema.matches; // claro: el planeta de día y el istmo como carta; oscuro: de noche, con las ciudades encendidas
  let istmo = null;

  const semilla = (s) => () => ((s = (s * 16807) % 2147483647) / 2147483647);

  // ── El sprite del cometa: cabeza, cola de polvo, cola de iones y polvo suelto ──
  function pintarCometa(canvas, L) {
    const pad = Math.round(L * 0.075 + 30), hh = Math.round(L * 0.06 + 30);
    const w = L + pad * 2, h = hh * 2;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
    const c = canvas.getContext('2d');
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.globalCompositeOperation = oscuro ? 'lighter' : 'source-over';
    const x0 = pad, y0 = hh, a = L * (oscuro ? 0.05 : 0.058);
    const cola = () => { c.beginPath(); c.moveTo(x0, y0 - 2.5); c.quadraticCurveTo(x0 + L * 0.5, y0 - a * 0.45, x0 + L, y0 - a * 1.35); c.lineTo(x0 + L, y0 + a * 0.5); c.quadraticCurveTo(x0 + L * 0.5, y0 + a * 0.32, x0, y0 + 2.5); c.closePath(); };
    const g = c.createLinearGradient(x0, 0, x0 + L, 0);
    if (oscuro) { g.addColorStop(0, 'rgba(255,240,210,.95)'); g.addColorStop(0.06, 'rgba(255,206,120,.78)'); g.addColorStop(0.3, 'rgba(255,160,52,.34)'); g.addColorStop(0.65, 'rgba(255,122,0,.11)'); g.addColorStop(1, 'rgba(255,122,0,0)'); }
    else { g.addColorStop(0, 'rgba(255,122,0,1)'); g.addColorStop(0.08, 'rgba(255,122,0,.92)'); g.addColorStop(0.32, 'rgba(255,140,30,.5)'); g.addColorStop(0.68, 'rgba(255,158,44,.18)'); g.addColorStop(1, 'rgba(255,158,44,0)'); }
    c.save(); c.shadowColor = oscuro ? 'rgba(255,150,40,.75)' : 'rgba(255,122,0,.3)'; c.shadowBlur = oscuro ? 22 : 16; c.fillStyle = g; cola(); c.fill(); c.restore();
    c.fillStyle = g; cola(); c.fill();
    // cola de iones: recta, fina y clara
    const gi = c.createLinearGradient(x0, y0, x0 + L * 1.02, y0 - a * 2.2);
    if (oscuro) { gi.addColorStop(0, 'rgba(255,255,255,.85)'); gi.addColorStop(0.5, 'rgba(255,240,215,.22)'); gi.addColorStop(1, 'rgba(255,240,215,0)'); }
    else { gi.addColorStop(0, 'rgba(11,15,20,.55)'); gi.addColorStop(0.5, 'rgba(11,15,20,.14)'); gi.addColorStop(1, 'rgba(11,15,20,0)'); }
    c.strokeStyle = gi; c.lineWidth = 1.1; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0 + L * 1.02, y0 - a * 2.2); c.stroke();
    // polvo suelto
    const r = semilla(42);
    for (let i = 0; i < Math.round(L * 0.22); i++) {
      const t = r() ** 1.35, px = x0 + t * L * 0.95, py = y0 + (r() - 0.5) * (5 + t * a * 1.8) - t * a * 0.55;
      c.fillStyle = oscuro ? `rgba(255,${200 + Math.round(r() * 40)},${130 + Math.round(r() * 60)},${((1 - t) * 0.75).toFixed(3)})` : `rgba(${200 + Math.round(r() * 40)},${85 + Math.round(r() * 40)},0,${((1 - t) * 0.65).toFixed(3)})`;
      c.beginPath(); c.arc(px, py, 0.35 + r() * 0.9 * (1 - t * 0.7), 0, 6.283); c.fill();
    }
    // cabeza
    const rc = Math.max(26, L * 0.06);
    const gc = c.createRadialGradient(x0, y0, 0, x0, y0, rc);
    if (oscuro) { gc.addColorStop(0, 'rgba(255,255,255,1)'); gc.addColorStop(0.07, 'rgba(255,248,230,1)'); gc.addColorStop(0.2, 'rgba(255,214,140,.62)'); gc.addColorStop(0.5, 'rgba(255,165,60,.16)'); gc.addColorStop(1, 'rgba(255,122,0,0)'); }
    else { gc.addColorStop(0, 'rgba(255,122,0,.5)'); gc.addColorStop(0.3, 'rgba(255,122,0,.2)'); gc.addColorStop(1, 'rgba(255,122,0,0)'); }
    c.fillStyle = gc; c.beginPath(); c.arc(x0, y0, rc, 0, 6.283); c.fill();
    if (!oscuro) { c.fillStyle = '#ff7a00'; c.beginPath(); c.arc(x0, y0, 4.6, 0, 6.283); c.fill(); }
    c.fillStyle = '#fff'; c.beginPath(); c.arc(x0, y0, oscuro ? 2.1 : 2, 0, 6.283); c.fill();
    canvas.style.transformOrigin = `${pad}px ${hh}px`;
    return { pad, hh };
  }
  const pose = (s, x, y, rot = ANG) => `translate(${(x - s.pad).toFixed(1)}px, ${(y - s.hh).toFixed(1)}px) rotate(${rot}rad)`;

  // ── El cielo con el istmo de noche ──
  function pintarCielo() {
    const W = portada.clientWidth, H = portada.clientHeight;
    const acc = portada.querySelector('.portada-acc').getBoundingClientRect();
    const top = portada.getBoundingClientRect().top;
    const fondoTexto = acc.bottom - top;
    const movil = W < 900;
    const horizonte = Math.min(Math.max(fondoTexto + (movil ? 34 : 46), H * 0.64), H - (movil ? 150 : 170));
    cielo.width = Math.round(W * dpr); cielo.height = Math.round(H * dpr);
    const c = cielo.getContext('2d');
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.fillStyle = oscuro ? '#050505' : '#fafafa'; c.fillRect(0, 0, W, H);
    const R = W * (movil ? 3.2 : 2.3), cx = W / 2, cy = horizonte + R;
    const limbo = (x) => cy - Math.sqrt(Math.max(R * R - (x - cx) ** 2, 0));
    if (!oscuro) return pintarDia(c, W, H, horizonte, R, cx, cy, movil, limbo);

    // brillo cálido muy bajo detrás del cometa
    const gb = c.createRadialGradient(W * 0.86, H * 0.08, 0, W * 0.86, H * 0.08, W * 0.55);
    gb.addColorStop(0, 'rgba(255,170,80,.07)'); gb.addColorStop(1, 'rgba(255,170,80,0)');
    c.fillStyle = gb; c.fillRect(0, 0, W, H);

    // estrellas, con una banda de Vía Láctea en diagonal
    const r = semilla(1357);
    const n = Math.round((W * horizonte) / (movil ? 1100 : 1350));
    c.globalCompositeOperation = 'lighter';
    const banda = (x) => H * 0.95 - x * (H * 0.9 / W) * 0.72;
    for (let i = 0; i < n * 1.45; i++) {
      let x = r() * W, y = r() * horizonte;
      if (i >= n) { x = r() * W; y = banda(x) + (r() - 0.5) * (r() * 160); }
      if (y > limbo(x) - 4 || y < 0) continue;
      const k = r(), rad = i >= n ? 0.25 + k ** 3 * 0.6 : 0.3 + k ** 4 * 1.35;
      const alfa = i >= n ? 0.12 + r() * 0.3 : 0.18 + r() * 0.72;
      const tono = r(); const col = tono < 0.1 ? '255,228,190' : tono < 0.17 ? '222,232,255' : '255,255,255';
      if (rad > 1.05) { const gs = c.createRadialGradient(x, y, 0, x, y, rad * 4.5); gs.addColorStop(0, `rgba(${col},${(alfa * 0.25).toFixed(3)})`); gs.addColorStop(1, `rgba(${col},0)`); c.fillStyle = gs; c.beginPath(); c.arc(x, y, rad * 4.5, 0, 6.283); c.fill(); }
      c.fillStyle = `rgba(${col},${alfa.toFixed(3)})`; c.beginPath(); c.arc(x, y, rad, 0, 6.283); c.fill();
    }
    c.save(); c.translate(W / 2, banda(W / 2)); c.rotate(Math.atan2(-(H * 0.9 / W) * 0.72, 1));
    const gv = c.createLinearGradient(0, -110, 0, 110); gv.addColorStop(0, 'rgba(255,240,220,0)'); gv.addColorStop(0.5, 'rgba(255,236,210,.035)'); gv.addColorStop(1, 'rgba(255,240,220,0)');
    c.fillStyle = gv; c.fillRect(-W, -110, W * 2, 220); c.restore();
    c.globalCompositeOperation = 'source-over';

    // atmósfera: halo ancho y la línea fina del limbo, más brillante cerca del centro
    const ga = c.createRadialGradient(cx, cy, R, cx, cy, R + (movil ? 70 : 120));
    ga.addColorStop(0, 'rgba(255,160,70,.24)'); ga.addColorStop(0.3, 'rgba(255,140,50,.08)'); ga.addColorStop(1, 'rgba(255,122,0,0)');
    c.fillStyle = ga; c.beginPath(); c.arc(cx, cy, R + (movil ? 70 : 120), 0, 6.283); c.fill();
    // cuerpo del planeta
    const gp = c.createLinearGradient(0, horizonte, 0, H);
    gp.addColorStop(0, '#0b0e13'); gp.addColorStop(0.5, '#07090c'); gp.addColorStop(1, '#050505');
    c.fillStyle = gp; c.beginPath(); c.arc(cx, cy, R, 0, 6.283); c.fill();
    const gl = c.createLinearGradient(0, 0, W, 0);
    gl.addColorStop(0, 'rgba(255,196,120,.18)'); gl.addColorStop(0.58, 'rgba(255,226,170,.95)'); gl.addColorStop(1, 'rgba(255,196,120,.3)');
    c.save(); c.shadowColor = 'rgba(255,165,70,.9)'; c.shadowBlur = 14; c.strokeStyle = gl; c.lineWidth = 1.4;
    c.beginPath(); c.arc(cx, cy, R + 0.5, Math.PI * 1.2, Math.PI * 1.8); c.stroke(); c.restore();

    if (istmo) pintarIstmo(c, W, H, horizonte, R, movil);
    fundido(c, W, H);
    return { W, H, horizonte };
  }
  const fundido = (c, W, H) => {
    const base = oscuro ? '5,5,5' : '250,250,250';
    const gf = c.createLinearGradient(0, H - 90, 0, H); gf.addColorStop(0, `rgba(${base},0)`); gf.addColorStop(1, `rgba(${base},1)`);
    c.fillStyle = gf; c.fillRect(0, H - 90, W, 90);
  };

  // De día: cielo claro con una franja tibia sobre el horizonte, el planeta claro y el istmo como una carta.
  function pintarDia(c, W, H, horizonte, R, cx, cy, movil, limbo) {
    const gb = c.createRadialGradient(W * 0.84, H * 0.06, 0, W * 0.84, H * 0.06, W * 0.6);
    gb.addColorStop(0, 'rgba(255,170,90,.12)'); gb.addColorStop(1, 'rgba(255,170,90,0)');
    c.fillStyle = gb; c.fillRect(0, 0, W, H);
    // puntos de una carta celeste, muy tenues
    const r = semilla(2468);
    for (let i = 0; i < Math.round((W * horizonte) / (movil ? 5200 : 7000)); i++) {
      const x = r() * W, y = r() * horizonte;
      if (y > limbo(x) - 10) continue;
      c.fillStyle = `rgba(11,15,20,${(0.08 + r() * 0.16).toFixed(3)})`; c.beginPath(); c.arc(x, y, 0.5 + r() ** 3 * 1.1, 0, 6.283); c.fill();
    }
    // atmósfera tibia
    const ga = c.createRadialGradient(cx, cy, R, cx, cy, R + (movil ? 110 : 190));
    ga.addColorStop(0, 'rgba(255,160,80,.34)'); ga.addColorStop(0.3, 'rgba(255,190,130,.14)'); ga.addColorStop(1, 'rgba(255,210,170,0)');
    c.fillStyle = ga; c.beginPath(); c.arc(cx, cy, R + (movil ? 110 : 190), 0, 6.283); c.fill();
    const gp = c.createLinearGradient(0, horizonte, 0, H);
    gp.addColorStop(0, '#f1eeea'); gp.addColorStop(0.6, '#f6f5f3'); gp.addColorStop(1, '#fafafa');
    c.fillStyle = gp; c.beginPath(); c.arc(cx, cy, R, 0, 6.283); c.fill();
    const gl = c.createLinearGradient(0, 0, W, 0);
    gl.addColorStop(0, 'rgba(11,15,20,.14)'); gl.addColorStop(0.58, 'rgba(11,15,20,.5)'); gl.addColorStop(1, 'rgba(11,15,20,.16)');
    c.strokeStyle = gl; c.lineWidth = 1.1; c.beginPath(); c.arc(cx, cy, R + 0.5, Math.PI * 1.2, Math.PI * 1.8); c.stroke();
    if (istmo) pintarIstmo(c, W, H, horizonte, R, movil);
    fundido(c, W, H);
    return { W, H, horizonte };
  }


  function pintarIstmo(c, W, H, horizonte, R, movil) {
    const { ancho, alto } = istmo;
    const zLejos = 2.9, zCerca = 1, mcx = movil ? 520 : 470, escala = (movil ? 2.05 : 1.32) * W / ancho;
    const yLejos = horizonte + 7, yCerca = H + (movil ? 40 : 70);
    const inv = (z) => (1 / z - 1 / zLejos) / (1 / zCerca - 1 / zLejos);
    const p = (mx, my) => {
      const t = my / alto, z = zLejos + (zCerca - zLejos) * t;
      const x = W / 2 + (mx - mcx) * escala / z;
      const y = yLejos + (yCerca - yLejos) * inv(z) + ((x - W / 2) ** 2) / (2 * R);
      return [x, y, z];
    };
    const trazar = (d) => {
      c.beginPath();
      for (const anillo of d.split('Z')) {
        if (!anillo) continue;
        anillo.slice(1).split('L').forEach((par, i) => { const [a, b] = par.split(' ').map(Number); const [x, y] = p(a, b); i ? c.lineTo(x, y) : c.moveTo(x, y); });
        c.closePath();
      }
    };
    c.save();
    c.beginPath(); c.rect(0, horizonte + 3, W, H); c.clip();
    // retícula de meridianos y paralelos, cada grado
    const k = Math.cos(9 * Math.PI / 180) * 100;
    c.strokeStyle = oscuro ? 'rgba(255,255,255,.045)' : 'rgba(11,15,20,.075)'; c.lineWidth = 0.7;
    for (let lon = -86; lon <= -77; lon++) { c.beginPath(); for (let lat = 11.6; lat >= 6.9; lat -= 0.25) { const [x, y] = p((lon + 86.4) * k, (11.6 - lat) * 100); lat === 11.6 ? c.moveTo(x, y) : c.lineTo(x, y); } c.stroke(); }
    for (let lat = 7; lat <= 11; lat++) { c.beginPath(); for (let lon = -86.4; lon <= -76.9; lon += 0.25) { const [x, y] = p((lon + 86.4) * k, (11.6 - lat) * 100); lon === -86.4 ? c.moveTo(x, y) : c.lineTo(x, y); } c.stroke(); }
    for (const d of istmo.apagados) { trazar(d); c.fillStyle = oscuro ? '#080a0e' : '#eceae6'; c.fill(); c.strokeStyle = oscuro ? 'rgba(255,255,255,.05)' : 'rgba(11,15,20,.2)'; c.lineWidth = 0.7; c.stroke(); }
    const gt = c.createLinearGradient(0, horizonte, 0, H);
    if (oscuro) { gt.addColorStop(0, '#0b0f15'); gt.addColorStop(1, '#0e131a'); } else { gt.addColorStop(0, '#fffdfb'); gt.addColorStop(1, '#ffffff'); }
    for (const d of istmo.encendidos) { trazar(d); c.fillStyle = gt; c.fill(); }
    c.strokeStyle = oscuro ? 'rgba(255,200,106,.26)' : 'rgba(11,15,20,.62)'; c.lineWidth = oscuro ? 0.8 : 0.9;
    for (const d of istmo.encendidos) { trazar(d); c.stroke(); }
    // luces de las ciudades
    if (oscuro) {
      c.globalCompositeOperation = 'lighter';
      for (const [mx, my, peso, alfa] of istmo.luces) {
        const [x, y, z] = p(mx, my);
        if (x < -20 || x > W + 20 || y > H) continue;
        const kz = 1.5 / z, base = (peso ? 0.9 + peso * 0.5 : 0.5) * kz;
        if (peso) { const rg = base * 7; const g = c.createRadialGradient(x, y, 0, x, y, rg); g.addColorStop(0, `rgba(255,190,100,${(0.3 * alfa).toFixed(3)})`); g.addColorStop(1, 'rgba(255,170,80,0)'); c.fillStyle = g; c.beginPath(); c.arc(x, y, rg, 0, 6.283); c.fill(); }
        c.fillStyle = `rgba(255,228,180,${(0.55 + 0.45 * alfa).toFixed(3)})`; c.beginPath(); c.arc(x, y, base, 0, 6.283); c.fill();
      }
      c.globalCompositeOperation = 'source-over';
    } else {
      // de día, solo las ciudades: un punto quemado con su aro, como en una carta
      for (const [mx, my, peso] of istmo.luces) {
        if (!peso) continue;
        const [x, y, z] = p(mx, my);
        if (x < -20 || x > W + 20 || y > H) continue;
        const rr = (1.3 + peso * 0.55) * (1.4 / z);
        c.fillStyle = 'rgba(255,122,0,.16)'; c.beginPath(); c.arc(x, y, rr * 3.2, 0, 6.283); c.fill();
        c.fillStyle = '#cc5a00'; c.beginPath(); c.arc(x, y, rr, 0, 6.283); c.fill();
      }
    }
    // tres nombres, como en un mapa
    c.font = `500 ${movil ? 11 : 12}px ${getComputedStyle(document.body).fontFamily}`; c.fillStyle = oscuro ? 'rgba(209,213,219,.62)' : 'rgba(31,41,55,.82)';
    for (const [nombre, lon, lat] of [['Ciudad de Panamá', -79.52, 8.98], ['San José', -84.08, 9.93], ['David', -82.43, 8.43]]) {
      const mx = (lon + 86.4) * Math.cos(9 * Math.PI / 180) * 100, my = (11.6 - lat) * 100;
      const [x, y] = p(mx, my);
      if (x > 30 && x < W - 110) c.fillText(nombre, x + 9, y - 7);
    }
    c.restore();
  }

  // ── El cometa de la portada: entra una vez y se queda ──
  let spriteP = null, restoP = null;
  function colocarCometa(W, animar) {
    const movil = W < 900;
    const L = movil ? Math.min(W * 0.86, 380) : Math.min(W * 0.6, 920);
    spriteP = pintarCometa(cometa, L);
    const barra = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--barra')) || 60;
    restoP = movil ? [W * 0.3, barra + Math.min(76, portada.clientHeight * 0.09)] : [Math.max(W * 0.69, 780), barra + Math.min(190, portada.clientHeight * 0.2)];
    const fin = pose(spriteP, ...restoP);
    if (!animar || reducir) {
      cometa.style.transform = fin;
      cometa.animate([{ opacity: 0 }, { opacity: 1 }], { duration: animar ? 160 : 0, fill: 'forwards' });
      return;
    }
    const D = movil ? W * 1.15 : W * 0.6;
    const ini = pose(spriteP, restoP[0] + Math.cos(ANG) * D, restoP[1] + Math.sin(ANG) * D);
    cometa.style.transform = fin;
    cometa.animate([{ transform: ini, opacity: 0 }, { opacity: 1, offset: 0.16 }, { transform: fin, opacity: 1 }], { duration: movil ? 1050 : 1250, easing: 'cubic-bezier(.12,.72,.2,1)', fill: 'forwards' });
    brillo(movil ? 260 : 320);
  }

  // La luz del cometa pasa una vez por las letras del titular.
  function brillo(retraso) {
    const caja = portada.querySelector('.brillo'), v = caja?.querySelector('.brillo-v'), t = caja?.querySelector('.brillo-t'), h1 = portada.querySelector('h1');
    if (!caja || Math.abs(t.offsetHeight - h1.offsetHeight) > 4 || t.offsetWidth > caja.clientWidth + 8) return;
    const bw = caja.clientWidth, vw = v.clientWidth;
    const op = { duration: 1250, delay: retraso, easing: 'cubic-bezier(.45,.05,.3,1)' };
    v.animate([{ transform: `translateX(${bw}px)`, opacity: 1 }, { transform: `translateX(${-vw}px)`, opacity: 1 }], op);
    t.animate([{ transform: `translateX(${-bw}px)` }, { transform: `translateX(${vw}px)` }], op);
  }

  let ultimoAncho = 0;
  function todo(animar) {
    const { W } = pintarCielo();
    ultimoAncho = W;
    colocarCometa(W, animar);
  }
  const listo = Promise.race([document.fonts?.ready || Promise.resolve(), new Promise((r) => setTimeout(r, 700))]);
  fetch('/datos/istmo.json').then((r) => r.json()).then((d) => { istmo = d; if (ultimoAncho) pintarCielo(); }).catch(() => {});
  listo.then(() => todo(true));
  tema.addEventListener('change', (e) => {
    oscuro = e.matches;
    cometa.getAnimations().forEach((a) => a.cancel());
    todo(false);
  });
  let pend = 0;
  new ResizeObserver(() => {
    cancelAnimationFrame(pend);
    pend = requestAnimationFrame(() => { if (Math.abs(portada.clientWidth - ultimoAncho) > 1) { cometa.getAnimations().forEach((a) => a.cancel()); todo(false); } });
  }).observe(portada);

  // ── ¿Qué negocio tienes? Cambia los tres servicios para empezar ──
  const empieza = document.getElementById('empieza');
  if (empieza) {
    const cuerpo = empieza.querySelector('.empieza-cuerpo');
    const estado = empieza.querySelector('[data-empieza-estado]');
    const chips = [...document.querySelectorAll('.chip[data-rubro]')];
    chips.forEach((ch) => ch.addEventListener('click', () => {
      const ya = ch.getAttribute('aria-pressed') === 'true';
      chips.forEach((c) => c.setAttribute('aria-pressed', 'false'));
      if (!ya) ch.setAttribute('aria-pressed', 'true');
      const t = document.getElementById(`empieza-${ya ? 'pedido' : ch.dataset.rubro}`);
      cuerpo.replaceChildren(t.content.cloneNode(true));
      cuerpo.classList.remove('cambia'); void cuerpo.offsetWidth; cuerpo.classList.add('cambia');
      estado.textContent = ya ? 'Servicios para empezar en cualquier negocio' : `Servicios para empezar en ${t.dataset.nombre}`;
    }));
  }

})();
