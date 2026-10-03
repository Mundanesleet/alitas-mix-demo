/* Las Alitas Mix · configuración editable
   Todo lo que cambia con el negocio (precios, salsas, WhatsApp, horarios, textos de datos)
   vive aquí. No hay claves ni datos secretos: este sitio es estático y público. */
window.ALITAS = (() => {
/* ============================================================
   CONFIGURACIÓN: aquí se cambia todo lo editable (precios,
   salsas por combo, WhatsApp, horarios) sin tocar el diseño.
   ============================================================ */
const CONFIG = {
  whatsapp: '573132902422',            // WhatsApp de Pitalito (tomado del Linktree; confirmar con el restaurante)
  carruselMs: 3000,                    // tiempo que cada salsa se queda quieta al frente en el inicio
  giroMs: 1400,                        // lo que tarda el giro de una salsa a la siguiente
  salsaInicial: 'picante-full',
  combos: [                            // 'salsas' = máximo de salsas por combo (POR CONFIRMAR)
    { n: 5,  precio: 24000, salsas: 2 },
    { n: 7,  precio: 28000, salsas: 2 },
    { n: 9,  precio: 34000, salsas: 2 },
    { n: 12, precio: 42000, salsas: 2 }
  ],
  comboPorDefecto: 7,
  adicionales: [                       // precios de EJEMPLO, por confirmar
    { id: 'papita',   nombre: 'Papita criolla',      precio: 6000 },
    { id: 'yuquitas', nombre: 'Yuquitas',            precio: 6000 },
    { id: 'papas',    nombre: 'Extra papas francesa', precio: 5000 }
  ],
  familiares: [
    { n: '20 alitas', precio: 63000 }, { n: '30 alitas', precio: 80000 },
    { n: '40 alitas', precio: 100000 }, { n: '50 alitas', precio: 110000 }
  ],
  costillitas: [
    { n: '250 g', precio: 26000 }, { n: '500 g', precio: 44000 },
    { n: '1.000 g', precio: 78000 }, { n: 'Costialitas', precio: 60000 }
  ],
  jueves: { horario: 'Todos los jueves, de 4:00 p. m. a 10:00 p. m. Aplican términos y condiciones.' },
  direccion: '[DIRECCIÓN]',
  horarios: '[HORARIOS]',
  instagram: 'https://www.instagram.com/alitasmixcolombia/'
};

const SALSAS = [
  { id: 'bbq',           nombre: 'BBQ',           color: '#8A2A10' },
  { id: 'bbq-dulce',     nombre: 'BBQ dulce',     color: '#B5651D' },
  { id: 'picante-full',  nombre: 'Picante full',  color: '#C8141B' },
  { id: 'picante-suave', nombre: 'Picante suave', color: '#E2561E' },
  { id: 'miel-mostaza',  nombre: 'Miel mostaza',  color: '#E3A917' },
  { id: 'envinada',      nombre: 'Envinada',      color: '#6B1630' },
  { id: 'maracuya',      nombre: 'Maracuyá',      color: '#F0B400' },
  { id: 'naranja',       nombre: 'Naranja',       color: '#EE7A1A' }
];

const IMG = {
  bowl: 'img/bowl.webp',
  'bbq': 'img/bbq.webp', 'bbq-dulce': 'img/bbq-dulce.webp', 'picante-full': 'img/picante-full.webp',
  'picante-suave': 'img/picante-suave.webp', 'miel-mostaza': 'img/miel-mostaza.webp',
  'envinada': 'img/envinada.webp', 'maracuya': 'img/maracuya.webp', 'naranja': 'img/naranja.webp',
  jueves: 'img/jueves-2x1.webp', combos: 'img/menu-combos.webp',
  familiares: 'img/menu-familiares.webp', costillitas: 'img/menu-costillitas.webp'
};

return { CONFIG, SALSAS, IMG };
})();
