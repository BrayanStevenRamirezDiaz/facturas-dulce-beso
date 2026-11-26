import { calcularDocumento, validar } from './factura.js';
import { formatoCOP } from './formato.js';
import { TIPOS, claveDeTipo } from './tipos.js';
import { definicionPDF } from './pdf.js';
import { EMISOR } from './emisor.js';
import { crearAlmacen } from './almacen.js';
import { LOGO } from './logo.js';

const ARCHIVOS_FUENTE = { 'LiberationSans-Regular.ttf': 'fonts/LiberationSans-Regular.ttf', 'LiberationSans-Bold.ttf': 'fonts/LiberationSans-Bold.ttf' };
const FUENTES = {
  Arial: { normal: 'LiberationSans-Regular.ttf', bold: 'LiberationSans-Bold.ttf', italics: 'LiberationSans-Regular.ttf', bolditalics: 'LiberationSans-Bold.ttf' },
};

function aBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

let fuentesListas;
function cargarFuentes() {
  fuentesListas ??= Promise.all(Object.entries(ARCHIVOS_FUENTE).map(async ([nombre, url]) => {
    window.pdfMake.vfs[nombre] = aBase64(await (await fetch(url)).arrayBuffer());
  })).then(() => { window.pdfMake.fonts = FUENTES; }).catch((e) => { fuentesListas = undefined; throw e; });
  return fuentesListas;
}

const almacen = crearAlmacen(window.localStorage);
const $ = (id) => document.getElementById(id);
const num = (el) => (el.value === '' ? undefined : Number(el.value));
const codigo = (tipo, n) => `${TIPOS[tipo].prefijo}-${String(n).padStart(4, '0')}`;
const capitalizar = (s) => s.charAt(0) + s.slice(1).toLowerCase();

let tipoActual = null;
let pendiente = null;

function hoy() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function crearLinea(l = {}) {
  const div = document.createElement('div');
  div.className = 'linea';
  div.innerHTML = `<button type="button" class="quitar" aria-label="Quitar">✕</button>
    <label>Concepto</label><textarea class="concepto" rows="2"></textarea>
    <div data-tipos="factura"><label>Masa o descripción (opcional)</label><input class="masa"></div>
    <div class="fila">
      <div><label class="etq-cantidad">Cantidad</label><input class="cantidad" type="number" inputmode="numeric" min="1"></div>
      <div data-tipos="factura"><label>Porciones (opcional)</label><input class="porciones" type="number" inputmode="numeric" min="1"></div>
    </div>
    <label>Valor unitario</label><input class="unitario" type="number" inputmode="numeric" min="0">`;
  div.querySelector('.concepto').value = l.concepto || '';
  div.querySelector('.masa').value = l.masa || '';
  div.querySelector('.cantidad').value = l.cantidad || '';
  div.querySelector('.porciones').value = l.porciones || '';
  div.querySelector('.unitario').value = l.valorUnitario ?? '';
  div.querySelector('.quitar').addEventListener('click', () => { div.remove(); actualizarTotal(); });
  mostrarCamposDelTipo(div);
  return div;
}

function mostrarCamposDelTipo(raiz = document) {
  const tipo = tipoActual ?? 'factura';
  raiz.querySelectorAll('[data-tipos]').forEach((el) => { el.hidden = !el.dataset.tipos.split(' ').includes(tipo); });
  raiz.querySelectorAll('.etq-cantidad').forEach((el) => { el.textContent = capitalizar(TIPOS[tipo].etiquetaCantidad); });
}

function leerDatos() {
  const lineas = [...document.querySelectorAll('.linea')].map((d) => ({
    concepto: d.querySelector('.concepto').value,
    masa: d.querySelector('.masa').value.trim() || undefined,
    cantidad: num(d.querySelector('.cantidad')),
    porciones: num(d.querySelector('.porciones')),
    valorUnitario: num(d.querySelector('.unitario')) ?? 0,
  }));
  return {
    tipo: tipoActual ?? undefined,
    fecha: $('fecha').value,
    cliente: { nombre: $('cliente').value, nit: $('nit').value },
    porConcepto: $('porConcepto').value,
    lineas,
    entrega: $('entrega').value.trim(),
    notas: $('notas').value.trim(),
    abonoPct: num($('abono')),
  };
}

function actualizarTotal() {
  const total = leerDatos().lineas.reduce((s, l) => s + (l.cantidad || 0) * l.valorUnitario, 0);
  $('total').textContent = `Total: ${formatoCOP(total)}`;
}

function cargarDatos(d) {
  $('fecha').value = hoy();
  $('cliente').value = d.cliente.nombre;
  $('nit').value = d.cliente.nit || '';
  $('porConcepto').value = d.porConcepto || '';
  $('entrega').value = d.entrega || '';
  $('notas').value = d.notas || '';
  $('abono').value = d.abonoPct ?? '';
  $('lineas').replaceChildren(...d.lineas.map(crearLinea));
  actualizarTotal();
}

function formularioNuevo() {
  cargarDatos({ cliente: { nombre: '', nit: '' }, lineas: [{}] });
  $('errores').textContent = '';
}

function pintarClientes() {
  $('clientes').replaceChildren(...almacen.clientes().map((c) => Object.assign(document.createElement('option'), { value: c.nombre })));
}

function abrirDesdeHistorial(datos) {
  pendiente = datos;
  const destino = `#${claveDeTipo(datos)}`;
  if (location.hash === destino) mostrarPantalla(); else location.hash = destino;
}

function pintarHistorial() {
  $('historial').replaceChildren(...almacen.historial().map((h) => {
    const tipo = claveDeTipo(h.datos);
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = `${codigo(tipo, h.numero)} · ${h.datos.cliente.nombre} · ${formatoCOP(h.total)}`;
    b.addEventListener('click', () => abrirDesdeHistorial(h.datos));
    return b;
  }));
}

// La pantalla sale del hash (#factura, #cobro, #cotizacion): así el botón "atrás" del celular vuelve al menú.
function mostrarPantalla() {
  const tipo = location.hash.slice(1);
  const hayTipo = Object.hasOwn(TIPOS, tipo);
  $('menu').hidden = hayTipo;
  $('editor').hidden = !hayTipo;
  if (!hayTipo) return;
  const cambio = tipo !== tipoActual;
  tipoActual = tipo;
  $('titulo').textContent = `Nueva ${TIPOS[tipo].nombre}`;
  document.querySelector('label[for="fecha"]').textContent = `Fecha de la ${TIPOS[tipo].nombre}`;
  if (pendiente) { cargarDatos(pendiente); pendiente = null; } else if (cambio) formularioNuevo();
  mostrarCamposDelTipo();
  window.scrollTo(0, 0);
}

async function generar(e) {
  e.preventDefault();
  const datos = leerDatos();
  const errores = validar(datos);
  $('errores').textContent = errores.join('\n');
  if (errores.length) return;
  try { await cargarFuentes(); } catch { $('errores').textContent = 'No se pudo cargar la fuente. Revisa tu conexión e intenta de nuevo.'; return; }
  const documento = calcularDocumento(datos);
  const numero = almacen.siguienteNumero(documento.tipo);
  almacen.guardarCliente(datos.cliente);
  almacen.guardarFactura({ numero, total: documento.total, datos });
  const archivo = `${codigo(documento.tipo, numero)}-${datos.cliente.nombre.replace(/[^\w]+/g, '_')}.pdf`;
  window.pdfMake.createPdf(definicionPDF(documento, EMISOR, LOGO)).download(archivo);
  pintarClientes();
  pintarHistorial();
}

$('cliente').addEventListener('change', () => {
  const c = almacen.clientes().find((x) => x.nombre.toLowerCase() === $('cliente').value.trim().toLowerCase());
  if (c && !$('nit').value) $('nit').value = c.nit;
});
$('agregar').addEventListener('click', () => $('lineas').append(crearLinea()));
$('form').addEventListener('input', actualizarTotal);
$('form').addEventListener('submit', generar);
window.addEventListener('hashchange', mostrarPantalla);

formularioNuevo();
pintarClientes();
pintarHistorial();
mostrarPantalla();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
