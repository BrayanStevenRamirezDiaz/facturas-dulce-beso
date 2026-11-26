export const EMISOR = {
  nombre: 'IVON MARITZA PEÑA HERRERA',
  negocio: 'POSTRES EL DULCE BESO',
  nit: '52978306-5',
  correo: 'postreseldulcebeso@gmail.com',
};

export const MENSAJE_SOLICITUD = 'Damos respuesta a la solicitud presentada por ustedes para la facturación de los siguientes productos';

export const declaracion = (e) =>
  `Yo. ${e.nombre}. Identificada con NIT: ${e.nit}. Declaro que no cumplo con los requisitos para pertenecer al régimen común de impuestos a las ventas y por lo tanto no estoy obligado a facturar ni a cobrar IVA. Certifico que este dinero no supera el 80% de mis ingresos recibidos en el mes. De conformidad con el decreto 1070 y 3032 de 2013.`;
