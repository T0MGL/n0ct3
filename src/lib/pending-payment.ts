/**
 * El pedido de un pago con tarjeta que salio de la pagina para autorizarse
 * (banco, 3DS a pantalla completa, metodos con redirect de Stripe).
 *
 * Se guarda justo antes de confirmPayment y /payment-success lo retoma. Vive
 * en localStorage y no en sessionStorage: el banco puede devolver al cliente
 * en una pestaña nueva del mismo navegador, y sessionStorage es por pestaña.
 * Lo que ningun storage cubre es la vuelta en otro navegador (del in-app de
 * Instagram a Safari): ahi el pago queda sin pedido y el retorno lo avisa al
 * backend en vez de inventar uno.
 *
 * Guarda los mismos datos que ya viajan en el pedido, nada mas, y solo
 * mientras hacen falta: se borra apenas la confirmacion vuelve sin redirigir,
 * y una vez mandado el pedido queda solo el numero de orden, para que recargar
 * la pagina de retorno no mande un segundo pedido ni un segundo Purchase.
 */

import type { PaidOrder } from "@/components/checkout/paidOrder";

const STORAGE_KEY = "nocte_pending_payment_v1";
// La idempotencia de Ordefy por orderNumber dura 24 horas. Mas alla de eso un
// reenvio ya no se deduplica, asi que el pedido pendiente tampoco vive mas.
const PENDING_TTL_MS = 24 * 60 * 60 * 1000;

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export type PendingPaymentEnv = { storage: StorageLike; now: number };

export type PendingPayment =
  | { paymentIntentId: string; savedAt: number; status: "pending"; paid: PaidOrder; checkoutPath: string }
  | { paymentIntentId: string; savedAt: number; status: "sent"; orderNumber: string; sentAt: number };

// Leer window.localStorage tira SecurityError con el storage bloqueado (Safari
// o Firefox sin cookies, Chrome con datos del sitio bloqueados). Por eso el env
// se resuelve adentro del try de cada funcion y nunca como parametro por
// defecto: si el storage falla se pierde la red del retorno, nunca el checkout
// ni el arranque de la app.
const browserEnv = (): PendingPaymentEnv | undefined => {
  if (typeof window === "undefined") return undefined;
  return { storage: window.localStorage, now: Date.now() };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isFiniteNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

const isNonEmptyString = (value: unknown): value is string => typeof value === "string" && value.length > 0;

// Solo un path propio: el "intentar de nuevo" del retorno navega a esto.
const isCheckoutPath = (value: unknown): value is string =>
  typeof value === "string" && /^\/[A-Za-z0-9/_-]*$/.test(value) && !value.startsWith("//");

const isPaymentIntentId = (value: unknown): value is string => typeof value === "string" && /^pi_[A-Za-z0-9]+$/.test(value);

// localStorage lo edita cualquiera. Lo que se chequea aca es la forma que el
// retorno necesita para no romperse; los precios y las lineas los valida el
// backend igual que en cualquier otro pedido.
const isPaidOrder = (value: unknown, paymentIntentId: string): value is PaidOrder => {
  if (!isRecord(value) || !isRecord(value.order) || !isRecord(value.purchase)) return false;
  const { order, purchase } = value;
  const linesOk =
    Array.isArray(order.lines) &&
    order.lines.length > 0 &&
    order.lines.every(
      (line) => isRecord(line) && isNonEmptyString(line.product) && isFiniteNumber(line.quantity) && isFiniteNumber(line.amount),
    );
  return (
    linesOk &&
    isNonEmptyString(order.name) &&
    isNonEmptyString(order.phone) &&
    isNonEmptyString(order.location) &&
    isNonEmptyString(order.orderNumber) &&
    isFiniteNumber(order.total) &&
    order.paymentType === "Card" &&
    order.paymentIntentId === paymentIntentId &&
    isFiniteNumber(purchase.value) &&
    isNonEmptyString(purchase.currency) &&
    isNonEmptyString(purchase.content_name) &&
    Array.isArray(purchase.content_ids) &&
    purchase.content_ids.every(isNonEmptyString) &&
    isFiniteNumber(purchase.num_items) &&
    purchase.order_id === order.orderNumber
  );
};

const parsePending = (raw: string | null, now: number): PendingPayment | undefined => {
  if (!raw) return undefined;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return undefined;
  }
  if (!isRecord(parsed) || !isPaymentIntentId(parsed.paymentIntentId) || !isFiniteNumber(parsed.savedAt)) return undefined;
  const { paymentIntentId, savedAt } = parsed;
  if (savedAt > now || now - savedAt >= PENDING_TTL_MS) return undefined;

  if (parsed.status === "sent" && isNonEmptyString(parsed.orderNumber) && isFiniteNumber(parsed.sentAt)) {
    return { paymentIntentId, savedAt, status: "sent", orderNumber: parsed.orderNumber, sentAt: parsed.sentAt };
  }
  if (parsed.status === "pending" && isPaidOrder(parsed.paid, paymentIntentId)) {
    const checkoutPath = isCheckoutPath(parsed.checkoutPath) ? parsed.checkoutPath : "/";
    return { paymentIntentId, savedAt, status: "pending", paid: parsed.paid, checkoutPath };
  }
  return undefined;
};

export const savePendingPayment = (
  paymentIntentId: string,
  paid: PaidOrder,
  checkoutPath: string,
  override?: PendingPaymentEnv,
): void => {
  try {
    const env = override ?? browserEnv();
    if (!env) return;
    const record: PendingPayment = { paymentIntentId, savedAt: env.now, status: "pending", paid, checkoutPath };
    env.storage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch {
    // Storage lleno o bloqueado: el pago con tarjeta sigue igual. Solo se
    // pierde la red para el caso de redirect.
  }
};

/** El pedido pendiente vivo, o undefined si no hay, vencio o no se puede leer. */
export const readPendingPayment = (override?: PendingPaymentEnv): PendingPayment | undefined => {
  try {
    const env = override ?? browserEnv();
    if (!env) return undefined;
    const raw = env.storage.getItem(STORAGE_KEY);
    const pending = parsePending(raw, env.now);
    // Lo vencido o corrupto se poda al leerlo: son datos personales que ya
    // no le sirven a nadie.
    if (raw && !pending) env.storage.removeItem(STORAGE_KEY);
    return pending;
  } catch {
    return undefined;
  }
};

/**
 * Marca el pago como pedido enviado y tira los datos del cliente. Va ANTES de
 * mandar el pedido: al reves, una recarga en el medio serian dos pedidos y dos
 * confirmaciones de WhatsApp para un solo pago. El costo es que si la pestaña
 * muere entre la marca y el envio, ese pedido se pierde sin aviso del
 * navegador; queda la linea stripe.payment_succeeded del webhook para
 * conciliar. Devuelve false si no pudo escribir, y entonces el pedido no sale.
 */
export const markPendingPaymentSent = (
  paymentIntentId: string,
  orderNumber: string,
  override?: PendingPaymentEnv,
): boolean => {
  try {
    const env = override ?? browserEnv();
    if (!env) return false;
    const current = parsePending(env.storage.getItem(STORAGE_KEY), env.now);
    if (!current || current.paymentIntentId !== paymentIntentId || current.status !== "pending") return false;
    const record: PendingPayment = {
      paymentIntentId,
      savedAt: current.savedAt,
      status: "sent",
      orderNumber,
      sentAt: env.now,
    };
    env.storage.setItem(STORAGE_KEY, JSON.stringify(record));
    return true;
  } catch {
    return false;
  }
};

/** Borra el pedido pendiente de este pago. Uno de otro pago no se toca. */
export const discardPendingPayment = (paymentIntentId: string, override?: PendingPaymentEnv): void => {
  try {
    const env = override ?? browserEnv();
    if (!env) return;
    const raw = env.storage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed: unknown = JSON.parse(raw);
    if (isRecord(parsed) && parsed.paymentIntentId !== paymentIntentId) return;
    env.storage.removeItem(STORAGE_KEY);
  } catch {
    // Se lo lleva el TTL.
  }
};
