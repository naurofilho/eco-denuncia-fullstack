const dataCurta = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
const dataHora = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export function formatarData(iso) {
  return iso ? dataCurta.format(new Date(iso)) : '';
}

export function formatarDataHora(iso) {
  return iso ? dataHora.format(new Date(iso)) : '';
}

// "2026-11-19" -> data local (evita o dia anterior por causa do fuso UTC).
export function formatarDia(aaaaMmDd) {
  if (!aaaaMmDd) return '';
  const [a, m, d] = aaaaMmDd.split('-').map(Number);
  return dataCurta.format(new Date(a, m - 1, d));
}

export function diaISO(data = new Date()) {
  return new Date(data.getTime() - data.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

export function hojeISO() {
  return diaISO(new Date());
}

export function formatarCoordenadas(lat, lng) {
  if (lat == null || lng == null) return '';
  return `${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}`;
}
