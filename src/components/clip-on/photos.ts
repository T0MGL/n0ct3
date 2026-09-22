// Fotos de /clip-on. Son las cinco del clip-on que ya usa la galeria de la
// home (ClipOnSection), todas 1200x1200 sobre fondo blanco de estudio. Estan
// como provisorias: cuando lleguen las definitivas se cambian aca, en este
// archivo y en ningun otro. Cada seccion lee su foto por el nombre del lugar
// que ocupa, no por el nombre del archivo.
//
// width y height son los del archivo: reservan el lugar antes de que cargue.
// Si una foto nueva viene en otra proporcion, se actualizan junto con el src.

import sobreLentes from "@/assets/clip-on/clip-on-sobre-lentes-recetados.webp";
import enUso from "@/assets/clip-on/clip-on-en-uso.webp";
import producto from "@/assets/clip-on/clip-on-producto.webp";
import mecanismo from "@/assets/clip-on/clip-on-mecanismo-clip.webp";
import packaging from "@/assets/clip-on/clip-on-packaging.webp";

export interface ClipOnPhoto {
  src: string;
  alt: string;
  width: number;
  height: number;
}

const square = (src: string, alt: string): ClipOnPhoto => ({ src, alt, width: 1200, height: 1200 });

/** Hero: la foto que explica el producto sin leer nada. */
export const HERO_PHOTO = square(sobreLentes, "Clip-On NOCTE rojo montado sobre unos lentes recetados de carey");

/** Puesto, en una cara. */
export const IN_USE_PHOTO = square(enUso, "Persona usando el Clip-On NOCTE sobre sus lentes recetados");

/** El clip de cerca: lo que lo sostiene. */
export const MECHANISM_PHOTO = square(
  mecanismo,
  "Detalle del clip con resorte y almohadillas de goma que lo sujetan a los lentes",
);

/** Solo, sin lentes debajo: lo que queda en la mano cuando lo sacás. */
export const DETACHED_PHOTO = square(producto, "Clip-On NOCTE rojo solo, sin lentes debajo");

/** Lo que llega en la caja. */
export const BOX_PHOTO = square(packaging, "Caja NOCTE, estuche, paño de limpieza y el Clip-On rojo");
