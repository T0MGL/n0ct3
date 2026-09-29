import { describe, expect, it } from "vitest";
import {
  discardPendingPayment,
  markPendingPaymentSent,
  readPendingPayment,
  savePendingPayment,
  type PendingPaymentEnv,
} from "@/lib/pending-payment";
import type { PaidOrder } from "@/components/checkout/paidOrder";

const KEY = "nocte_pending_payment_v1";
const PI = "pi_3Abc123";
const T0 = Date.parse("2026-09-28T15:00:00Z");
const HOUR = 60 * 60 * 1000;

const memoryStorage = () => {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
  };
};

const at = (storage: PendingPaymentEnv["storage"], now: number): PendingPaymentEnv => ({ storage, now });

const paid = (paymentIntentId = PI): PaidOrder => ({
  order: {
    name: "Lucía Benítez",
    phone: "0981 555 123",
    location: "Luque",
    address: "Av. Aviadores 1234",
    lines: [{ product: "lentes", quantity: 1, amount: 229000, colors: ["rojo"] }],
    quantity: 1,
    total: 229000,
    orderNumber: "#NOC-0928-4417",
    paymentIntentId,
    email: "lucia@example.com",
    paymentType: "Card",
    isPaid: true,
    deliveryType: "común",
    colors: ["rojo"],
  },
  purchase: {
    value: 229000,
    currency: "PYG",
    content_name: "NOCTE® Red Light Blocking Glasses",
    content_ids: ["nocte-red-glasses"],
    num_items: 1,
    order_id: "#NOC-0928-4417",
  },
});

describe("pedido pendiente de un pago con redirect", () => {
  it("se guarda atado al PaymentIntent y se relee igual", () => {
    const storage = memoryStorage();
    savePendingPayment(PI, paid(), "/sleep-mask", at(storage, T0));
    expect(readPendingPayment(at(storage, T0 + HOUR))).toEqual({
      paymentIntentId: PI,
      savedAt: T0,
      status: "pending",
      paid: paid(),
      checkoutPath: "/sleep-mask",
    });
  });

  it("vence a las 24 horas y lo vencido se borra al leerlo", () => {
    const storage = memoryStorage();
    savePendingPayment(PI, paid(), "/", at(storage, T0));
    expect(readPendingPayment(at(storage, T0 + 24 * HOUR - 1))).toBeDefined();
    expect(readPendingPayment(at(storage, T0 + 24 * HOUR))).toBeUndefined();
    expect(storage.data.has(KEY)).toBe(false);
  });

  it("uno guardado en el futuro no se acepta", () => {
    const storage = memoryStorage();
    savePendingPayment(PI, paid(), "/", at(storage, T0 + HOUR));
    expect(readPendingPayment(at(storage, T0))).toBeUndefined();
  });

  it("corrupto, editado a mano o de otro pago no rompe y no se usa", () => {
    const storage = memoryStorage();
    for (const raw of [
      "{no es json",
      "null",
      "[]",
      JSON.stringify({ paymentIntentId: PI, savedAt: T0, status: "pending" }),
      JSON.stringify({ paymentIntentId: "pi_otro", savedAt: T0, status: "pending", paid: paid(PI) }),
      JSON.stringify({ paymentIntentId: PI, savedAt: T0, status: "pending", paid: { ...paid(), order: { ...paid().order, lines: [] } } }),
      JSON.stringify({ paymentIntentId: PI, savedAt: T0, status: "pending", paid: { ...paid(), order: { ...paid().order, paymentType: "COD" } } }),
      JSON.stringify({ paymentIntentId: "<script>", savedAt: T0, status: "sent", orderNumber: "x", sentAt: T0 }),
    ]) {
      storage.data.set(KEY, raw);
      expect(readPendingPayment(at(storage, T0))).toBeUndefined();
      expect(storage.data.has(KEY)).toBe(false);
    }
  });

  it("un path de reintento ajeno cae en la home", () => {
    const storage = memoryStorage();
    savePendingPayment(PI, paid(), "//evil.example/x", at(storage, T0));
    const pending = readPendingPayment(at(storage, T0));
    expect(pending?.status === "pending" && pending.checkoutPath).toBe("/");
  });

  it("marcarlo enviado deja solo el numero de orden, sin datos del cliente", () => {
    const storage = memoryStorage();
    savePendingPayment(PI, paid(), "/", at(storage, T0));
    expect(markPendingPaymentSent(PI, "#NOC-0928-4417", at(storage, T0 + 5000))).toBe(true);
    const raw = storage.data.get(KEY) ?? "";
    expect(raw).not.toContain("Lucía");
    expect(raw).not.toContain("0981");
    expect(raw).not.toContain("Aviadores");
    expect(readPendingPayment(at(storage, T0 + 6000))).toEqual({
      paymentIntentId: PI,
      savedAt: T0,
      status: "sent",
      orderNumber: "#NOC-0928-4417",
      sentAt: T0 + 5000,
    });
  });

  it("no se marca dos veces ni se marca el de otro pago", () => {
    const storage = memoryStorage();
    savePendingPayment(PI, paid(), "/", at(storage, T0));
    expect(markPendingPaymentSent("pi_otro", "#NOC-0928-4417", at(storage, T0))).toBe(false);
    expect(markPendingPaymentSent(PI, "#NOC-0928-4417", at(storage, T0))).toBe(true);
    expect(markPendingPaymentSent(PI, "#NOC-0928-4417", at(storage, T0))).toBe(false);
  });

  it("descartar borra solo el de ese pago", () => {
    const storage = memoryStorage();
    savePendingPayment(PI, paid(), "/", at(storage, T0));
    discardPendingPayment("pi_otro", at(storage, T0));
    expect(storage.data.has(KEY)).toBe(true);
    discardPendingPayment(PI, at(storage, T0));
    expect(storage.data.has(KEY)).toBe(false);
  });

  it("con el storage bloqueado nada tira", () => {
    const broken = {
      getItem: () => {
        throw new Error("SecurityError");
      },
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
      removeItem: () => {
        throw new Error("SecurityError");
      },
    };
    expect(() => savePendingPayment(PI, paid(), "/", at(broken, T0))).not.toThrow();
    expect(readPendingPayment(at(broken, T0))).toBeUndefined();
    expect(markPendingPaymentSent(PI, "#NOC-0928-4417", at(broken, T0))).toBe(false);
    expect(() => discardPendingPayment(PI, at(broken, T0))).not.toThrow();
  });
});
