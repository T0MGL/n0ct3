// Fotos de /sleep-mask. Salen de las originales 2048x2048 del antifaz
// (ECOMMERCE/NOCTE /sleep-mask/originales), exportadas a WebP en tres anchos y
// sin metadata.

import type { MaskColorId } from "@/lib/mask-colors";
import negro640 from "@/assets/sleep-mask/en-uso-negro-640.webp";
import negro1024 from "@/assets/sleep-mask/en-uso-negro-1024.webp";
import negro1600 from "@/assets/sleep-mask/en-uso-negro-1600.webp";
import copaNegro640 from "@/assets/sleep-mask/copa-3d-640.webp";
import copaNegro960 from "@/assets/sleep-mask/copa-3d-960.webp";
import copaNegro1400 from "@/assets/sleep-mask/copa-3d-1400.webp";
import frenteNegro480 from "@/assets/sleep-mask/frente-480.webp";
import frenteNegro720 from "@/assets/sleep-mask/frente-720.webp";
import frenteNegro1080 from "@/assets/sleep-mask/frente-1080.webp";
import correaNegro480 from "@/assets/sleep-mask/correa-480.webp";
import correaNegro720 from "@/assets/sleep-mask/correa-720.webp";
import correaNegro1068 from "@/assets/sleep-mask/correa-1068.webp";
import ritualNegro480 from "@/assets/sleep-mask/ritual-antifaz-negro-480.webp";
import ritualNegro720 from "@/assets/sleep-mask/ritual-antifaz-negro-720.webp";
import ritualNegro1080 from "@/assets/sleep-mask/ritual-antifaz-negro-1080.webp";

export interface Photo {
  src: string;
  srcSet: string;
  alt: string;
}

export type ColorPhotos = Readonly<Record<MaskColorId, Photo>>;

/**
 * La escena en uso, con el antifaz negro.
 */
export const IN_USE_PHOTOS: ColorPhotos = {
  negro: {
    src: negro1024,
    srcSet: `${negro640} 640w, ${negro1024} 1024w, ${negro1600} 1600w`,
    alt: "Mujer durmiendo en una cama con sábanas de lino y luz de ventana, con el antifaz 3D NOCTE negro puesto",
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
};

export const RITUAL_FRAME_SIZES = "(min-width: 1240px) 340px, (min-width: 1024px) 28vw, 50vw";

export const BUILD_CUP_PHOTOS: ColorPhotos = {
  negro: {
    src: copaNegro960,
    srcSet: `${copaNegro640} 640w, ${copaNegro960} 960w, ${copaNegro1400} 1400w`,
    alt: "Interior del antifaz NOCTE negro: dos copas 3D contorneadas con el hueco para cada ojo",
  },
};
export const BUILD_CUP_SIZES = "(min-width: 1240px) 680px, (min-width: 768px) 56vw, 100vw";

export const BUILD_FRONT_PHOTOS: ColorPhotos = {
  negro: {
    src: frenteNegro720,
    srcSet: `${frenteNegro480} 480w, ${frenteNegro720} 720w, ${frenteNegro1080} 1080w`,
    alt: "Frente del antifaz NOCTE negro con el logo en blanco, apoyado sobre sábanas",
  },
};

export const BUILD_STRAP_PHOTOS: ColorPhotos = {
  negro: {
    src: correaNegro720,
    srcSet: `${correaNegro480} 480w, ${correaNegro720} 720w, ${correaNegro1068} 1068w`,
    alt: "Correa del antifaz NOCTE negro con la hebilla para regular el largo",
  },
};
export const BUILD_SIDE_SIZES = "(min-width: 1240px) 480px, (min-width: 768px) 39vw, 50vw";

// Cada foto que sigue al color, con el sizes de su <img>. Precargar con otro
// sizes elegiria otro archivo del srcset y el cambio de color lo bajaria dos veces.
const COLOR_FOLLOWING_PHOTOS: ReadonlyArray<{ photos: ColorPhotos; sizes: string }> = [
  { photos: IN_USE_PHOTOS, sizes: IN_USE_SIZES },
  { photos: RITUAL_MASK_PHOTOS, sizes: RITUAL_FRAME_SIZES },
  { photos: BUILD_CUP_PHOTOS, sizes: BUILD_CUP_SIZES },
  { photos: BUILD_FRONT_PHOTOS, sizes: BUILD_SIDE_SIZES },
  { photos: BUILD_STRAP_PHOTOS, sizes: BUILD_SIDE_SIZES },
];

const preloaded = new Set<MaskColorId>();

/**
 * Pide las fotos de un color antes de que se vean, cuando el cliente muestra
 * intencion de elegirlo (hover, foco o toque en las muestras). La carga inicial
 * no baja ningun color que no este a la vista. sizes va antes que srcset para
 * que el navegador elija el mismo archivo que el <img>.
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
