import { TIPO_POR_DEFECTO } from './tipos.js';

const LIMITE_HISTORIAL = 50;

// La factura conserva la clave original para no reiniciar la numeración de quien ya la usa.
const claveContador = (tipo) => (tipo === TIPO_POR_DEFECTO ? 'consecutivo' : `consecutivo_${tipo}`);

export function crearAlmacen(storage) {
  const respaldo = new Map();

  const leer = (clave, defecto) => {
    try {
      const v = storage.getItem(clave);
      if (v !== null) return JSON.parse(v);
    } catch { /* almacenamiento no disponible: se usa memoria */ }
    return respaldo.has(clave) ? respaldo.get(clave) : defecto;
  };

  const escribir = (clave, valor) => {
    respaldo.set(clave, valor);
    try { storage.setItem(clave, JSON.stringify(valor)); } catch { /* solo memoria */ }
  };

  return {
    clientes: () => leer('clientes', []),
    guardarCliente(c) {
      const nombre = (c.nombre || '').trim();
      if (!nombre) return;
      const otros = this.clientes().filter((x) => x.nombre.toLowerCase() !== nombre.toLowerCase());
      escribir('clientes', [...otros, { nombre, nit: (c.nit || '').trim() }].sort((a, b) => a.nombre.localeCompare(b.nombre)));
    },
    siguienteNumero(tipo = TIPO_POR_DEFECTO) {
      const clave = claveContador(tipo);
      const n = leer(clave, 0) + 1;
      escribir(clave, n);
      return n;
    },
    historial: () => leer('historial', []),
    guardarFactura(f) {
      escribir('historial', [f, ...this.historial()].slice(0, LIMITE_HISTORIAL));
    },
  };
}
