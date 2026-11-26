const LIMITE_HISTORIAL = 50;

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
    siguienteNumero() {
      const n = leer('consecutivo', 0) + 1;
      escribir('consecutivo', n);
      return n;
    },
    historial: () => leer('historial', []),
    guardarFactura(f) {
      escribir('historial', [f, ...this.historial()].slice(0, LIMITE_HISTORIAL));
    },
  };
}
