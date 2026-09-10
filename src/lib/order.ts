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

export type OrderProduct = "lentes" | "sleepmask" | "clipon" | "envio-prioritario";

export interface OrderLine {
  product: OrderProduct;
  /** Unidades que se lleva el cliente. Para lentes, los lentes del pack. */
  quantity: number;
  /** Importe total de la linea en guaranies, con el descuento ya aplicado. */
  amount: number;
  /** Solo lentes: el color de cada unidad, en el orden en que los eligio. */
  colors?: VariantId[];
}

interface AddOn {
  product: OrderProduct;
  /** Nombre que ve el cliente en el resumen y en la confirmacion de WhatsApp. */
  name: string;
  /** Lo que se cobra. */
  price: number;
  /** Precio de catalogo, tachado. Ausente cuando no hay descuento. */
  listPrice?: number;
  image?: string;
}

export const PRIORITY_SHIPPING: AddOn = {
  product: "envio-prioritario",
  name: "Envío Prioritario VIP",
  price: 10000,
};

export const SLEEP_MASK: AddOn = {
  product: "sleepmask",
  name: "Antifaz 3D para dormir",
  price: 119000,
  listPrice: 169000,
  // Sin foto real todavia. El bump renderiza sin miniatura hasta que llegue:
  // importar el .webp aca y asignarlo es todo lo que hace falta.
  image: undefined,
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
  sleepMask: boolean;
  priorityShipping: boolean;
}

export function buildOrderLines(item: CheckoutItem, upsells: CheckoutUpsells): OrderLine[] {
  const lines: OrderLine[] = [item];

  if (upsells.sleepMask) {
    lines.push({ product: SLEEP_MASK.product, quantity: 1, amount: SLEEP_MASK.price });
  }
  if (upsells.priorityShipping) {
    lines.push({ product: PRIORITY_SHIPPING.product, quantity: 1, amount: PRIORITY_SHIPPING.price });
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

/**
 * El pedido en texto, una linea por producto. Es lo que el cliente recibe por
 * WhatsApp y lo que ve en la pantalla de confirmacion, asi que se arma desde
 * las lineas y no desde el producto principal: un antifaz que no aparece aca
 * es un antifaz que el cliente no sabe que compro hasta que le llega.
 */
export function describeOrderLines(lines: readonly OrderLine[]): string {
  return lines
    .flatMap((line) => {
      if (line.product === "lentes") {
        const byColor = summarizeVariantCounts(line.colors ?? []);
        // Sin colores el pedido igual tiene que nombrar el producto, si no la
        // linea de lentes desaparece del mensaje entero.
        if (byColor.length === 0) return [`🔴 ${line.quantity}x NOCTE® Lentes Anti-Luz Azul`];
        return byColor.map(({ variant, count }) => `${variant.emoji} ${count}x ${variant.productName}`);
      }
      if (line.product === "clipon") return [`🕶️ ${line.quantity}x NOCTE® ${CLIP_ON.name}`];
      if (line.product === "sleepmask") return [`😴 ${line.quantity}x NOCTE® ${SLEEP_MASK.name}`];
      return [`🚀 ${PRIORITY_SHIPPING.name}`];
    })
    .join("\n");
}
