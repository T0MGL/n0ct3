// Fotos de /sleep-mask. Todas salen de las originales 2048x2048 del antifaz
// (ECOMMERCE/NOCTE /sleep-mask/originales) y de la escena del lente rojo ya
// aprobada para la landing de lentes, exportadas a WebP en tres anchos y sin
// metadata. Ninguna es generada para esta pagina.
//
// Solo la escena en uso existe en los dos colores: copa, frente y correa hay
// unicamente en negro, asi que esas secciones no siguen al color.

import type { MaskColorId } from "@/lib/mask-colors";
import negro640 from "@/assets/sleep-mask/en-uso-negro-640.webp";
import negro1024 from "@/assets/sleep-mask/en-uso-negro-1024.webp";
import negro1600 from "@/assets/sleep-mask/en-uso-negro-1600.webp";
import rosado640 from "@/assets/sleep-mask/en-uso-rosado-640.webp";
import rosado1024 from "@/assets/sleep-mask/en-uso-rosado-1024.webp";
import rosado1600 from "@/assets/sleep-mask/en-uso-rosado-1600.webp";
import ritualNegro480 from "@/assets/sleep-mask/ritual-antifaz-negro-480.webp";
import ritualNegro720 from "@/assets/sleep-mask/ritual-antifaz-negro-720.webp";
import ritualNegro1080 from "@/assets/sleep-mask/ritual-antifaz-negro-1080.webp";
import ritualRosado480 from "@/assets/sleep-mask/ritual-antifaz-rosado-480.webp";
import ritualRosado720 from "@/assets/sleep-mask/ritual-antifaz-rosado-720.webp";
import ritualRosado1080 from "@/assets/sleep-mask/ritual-antifaz-rosado-1080.webp";

export interface Photo {
  src: string;
  srcSet: string;
  alt: string;
}

export type ColorPhotos = Readonly<Record<MaskColorId, Photo>>;

/**
 * La escena en uso, una por color. Es la misma toma en negro y en rosado
 * (misma cama, misma luz, mismo encuadre), asi que el cruce al cambiar de color
 * cambia el antifaz y no la foto.
 */
export const IN_USE_PHOTOS: ColorPhotos = {
  negro: {
    src: negro1024,
    srcSet: `${negro640} 640w, ${negro1024} 1024w, ${negro1600} 1600w`,
    alt: "Mujer durmiendo en una cama con sábanas de lino y luz de ventana, con el antifaz 3D NOCTE negro puesto",
  },
  rosado: {
    src: rosado1024,
    srcSet: `${rosado640} 640w, ${rosado1024} 1024w, ${rosado1600} 1600w`,
    alt: "Mujer durmiendo en una cama con sábanas de lino y luz de ventana, con el antifaz 3D NOCTE rosado puesto",
  },
};

// El cuadro de la foto mide el ancho entero en mobile y 7/12 en desktop, pero
// la foto es cuadrada y cubre un cuadro mas alto que ancho: en 1440x900 se
// dibuja a unos 900px. 64vw cubre ese caso sin pedir la de 1600 en mobile.
export const IN_USE_SIZES = "(min-width: 1024px) 64vw, 100vw";

/** Recorte 3:4 de la misma escena, igual en los dos colores, para el diptico del ritual. */
export const RITUAL_MASK_PHOTOS: ColorPhotos = {
  negro: {
    src: ritualNegro720,
    srcSet: `${ritualNegro480} 480w, ${ritualNegro720} 720w, ${ritualNegro1080} 1080w`,
    alt: "Mujer dormida con el antifaz 3D NOCTE negro puesto",
  },
  rosado: {
    src: ritualRosado720,
    srcSet: `${ritualRosado480} 480w, ${ritualRosado720} 720w, ${ritualRosado1080} 1080w`,
    alt: "Mujer dormida con la mano bajo la mejilla y el antifaz 3D NOCTE rosado puesto",
  },
};

export const RITUAL_FRAME_SIZES = "(min-width: 1240px) 340px, (min-width: 1024px) 28vw, 50vw";

// Cada foto que sigue al color, con el sizes de su <img>. Precargar con otro
// sizes elegiria otro archivo del srcset y el cambio de color lo bajaria dos veces.
const COLOR_FOLLOWING_PHOTOS: ReadonlyArray<{ photos: ColorPhotos; sizes: string }> = [
  { photos: IN_USE_PHOTOS, sizes: IN_USE_SIZES },
  { photos: RITUAL_MASK_PHOTOS, sizes: RITUAL_FRAME_SIZES },
];

const preloaded = new Set<MaskColorId>();

/**
 * Pide las fotos de un color antes de que se vean, cuando el cliente muestra
 * intencion de elegirlo (hover, foco o toque en las muestras). La carga inicial
 * no baja ningun color que no este a la vista. sizes va antes que srcset para
 * que el navegador elija el mismo archivo que el <img>. El Set tiene como mucho
 * un elemento por color.
 */
export function preloadColorPhotos(color: MaskColorId): void {
  if (preloaded.has(color)) return;
  preloaded.add(color);
  for (const { photos, sizes } of COLOR_FOLLOWING_PHOTOS) {
    const img = new Image();
    img.sizes = sizes;
    img.srcset = photos[color].srcSet;
  }
}
