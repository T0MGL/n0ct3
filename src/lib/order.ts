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

import { summarizeVariantCounts, type VariantId } from "@/lib/variants";
import { MASK_COLORS, MASK_COLOR_IDS, resolveSelectableMaskColor, type MaskColorId } from "@/lib/mask-colors";
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

// El color se elige por unidad en el bump (ver mask-colors.ts) y va en el nombre
// de cada linea con maskName: es lo que el cliente lee en su confirmacion de
// WhatsApp y tiene que coincidir con lo que llega en la caja.
export const SLEEP_MASK: AddOn = {
  product: "sleepmask",
  name: "Antifaz 3D para dormir",
  price: 119000,
  listPrice: 169000,
};

export const CLIP_ON: AddOn = {
  product: "clipon",
  name: "Clip-On Rojo",
  price: 189000,
};

/** El producto principal del checkout. Los upsells se suman aparte. */
export type CheckoutItem =
  | { product: "lentes"; quantity: number; amount: number; colors: VariantId[] }
  | { product: "clipon"; quantity: 1; amount: number };

export interface CheckoutUpsells {
  /** Color de cada antifaz, uno por unidad. Vacio es sin antifaz. */
  sleepMaskPicks: readonly MaskColorId[];
  priorityShipping: boolean;
}

export const maskName = (color: MaskColorId): string =>
  `Antifaz 3D ${MASK_COLORS[color].name.toLowerCase()} para dormir`;

export function buildOrderLines(item: CheckoutItem, upsells: CheckoutUpsells): OrderLine[] {
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

export const sumLines = (lines: readonly OrderLine[]): number =>
  lines.reduce((total, line) => total + line.amount, 0);

export const clipOnItem = (): CheckoutItem => ({
  product: "clipon",
  quantity: 1,
  amount: CLIP_ON.price,
});

/**
 * Identidad del producto para Meta. Los content_ids de los lentes quedan tal
 * cual estaban: cambiarlos a mitad de campana parte el historico de la cuenta.
 */
export function metaContent(item: CheckoutItem): { content_name: string; content_ids: string[] } {
  if (item.product === "clipon") {
    return { content_name: "NOCTE® Clip-On Rojo", content_ids: ["nocte-clipon-rojo"] };
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
