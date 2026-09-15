// Fotos de /sleep-mask. Todas salen de las originales 2048x2048 del antifaz
// (ECOMMERCE/NOCTE /sleep-mask/originales) y de la escena del lente rojo ya
// aprobada para la landing de lentes, exportadas a WebP en tres anchos y sin
// metadata. Salvo los recoloreos rosados de construccion (abajo), ninguna es
// generada para esta pagina.
//
// La escena en uso existe en los dos colores. Copa, frente y correa solo se
// fotografiaron en negro: sus versiones rosadas (*-rosado-recoloreo-*) son
// recoloreos de esas fotos negras hechos con gemini-3-pro-image usando la
// rosada real como referencia de color, no fotos del antifaz rosado. Si llegan
// fotos reales, se importan con nombre sin `recoloreo` en estas mismas
// constantes y se borra este parrafo.

import type { MaskColorId } from "@/lib/mask-colors";
import negro640 from "@/assets/sleep-mask/en-uso-negro-640.webp";
import negro1024 from "@/assets/sleep-mask/en-uso-negro-1024.webp";
import negro1600 from "@/assets/sleep-mask/en-uso-negro-1600.webp";
import rosado640 from "@/assets/sleep-mask/en-uso-rosado-640.webp";
import rosado1024 from "@/assets/sleep-mask/en-uso-rosado-1024.webp";
import rosado1600 from "@/assets/sleep-mask/en-uso-rosado-1600.webp";
import copaNegro640 from "@/assets/sleep-mask/copa-3d-640.webp";
import copaNegro960 from "@/assets/sleep-mask/copa-3d-960.webp";
import copaNegro1400 from "@/assets/sleep-mask/copa-3d-1400.webp";
import copaRosado640 from "@/assets/sleep-mask/copa-3d-rosado-recoloreo-640.webp";
import copaRosado960 from "@/assets/sleep-mask/copa-3d-rosado-recoloreo-960.webp";
import copaRosado1400 from "@/assets/sleep-mask/copa-3d-rosado-recoloreo-1400.webp";
import frenteNegro480 from "@/assets/sleep-mask/frente-480.webp";
import frenteNegro720 from "@/assets/sleep-mask/frente-720.webp";
import frenteNegro1080 from "@/assets/sleep-mask/frente-1080.webp";
import frenteRosado480 from "@/assets/sleep-mask/frente-rosado-recoloreo-480.webp";
import frenteRosado720 from "@/assets/sleep-mask/frente-rosado-recoloreo-720.webp";
import frenteRosado1080 from "@/assets/sleep-mask/frente-rosado-recoloreo-1080.webp";
import correaNegro480 from "@/assets/sleep-mask/correa-480.webp";
import correaNegro720 from "@/assets/sleep-mask/correa-720.webp";
import correaNegro1068 from "@/assets/sleep-mask/correa-1068.webp";
import correaRosado480 from "@/assets/sleep-mask/correa-rosado-recoloreo-480.webp";
import correaRosado720 from "@/assets/sleep-mask/correa-rosado-recoloreo-720.webp";
import correaRosado1068 from "@/assets/sleep-mask/correa-rosado-recoloreo-1068.webp";
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

export const BUILD_CUP_PHOTOS: ColorPhotos = {
  negro: {
    src: copaNegro960,
    srcSet: `${copaNegro640} 640w, ${copaNegro960} 960w, ${copaNegro1400} 1400w`,
    alt: "Interior del antifaz NOCTE negro: dos copas 3D contorneadas con el hueco para cada ojo",
  },
  rosado: {
    src: copaRosado960,
    srcSet: `${copaRosado640} 640w, ${copaRosado960} 960w, ${copaRosado1400} 1400w`,
    alt: "Interior del antifaz NOCTE rosado: dos copas 3D contorneadas con el hueco para cada ojo",
  },
};
export const BUILD_CUP_SIZES = "(min-width: 1240px) 680px, (min-width: 768px) 56vw, 100vw";

export const BUILD_FRONT_PHOTOS: ColorPhotos = {
  negro: {
    src: frenteNegro720,
    srcSet: `${frenteNegro480} 480w, ${frenteNegro720} 720w, ${frenteNegro1080} 1080w`,
    alt: "Frente del antifaz NOCTE negro con el logo en blanco, apoyado sobre sábanas",
  },
  rosado: {
    src: frenteRosado720,
    srcSet: `${frenteRosado480} 480w, ${frenteRosado720} 720w, ${frenteRosado1080} 1080w`,
    alt: "Frente del antifaz NOCTE rosado con el logo en blanco, apoyado sobre sábanas",
  },
};

export const BUILD_STRAP_PHOTOS: ColorPhotos = {
  negro: {
    src: correaNegro720,
    srcSet: `${correaNegro480} 480w, ${correaNegro720} 720w, ${correaNegro1068} 1068w`,
    alt: "Correa del antifaz NOCTE negro con la hebilla para regular el largo",
  },
  rosado: {
    src: correaRosado720,
    srcSet: `${correaRosado480} 480w, ${correaRosado720} 720w, ${correaRosado1068} 1068w`,
    alt: "Correa del antifaz NOCTE rosado con la hebilla para regular el largo",
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
