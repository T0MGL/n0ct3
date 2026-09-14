// Fotos de /sleep-mask. Todas salen de las originales 2048x2048 del antifaz
// (ECOMMERCE/NOCTE /sleep-mask/originales) y de la escena del lente rojo ya
// aprobada para la landing de lentes, exportadas a WebP en tres anchos y sin
// metadata. Ninguna es generada para esta pagina.

import type { MaskColorId } from "@/lib/mask-colors";
import negro640 from "@/assets/sleep-mask/en-uso-negro-640.webp";
import negro1024 from "@/assets/sleep-mask/en-uso-negro-1024.webp";
import negro1600 from "@/assets/sleep-mask/en-uso-negro-1600.webp";
import rosado640 from "@/assets/sleep-mask/en-uso-rosado-640.webp";
import rosado1024 from "@/assets/sleep-mask/en-uso-rosado-1024.webp";
import rosado1600 from "@/assets/sleep-mask/en-uso-rosado-1600.webp";

export interface Photo {
  src: string;
  srcSet: string;
  alt: string;
}

/**
 * La escena en uso, una por color. Es la misma toma en negro y en rosado
 * (misma cama, misma luz, mismo encuadre), asi que el cruce al cambiar de color
 * cambia el antifaz y no la foto.
 */
export const IN_USE_PHOTOS: Readonly<Record<MaskColorId, Photo>> = {
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
