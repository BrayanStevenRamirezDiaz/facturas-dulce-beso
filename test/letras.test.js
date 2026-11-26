import { test } from 'node:test';
import assert from 'node:assert/strict';
import { numeroEnLetras, pesosEnLetras } from '../src/letras.js';

test('números sueltos', () => {
  const casos = {
    0: 'cero', 1: 'uno', 9: 'nueve', 10: 'diez', 15: 'quince', 16: 'dieciséis', 20: 'veinte', 21: 'veintiuno', 29: 'veintinueve',
    30: 'treinta', 31: 'treinta y uno', 99: 'noventa y nueve', 100: 'cien', 101: 'ciento uno', 500: 'quinientos', 999: 'novecientos noventa y nueve',
    1000: 'mil', 1001: 'mil uno', 2000: 'dos mil', 21000: 'veintiún mil', 31000: 'treinta y un mil', 100000: 'cien mil', 101000: 'ciento un mil',
    470000: 'cuatrocientos setenta mil', 607000: 'seiscientos siete mil', 999999: 'novecientos noventa y nueve mil novecientos noventa y nueve',
    1000000: 'un millón', 1214000: 'un millón doscientos catorce mil', 2000000: 'dos millones', 21000000: 'veintiún millones',
    999999999: 'novecientos noventa y nueve millones novecientos noventa y nueve mil novecientos noventa y nueve',
  };
  for (const [n, letras] of Object.entries(casos)) assert.equal(numeroEnLetras(Number(n)), letras, `n = ${n}`);
});

test('pesos: singular, apócope de "un" y "de pesos" en millones exactos', () => {
  assert.equal(pesosEnLetras(1214000), 'un millón doscientos catorce mil pesos');
  assert.equal(pesosEnLetras(607000), 'seiscientos siete mil pesos');
  assert.equal(pesosEnLetras(470000), 'cuatrocientos setenta mil pesos');
  assert.equal(pesosEnLetras(1), 'un peso');
  assert.equal(pesosEnLetras(21), 'veintiún pesos');
  assert.equal(pesosEnLetras(101), 'ciento un pesos');
  assert.equal(pesosEnLetras(0), 'cero pesos');
  assert.equal(pesosEnLetras(1000000), 'un millón de pesos');
  assert.equal(pesosEnLetras(2000000), 'dos millones de pesos');
  assert.equal(pesosEnLetras(1500000), 'un millón quinientos mil pesos');
});

test('rechaza lo que no sabe escribir', () => {
  for (const malo of [-1, 1.5, NaN, 1e9, '5']) assert.throws(() => pesosEnLetras(malo), RangeError, String(malo));
});
