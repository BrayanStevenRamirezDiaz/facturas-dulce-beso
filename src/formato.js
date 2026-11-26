const MESES = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];

export function formatoCOP(n) {
  return '$' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function partesFecha(iso) {
  const [anio, mes, dia] = iso.split('-').map(Number);
  return { anio, mes: MESES[mes - 1], dia };
}

export function fechaLarga(iso) {
  const { anio, mes, dia } = partesFecha(iso);
  return `${dia} de ${mes} ${anio}`;
}

export function fraseFirma(iso) {
  const { anio, mes, dia } = partesFecha(iso);
  return `La siguiente se firma a los ${dia} días del mes de ${mes} del ${anio}.`;
}
