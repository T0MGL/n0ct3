export type VariantId = "rojo" | "naranja" | "amarillo";

export type VariantMoment = "NOCHE" | "TARDE" | "DÍA";

export interface Variant {
  id: VariantId;
  name: string;
  /** Full product title used in order confirmations (WhatsApp, success screen). */
  productName: string;
  /** Colored circle that prefixes the variant in the WhatsApp order breakdown. */
  emoji: string;
  displayTitle: string;
  moment: VariantMoment;
  momentTimeWindow: string;
  /**
   * Franja horaria de este color sobre el reloj de 24 horas, [desde, hasta) en
   * horas locales. A diferencia de momentTimeWindow (que es la ventana
   * recomendada y se muestra como texto), las tres dayRange cubren el dia
   * entero sin huecos ni solapamientos: MomentsSection las usa para decirle al
   * visitante cual le toca AHORA, y eso obliga a que las 24 horas tengan
   * dueno. La madrugada le toca al rojo.
   */
  dayRange: readonly [number, number];
  blockedPercent: number;
  spectrumRange: readonly [number, number];
  spectrumLabel: string;
  accent: string;
  lensColor: string;
  lensGlow: string;
  tintFilter: string;
  use: string;
  description: string;
  /** Titular del momento del dia en MomentsSection. */
  momentHeadline: string;
  /**
   * Parrafo del momento. Abre con el sintoma que ya tiene el cliente y recien
   * despues aparece el lente: el que llega del ad no compra "anti luz azul",
   * compra dejar de sentirse quemado a las cuatro de la tarde.
   */
  momentCopy: string;
  /** Fila de este color en la linea de tiempo de uso. */
  timeline: {
    hour: string;
    scene: string;
    result: string;
  };
  benefits: readonly string[];
  /**
   * Manual out-of-stock flag. When true the color still renders but cannot be
   * selected or added to cart. This is a hand-set inventory gate, NOT read from
   * Ordefy. Flip back to false (or drop the field) when stock returns.
   */
  soldOut?: boolean;
}

// Source of truth for the three NOCTE lens variants. Single product, three tints.
// Anything that touches lens color, blocking spectrum, copy or accent reads from here.
export const VARIANTS: Readonly<Record<VariantId, Variant>> = {
  rojo: {
    id: "rojo",
    name: "NOCTE Rojo",
    productName: "NOCTE® Lentes Rojos",
    emoji: "🔴",
    displayTitle: "Lentes Rojos Anti-Luz Azul",
    moment: "NOCHE",
    momentTimeWindow: "20:00 a 03:00",
    dayRange: [20, 7],
    blockedPercent: 99,
    spectrumRange: [400, 550],
    spectrumLabel: "400 a 550nm",
    accent: "#EF4444",
    lensColor: "#FF1A1A",
    lensGlow: "rgba(239,68,68,0.55)",
    tintFilter: "sepia(1) saturate(8) hue-rotate(-50deg) brightness(0.78)",
    use: "Para usar 2 a 3hs antes de dormir",
    description:
      "El bloqueo más agresivo. Si trabajás de noche con pantallas y querés dormir profundo, este es el tuyo.",
    momentHeadline: "Las dos horas antes de dormir.",
    momentCopy:
      "Te acostás cansado pero la cabeza no para. No sos vos, son las pantallas hasta el último momento. El rojo bloquea el 99% de la luz azul y le devuelve a tu cuerpo la señal de que es de noche.",
    timeline: {
      hour: "21:00",
      scene: "Última serie, últimos mensajes.",
      result: "Ponételos dos horas antes de acostarte y dormís distinto.",
    },
    benefits: [
      "Bloquea 99% de luz azul y verde",
      "Melatonina natural en 30 minutos",
      "Sueño REM profundo",
    ],
    soldOut: false,
  },
  naranja: {
    id: "naranja",
    name: "NOCTE Naranja",
    productName: "NOCTE® Lentes Naranjas",
    emoji: "🟠",
    displayTitle: "Lentes Naranjas Anti-Luz Azul",
    moment: "TARDE",
    momentTimeWindow: "17:00 a 20:00",
    dayRange: [17, 20],
    blockedPercent: 95,
    spectrumRange: [400, 500],
    spectrumLabel: "400 a 500nm",
    accent: "#F97316",
    lensColor: "#FF7A1A",
    lensGlow: "rgba(255,122,26,0.55)",
    tintFilter: "sepia(1) saturate(5) hue-rotate(-25deg) brightness(0.92)",
    use: "Para las horas previas al rojo",
    description:
      "Bloqueo intermedio. Ideal para la transición tarde a noche cuando todavía necesitás distinguir colores con precisión.",
    momentHeadline: "De tarde, cuando baja el sol.",
    momentCopy:
      "Es la hora en que tu cuerpo debería empezar a frenar y la pantalla le dice que siga. El naranja bloquea el 95% y acompaña la transición sin cortarte la productividad.",
    timeline: {
      hour: "17:00",
      scene: "Todavía te quedan dos horas.",
      result: "Seguís rindiendo mientras tu cuerpo empieza a bajar.",
    },
    benefits: [
      "Bloquea 95% de luz azul",
      "Sin distorsión cromática extrema",
      "Fatiga ocular reducida un 70%",
    ],
    soldOut: false,
  },
  amarillo: {
    id: "amarillo",
    name: "NOCTE Amarillo",
    productName: "NOCTE® Lentes Amarillos",
    emoji: "🟡",
    displayTitle: "Lentes Amarillos Anti-Luz Azul",
    moment: "DÍA",
    momentTimeWindow: "08:00 a 17:00",
    dayRange: [7, 17],
    blockedPercent: 75,
    spectrumRange: [400, 450],
    spectrumLabel: "400 a 450nm",
    accent: "#EAB308",
    lensColor: "#FFD11A",
    lensGlow: "rgba(255,209,26,0.45)",
    tintFilter: "sepia(0.8) saturate(2) hue-rotate(-8deg) brightness(1.02)",
    use: "Para usar todo el día",
    description:
      "Para 8 horas o más frente a pantallas. Reduce fatiga sin alterar los colores. Trabajás todo el día sin migrañas.",
    momentHeadline: "De mañana y toda la jornada.",
    momentCopy:
      "Ocho horas de pantalla te cansan la vista y te apagan el foco a media tarde. El amarillo filtra el 75% de la luz azul sin cambiarte los colores, así trabajás todo el día sin que te pese.",
    timeline: {
      hour: "7:00",
      scene: "Prendés la compu.",
      result: "Arrancás el día sin que la pantalla te queme la vista.",
    },
    benefits: [
      "Bloquea 75% de luz azul HEV",
      "Colores prácticamente naturales",
      "Cero fatiga al final del día",
    ],
    soldOut: false,
  },
} as const;

export const VARIANT_IDS = ["rojo", "naranja", "amarillo"] as const satisfies readonly VariantId[];

/**
 * Los mismos tres colores en el orden en que se viven, no en el orden del
 * catalogo: la seccion de los momentos y la linea de tiempo se leen de la
 * manana a la noche, y arrancar por el rojo obligaria a leer el dia al reves.
 */
export const MOMENT_ORDER = ["amarillo", "naranja", "rojo"] as const satisfies readonly VariantId[];

export function isVariantId(value: string): value is VariantId {
  return value === "rojo" || value === "naranja" || value === "amarillo";
}

export function getVariant(id: VariantId): Variant {
  return VARIANTS[id];
}

/**
 * El color que le toca a una hora del reloj. El rojo cruza la medianoche
 * (20 a 7), asi que su rango se evalua al reves que los otros dos. Si algun
 * dayRange dejara un hueco esto devolveria el rojo por defecto, que es el
 * comportamiento seguro: de madrugada nadie quiere el amarillo.
 */
export function variantForHour(hour: number): VariantId {
  const h = ((hour % 24) + 24) % 24;
  for (const id of VARIANT_IDS) {
    const [from, to] = VARIANTS[id].dayRange;
    const inside = from < to ? h >= from && h < to : h >= from || h < to;
    if (inside) return id;
  }
  return "rojo";
}

/** True when a color is manually flagged out of stock and must not be sellable. */
export function isVariantSoldOut(id: VariantId): boolean {
  return VARIANTS[id].soldOut === true;
}

/**
 * First in-stock color in canonical order. Derived so the default follows the
 * soldOut flags: mark a color sold out and the default skips it automatically,
 * flip it back and the default returns without touching this file.
 */
export const DEFAULT_VARIANT: VariantId =
  VARIANT_IDS.find((id) => !isVariantSoldOut(id)) ?? VARIANT_IDS[0];

/**
 * True when every color is gated. The buy flow shuts down completely: CTAs
 * render disabled as "Agotado" and startBuyFlow refuses to open the checkout,
 * so no order can be placed through the site until at least one soldOut flag
 * is flipped back in this file.
 */
export const ALL_VARIANTS_SOLD_OUT: boolean = VARIANT_IDS.every(isVariantSoldOut);

/**
 * Force any candidate id onto a sellable color. Sold-out picks (stale state,
 * deep links, resized packs) collapse to DEFAULT_VARIANT so a gated color can
 * never end up active or in the cart.
 */
export function resolveSelectableVariant(id: VariantId): VariantId {
  return isVariantSoldOut(id) ? DEFAULT_VARIANT : id;
}

export interface VariantCount {
  variant: Variant;
  count: number;
}

/**
 * Collapse a per-unit picks array (e.g. ["amarillo", "rojo"]) into one entry
 * per distinct variant with its quantity, ordered by the canonical variant
 * order so the breakdown is stable. Unknown ids are skipped defensively.
 */
export function summarizeVariantCounts(picks: readonly VariantId[]): VariantCount[] {
  const counts = picks.reduce<Partial<Record<VariantId, number>>>((acc, id) => {
    if (isVariantId(id)) acc[id] = (acc[id] ?? 0) + 1;
    return acc;
  }, {});

  return VARIANT_IDS.flatMap((id) => {
    const count = counts[id];
    return count ? [{ variant: VARIANTS[id], count }] : [];
  });
}
