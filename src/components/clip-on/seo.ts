// Title, descripcion y preview de /clip-on. Lo leen dos lados y por eso vive
// aca, sin imports: vite.config.ts lo usa para escribir clip-on.html en el
// build (lo que ven WhatsApp y Facebook, que no ejecutan JS) y la pagina lo
// aplica al montar (lo que ve quien llega navegando desde la home). Si cambia
// algo, cambia en los dos.
//
// Sin precio: el precio vive en order.ts, que vite.config no puede importar, y
// un precio escrito aca a mano se desincroniza el dia que cambie. El JSON-LD
// con el precio lo agrega la pagina.

// El dominio sin www redirige a www, asi que la URL canonica es la con www.
export const CLIP_ON_URL = "https://www.nocte.studio/clip-on";

export const CLIP_ON_TITLE = "Clip-On Rojo para lentes recetados | NOCTE®";

export const CLIP_ON_DESCRIPTION =
  "Clip-On Rojo NOCTE: se engancha sobre tus lentes con aumento, filtra la luz azul y se saca en un segundo. Envío gratis y pago contra entrega en todo Paraguay.";

export const CLIP_ON_SHARE_TITLE = "NOCTE Clip-On Rojo, para los que usan lentes con aumento";

// Recorte 1200x630 de la foto del hero (public/og-clip-on.jpg). JPG y no WebP:
// es el formato que todos los scrapers de preview muestran sin excepciones.
export const CLIP_ON_SHARE_IMAGE = {
  url: "https://www.nocte.studio/og-clip-on.jpg",
  type: "image/jpeg",
  width: 1200,
  height: 630,
  alt: "Clip-On NOCTE rojo montado sobre unos lentes recetados de carey",
} as const;
