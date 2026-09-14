// Contrato del pedido. Una linea por producto, con su cantidad y su importe.
//
// Antes el frontend mandaba solo el total y el backend deducia el precio del
// producto restandole los upsells (`total - priorityCost`). Con un solo upsell
// de 10.000 funcionaba; con dos productos mas cada upsell nuevo obliga a
// acordarse de restarlo, y el dia que alguien no se acuerde Ordefy guarda el
// numero mal sin que nadie se entere. Desde aca el precio viaja explicito y el
// backend no deduce nada.
//
// La clave `product` es semantica, no un SKU: el mapa de SKU vive en
// nocte-backend/server.js junto con la resolucion de color y de pack, validada
// contra la tienda de produccion. Duplicarlo aca seria dos fuentes de verdad.

import { isVariantSoldOut, summarizeVariantCounts, type VariantId } from "@/lib/variants";
import { BUNDLES } from "@/lib/bundles";
import {
  DEFAULT_MASK_COLOR,
  MASK_COLORS,
  MASK_COLOR_IDS,
  resolveSelectableMaskColor,
  type MaskColorId,
} from "@/lib/mask-colors";
import envioPrioritarioIcon from "@/assets/checkout/envio-prioritario.webp";

export type OrderProduct = "lentes" | "sleepmask" | "clipon" | "envio-prioritario";

interface LineBase {
  /** Unidades que se lleva el cliente. Para lentes, los lentes del pack. */
  quantity: number;
  /** Importe total de la linea en guaranies, con el descuento ya aplicado. */
  amount: number;
}

/**
 * Una linea por producto y, en el antifaz, una por color: cada color es un SKU
 * distinto en Ordefy. Dos negros y un rosado son dos lineas. Los lentes van en
 * una sola linea con el color de cada unidad, porque en Ordefy el pack es un
 * solo item con su composicion adentro.
 */
export type OrderLine =
  | (LineBase & { product: "lentes"; colors: VariantId[] })
  | (LineBase & { product: "sleepmask"; color: MaskColorId })
  | (LineBase & { product: "clipon" | "envio-prioritario" });

interface AddOn {
  product: OrderProduct;
  /** Nombre que ve el cliente en el resumen y en la confirmacion de WhatsApp. */
  name: string;
  /** Lo que se cobra. */
  price: number;
  /** Precio de catalogo, tachado. Ausente cuando no hay descuento. */
  listPrice?: number;
  /**
   * Icono arriba de la tarjeta del bump, decorativo: el titulo ya dice que es.
   * Las medidas van con el archivo para reservar su lugar antes de que cargue.
   * El antifaz no lo usa: su foto cambia con el color (mask-photos.ts).
   */
  image?: { src: string; width: number; height: number };
}

export const PRIORITY_SHIPPING: AddOn = {
  product: "envio-prioritario",
  name: "Envío Prioritario VIP",
  price: 10000,
  // Servido desde el repo y no desde la URL que tiene cargada Ordefy: esa
  // apunta al CDN de otra tienda y se rompe el dia que la borren.
  image: { src: envioPrioritarioIcon, width: 421, height: 431 },
};

/**
 * Packs del antifaz comprado sin lentes ni clip-on, solo en la web (/sleep-mask).
 * El pack se cuenta sobre el total de antifaces del pedido, colores sumados: un
 * negro y un rosado son el pack de dos. Helena cobra lineal y no lee esto.
 * Espejo en nocte-backend/server.js (SLEEP_MASK_PACK_PRICE): si cambia un
 * precio, cambia en los dos lados o el backend rebota los pedidos en COD.
 */
export const SLEEP_MASK_PACKS = [
  { quantity: 1, price: 169000 },
  { quantity: 2, price: 269000 },
  { quantity: 3, price: 369000 },
] as const;

export type SleepMaskPack = (typeof SLEEP_MASK_PACKS)[number];

/** El antifaz de a uno. Es el precio de catalogo de Ordefy y la base del ahorro. */
export const SLEEP_MASK_SOLO_PRICE = SLEEP_MASK_PACKS[0].price;

export const MAX_SLEEP_MASK_PACK = SLEEP_MASK_PACKS[SLEEP_MASK_PACKS.length - 1].quantity;

/** El pack de una cantidad, con la cantidad llevada al rango vendible. */
export const sleepMaskPack = (quantity: number): SleepMaskPack =>
  SLEEP_MASK_PACKS.find((pack) => pack.quantity === quantity) ??
  (quantity < 1 ? SLEEP_MASK_PACKS[0] : SLEEP_MASK_PACKS[SLEEP_MASK_PACKS.length - 1]);

/** Contra comprarlos de a uno. Es el unico ahorro que se muestra. */
export const sleepMaskPackSavings = (pack: SleepMaskPack): number =>
  SLEEP_MASK_SOLO_PRICE * pack.quantity - pack.price;

// El color se elige por unidad en el bump (ver mask-colors.ts) y va en el nombre
// de cada linea con maskName: es lo que el cliente lee en su confirmacion de
// WhatsApp y tiene que coincidir con lo que llega en la caja.
//
// price es el del antifaz acompanado de lentes o clip-on. El backend valida
// los dos precios contra el pedido entero (expectedLineAmount en server.js).
export const SLEEP_MASK: AddOn = {
  product: "sleepmask",
  name: "Antifaz 3D para dormir",
  price: 119000,
  listPrice: SLEEP_MASK_SOLO_PRICE,
};

// Sin pack de un lente en BUNDLES el bump no se ofrece: mejor perder el upsell
// que tirar el bundle principal, que es el de / tambien.
const personalBundle = BUNDLES.find((bundle) => bundle.quantity === 1);

/**
 * Bump del checkout del antifaz: un lente rojo al precio de siempre del pack
 * Personal. Lo que baja es el antifaz, que al ir acompanado pasa a su precio de
 * bump, asi que el cliente ve sumar la diferencia y nunca un descuento en los
 * lentes: la linea de lentes que llega a Ordefy vale lo que vale.
 */
export const RED_GLASSES = {
  name: "Lentes Rojos NOCTE",
  price: personalBundle?.price ?? 0,
  /** Con el rojo agotado el bump no se ofrece y el pedido no lo puede llevar. */
  available: personalBundle !== undefined && !isVariantSoldOut("rojo"),
} as const;

export const CLIP_ON: AddOn = {
  product: "clipon",
  name: "Clip-On Rojo",
  price: 189000,
};

/** El producto principal del checkout. Los upsells se suman aparte. */
export type CheckoutItem =
  | { product: "lentes"; quantity: number; amount: number; colors: VariantId[] }
  | { product: "clipon"; quantity: 1; amount: number }
  | { product: "sleepmask"; quantity: number; amount: number; colors: MaskColorId[] };

export interface CheckoutUpsells {
  /** Color de cada antifaz, uno por unidad. Vacio es sin antifaz. No aplica si el principal es el antifaz. */
  sleepMaskPicks: readonly MaskColorId[];
  /** Lentes rojos del checkout del antifaz. Solo aplica si el principal es el antifaz. */
  redGlasses?: boolean;
  priorityShipping: boolean;
}

export const maskName = (color: MaskColorId): string =>
  `Antifaz 3D ${MASK_COLORS[color].name.toLowerCase()} para dormir`;

/**
 * El pedido linea por linea. La primera linea es siempre el producto principal:
 * el backend la lee para saber con que identidad sale el Purchase del servidor.
 */
export function buildOrderLines(item: CheckoutItem, upsells: CheckoutUpsells): OrderLine[] {
  if (item.product === "sleepmask") return buildSleepMaskLines(item, upsells);

  const lines: OrderLine[] = [item];

  // Los picks por unidad se agrupan por color: una linea por SKU con su
  // cantidad. resolveSelectableMaskColor es la ultima compuerta, un color
  // agotado que se colo por un estado viejo no llega al pedido.
  const perColor = new Map<MaskColorId, number>();
  for (const pick of upsells.sleepMaskPicks) {
    const color = resolveSelectableMaskColor(pick);
    perColor.set(color, (perColor.get(color) ?? 0) + 1);
  }
  for (const color of MASK_COLOR_IDS) {
    const quantity = perColor.get(color);
    if (quantity) {
      lines.push({ product: "sleepmask", color, quantity, amount: SLEEP_MASK.price * quantity });
    }
  }

  if (upsells.priorityShipping) {
    lines.push({ product: "envio-prioritario", quantity: 1, amount: PRIORITY_SHIPPING.price });
  }

  return lines;
}

/** Unidades por color en el orden del catalogo, sin colores agotados. */
const countMaskColors = (picks: readonly MaskColorId[]): Array<{ color: MaskColorId; quantity: number }> => {
  const perColor = new Map<MaskColorId, number>();
  for (const pick of picks) {
    const color = resolveSelectableMaskColor(pick);
    perColor.set(color, (perColor.get(color) ?? 0) + 1);
  }
  return MASK_COLOR_IDS.flatMap((color) => {
    const quantity = perColor.get(color);
    return quantity ? [{ color, quantity }] : [];
  });
};

/**
 * Una linea por color. Con lentes cada antifaz va a su precio acompanado. Sin
 * lentes el pack se reparte por unidad: pack / cantidad por cada antifaz, y si
 * esa division dejara resto va a la primera linea, asi la suma es siempre el
 * pack. Con 269.000 y 369.000 divide exacto (134.500 y 123.000). Es la misma
 * regla que valida el backend linea por linea.
 */
function buildSleepMaskLines(
  item: Extract<CheckoutItem, { product: "sleepmask" }>,
  upsells: CheckoutUpsells,
): OrderLine[] {
  const withGlasses = upsells.redGlasses === true && RED_GLASSES.available;
  const perColor = countMaskColors(item.colors);
  const units = perColor.reduce((total, { quantity }) => total + quantity, 0);
  const pack = sleepMaskPack(units);
  const packUnitPrice = Math.floor(pack.price / units);
  const remainder = pack.price - packUnitPrice * units;

  const lines: OrderLine[] = perColor.map(({ color, quantity }, index) => ({
    product: "sleepmask",
    color,
    quantity,
    amount: withGlasses
      ? SLEEP_MASK.price * quantity
      : packUnitPrice * quantity + (index === 0 ? remainder : 0),
  }));
  if (withGlasses) {
    lines.push({ product: "lentes", quantity: 1, amount: RED_GLASSES.price, colors: ["rojo"] });
  }
  if (upsells.priorityShipping) {
    lines.push({ product: "envio-prioritario", quantity: 1, amount: PRIORITY_SHIPPING.price });
  }
  return lines;
}

export const sumLines = (lines: readonly OrderLine[]): number =>
  lines.reduce((total, line) => total + line.amount, 0);

export const clipOnItem = (): CheckoutItem => ({
  product: "clipon",
  quantity: 1,
  amount: CLIP_ON.price,
});

/**
 * El antifaz como producto principal, un color por unidad. Mas alla del pack
 * mas grande se corta: la web no vende packs que no existen.
 */
export const sleepMaskItem = (picks: readonly MaskColorId[]): CheckoutItem => {
  const colors = (picks.length > 0 ? picks : [DEFAULT_MASK_COLOR])
    .slice(0, MAX_SLEEP_MASK_PACK)
    .map(resolveSelectableMaskColor);
  return {
    product: "sleepmask",
    quantity: colors.length,
    amount: sleepMaskPack(colors.length).price,
    colors,
  };
};

/**
 * num_items de AddPaymentInfo y Purchase. Lentes y clip-on mandan la cantidad
 * del item como siempre. El antifaz manda las unidades reales del pedido:
 * antifaces mas los lentes del bump, sin el envio, que no es una unidad. El
 * Purchase del servidor cuenta igual (purchaseContent en server.js).
 */
export function metaNumItems(item: CheckoutItem, lines: readonly OrderLine[]): number {
  if (item.product !== "sleepmask") return item.quantity;
  return lines
    .filter((line) => line.product !== "envio-prioritario")
    .reduce((units, line) => units + line.quantity, 0);
}

/** "1 negro, 2 rosados": el color de cada antifaz del pedido, en el orden del catalogo. */
export function maskColorBreakdown(colors: readonly MaskColorId[]): string {
  // Los dos nombres terminan en vocal, asi que el plural es sumar una s.
  return countMaskColors(colors)
    .map(({ color, quantity }) => `${quantity} ${MASK_COLORS[color].name.toLowerCase()}${quantity > 1 ? "s" : ""}`)
    .join(", ");
}

/** Como se nombra el pedido de antifaces en textos cortos: "Antifaz 3D Negro", "2 antifaces 3D: 1 negro, 1 rosado". */
export function describeMaskColors(colors: readonly MaskColorId[]): string {
  if (colors.length === 1) return `Antifaz 3D ${MASK_COLORS[resolveSelectableMaskColor(colors[0])].name}`;
  return `${colors.length} antifaces 3D: ${maskColorBreakdown(colors)}`;
}

/**
 * quantity y colors de primer nivel del pedido. Son anteriores a las lineas y
 * los siguen leyendo n8n (el desglose "1 Lente Rojo" de la plantilla sale de
 * colors) y el Purchase del servidor. Para lentes y clip-on quedan como
 * estaban; el antifaz manda los de sus lentes rojos si los lleva, y sin lentes
 * colors va vacio para que la plantilla no nombre un lente que no se compro.
 */
export function legacyOrderFields(
  item: CheckoutItem,
  lines: readonly OrderLine[],
): { quantity: number; colors: VariantId[] | undefined } {
  if (item.product === "lentes") return { quantity: item.quantity, colors: item.colors };
  if (item.product === "clipon") return { quantity: item.quantity, colors: undefined };
  const glasses = lines.find((line) => line.product === "lentes");
  return glasses?.product === "lentes"
    ? { quantity: glasses.quantity, colors: glasses.colors }
    : { quantity: item.quantity, colors: [] };
}

/**
 * Identidad del producto para Meta. Los content_ids de los lentes quedan tal
 * cual estaban: cambiarlos a mitad de campana parte el historico de la cuenta.
 */
export function metaContent(item: CheckoutItem): { content_name: string; content_ids: string[] } {
  if (item.product === "clipon") {
    return { content_name: "NOCTE® Clip-On Rojo", content_ids: ["nocte-clipon-rojo"] };
  }
  // Un id para el antifaz en cualquier color y cantidad, igual que el
  // Purchase del servidor (purchaseContent en server.js).
  if (item.product === "sleepmask") {
    return { content_name: "NOCTE® Antifaz 3D para dormir", content_ids: ["nocte-sleepmask-3d"] };
  }

  return {
    content_name:
      item.quantity === 1
        ? "NOCTE® Red Light Blocking Glasses"
        : `NOCTE® Red Light Blocking Glasses - Pack x${item.quantity}`,
    content_ids:
      item.quantity === 1 ? ["nocte-red-glasses"] : [`nocte-red-glasses-${item.quantity}pack`],
  };
}

export interface OrderSummaryItem {
  /** Producto y color: la clave de la fila en la lista. */
  key: string;
  quantity: number;
  /** Nombre corto. El largo, con marca y "para dormir", va a WhatsApp y a Ordefy. */
  name: string;
}

export interface OrderSummary {
  items: OrderSummaryItem[];
  priorityShipping: boolean;
}

/**
 * Lo que la pantalla de exito muestra del pedido: un renglon por producto y
 * color con su nombre corto, y el envio aparte porque es un servicio y no se
 * cuenta por unidades. Dos lineas del mismo producto y color se juntan en una.
 */
export function summarizeOrder(lines: readonly OrderLine[]): OrderSummary {
  const items = new Map<string, OrderSummaryItem>();
  const add = (key: string, name: string, quantity: number) =>
    items.set(key, { key, name, quantity: (items.get(key)?.quantity ?? 0) + quantity });

  let priorityShipping = false;
  for (const line of lines) {
    if (line.product === "lentes") {
      const byColor = summarizeVariantCounts(line.colors);
      if (byColor.length === 0) add("lentes", "Lentes Anti-Luz Azul", line.quantity);
      byColor.forEach(({ variant, count }) => add(`lentes-${variant.id}`, variant.shortName, count));
    } else if (line.product === "sleepmask") {
      add(`sleepmask-${line.color}`, `Antifaz 3D ${MASK_COLORS[line.color].name}`, line.quantity);
    } else if (line.product === "clipon") {
      add("clipon", CLIP_ON.name, line.quantity);
    } else if (line.product === "envio-prioritario") {
      priorityShipping = true;
    }
  }
  return { items: [...items.values()], priorityShipping };
}

/**
 * El pedido en texto, una linea por producto, para el mensaje de WhatsApp que
 * el cliente le manda a NOCTE. Se arma desde las lineas y no desde el producto
 * principal: un antifaz que no aparece aca es un antifaz que el cliente no
 * sabe que compro hasta que le llega. La pantalla de exito usa summarizeOrder.
 */
export function describeOrderLines(lines: readonly OrderLine[]): string {
  return lines
    .flatMap((line) => {
      if (line.product === "lentes") {
        const byColor = summarizeVariantCounts(line.colors);
        // Sin colores el pedido igual tiene que nombrar el producto, si no la
        // linea de lentes desaparece del mensaje entero.
        if (byColor.length === 0) return [`🔴 ${line.quantity}x NOCTE® Lentes Anti-Luz Azul`];
        return byColor.map(({ variant, count }) => `${variant.emoji} ${count}x ${variant.productName}`);
      }
      if (line.product === "clipon") return [`🕶️ ${line.quantity}x NOCTE® ${CLIP_ON.name}`];
      if (line.product === "sleepmask") return [`😴 ${line.quantity}x NOCTE® ${maskName(line.color)}`];
      return [`🚀 ${PRIORITY_SHIPPING.name}`];
    })
    .join("\n");
}
