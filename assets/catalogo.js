// NovahWeb · catálogo: buscador sin acentos, filtro por necesidad y por tipo de negocio, con la URL al día.
(() => {
  const form = document.querySelector('[data-catalogo-form]');
  const lista = document.querySelector('[data-catalogo]');
  if (!form || !lista) return;
  const items = [...lista.children];
  const cuenta = document.querySelector('[data-cuenta]');
  const vacio = document.querySelector('[data-vacio]');
  const waVacio = document.querySelector('[data-vacio-wa]');
  const chips = [...form.querySelectorAll('[data-necesidad]')];
  const norm = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
  const params = new URLSearchParams(location.search);
  form.q.value = params.get('q') || '';
  form.rubro.value = [...form.rubro.options].some((o) => o.value === params.get('rubro')) ? params.get('rubro') : '';
  let necesidad = chips.some((c) => c.dataset.necesidad === params.get('necesidad')) ? params.get('necesidad') : '';

  function aplicar(actualizarUrl = true) {
    const palabras = norm(form.q.value).split(/\s+/).filter(Boolean), rubro = form.rubro.value;
    let n = 0;
    for (const li of items) {
      const ok = (!necesidad || li.dataset.n.split(' ').includes(necesidad)) && (!rubro || li.dataset.r.split(' ').includes(rubro)) && palabras.every((p) => li.dataset.t.includes(p));
      li.hidden = !ok; if (ok) n++;
    }
    chips.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.necesidad === necesidad)));
    cuenta.textContent = n === 1 ? '1 servicio' : `${n} servicios`;
    vacio.hidden = n > 0;
    if (!n) waVacio.href = `https://wa.me/50763786576?text=${encodeURIComponent(`Hola, NovahWeb. Busqué «${form.q.value.trim() || 'algo'}» en su catálogo y no lo encontré. ¿Lo hacen?`)}`;
    if (actualizarUrl) {
      const u = new URLSearchParams();
      if (form.q.value.trim()) u.set('q', form.q.value.trim());
      if (necesidad) u.set('necesidad', necesidad);
      if (rubro) u.set('rubro', rubro);
      history.replaceState(null, '', u.toString() ? `?${u}` : location.pathname);
    }
  }
  form.q.addEventListener('input', () => aplicar());
  form.rubro.addEventListener('change', () => aplicar());
  chips.forEach((c) => c.addEventListener('click', () => { necesidad = c.dataset.necesidad; aplicar(); }));
  document.querySelector('[data-limpiar]')?.addEventListener('click', () => { form.q.value = ''; form.rubro.value = ''; necesidad = ''; aplicar(); form.q.focus(); });
  aplicar(false);
})();
