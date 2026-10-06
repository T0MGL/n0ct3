import { sendOrderInBackground, type OrderData, type SendOrderResponse } from "@/services/orderService";
import { trackPurchase, trackServerPurchase, type MetaUserData, type PurchaseParams } from "@/lib/meta-pixel";
import {
  getFbc,
  getFbp,
  hashCity,
  hashCountry,
  hashDepartment,
  hashEmail,
  hashExternalId,
  hashFirstName,
  hashLastName,
  hashPhoneE164,
} from "@/lib/meta-matching";
import {
  describeOrderLines,
  legacyOrderFields,
  metaContent,
  metaNumItems,
  summarizeOrder,
  sumLines,
  type CheckoutItem,
  type OrderLine,
  type OrderSummary,
} from "@/lib/order";
import { readOrderAttribution } from "@/lib/attribution";
import type { PaymentResult } from "@/components/checkout/StripeCheckoutModal";

// How long the Purchase pixel waits for /api/send-order to hand back the
// server event id before falling back to the legacy pixel.
const PURCHASE_ID_WAIT_MS = 6000;

/** Lo que el checkout sabe del cliente al momento de pagar. */
export interface CheckoutSnapshot {
  item: CheckoutItem;
  name: string;
  phone: string;
  location: string;
  address: string;
  lat?: number;
  long?: number;
  ruc?: string;
  email?: string;
  orderNumber: string;
}

/**
 * El pedido y el Purchase de un pago confirmado, listos para salir. Es un dato
 * y no una accion para que el retorno de Stripe (/payment-success) mande
 * exactamente lo mismo que habria mandado la pantalla del pago: se arma una
 * vez, antes de confirmar, y se guarda.
 */
export interface PaidOrder {
  order: OrderData;
  purchase: PurchaseParams;
}

export function buildPaidOrder(checkout: CheckoutSnapshot, result: PaymentResult): PaidOrder {
  // Prefer the email that came back from the payment modal (card typed it
  // in-form, COD may have it from the factura path) and fall back to whatever
  // was already stored from PhoneNameForm.
  const effectiveEmail = result.email || checkout.email;
  const { quantity, colors } = legacyOrderFields(checkout.item, result.lines);

  return {
    order: {
      name: checkout.name,
      phone: checkout.phone,
      location: checkout.location,
      address: checkout.address,
      lat: checkout.lat,
      long: checkout.long,
      ruc: checkout.ruc,
      lines: result.lines,
      quantity,
      total: result.finalTotal,
      orderNumber: checkout.orderNumber,
      paymentIntentId: result.paymentIntentId,
      email: effectiveEmail,
      paymentType: result.paymentType,
      isPaid: result.isPaid,
      deliveryType: result.deliveryType,
      colors,
      fbp: getFbp(),
      fbc: getFbc(),
      attribution: readOrderAttribution(),
    },
    // El value del Purchase es el total real cobrado, upsells incluidos, no el
    // precio del producto: sale de la suma de las lineas del pedido.
    purchase: {
      value: result.finalTotal,
      currency: 'PYG',
      ...metaContent(checkout.item),
      num_items: metaNumItems(checkout.item, result.lines),
      order_id: checkout.orderNumber,
    },
  };
}

/**
 * Manda el pedido y dispara el Purchase. La pantalla de exito nunca espera
 * esto, solo el pixel: con META_SERVER_PURCHASE prendido el servidor emite el
 * Purchase y responde con su event_id. Devuelve el envio para quien necesite
 * saber si el pedido llego; nunca rechaza.
 */
export function submitPaidOrder({ order, purchase }: PaidOrder): Promise<SendOrderResponse> {
  const orderSent = sendOrderInBackground(order);

  // Hash the Advanced Matching payload off the main thread while the order is
  // in flight, then fire Purchase once the backend answers. If the server
  // already emitted it, the pixel replays under the same event_id and Meta
  // dedupes. Otherwise (flag off, Meta down, request lost) the pixel plus CAPI
  // mirror fires as before. If hashing fails the event still goes out without
  // user_data so we never lose a conversion signal.
  void (async () => {
    let userData: MetaUserData | undefined;
    try {
      const [em, ph, external_id, fn, ln, ct, country, st] = await Promise.all([
        hashEmail(order.email),
        hashPhoneE164(order.phone),
        hashExternalId(order.orderNumber),
        hashFirstName(order.name),
        hashLastName(order.name),
        hashCity(order.location),
        hashCountry(),
        hashDepartment(order.location),
      ]);
      userData = { em, ph, fn, ln, ct, country, st, external_id, fbc: getFbc(), fbp: getFbp() };
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('[Meta] hash failed, firing without user_data', err);
      }
    }

    // Bounded wait: on a slow backend the legacy pixel fires anyway so a buyer
    // closing the tab never costs the conversion. With the flag on and a
    // backend slower than this, Meta may see two ids for one order (server
    // ORD-based, browser #NOC-based); rarer and cheaper than losing the event.
    const { purchaseEventId } = await Promise.race([
      orderSent,
      new Promise<{ purchaseEventId?: undefined }>((resolve) => {
        setTimeout(() => resolve({}), PURCHASE_ID_WAIT_MS);
      }),
    ]);
    if (purchaseEventId) {
      trackServerPurchase(purchase, userData, purchaseEventId);
    } else {
      trackPurchase(purchase, userData, order.orderNumber);
    }
  })();

  return orderSent;
}

export interface SuccessOrderData {
  orderNumber: string;
  products: string;
  summary: OrderSummary;
  total: string;
  location: string;
  phone: string;
  name: string;
  address?: string;
  googleMapsLink?: string;
}

/** Lo que muestra SuccessPage y lo que lleva su mensaje de WhatsApp. */
export function successOrderData(
  customer: Pick<OrderData, "orderNumber" | "name" | "phone" | "location" | "address" | "lat" | "long">,
  lines: readonly OrderLine[],
): SuccessOrderData {
  return {
    orderNumber: customer.orderNumber,
    products: describeOrderLines(lines),
    summary: summarizeOrder(lines),
    total: `${sumLines(lines).toLocaleString('es-PY')} Gs`,
    location: customer.location,
    phone: customer.phone,
    name: customer.name,
    address: customer.address,
    googleMapsLink:
      customer.lat && customer.long
        ? `https://www.google.com/maps?q=${customer.lat},${customer.long}`
        : undefined,
  };
}
