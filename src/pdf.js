import { formatoCOP, fechaLarga, fraseFirma } from './formato.js';
import { declaracion } from './emisor.js';
import { TIPOS } from './tipos.js';

const CAFE = '#4a2c20';
const BEIGE = '#e8d9c4';
const LOGO_PROPORCION = 213 / 370;
const ENCABEZADOS = { concepto: 'CONCEPTO', masa: 'MASA', porciones: 'PORCIONES', unitario: 'VALOR UNITARIO', total: 'VALOR TOTAL' };

function columnasVisibles(columnas) {
  return ['concepto', 'cantidad', ...(columnas.masa ? ['masa'] : []), ...(columnas.porciones ? ['porciones'] : []), ...(columnas.unitario ? ['unitario'] : []), 'total'];
}

function celda(col, l) {
  const valores = {
    concepto: l.concepto, cantidad: String(l.cantidad), masa: l.masa || '', porciones: l.porciones ? String(l.porciones) : '',
    unitario: formatoCOP(l.valorUnitario), total: formatoCOP(l.valorTotal),
  };
  return { text: valores[col], alignment: col === 'concepto' || col === 'masa' ? 'left' : 'center' };
}

function tablaItems(f, tipo) {
  const cols = columnasVisibles(f.columnas);
  const titulos = { ...ENCABEZADOS, cantidad: tipo.etiquetaCantidad };
  const encabezado = cols.map((c) => ({ text: titulos[c], bold: true, alignment: 'center', fillColor: BEIGE, color: CAFE }));
  const filas = f.lineas.map((l) => cols.map((c) => celda(c, l)));
  const total = [{ text: 'Total', bold: true, alignment: 'right', colSpan: cols.length - 1 }, ...Array(cols.length - 2).fill({}), { text: formatoCOP(f.total), bold: true, alignment: 'center' }];
  return { layout: { hLineColor: () => CAFE, vLineColor: () => CAFE }, table: { headerRows: 1, widths: cols.map((c) => (c === 'concepto' || c === 'masa' ? '*' : 'auto')), body: [encabezado, ...filas, total] } };
}

function bloqueCliente(c) {
  return [{ text: c.nombre, bold: true, fontSize: 14, color: CAFE }, ...(c.nit ? [{ text: `NIT: ${c.nit}` }] : [])];
}

function bloqueNotas(f, tipo) {
  const out = [];
  if (f.entrega) out.push({ text: `Fecha y hora de entrega: ${f.entrega}`, margin: [0, 10, 0, 0] });
  if (f.notas) out.push({ text: f.notas, margin: [0, 6, 0, 0] });
  if (f.abono) out.push(...tipo.textoAbono(f.abono).map((text, i) => ({ text, margin: [0, i === 0 ? 6 : 0, 0, 0] })));
  return out;
}

function marcaDeAgua(logo) {
  const ancho = 400;
  return (_pagina, { width, height }) => ({
    image: logo, width: ancho, opacity: 0.15,
    absolutePosition: { x: (width - ancho) / 2, y: height / 2 - (ancho * LOGO_PROPORCION) / 2 },
  });
}

export function definicionPDF(f, emisor, logo) {
  const tipo = TIPOS[f.tipo];
  return {
    ...(logo ? { background: marcaDeAgua(logo) } : {}),
    pageSize: 'LETTER',
    pageMargins: [50, 50, 50, 50],
    defaultStyle: { font: 'Arial', fontSize: 11 },
    content: [
      ...(logo ? [{ image: logo, width: 110, alignment: 'center', margin: [0, 0, 0, 6] }] : []),
      { text: tipo.titulo, fontSize: 22, bold: true, alignment: 'center', color: CAFE },
      { text: fechaLarga(f.fecha), alignment: 'center', margin: [0, 0, 0, 14] },
      ...bloqueCliente(f.cliente),
      { text: emisor.negocio, bold: true, color: CAFE, margin: [0, 12, 0, 0] },
      { text: `NIT: ${emisor.nit}`, margin: [0, 0, 0, 12] },
      { text: tipo.intro(f, emisor), margin: [0, 0, 0, 10] },
      tablaItems(f, tipo),
      ...bloqueNotas(f, tipo),
      { text: declaracion(emisor), margin: [0, 24, 0, 10], alignment: 'justify' },
      { text: fraseFirma(f.fecha), margin: [0, 0, 0, 24] },
      { text: 'Atentamente:', margin: [0, 0, 0, 30] },
      { text: emisor.nombre, bold: true, color: CAFE },
      { text: `NIT: ${emisor.nit}` },
      { text: emisor.correo },
    ],
  };
}
