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

function calcularAbono(total, pct) {
  if (!pct) return null;
  const valor = Math.round((total * pct) / 100);
  return { pct, valor, saldo: total - valor };
}

export function calcularFactura(datos) {
  const lineas = datos.lineas.map((l) => ({ ...l, valorTotal: l.cantidad * l.valorUnitario }));
  const total = lineas.reduce((s, l) => s + l.valorTotal, 0);
  return {
    fecha: datos.fecha,
    cliente: datos.cliente,
    lineas,
    total,
    columnas: {
      masa: lineas.some((l) => Boolean(l.masa)),
      porciones: lineas.some((l) => Boolean(l.porciones)),
    },
    abono: calcularAbono(total, datos.abonoPct),
    entrega: datos.entrega || '',
    notas: datos.notas || '',
  };
}

function erroresLinea(l, i) {
  const n = `Línea ${i + 1}: `;
  const errs = [];
  if (!l.concepto || !l.concepto.trim()) errs.push(n + 'falta el concepto');
  if (!(l.cantidad > 0)) errs.push(n + 'la cantidad debe ser mayor a 0');
  if (l.valorUnitario < 0) errs.push(n + 'el valor unitario no puede ser negativo');
  return errs;
}

export function validar(datos) {
  const errs = [];
  if (!datos.cliente || !datos.cliente.nombre || !datos.cliente.nombre.trim()) errs.push('Falta el nombre del cliente');
  if (!datos.fecha) errs.push('Falta la fecha');
  if (!datos.lineas || datos.lineas.length === 0) errs.push('Agrega al menos un producto');
  else datos.lineas.forEach((l, i) => errs.push(...erroresLinea(l, i)));
  if (datos.abonoPct !== undefined && datos.abonoPct !== null && !(datos.abonoPct >= 1 && datos.abonoPct <= 100)) {
    errs.push('El abono debe estar entre 1 y 100');
  }
  return errs;
}
