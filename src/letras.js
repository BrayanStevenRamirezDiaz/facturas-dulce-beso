const MENORES_30 = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce', 'trece', 'catorce', 'quince',
  'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte', 'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco',
  'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve'];
const DECENAS = ['', '', '', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
const CENTENAS = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];
const LIMITE = 1e9;

// Antes de "mil", "millones" o "pesos" el uno se apocopa: un, veintiún.
const unidad = (n, apocope) => {
  if (!apocope) return MENORES_30[n];
  if (n === 1) return 'un';
  if (n === 21) return 'veintiún';
  return MENORES_30[n];
};

function menosDe100(n, apocope) {
  if (n < 30) return unidad(n, apocope);
  const u = n % 10;
  return u === 0 ? DECENAS[n / 10] : `${DECENAS[Math.floor(n / 10)]} y ${unidad(u, apocope)}`;
}

function menosDe1000(n, apocope) {
  if (n === 100) return 'cien';
  const resto = n % 100;
  return [CENTENAS[Math.floor(n / 100)], resto ? menosDe100(resto, apocope) : ''].filter(Boolean).join(' ');
}

function validarEntero(n) {
  if (!Number.isInteger(n) || n < 0 || n >= LIMITE) throw new RangeError(`Solo se escriben enteros entre 0 y ${LIMITE - 1}`);
}

export function numeroEnLetras(n, apocope = false) {
  validarEntero(n);
  if (n === 0) return 'cero';
  const millones = Math.floor(n / 1e6);
  const miles = Math.floor((n % 1e6) / 1000);
  const unidades = n % 1000;
  return [
    millones && (millones === 1 ? 'un millón' : `${menosDe1000(millones, true)} millones`),
    miles && (miles === 1 ? 'mil' : `${menosDe1000(miles, true)} mil`),
    unidades && menosDe1000(unidades, apocope),
  ].filter(Boolean).join(' ');
}

export function pesosEnLetras(n) {
  const letras = numeroEnLetras(n, true);
  if (n === 1) return `${letras} peso`;
  return n > 0 && n % 1e6 === 0 ? `${letras} de pesos` : `${letras} pesos`;
}
