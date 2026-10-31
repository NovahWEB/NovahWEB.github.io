// NovahWeb · comportamiento común: paneles de la barra, hoja del menú y búsqueda (/, ⌘K o Ctrl+K).
(() => {
  const reducir = matchMedia('(prefers-reduced-motion: reduce)');

  // ── Paneles de Soluciones y Servicios ──
  const botones = [...document.querySelectorAll('.nav-btn[aria-controls]')];
  const cerrarPaneles = (excepto) => botones.forEach((b) => {
    if (b === excepto) return;
    b.setAttribute('aria-expanded', 'false');
    document.getElementById(b.getAttribute('aria-controls')).hidden = true;
  });
  botones.forEach((b) => b.addEventListener('click', () => {
    const panel = document.getElementById(b.getAttribute('aria-controls'));
    const abrir = panel.hidden;
    cerrarPaneles(b);
    panel.hidden = !abrir;
    b.setAttribute('aria-expanded', String(abrir));
  }));
  document.addEventListener('click', (e) => { if (!e.target.closest('.nav-btn, .mega')) cerrarPaneles(); });

  // ── Hoja del menú (teléfono) ──
  const hoja = document.getElementById('hoja-menu');
  const cerrarDialogo = (d) => {
    if (!d.open) return;
    if (reducir.matches || d.id !== 'hoja-menu') { d.close(); return; }
    d.classList.add('cerrando');
    setTimeout(() => { d.close(); d.classList.remove('cerrando'); }, 160);
  };
  document.querySelectorAll('[data-abre-menu]').forEach((b) => b.addEventListener('click', () => hoja.showModal()));
  document.querySelectorAll('dialog [data-cierra]').forEach((b) => b.addEventListener('click', () => cerrarDialogo(b.closest('dialog'))));
  document.querySelectorAll('dialog').forEach((d) => d.addEventListener('click', (e) => { if (e.target === d) cerrarDialogo(d); }));

  // ── Búsqueda ──
  const dlg = document.getElementById('buscador');
  const q = document.getElementById('buscador-q');
  const lista = document.getElementById('buscador-lista');
  const vacio = dlg.querySelector('.buscador-vacio');
  const waVacio = dlg.querySelector('[data-wa-busqueda]');
  let indice = null, actual = -1, resultados = [];
  const escHtml = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  async function cargar() {
    if (indice) return indice;
    try {
      const r = await fetch('/buscar.json');
      if (!r.ok) throw new Error(r.status);
      indice = (await r.json()).map((x) => ({ ...x, n: norm(`${x.t} ${x.k || ''} ${x.d}`), nt: norm(x.t) }));
    } catch {
      indice = [];
      vacio.hidden = false;
      vacio.firstChild.textContent = 'No se pudo cargar la búsqueda. ';
    }
    return indice;
  }
  function buscar() {
    const texto = norm(q.value.trim());
    const palabras = texto.split(/\s+/).filter(Boolean);
    if (!palabras.length) resultados = indice.filter((x) => x.g === 'Solución' || x.destacado).slice(0, 12);
    else {
      resultados = indice.map((x) => {
        let p = 0;
        for (const w of palabras) {
          if (!x.n.includes(w)) return null;
          p += x.nt.startsWith(w) ? 6 : x.nt.includes(w) ? 4 : 1;
        }
        return [p + (x.g === 'Servicio' ? .5 : 0), x];
      }).filter(Boolean).sort((a, b) => b[0] - a[0]).map((a) => a[1]).slice(0, 30);
    }
    lista.innerHTML = resultados.map((x, i) => `<li role="option" id="r-${i}" aria-selected="${i === 0}"><em>${escHtml(x.g)}</em><b>${escHtml(x.t)}</b><small>${escHtml(x.d)}</small></li>`).join('');
    actual = resultados.length ? 0 : -1;
    q.setAttribute('aria-activedescendant', actual >= 0 ? 'r-0' : '');
    vacio.hidden = resultados.length > 0;
    if (waVacio) waVacio.href = `https://wa.me/50763786576?text=${encodeURIComponent(`Hola, NovahWeb. Busqué «${q.value.trim()}» en su página y no lo encontré. ¿Lo hacen?`)}`;
  }
  function mover(d) {
    if (!resultados.length) return;
    lista.children[actual]?.setAttribute('aria-selected', 'false');
    actual = (actual + d + resultados.length) % resultados.length;
    const li = lista.children[actual];
    li.setAttribute('aria-selected', 'true');
    q.setAttribute('aria-activedescendant', li.id);
    li.scrollIntoView({ block: 'nearest' });
  }
  async function abrirBuscador() {
    if (hoja?.open) hoja.close();
    if (!dlg.open) dlg.showModal();
    q.focus();
    await cargar();
    buscar();
  }
  document.querySelectorAll('[data-abre-buscador]').forEach((b) => b.addEventListener('click', abrirBuscador));
  q.addEventListener('input', () => indice && buscar());
  q.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); mover(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); mover(-1); }
    else if (e.key === 'Enter' && actual >= 0) { e.preventDefault(); location.href = resultados[actual].u; }
  });
  lista.addEventListener('click', (e) => { const li = e.target.closest('li'); if (li) location.href = resultados[+li.id.slice(2)].u; });
  // ── Formularios que arman el mensaje de WhatsApp (y, si hay llave de Web3Forms, también mandan por correo) ──
  document.querySelectorAll('[data-form-wa]').forEach((form) => form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nombre = form.nombre.value.trim(), negocio = form.negocio?.value || '', msg = form.mensaje?.value.trim() || '';
    const err = form.querySelector('.campo-error');
    if (!nombre) { form.nombre.setAttribute('aria-invalid', 'true'); if (err) err.hidden = false; form.nombre.focus(); return; }
    form.nombre.removeAttribute('aria-invalid'); if (err) err.hidden = true;
    const texto = [`Hola, NovahWeb. Soy ${nombre}.`, negocio && `Tengo: ${negocio}.`, msg].filter(Boolean).join(' ');
    if (e.submitter?.hasAttribute('data-por-correo') && form.hasAttribute('data-web3forms')) {
      const estado = form.querySelector('[data-estado]');
      estado.textContent = 'Enviando…';
      try {
        const r = await fetch('https://api.web3forms.com/submit', { method: 'POST', headers: { Accept: 'application/json' }, body: new FormData(form) });
        const j = await r.json();
        estado.textContent = j.success ? 'Recibido. Te escribimos al correo que nos dejaste.' : 'No se pudo enviar por correo. Usa el botón de WhatsApp o escríbenos a hola@novahweb.com.';
      } catch { estado.textContent = 'No se pudo enviar por correo. Usa el botón de WhatsApp o escríbenos a hola@novahweb.com.'; }
      return;
    }
    location.assign(`https://wa.me/50763786576?text=${encodeURIComponent(texto)}`);
  }));

  document.addEventListener('keydown', (e) => {
    const escribiendo = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName) || document.activeElement?.isContentEditable;
    if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !escribiendo && !dlg.open)) { e.preventDefault(); abrirBuscador(); }
    if (e.key === 'Escape') cerrarPaneles();
  });
})();
