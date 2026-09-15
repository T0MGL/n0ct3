// Titulo, descripcion, imagen de preview y JSON-LD de /sleep-mask. Una sola
// fuente para los dos lados: el build los escribe en dist/sleep-mask.html
// (vite.sleep-mask.ts), que es lo que leen Google y los previews de links sin
// ejecutar JS, y la pagina los reusa al montar cuando se llega navegando desde
// otra ruta del SPA.
//
// Imports relativos y sin assets a proposito: vite.config.ts carga este archivo
// en node, donde no existe el alias @ ni los loaders de imagenes. Las imagenes
// son archivos fijos de public/ por la misma razon: una URL con hash cambia en
// cada build y el preview cacheado de WhatsApp o Facebook queda roto.

import { MASK_COLORS, MASK_COLOR_IDS, type MaskColorId } from "../../lib/mask-colors";
import { SLEEP_MASK_SOLO_PRICE } from "../../lib/sleep-mask-packs";

const ORIGIN = "https://www.nocte.studio";

export const SLEEP_MASK_PATH = "/sleep-mask";
export const SLEEP_MASK_URL = `${ORIGIN}${SLEEP_MASK_PATH}`;
export const SLEEP_MASK_TITLE = "Antifaz 3D para dormir | NOCTE®";
export const SLEEP_MASK_DESCRIPTION =
  "Antifaz 3D NOCTE: oscuridad total y cero presión en los párpados. Delivery gratis a todo Paraguay y pago contra entrega. Desde 169.000 Gs.";

export const SLEEP_MASK_OG_IMAGE = {
  url: `${ORIGIN}/og-sleep-mask.jpg`,
  type: "image/jpeg",
  width: 1200,
  height: 630,
  alt: "Mujer durmiendo de día con el antifaz 3D NOCTE negro puesto, en una cama con sábanas de lino",
} as const;

const PRODUCT_NAME = "NOCTE® Antifaz 3D para dormir";

// Mismos SKU que SLEEP_MASK_VARIANT en nocte-backend/server.js, que es el
// contrato con Ordefy. seo.test.ts rompe si dejan de coincidir.
export const sleepMaskSku = (color: MaskColorId): string => `NOCTE-SLEEPMASK-3D-${color.toUpperCase()}`;

/**
 * ProductGroup con una variante por color, el formato de variantes de Google
 * para una pagina unica: cada oferta apunta a la misma URL con ?color=, que la
 * pagina lee para preseleccionar el color (maskColorFromSearch). Sin rating ni
 * reseñas: el antifaz no tiene reseñas propias y las de los lentes no son suyas.
 */
export const sleepMaskJsonLd = () => ({
  "@context": "https://schema.org",
  "@type": "ProductGroup",
  name: PRODUCT_NAME,
  description:
    "Antifaz 3D con copas contorneadas que rodean los ojos: oscuridad total y cero presión en los párpados, con correa ajustable.",
  url: SLEEP_MASK_URL,
  brand: { "@type": "Brand", name: "NOCTE" },
  productGroupID: "NOCTE-SLEEPMASK-3D",
  variesBy: ["https://schema.org/color"],
  image: [SLEEP_MASK_OG_IMAGE.url, `${ORIGIN}/antifaz-3d-negro.jpg`],
  hasVariant: MASK_COLOR_IDS.map((id) => ({
    "@type": "Product",
    name: `${PRODUCT_NAME}, ${MASK_COLORS[id].name}`,
    sku: sleepMaskSku(id),
    color: MASK_COLORS[id].name,
    inProductGroupWithID: "NOCTE-SLEEPMASK-3D",
    image: `${ORIGIN}/antifaz-3d-${id}.jpg`,
    offers: {
      "@type": "Offer",
      url: `${SLEEP_MASK_URL}?color=${id}`,
      price: SLEEP_MASK_SOLO_PRICE,
      priceCurrency: "PYG",
      availability: MASK_COLORS[id].soldOut ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: { "@type": "MonetaryAmount", value: 0, currency: "PYG" },
        shippingDestination: { "@type": "DefinedRegion", addressCountry: "PY" },
      },
    },
  })),
});
