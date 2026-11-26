import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcularDocumento, validar } from '../src/factura.js';
import { formatoCOP, fechaLarga, fraseFirma } from '../src/formato.js';

const carolina = {
  fecha: '2026-11-24',
  cliente: { nombre: 'CAROLINA', nit: '' },
  lineas: [{ concepto: 'Torta con decoración para bautizo', cantidad: 2, masa: 'Tres leches y postre de maracuyá', porciones: 60, valorUnitario: 100000 }],
  entrega: '5 de diciembre del 2026 a las 4 pm',
};
const semrex = {
  fecha: '2026-11-24',
  cliente: { nombre: 'SEMREX', nit: '830100953-4' },
  lineas: [{ concepto: 'Cupcakes con decoración navideña', cantidad: 200, valorUnitario: 3500 }],
  notas: 'Envío incluido a Bosa Carbonell',
  abonoPct: 50,
};

test('formatoCOP usa punto de miles', () => {
  assert.equal(formatoCOP(200000), '$200.000');
  assert.equal(formatoCOP(3500), '$3.500');
  assert.equal(formatoCOP(0), '$0');
});

test('fechaLarga y fraseFirma en el estilo de las facturas', () => {
  assert.equal(fechaLarga('2026-11-24'), '24 de NOVIEMBRE 2026');
  assert.equal(fechaLarga('2026-01-05'), '5 de ENERO 2026');
  assert.equal(fraseFirma('2026-11-24'), 'La siguiente se firma a los 24 días del mes de NOVIEMBRE del 2026.');
});

test('caso Carolina: total, columnas masa y porciones, sin abono', () => {
  const f = calcularDocumento(carolina);
  assert.equal(f.lineas[0].valorTotal, 200000);
  assert.equal(f.total, 200000);
  assert.deepEqual(f.columnas, { masa: true, porciones: true, unitario: true });
  assert.equal(f.abono, null);
});

test('caso SEMREX: sin masa ni porciones, abono 50%', () => {
  const f = calcularDocumento(semrex);
  assert.equal(f.total, 700000);
  assert.deepEqual(f.columnas, { masa: false, porciones: false, unitario: true });
  assert.deepEqual(f.abono, { pct: 50, valor: 350000, saldo: 350000 });
});

test('varias líneas suman el total', () => {
  const f = calcularDocumento({ ...semrex, lineas: [
    { concepto: 'A', cantidad: 2, valorUnitario: 1000 },
    { concepto: 'B', cantidad: 1, valorUnitario: 500 },
  ], abonoPct: undefined });
  assert.equal(f.total, 2500);
});

test('validar acepta los casos reales', () => {
  assert.deepEqual(validar(carolina), []);
  assert.deepEqual(validar(semrex), []);
});

test('validar reporta errores legibles', () => {
  const errs = validar({ fecha: '', cliente: { nombre: ' ' }, lineas: [{ concepto: '', cantidad: 0, valorUnitario: -1 }], abonoPct: 150 });
  assert.ok(errs.includes('Falta el nombre del cliente'));
  assert.ok(errs.includes('Falta la fecha'));
  assert.ok(errs.includes('Línea 1: falta el concepto'));
  assert.ok(errs.includes('Línea 1: la cantidad debe ser mayor a 0'));
  assert.ok(errs.includes('Línea 1: el valor unitario no puede ser negativo'));
  assert.ok(errs.includes('El abono debe estar entre 1 y 100'));
  assert.deepEqual(validar({ fecha: '2026-01-01', cliente: { nombre: 'X' }, lineas: [] }), ['Agrega al menos un producto']);
});

const giGroup = {
  tipo: 'cotizacion', fecha: '2026-10-27', cliente: { nombre: 'GI GROUP SERVICIOS S.A.S.', nit: '800.151.175-1' },
  lineas: [
    { concepto: 'Refrigerios\nMini hamburguesa artesanal\nJugo en caja', cantidad: 55, masa: 'no debe salir', porciones: 3, valorUnitario: 8000 },
    { concepto: 'Domicilio', cantidad: 1, valorUnitario: 30000 },
  ],
  abonoPct: 50, entrega: '5 de noviembre a las 3 pm',
};
const jeansco = {
  tipo: 'cobro', fecha: '2026-10-27', cliente: { nombre: 'JEANSCO S.A.S', nit: '901.914.035-9' }, porConcepto: ' productos de Halloween ',
  lineas: [
    { concepto: 'Sándwich ataúd', cantidad: 30, valorUnitario: 3000 },
    { concepto: 'Cupcakes', cantidad: 101, valorUnitario: 3500 },
    { concepto: 'Mini hamburguesas', cantidad: 71, valorUnitario: 4000 },
    { concepto: 'Kits de galletas', cantidad: 20, valorUnitario: 7000 },
    { concepto: 'Domicilio 29/10/2026', cantidad: 1, valorUnitario: 15000 },
  ],
  abonoPct: 50, entrega: '1 de noviembre', notas: 'Gracias',
};

test('sin tipo se trata como factura (datos viejos del historial)', () => {
  const f = calcularDocumento(semrex);
  assert.equal(f.tipo, 'factura');
  assert.equal(calcularDocumento({ ...semrex, tipo: 'factura' }).tipo, 'factura');
});

test('cotización GI GROUP: $470.000, sin masa, porciones ni abono', () => {
  const d = calcularDocumento(giGroup);
  assert.equal(d.tipo, 'cotizacion');
  assert.equal(d.total, 470000);
  assert.deepEqual(d.columnas, { masa: false, porciones: false, unitario: true });
  assert.equal(d.abono, null);
  assert.equal(d.entrega, '5 de noviembre a las 3 pm');
  assert.equal(d.lineas[0].concepto, 'Refrigerios\nMini hamburguesa artesanal\nJugo en caja');
});

test('cuenta de cobro JEANSCO: total y abono 50%, sin valor unitario en el PDF', () => {
  const d = calcularDocumento({ ...jeansco, lineas: [{ concepto: 'Todo', cantidad: 1, valorUnitario: 1214000 }] });
  assert.equal(d.total, 1214000);
  assert.deepEqual(d.abono, { pct: 50, valor: 607000, saldo: 607000 });
  assert.deepEqual(d.columnas, { masa: false, porciones: false, unitario: false });
  assert.equal(d.porConcepto, 'productos de Halloween');
  assert.equal(d.entrega, '1 de noviembre');
  assert.equal(d.notas, 'Gracias');
});

test('validar: la cuenta de cobro exige "por concepto de"', () => {
  assert.deepEqual(validar(jeansco), []);
  assert.ok(validar({ ...jeansco, porConcepto: '  ' }).includes('Falta el "por concepto de"'));
  assert.deepEqual(validar(giGroup), []);
});

test('validar: tipo inválido y total demasiado grande', () => {
  assert.ok(validar({ ...semrex, tipo: 'recibo' }).includes('Tipo de documento no válido'));
  const enorme = { ...semrex, lineas: [{ concepto: 'x', cantidad: 1, valorUnitario: 1e9 }] };
  assert.ok(validar(enorme).includes('El total no puede superar $999.999.999'));
});
