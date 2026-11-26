import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcularFactura } from '../src/factura.js';
import { definicionPDF } from '../src/pdf.js';
import { EMISOR } from '../src/emisor.js';

const textos = (nodo, acc = []) => {
  if (typeof nodo === 'string') acc.push(nodo);
  else if (Array.isArray(nodo)) nodo.forEach((n) => textos(n, acc));
  else if (nodo && typeof nodo === 'object') {
    for (const k of ['text', 'stack', 'table', 'body', 'content', 'columns']) if (nodo[k] !== undefined) textos(nodo[k], acc);
  }
  return acc;
};
const todo = (def) => textos(def.content).join('\n');
const tabla = (def) => def.content.find((n) => n.table).table;

const semrex = calcularFactura({
  fecha: '2026-11-24', cliente: { nombre: 'SEMREX', nit: '830100953-4' },
  lineas: [{ concepto: 'Cupcakes con decoración navideña', cantidad: 200, valorUnitario: 3500 }],
  notas: 'Envío incluido a Bosa Carbonell', abonoPct: 50,
});
const carolina = calcularFactura({
  fecha: '2026-11-24', cliente: { nombre: 'CAROLINA', nit: '' },
  lineas: [{ concepto: 'Torta', cantidad: 2, masa: 'Tres leches', porciones: 60, valorUnitario: 100000 }],
  entrega: '5 de diciembre del 2026 a las 4 pm',
});

test('emisor fijo', () => {
  assert.equal(EMISOR.nombre, 'IVON MARITZA PEÑA HERRERA');
  assert.equal(EMISOR.nit, '52978306-5');
});

test('PDF incluye cliente, emisor, declaración y firma', () => {
  const t = todo(definicionPDF(semrex, EMISOR));
  for (const s of ['FACTURA', '24 de NOVIEMBRE 2026', 'SEMREX', 'NIT: 830100953-4', 'POSTRES EL DULCE BESO',
    'Damos respuesta a la solicitud', 'decreto 1070 y 3032 de 2013',
    'La siguiente se firma a los 24 días del mes de NOVIEMBRE del 2026.', 'Atentamente', 'postreseldulcebeso@gmail.com']) {
    assert.ok(t.includes(s), 'falta: ' + s);
  }
});

test('SEMREX: 3 columnas, total, abono y notas', () => {
  const def = definicionPDF(semrex, EMISOR);
  const tb = tabla(def);
  assert.equal(tb.body[0].length, 4); // concepto, cantidad, unitario, total
  const t = todo(def);
  assert.ok(t.includes('$700.000') && t.includes('$3.500'));
  assert.ok(t.includes('50 % de abono ($350.000)') && t.includes('saldo ($350.000)'));
  assert.ok(t.includes('Envío incluido a Bosa Carbonell'));
});

test('Carolina: 6 columnas con masa y porciones, entrega, sin NIT de cliente', () => {
  const def = definicionPDF(carolina, EMISOR);
  assert.equal(tabla(def).body[0].length, 6);
  const t = todo(def);
  assert.ok(t.includes('Fecha y hora de entrega: 5 de diciembre del 2026 a las 4 pm'));
  assert.ok(t.includes('$200.000'));
  assert.ok(!t.includes('NIT: undefined') && !t.includes('NIT: \n'));
});

test('todas las filas de la tabla tienen el mismo número de celdas', () => {
  for (const f of [semrex, carolina]) {
    const { body } = tabla(definicionPDF(f, EMISOR));
    assert.ok(body.every((r) => r.length === body[0].length));
  }
});

test('fuente Arial y colores sobrios (café y crema)', () => {
  const def = definicionPDF(semrex, EMISOR);
  assert.equal(def.defaultStyle.font, 'Arial');
  const encabezado = tabla(def).body[0][0];
  assert.equal(encabezado.fillColor, '#e8d9c4');
  assert.equal(def.content[0].color, '#4a2c20');
});

test('sin logo no hay imágenes; con logo: marca de agua al 15% y logo arriba centrado', () => {
  const sin = definicionPDF(semrex, EMISOR);
  assert.equal(sin.background, undefined);
  assert.ok(!sin.content.some((n) => n.image));

  const con = definicionPDF(semrex, EMISOR, 'data:image/png;base64,AAA');
  const fondo = con.background(1, { width: 612, height: 792 });
  assert.equal(fondo.image, 'data:image/png;base64,AAA');
  assert.equal(fondo.opacity, 0.15);
  assert.equal(fondo.width, 400);
  assert.deepEqual(fondo.absolutePosition, { x: 106, y: 396 - (400 * 213) / 370 / 2 });
  const arriba = con.content[0];
  assert.equal(arriba.image, 'data:image/png;base64,AAA');
  assert.equal(arriba.alignment, 'center');
  assert.equal(arriba.width, 110);
});
