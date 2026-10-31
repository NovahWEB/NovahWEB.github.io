// NovahWeb · plano del local: un aparato abierto a la vez y su punto marcado en el plano.
(() => {
  const aparatos = [...document.querySelectorAll('.aparato')];
  if (!aparatos.length) return;
  const puntos = document.querySelectorAll('.plano .punto');
  const vistas = [...document.querySelectorAll('.aparato-vista')];
  const marcar = (id) => puntos.forEach((p) => p.classList.toggle('activo', p.dataset.punto === id));
  aparatos.forEach((li) => li.querySelector('.aparato-btn').addEventListener('click', () => {
    aparatos.forEach((o) => { const on = o === li; o.classList.toggle('activo', on); o.querySelector('.aparato-btn').setAttribute('aria-pressed', String(on)); });
    vistas.forEach((v) => { v.hidden = v.dataset.vista !== li.dataset.aparato; });
    marcar(li.dataset.aparato);
  }));
  const inicial = document.querySelector('.aparato.activo');
  if (inicial) marcar(inicial.dataset.aparato);
})();
