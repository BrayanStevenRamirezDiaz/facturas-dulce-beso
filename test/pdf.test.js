import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcularDocumento } from '../src/factura.js';
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

const semrex = calcularDocumento({
  fecha: '2026-11-24', cliente: { nombre: 'SEMREX', nit: '830100953-4' },
  lineas: [{ concepto: 'Cupcakes con decoración navideña', cantidad: 200, valorUnitario: 3500 }],
  notas: 'Envío incluido a Bosa Carbonell', abonoPct: 50,
});
const carolina = calcularDocumento({
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

const cotizacion = calcularDocumento({
  tipo: 'cotizacion', fecha: '2026-10-27', cliente: { nombre: 'GI GROUP SERVICIOS S.A.S.', nit: '800.151.175-1' },
  lineas: [
    { concepto: 'Refrigerios' + String.fromCharCode(10) + 'Mini hamburguesa artesanal', cantidad: 55, valorUnitario: 8000 },
    { concepto: 'Domicilio', cantidad: 1, valorUnitario: 30000 },
  ],
});
const cobro = calcularDocumento({
  tipo: 'cobro', fecha: '2026-10-27', cliente: { nombre: 'JEANSCO S.A.S', nit: '901.914.035-9' }, porConcepto: 'productos de Halloween',
  lineas: [{ concepto: 'Cupcakes', cantidad: 101, valorUnitario: 3500 }, { concepto: 'Todo lo demás', cantidad: 1, valorUnitario: 860500 }],
  abonoPct: 50, notas: 'Gracias',
});

const encabezados = (def) => tabla(def).body[0].map((c) => c.text);

test('cotización: título, mensaje, 4 columnas, concepto en varias líneas y sin abono', () => {
  const def = definicionPDF(cotizacion, EMISOR);
  const t = todo(def);
  assert.ok(t.includes('COTIZACIÓN') && !t.includes('FACTURA'));
  assert.ok(t.includes('Damos respuesta a la solicitud presentada por ustedes para la cotización de los siguientes productos'));
  assert.deepEqual(encabezados(def), ['CONCEPTO', 'CANTIDAD', 'VALOR UNITARIO', 'VALOR TOTAL']);
  assert.equal(tabla(def).body[1][0].text, 'Refrigerios' + String.fromCharCode(10) + 'Mini hamburguesa artesanal');
  assert.ok(t.includes('$470.000'));
  assert.ok(t.includes('La siguiente se firma a los 27 días del mes de OCTUBRE del 2026.'));
  assert.ok(!t.includes('abono'));
});

test('cuenta de cobro: título, frase con total en letras, 3 columnas, abono en letras', () => {
  const def = definicionPDF(cobro, EMISOR);
  const t = todo(def);
  assert.ok(t.includes('CUENTA DE COBRO'));
  assert.ok(t.includes('JEANSCO S.A.S debe a POSTRES EL DULCE BESO por concepto de productos de Halloween por el valor total de ($1.214.000) un millón doscientos catorce mil pesos.'));
  assert.ok(!t.includes('Damos respuesta'));
  assert.deepEqual(encabezados(def), ['CONCEPTO', 'UNIDADES', 'VALOR TOTAL']);
  assert.ok(!t.includes('$3.500') && t.includes('$353.500'));
  assert.ok(t.includes('Iniciamos labores con un abono del 50% que es ($607.000) seiscientos siete mil pesos y el pago del otro 50% se realizará apenas terminemos labores.'));
  assert.ok(t.includes('Gracias'));
  assert.equal(tabla(def).body.at(-1).length, 3);
});

test('los tres documentos comparten forma: logo arriba, marca de agua, Arial y declaración', () => {
  for (const d of [semrex, cotizacion, cobro]) {
    const def = definicionPDF(d, EMISOR, 'data:image/png;base64,AAA');
    assert.equal(def.content[0].image, 'data:image/png;base64,AAA');
    assert.equal(def.background(1, { width: 612, height: 792 }).opacity, 0.15);
    assert.equal(def.defaultStyle.font, 'Arial');
    assert.ok(todo(def).includes('decreto 1070 y 3032 de 2013'));
  }
});
