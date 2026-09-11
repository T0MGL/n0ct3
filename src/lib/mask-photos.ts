// Foto del antifaz en el bump del checkout, una por color. Es la misma escena
// en negro y en rosado (mismo recorte, misma luz), asi que al cambiar de color
// el cruce solo cambia el antifaz y no parece un salto de foto.
//
// Recorte 1200x700 de la foto 1200x1200 "01-en-uso", centrado en el antifaz,
// en tres anchos. Sin metadata.

import { ALL_MASK_COLORS_SOLD_OUT, DEFAULT_MASK_COLOR, type MaskColorId } from "@/lib/mask-colors";
import negro520 from "@/assets/checkout/antifaz-negro-520.webp";
import negro780 from "@/assets/checkout/antifaz-negro-780.webp";
import negro1040 from "@/assets/checkout/antifaz-negro-1040.webp";
import rosado520 from "@/assets/checkout/antifaz-rosado-520.webp";
import rosado780 from "@/assets/checkout/antifaz-rosado-780.webp";
import rosado1040 from "@/assets/checkout/antifaz-rosado-1040.webp";

interface MaskPhoto {
  src: string;
  srcSet: string;
  alt: string;
}

// Ancho real de la tarjeta del bump: el modal es max-w-[550px] con p-10 desde
// md, y en mobile pierde 138px entre los paddings del overlay, del modal y del
// resumen. Si esos paddings cambian, esto tambien.
export const MASK_PHOTO_SIZES = "(min-width: 600px) 430px, calc(100vw - 138px)";

export const MASK_PHOTOS: Readonly<Record<MaskColorId, MaskPhoto>> = {
  negro: {
    src: negro780,
    srcSet: `${negro520} 520w, ${negro780} 780w, ${negro1040} 1040w`,
    alt: "Mujer durmiendo en la cama con el antifaz 3D NOCTE negro puesto",
  },
  rosado: {
    src: rosado780,
    srcSet: `${rosado520} 520w, ${rosado780} 780w, ${rosado1040} 1040w`,
    alt: "Mujer durmiendo en la cama con el antifaz 3D NOCTE rosado puesto",
  },
};

/**
 * Pide la foto del color por defecto al abrir el checkout, un paso antes de
 * que aparezca el bump, para que no se vea el hueco mientras carga. sizes va
 * antes que srcset: con los mismos dos valores que el <img>, el navegador elige
 * el mismo archivo y el bump lo saca de cache en vez de bajarlo otra vez.
 */
export function preloadMaskPhoto(): void {
  if (ALL_MASK_COLORS_SOLD_OUT) return;
  const photo = MASK_PHOTOS[DEFAULT_MASK_COLOR];
  const img = new Image();
  img.sizes = MASK_PHOTO_SIZES;
  img.srcset = photo.srcSet;
}
