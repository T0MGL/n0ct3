// Colores del antifaz. Misma forma que los tonos de los lentes (variants.ts):
// el agotado es un flag manual, no se lee de Ordefy, y todo lo demas (el color
// por defecto, que se ofrezca o no el bump, a donde cae un pick viejo) se
// deriva del flag. Agotar un color es cambiar soldOut aca y nada mas.
//
// El SKU de cada color vive en el backend (nocte-backend/server.js), junto al
// resto del contrato con Ordefy. Aca solo la clave, el nombre y la muestra.

export type MaskColorId = "negro" | "rosado";

export interface MaskColor {
  id: MaskColorId;
  /** Como se nombra en la UI y en la confirmacion de WhatsApp. */
  name: string;
  /** Relleno de la muestra. */
  swatch: string;
  /** Borde de la muestra seleccionada. El negro sobre fondo negro necesita uno claro. */
  ring: string;
  /** La muestra oscura se pierde contra el fondo sin un filete. */
  needsOutline: boolean;
  /**
   * Flag manual de stock. En true el color se sigue mostrando pero no se puede
   * elegir. El rosado se agota primero: hay bastante menos que del negro.
   */
  soldOut: boolean;
}

export const MASK_COLORS: Readonly<Record<MaskColorId, MaskColor>> = {
  negro: {
    id: "negro",
    name: "Negro",
    swatch: "#141414",
    ring: "rgba(255,255,255,0.75)",
    needsOutline: true,
    soldOut: false,
  },
  rosado: {
    id: "rosado",
    name: "Rosado",
    swatch: "#F2B8C6",
    ring: "#F2B8C6",
    needsOutline: false,
    soldOut: false,
  },
};

export const MASK_COLOR_IDS = ["negro", "rosado"] as const satisfies readonly MaskColorId[];

export const isMaskColorSoldOut = (id: MaskColorId): boolean => MASK_COLORS[id].soldOut;

/** Primer color vendible, en orden. Si el negro se agota, el default salta solo. */
export const DEFAULT_MASK_COLOR: MaskColorId =
  MASK_COLOR_IDS.find((id) => !isMaskColorSoldOut(id)) ?? MASK_COLOR_IDS[0];

/** Con todo agotado el bump no se ofrece. */
export const ALL_MASK_COLORS_SOLD_OUT: boolean = MASK_COLOR_IDS.every(isMaskColorSoldOut);

/** Ultima compuerta: un color agotado nunca llega al pedido. */
export const resolveSelectableMaskColor = (id: MaskColorId): MaskColorId =>
  isMaskColorSoldOut(id) ? DEFAULT_MASK_COLOR : id;

// Tope del stepper. A partir de 6 los lentes ya son precio mayorista por
// WhatsApp (WHOLESALE_THRESHOLD), y el antifaz sigue la misma linea.
export const MAX_MASK_QUANTITY = 5;

/** Ajusta los picks al largo pedido: conserva lo elegido y completa con el default. */
export function resizeMaskPicks(prev: readonly MaskColorId[], quantity: number): MaskColorId[] {
  const next = prev.slice(0, quantity);
  while (next.length < quantity) next.push(DEFAULT_MASK_COLOR);
  return next;
}

/** Aviso de colores agotados, o null si esta todo en stock. */
export const MASK_SOLD_OUT_NOTICE: string | null = (() => {
  const names = MASK_COLOR_IDS.filter(isMaskColorSoldOut).map((id) => MASK_COLORS[id].name);
  if (names.length === 0) return null;
  return names.length === 1 ? `${names[0]} agotado, vuelve pronto.` : `${names.join(" y ")} agotados, vuelven pronto.`;
})();
