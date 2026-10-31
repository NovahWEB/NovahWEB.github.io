// NovahWeb · diagnóstico en 3 pasos. No guarda nada: al final arma el enlace de WhatsApp con el resumen.
(() => {
  const form = document.querySelector('[data-diagnostico]');
  if (!form) return;
  const datos = JSON.parse(document.getElementById('datos-diagnostico').textContent);
  const pasos = [...form.querySelectorAll('[data-paso]')];
  const ind = [...form.querySelectorAll('[data-paso-ind]')];
  const caja = form.querySelector('[data-dolores]');
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  let actual = 1, rubroPintado = '';

  const rubro = () => datos.rubros.find((r) => r.slug === form.rubro.value);
  function pintarDolores() {
    const r = rubro(); if (!r || r.slug === rubroPintado) return;
    rubroPintado = r.slug;
    caja.innerHTML = r.dolores.map((d, i) => `<label class="opcion"><input type="checkbox" name="dolor" value="${i}"><span>${esc(d.t)}</span></label>`).join('');
  }
  function ir(n) {
    actual = n;
    pasos.forEach((p) => { p.hidden = +p.dataset.paso !== n; });
    ind.forEach((li) => li.classList.toggle('on', +li.dataset.pasoInd <= Math.min(n, 3)));
    const titulo = pasos[n - 1].querySelector('legend, h2');
    titulo?.setAttribute('tabindex', '-1'); titulo?.focus({ preventScroll: false });
  }
  function error(n, mostrar) { const e = pasos[n - 1].querySelector('[data-error]'); if (e) e.hidden = !mostrar; return !mostrar; }
  function valido(n) {
    if (n === 1) return error(1, !form.rubro.value);
    if (n === 2) return error(2, !form.querySelectorAll('[name="dolor"]:checked').length && !form.otro.value.trim());
    if (n === 3) { const ok = form.nombre.value.trim().length > 0; form.nombre.toggleAttribute('aria-invalid', !ok); return error(3, !ok); }
    return true;
  }
  function resumen() {
    const r = rubro();
    const marcados = [...form.querySelectorAll('[name="dolor"]:checked')].map((c) => r.dolores[+c.value]);
    const sugeridos = [...new Set(marcados.flatMap((d) => d.s))].slice(0, 4);
    const lineas = [
      `Hola, NovahWeb. Soy ${form.nombre.value.trim()}${form.negocio.value.trim() ? `, de ${form.negocio.value.trim()}` : ''}.`,
      `Tengo ${r.negocio} en ${form.pais.value}.`,
      marcados.length ? `Lo que me pasa:\n${marcados.map((d) => `- ${d.t}`).join('\n')}` : '',
      form.otro.value.trim() ? `Otra cosa: ${form.otro.value.trim()}` : '',
      sugeridos.length ? `Me interesa: ${sugeridos.map((s) => datos.servicios[s]).join(', ')}.` : '',
      `${form.medio.value}.`,
    ].filter(Boolean);
    const texto = lineas.join('\n\n');
    form.querySelector('[data-resumen]').textContent = texto;
    form.querySelector('[data-sugeridos]').innerHTML = sugeridos.length ? `<div class="sugeridos"><p>Lo que te conviene ver primero</p><ul>${sugeridos.map((s) => `<li><a href="/servicios/${s}/">${esc(datos.servicios[s])}</a></li>`).join('')}</ul></div>` : '';
    form.querySelector('[data-enviar]').href = `https://wa.me/${datos.numero}?text=${encodeURIComponent(texto)}`;
  }
  form.addEventListener('click', (e) => {
    if (e.target.closest('[data-siguiente]')) {
      if (!valido(actual)) return;
      if (actual === 1) pintarDolores();
      if (actual === 3) resumen();
      ir(actual + 1);
    } else if (e.target.closest('[data-atras]')) ir(actual - 1);
  });
  form.addEventListener('change', (e) => { if (e.target.name === 'rubro') error(1, false); if (e.target.name === 'dolor') error(2, false); });
  const pre = new URLSearchParams(location.search).get('rubro');
  if (pre && datos.rubros.some((r) => r.slug === pre)) { form.querySelector(`[name="rubro"][value="${pre}"]`).checked = true; }
})();
