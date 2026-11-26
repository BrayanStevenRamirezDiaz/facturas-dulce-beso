# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Qué es

Web estática (sin servidor ni build) para que cualquiera genere desde el celular facturas, cuentas de cobro y cotizaciones en PDF de **POSTRES EL DULCE BESO** (emisor fijo: IVON MARITZA PEÑA HERRERA, NIT 52978306-5). Publicada con GitHub Pages desde `main`: https://brayanstevenramirezdiaz.github.io/facturas-dulce-beso/ (repo público `BrayanStevenRamirezDiaz/facturas-dulce-beso`). La interfaz y los textos están en español.

## Comandos

- Todas las pruebas: `node --test test/` (o `npm test`). Sin dependencias; ES modules (`"type": "module"`).
- Una sola prueba: `node --test test/pdf.test.js`, o `node --test --test-name-pattern="Carolina" test/`.
- Ver la web: servirla con `python -m http.server 8080` desde la raíz y abrir `http://localhost:8080` (hay una entrada `facturas` en `.claude/launch.json`, ignorada por git). Abrir `index.html` con `file://` no sirve: los módulos ES y el service worker necesitan http.
- No hay linter ni paso de build.

## Arquitectura

La separación importante es **lógica pura testeable vs. capa de navegador**:

- `src/tipos.js`, `src/factura.js`, `src/pdf.js`, `src/emisor.js`, `src/formato.js`, `src/letras.js` son puros (sin DOM, sin pdfmake): se prueban con `node --test`.
  - **`tipos.js` es la única fuente de lo que distingue a cada documento** (`factura`, `cotizacion`, `cobro`): título, prefijo del consecutivo, texto de introducción, texto del abono, qué columnas puede mostrar la tabla y qué campos opcionales acepta. Un documento nuevo se agrega ahí, no copiando archivos. Los datos sin `tipo` (historial viejo) se leen como `factura` (`claveDeTipo`).
  - `calcularDocumento(datos)` calcula totales, abono/saldo y columnas visibles según el tipo, y descarta los opcionales que el tipo no acepta. `validar(datos)` devuelve errores legibles; es el único punto donde se revisan los datos. (El archivo se llama `factura.js` por historia.)
  - `definicionPDF(documento, emisor, logo?)` devuelve el *docDefinition* de pdfmake. Los tres documentos comparten forma (logo arriba, marca de agua al 15%, tabla café y beige, declaración y firma). El `logo` (data URL) es opcional: sin él no hay imágenes, lo que mantiene las pruebas simples.
  - `emisor.js` es el único lugar con los datos del emisor y el texto legal de la declaración (decretos 1070 y 3032 de 2013). `formato.js` tiene `formatoCOP` y las fechas en el estilo de las facturas; `letras.js` escribe pesos en letras (hasta 999.999.999, lanza `RangeError` fuera de eso; `validar` limita el total).
- `src/almacen.js`: clientes, historial (máx. 50) y un consecutivo por tipo en `localStorage`. Recibe el storage por inyección y cae a memoria si el navegador lo bloquea. La factura conserva la clave original `consecutivo` (los otros usan `consecutivo_cobro`, `consecutivo_cotizacion`) para no reiniciar la numeración de quien ya usaba la web.
- `src/app.js`: única capa con DOM; une formulario, almacén y pdfmake. No tiene pruebas automáticas; se verifica a mano en el navegador. La pantalla sale del hash (`#factura`, `#cobro`, `#cotizacion`, sin hash = menú), así el botón "atrás" del celular vuelve al menú. Los campos que dependen del tipo llevan `data-tipos="factura cobro"` en `index.html` y se muestran u ocultan desde `mostrarCamposDelTipo`; no usar `required` en campos que pueden estar ocultos (bloquea el envío), validar en `validar`.
- `src/logo.js` es **generado** desde `assets/logo.png` (data URL base64). Si cambia el logo, hay que regenerarlo (no se edita a mano). `assets/logo.png` es de solo 370x213 px.
- `sw.js` + `manifest.webmanifest`: PWA. El service worker es red-primero con caché de respaldo.

## Cosas no obvias

- **pdfmake 0.2.7 (cdnjs) no descarga fuentes por URL.** `app.js` hace `fetch` de `fonts/LiberationSans-*.ttf`, las guarda en `pdfMake.vfs` y registra la familia `Arial` antes de generar. La fuente real es Liberation Sans (equivalente libre de Arial; no publicar el Arial de Windows por licencia). Las fuentes se cargan **antes** de gastar el consecutivo para que un fallo no consuma un número.
- **Al agregar, renombrar o quitar archivos servidos, actualizar la lista `BASE` de `sw.js` y subir la versión de `CACHE`** (hoy `facturas-v4`), o el uso sin conexión y las actualizaciones en celulares ya instalados se rompen.
- Las columnas MASA/PORCIONES (solo factura) aparecen si alguna línea las trae; el NIT del cliente solo si existe; el abono/saldo solo si se indica un porcentaje y el tipo lo acepta (no la cotización). En la cuenta de cobro el valor unitario se escribe pero no sale en el PDF, y el abono se redacta con su valor en letras.

## Glosario

- **Factura**: pedido con entrega; no cobra IVA (régimen simple). **Cotización**: precios para que el cliente apruebe. **Cuenta de cobro**: lo que el cliente debe, redactado como "X debe a Y por concepto de …".
- **Por concepto de**: el motivo del cobro, solo en la cuenta de cobro. **Abono**: porcentaje pagado por adelantado; el saldo es el resto. **Consecutivo**: número por tipo (FAC/CC/COT-0001) que solo aparece en el nombre del archivo.
- Las fechas se parsean desde el texto `YYYY-MM-DD` (no con `Date`) para evitar errores de zona horaria.
- Los datos viven solo en el navegador de cada celular: el consecutivo y el historial **no** se comparten entre dispositivos.

## Reglas de trabajo del usuario

- **Antes de cualquier `git commit` o `git push`, decir el nombre del commit y preguntar; el push se pregunta siempre aparte.** Esto prevalece sobre cualquier regla de "commitear y subir al final". Cada push actualiza la página pública.
- Hacer las preguntas antes de implementar cambios y, si el cambio es visual, mostrar ejemplos antes de aplicarlo.
- Mensajes de commit en español: por qué, qué cambió y cómo se probó.
