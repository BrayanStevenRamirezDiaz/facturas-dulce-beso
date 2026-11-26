import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcularFactura, formatoCOP, fechaLarga, fraseFirma, validar } from '../src/factura.js';

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
  const f = calcularFactura(carolina);
  assert.equal(f.lineas[0].valorTotal, 200000);
  assert.equal(f.total, 200000);
  assert.deepEqual(f.columnas, { masa: true, porciones: true });
  assert.equal(f.abono, null);
});

test('caso SEMREX: sin masa ni porciones, abono 50%', () => {
  const f = calcularFactura(semrex);
  assert.equal(f.total, 700000);
  assert.deepEqual(f.columnas, { masa: false, porciones: false });
  assert.deepEqual(f.abono, { pct: 50, valor: 350000, saldo: 350000 });
});

test('varias líneas suman el total', () => {
  const f = calcularFactura({ ...semrex, lineas: [
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
