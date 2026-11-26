import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crearAlmacen } from '../src/almacen.js';

const memoria = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)) }; };
const roto = { getItem() { throw new Error('bloqueado'); }, setItem() { throw new Error('bloqueado'); } };

test('guardar el mismo cliente dos veces no lo duplica y actualiza el NIT', () => {
  const a = crearAlmacen(memoria());
  a.guardarCliente({ nombre: 'SEMREX', nit: '' });
  a.guardarCliente({ nombre: 'semrex', nit: '830100953-4' });
  assert.deepEqual(a.clientes(), [{ nombre: 'semrex', nit: '830100953-4' }]);
});

test('no guarda clientes sin nombre', () => {
  const a = crearAlmacen(memoria());
  a.guardarCliente({ nombre: '  ', nit: '1' });
  assert.deepEqual(a.clientes(), []);
});

test('el consecutivo sube de uno en uno y persiste', () => {
  const s = memoria();
  assert.equal(crearAlmacen(s).siguienteNumero(), 1);
  assert.equal(crearAlmacen(s).siguienteNumero(), 2);
});

test('historial guarda lo más reciente primero y limita a 50', () => {
  const a = crearAlmacen(memoria());
  for (let i = 1; i <= 55; i++) a.guardarFactura({ numero: i });
  const h = a.historial();
  assert.equal(h.length, 50);
  assert.equal(h[0].numero, 55);
});

test('si el almacenamiento falla, sigue funcionando en memoria', () => {
  const a = crearAlmacen(roto);
  a.guardarCliente({ nombre: 'X', nit: '1' });
  assert.equal(a.clientes().length, 1);
  assert.equal(a.siguienteNumero(), 1);
  assert.equal(a.siguienteNumero(), 2);
});

test('el consecutivo cuenta aparte para cada tipo de documento', () => {
  const a = crearAlmacen(memoria());
  assert.equal(a.siguienteNumero('factura'), 1);
  assert.equal(a.siguienteNumero('cotizacion'), 1);
  assert.equal(a.siguienteNumero('cobro'), 1);
  assert.equal(a.siguienteNumero('cobro'), 2);
  assert.equal(a.siguienteNumero('factura'), 2);
  assert.equal(a.siguienteNumero(), 3, 'sin tipo cuenta como factura');
});

test('un celular que ya tenía facturas sigue su numeración (clave "consecutivo")', () => {
  const s = memoria();
  s.setItem('consecutivo', '7');
  const a = crearAlmacen(s);
  assert.equal(a.siguienteNumero('factura'), 8);
  assert.equal(a.siguienteNumero('cotizacion'), 1);
  assert.equal(s.getItem('consecutivo'), '8');
});

test('el historial conserva el tipo de cada documento', () => {
  const a = crearAlmacen(memoria());
  a.guardarFactura({ tipo: 'cobro', numero: 1 });
  assert.equal(a.historial()[0].tipo, 'cobro');
});
