import { formatoCOP } from './formato.js';
import { TIPOS, claveDeTipo } from './tipos.js';

function calcularAbono(total, pct) {
  if (!pct) return null;
  const valor = Math.round((total * pct) / 100);
  return { pct, valor, saldo: total - valor };
}

const sumaTotal = (lineas) => lineas.reduce((s, l) => s + l.cantidad * l.valorUnitario, 0);
const LIMITE_TOTAL = 999999999;

export function calcularDocumento(datos) {
  const clave = claveDeTipo(datos);
  const tipo = TIPOS[clave];
  const lineas = datos.lineas.map((l) => ({ ...l, valorTotal: l.cantidad * l.valorUnitario }));
  const total = lineas.reduce((s, l) => s + l.valorTotal, 0);
  const conValor = (campo) => lineas.some((l) => Boolean(l[campo]));
  return {
    tipo: clave,
    fecha: datos.fecha,
    cliente: datos.cliente,
    lineas,
    total,
    columnas: {
      masa: tipo.columnas.masa && conValor('masa'),
      porciones: tipo.columnas.porciones && conValor('porciones'),
      unitario: tipo.columnas.unitario,
    },
    abono: tipo.acepta.abono ? calcularAbono(total, datos.abonoPct) : null,
    entrega: tipo.acepta.entrega ? datos.entrega || '' : '',
    notas: tipo.acepta.notas ? datos.notas || '' : '',
    porConcepto: tipo.acepta.porConcepto ? (datos.porConcepto || '').trim() : '',
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

function erroresDelTipo(datos, tipo) {
  const errs = [];
  if (tipo.acepta.porConcepto && !(datos.porConcepto || '').trim()) errs.push('Falta el "por concepto de"');
  const pct = datos.abonoPct;
  if (tipo.acepta.abono && pct !== undefined && pct !== null && !(pct >= 1 && pct <= 100)) errs.push('El abono debe estar entre 1 y 100');
  return errs;
}

export function validar(datos) {
  const tipo = TIPOS[claveDeTipo(datos)];
  if (!tipo) return ['Tipo de documento no válido'];
  const errs = [];
  if (!datos.cliente || !datos.cliente.nombre || !datos.cliente.nombre.trim()) errs.push('Falta el nombre del cliente');
  if (!datos.fecha) errs.push('Falta la fecha');
  if (!datos.lineas || datos.lineas.length === 0) errs.push('Agrega al menos un producto');
  else {
    datos.lineas.forEach((l, i) => errs.push(...erroresLinea(l, i)));
    if (sumaTotal(datos.lineas) > LIMITE_TOTAL) errs.push(`El total no puede superar ${formatoCOP(LIMITE_TOTAL)}`);
  }
  return [...errs, ...erroresDelTipo(datos, tipo)];
}
