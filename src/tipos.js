import { formatoCOP } from './formato.js';
import { pesosEnLetras } from './letras.js';

const solicitud = (para) => `Damos respuesta a la solicitud presentada por ustedes para ${para} de los siguientes productos`;

const abonoFactura = (a) => [
  `Agendamos tu pedido con el ${a.pct} % de abono (${formatoCOP(a.valor)})`,
  `El otro ${100 - a.pct} %, saldo (${formatoCOP(a.saldo)}), en el momento de la entrega`,
];

const abonoCobro = (a) => [
  `Iniciamos labores con un abono del ${a.pct}% que es (${formatoCOP(a.valor)}) ${pesosEnLetras(a.valor)} y el pago del otro ${100 - a.pct}% se realizará apenas terminemos labores.`,
];

// Única fuente de lo que distingue a cada documento. `columnas` dice cuáles pueden salir en la tabla;
// `acepta` cuáles campos opcionales entran; lo demás se ignora al calcular.
export const TIPOS = {
  factura: {
    titulo: 'FACTURA', nombre: 'factura', prefijo: 'FAC', etiquetaCantidad: 'CANTIDAD',
    columnas: { masa: true, porciones: true, unitario: true },
    acepta: { entrega: true, notas: true, abono: true, porConcepto: false },
    intro: () => solicitud('la facturación'),
    textoAbono: abonoFactura,
  },
  cotizacion: {
    titulo: 'COTIZACIÓN', nombre: 'cotización', prefijo: 'COT', etiquetaCantidad: 'CANTIDAD',
    columnas: { masa: false, porciones: false, unitario: true },
    acepta: { entrega: true, notas: true, abono: false, porConcepto: false },
    intro: () => solicitud('la cotización'),
    textoAbono: () => [],
  },
  cobro: {
    titulo: 'CUENTA DE COBRO', nombre: 'cuenta de cobro', prefijo: 'CC', etiquetaCantidad: 'UNIDADES',
    columnas: { masa: false, porciones: false, unitario: false },
    acepta: { entrega: true, notas: true, abono: true, porConcepto: true },
    intro: (d, emisor) =>
      `${d.cliente.nombre} debe a ${emisor.negocio} por concepto de ${d.porConcepto} por el valor total de (${formatoCOP(d.total)}) ${pesosEnLetras(d.total)}.`,
    textoAbono: abonoCobro,
  },
};

export const TIPO_POR_DEFECTO = 'factura';

// Datos viejos (historial) no traen tipo: se leen como factura, en un solo lugar.
export const claveDeTipo = (datos) => datos.tipo ?? TIPO_POR_DEFECTO;
