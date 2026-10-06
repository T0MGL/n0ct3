import { webcrypto } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildPaidOrder, submitPaidOrder, type CheckoutSnapshot } from "@/components/checkout/paidOrder";
import {
  resetPaymentReturnForTests,
  settlePaymentReturn,
  type PaymentReturnDeps,
} from "@/components/checkout/paymentReturn";
import type { PaymentResult } from "@/components/checkout/StripeCheckoutModal";
import {
  discardPendingPayment,
  markPendingPaymentSent,
  readPendingPayment,
  savePendingPayment,
} from "@/lib/pending-payment";

// Todo pasa contra fetch y fbq falsos. Un request a cualquier cosa que no sea
// el backend de NOCTE (Stripe, Meta, Ordefy, n8n) hace fallar el test.

const PI = "pi_3QxRedirect01";
const SECRET = `${PI}_secret_tR4nsFer`;
const RETURN_SEARCH = `?payment_intent=${PI}&payment_intent_client_secret=${SECRET}&redirect_status=succeeded`;
const ORDER_NUMBER = "#NOC-0928-4417";
const SERVER_EVENT_ID = "nocte-purchase-ORD00912";
const ATTRIBUTION_KEY = "nocte_attribution_v1";
const PENDING_KEY = "nocte_pending_payment_v1";

const checkout: CheckoutSnapshot = {
  item: { product: "lentes", quantity: 2, amount: 349000, colors: ["rojo", "amarillo"] },
  name: "Lucía Benítez",
  phone: "0981 555 123",
  location: "Luque",
  address: "Av. Aviadores 1234",
  lat: -25.27,
  long: -57.48,
  ruc: "4123456-7",
  email: undefined,
  orderNumber: ORDER_NUMBER,
};

const result: PaymentResult = {
  paymentIntentId: PI,
  paymentType: "Card",
  isPaid: true,
  deliveryType: "premium",
  lines: [
    { product: "lentes", quantity: 2, amount: 349000, colors: ["rojo", "amarillo"] },
    { product: "sleepmask", color: "negro", quantity: 1, amount: 99000 },
    { product: "envio-prioritario", quantity: 1, amount: 10000 },
  ],
  finalTotal: 458000,
  email: "lucia@example.com",
};

const touch = (source: string, capturedAt: string) => ({
  first: { source, utm_source: source, utm_campaign: `${source}-sep`, captured_at: capturedAt },
  last: { source, utm_source: source, utm_campaign: `${source}-sep`, captured_at: capturedAt },
});

type Call = { url: string; body: unknown };

let storage: Map<string, string>;
let calls: Call[];
let unexpected: string[];
let fbq: ReturnType<typeof vi.fn>;
let serverEventId: string | undefined;

const sendOrderCalls = () => calls.filter((c) => c.url.endsWith("/api/send-order"));
const purchases = () => fbq.mock.calls.filter((args) => args[0] === "track" && args[1] === "Purchase");

beforeEach(() => {
  resetPaymentReturnForTests();
  storage = new Map();
  calls = [];
  unexpected = [];
  serverEventId = SERVER_EVENT_ID;
  fbq = vi.fn();

  vi.stubGlobal("window", {
    localStorage: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => void storage.set(key, value),
      removeItem: (key: string) => void storage.delete(key),
    },
    location: {
      href: `https://nocte.studio/payment-success${RETURN_SEARCH}`,
      origin: "https://nocte.studio",
      pathname: "/payment-success",
      hostname: "nocte.studio",
      protocol: "https:",
      search: RETURN_SEARCH,
    },
    crypto: webcrypto,
    fbq,
  });
  vi.stubGlobal("document", { cookie: "_fbp=fb.1.1727530000000.1843092211; _fbc=fb.1.1727530000000.IwAR3xyz", referrer: "" });
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string, init?: RequestInit) => {
      const url = String(input);
      const body = init?.body ? JSON.parse(String(init.body)) : undefined;
      if (url.endsWith("/api/send-order")) {
        calls.push({ url, body });
        return new Response(
          JSON.stringify({ success: true, orderNumber: ORDER_NUMBER, ...(serverEventId ? { purchaseEventId: serverEventId } : {}) }),
        );
      }
      if (url === "https://api.nocte.studio/api/meta-capi/event") {
        calls.push({ url, body });
        return new Response("{}");
      }
      unexpected.push(url);
      throw new Error(`request no mockeado: ${url}`);
    }),
  );

  storage.set(ATTRIBUTION_KEY, JSON.stringify(touch("meta", new Date(Date.now() - 60_000).toISOString())));
});

afterEach(() => {
  expect(unexpected).toEqual([]);
  vi.unstubAllGlobals();
});

/** Lo que hace el checkout justo antes de confirmPayment. */
const prepareBeforeRedirect = () => savePendingPayment(PI, buildPaidOrder(checkout, result), "/");

const deps = (overrides: Partial<PaymentReturnDeps> = {}): PaymentReturnDeps => ({
  search: RETURN_SEARCH,
  readPending: () => readPendingPayment(),
  markSent: (id, orderNumber) => markPendingPaymentSent(id, orderNumber),
  discard: (id) => discardPendingPayment(id),
  retrieve: async () => ({ id: PI, status: "succeeded" }),
  submit: submitPaidOrder,
  reportPaidWithoutOrder: vi.fn(),
  ...overrides,
});

const settled = async () => {
  await vi.waitFor(() => expect(purchases().length).toBeGreaterThan(0));
  // Un tick mas por si alguien dispara un segundo evento tarde.
  await new Promise((resolve) => setTimeout(resolve, 20));
};

describe("retorno de Stripe con el pago confirmado", () => {
  it("crea un pedido y un Purchase con el event_id del servidor", async () => {
    prepareBeforeRedirect();
    const outcome = await settlePaymentReturn(deps());
    await settled();

    expect(outcome.kind).toBe("paid");
    expect(sendOrderCalls()).toHaveLength(1);
    expect(purchases()).toHaveLength(1);
    const [, , payload, options] = purchases()[0];
    expect(options).toEqual({ eventID: SERVER_EVENT_ID });
    expect(payload).toMatchObject({ value: 458000, currency: "PYG", order_id: ORDER_NUMBER, num_items: 2 });
    // El replay del Purchase del servidor no se espeja: el evento del servidor ya es el espejo.
    expect(calls.filter((c) => c.url.includes("meta-capi"))).toHaveLength(0);
  });

  it("sin Purchase del servidor cae al pixel de siempre con el numero de orden", async () => {
    serverEventId = undefined;
    prepareBeforeRedirect();
    await settlePaymentReturn(deps());
    await settled();

    expect(purchases()).toHaveLength(1);
    expect(purchases()[0][3]).toEqual({ eventID: ORDER_NUMBER });
    const mirrors = calls.filter((c) => c.url.includes("meta-capi"));
    expect(mirrors).toHaveLength(1);
    expect(mirrors[0].body).toMatchObject({ event_name: "Purchase", event_id: ORDER_NUMBER });
  });

  it("manda byte por byte el mismo body que habria mandado la pantalla del pago", async () => {
    submitPaidOrder(buildPaidOrder(checkout, result));
    await settled();
    const inlineBody = JSON.stringify(sendOrderCalls()[0].body);

    calls = [];
    fbq.mockClear();
    prepareBeforeRedirect();
    await settlePaymentReturn(deps());
    await settled();

    expect(JSON.stringify(sendOrderCalls()[0].body)).toBe(inlineBody);
    expect(sendOrderCalls()[0].body).toMatchObject({
      paymentIntentId: PI,
      paymentType: "Card",
      isPaid: true,
      orderNumber: ORDER_NUMBER,
      ruc: "4123456-7",
      lat: -25.27,
      fbp: "fb.1.1727530000000.1843092211",
      fbc: "fb.1.1727530000000.IwAR3xyz",
      googleMapsLink: "https://www.google.com/maps?q=-25.27,-57.48",
    });
  });

  it("lleva la atribucion guardada antes de pagar, no la de la vuelta", async () => {
    prepareBeforeRedirect();
    // Entre el pago y la vuelta otra pestaña llego por Google.
    storage.set(ATTRIBUTION_KEY, JSON.stringify(touch("google", new Date().toISOString())));

    await settlePaymentReturn(deps());
    await settled();

    const { attribution } = sendOrderCalls()[0].body as { attribution: { source: string; utm_campaign: string; touch: string } };
    expect(attribution).toMatchObject({ source: "meta", utm_campaign: "meta-sep", touch: "last" });
  });

  it("dos montajes de la pagina ven el mismo resultado y mandan un solo pedido", async () => {
    prepareBeforeRedirect();
    const [first, second] = await Promise.all([settlePaymentReturn(deps()), settlePaymentReturn(deps())]);
    await settled();

    expect(first).toBe(second);
    expect(sendOrderCalls()).toHaveLength(1);
    expect(purchases()).toHaveLength(1);
  });

  it("recargar la pagina no manda un segundo pedido ni un segundo Purchase", async () => {
    prepareBeforeRedirect();
    await settlePaymentReturn(deps());
    await settled();

    resetPaymentReturnForTests();
    const retrieve = vi.fn(async () => ({ id: PI, status: "succeeded" as const }));
    const reload = await settlePaymentReturn(deps({ retrieve }));
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(reload).toEqual({ kind: "already-sent", orderNumber: ORDER_NUMBER });
    expect(retrieve).not.toHaveBeenCalled();
    expect(sendOrderCalls()).toHaveLength(1);
    expect(purchases()).toHaveLength(1);
  });

  it("si el pedido no llega al backend avisa, sin reintentar", async () => {
    prepareBeforeRedirect();
    const reportPaidWithoutOrder = vi.fn();
    const outcome = await settlePaymentReturn(
      deps({ submit: async () => ({ success: false }), reportPaidWithoutOrder }),
    );
    await vi.waitFor(() => expect(reportPaidWithoutOrder).toHaveBeenCalledWith(PI, SECRET));

    expect(outcome.kind).toBe("paid");
    expect(readPendingPayment()?.status).toBe("sent");
  });

  it("dos pestañas que vuelven a la vez mandan un solo pedido y ninguna alerta", async () => {
    prepareBeforeRedirect();
    let releaseSecondTab: () => void = () => undefined;
    const secondTabRetrieve = () =>
      new Promise<{ id: string; status: "succeeded" }>((resolve) => {
        releaseSecondTab = () => resolve({ id: PI, status: "succeeded" });
      });
    const reportPaidWithoutOrder = vi.fn();

    // La segunda pestaña lee el pendiente y se queda esperando a Stripe
    // mientras la primera manda el pedido.
    const secondTab = settlePaymentReturn(
      deps({ search: `${RETURN_SEARCH}&tab=2`, retrieve: secondTabRetrieve, reportPaidWithoutOrder }),
    );
    const firstTab = await settlePaymentReturn(deps({ reportPaidWithoutOrder }));
    releaseSecondTab();

    expect(firstTab.kind).toBe("paid");
    expect(await secondTab).toEqual({ kind: "already-sent", orderNumber: ORDER_NUMBER });
    await settled();
    expect(sendOrderCalls()).toHaveLength(1);
    expect(purchases()).toHaveLength(1);
    expect(reportPaidWithoutOrder).not.toHaveBeenCalled();
  });

  it("con localStorage bloqueado, preparar el redirect no frena el pago", () => {
    vi.stubGlobal(
      "window",
      Object.defineProperty({ location: { href: "https://nocte.studio/", hostname: "nocte.studio", protocol: "https:" } }, "localStorage", {
        get() {
          throw new DOMException("The operation is insecure.", "SecurityError");
        },
      }),
    );
    expect(() => savePendingPayment(PI, buildPaidOrder(checkout, result), "/")).not.toThrow();
    expect(readPendingPayment()).toBeUndefined();
  });

  it("si no puede marcar el envio no manda nada y avisa al backend", async () => {
    prepareBeforeRedirect();
    const reportPaidWithoutOrder = vi.fn();
    const outcome = await settlePaymentReturn(deps({ markSent: () => false, reportPaidWithoutOrder }));

    expect(outcome).toEqual({ kind: "paid-without-order", paymentIntentId: PI });
    expect(reportPaidWithoutOrder).toHaveBeenCalledWith(PI, SECRET);
    expect(sendOrderCalls()).toHaveLength(0);
  });
});

describe("retorno sin pago confirmado", () => {
  it("processing no crea pedido y conserva el pendiente para cuando se acredite", async () => {
    prepareBeforeRedirect();
    const outcome = await settlePaymentReturn(deps({ retrieve: async () => ({ id: PI, status: "processing" }) }));

    expect(outcome).toEqual({ kind: "processing" });
    expect(sendOrderCalls()).toHaveLength(0);
    expect(readPendingPayment()?.status).toBe("pending");

    resetPaymentReturnForTests();
    await settlePaymentReturn(deps());
    await settled();
    expect(sendOrderCalls()).toHaveLength(1);
  });

  it.each(["requires_payment_method", "requires_action", "canceled"] as const)(
    "%s no crea pedido y borra los datos guardados",
    async (status) => {
      prepareBeforeRedirect();
      const outcome = await settlePaymentReturn(deps({ retrieve: async () => ({ id: PI, status }) }));

      expect(outcome).toEqual({ kind: "failed", retryPath: "/" });
      expect(sendOrderCalls()).toHaveLength(0);
      expect(purchases()).toHaveLength(0);
      expect(storage.has(PENDING_KEY)).toBe(false);
    },
  );

  it("redirect_status=succeeded en la URL no alcanza: manda el estado de Stripe", async () => {
    prepareBeforeRedirect();
    const outcome = await settlePaymentReturn(
      deps({ retrieve: async () => ({ id: PI, status: "requires_payment_method" }) }),
    );
    expect(outcome.kind).toBe("failed");
    expect(sendOrderCalls()).toHaveLength(0);
  });

  it("si Stripe no responde o responde otro pago, no decide nada", async () => {
    prepareBeforeRedirect();
    expect(
      await settlePaymentReturn(
        deps({
          retrieve: async () => {
            throw new Error("network");
          },
        }),
      ),
    ).toEqual({ kind: "unverified" });
    resetPaymentReturnForTests();
    expect(await settlePaymentReturn(deps({ retrieve: async () => ({ id: "pi_otro", status: "succeeded" }) }))).toEqual({
      kind: "unverified",
    });
    expect(sendOrderCalls()).toHaveLength(0);
    expect(readPendingPayment()?.status).toBe("pending");
  });
});

describe("retorno sin el pedido de este pago", () => {
  it("sin pedido guardado: no inventa uno y deja rastro en el backend", async () => {
    const reportPaidWithoutOrder = vi.fn();
    const outcome = await settlePaymentReturn(deps({ reportPaidWithoutOrder }));

    expect(outcome).toEqual({ kind: "paid-without-order", paymentIntentId: PI });
    expect(reportPaidWithoutOrder).toHaveBeenCalledTimes(1);
    expect(reportPaidWithoutOrder).toHaveBeenCalledWith(PI, SECRET);
    expect(sendOrderCalls()).toHaveLength(0);
    expect(purchases()).toHaveLength(0);
  });

  it("con el pedido guardado corrupto: no rompe y no crea nada", async () => {
    storage.set(PENDING_KEY, '{"paymentIntentId":"pi_3QxRedirect01","status":"pending","paid":');
    const outcome = await settlePaymentReturn(deps());

    expect(outcome.kind).toBe("paid-without-order");
    expect(sendOrderCalls()).toHaveLength(0);
    expect(storage.has(PENDING_KEY)).toBe(false);
  });

  it("el PaymentIntent de la URL no es el del pedido guardado: no lo manda ni lo toca", async () => {
    savePendingPayment("pi_3OtroCheckout9", buildPaidOrder(checkout, { ...result, paymentIntentId: "pi_3OtroCheckout9" }), "/");
    const outcome = await settlePaymentReturn(deps());

    expect(outcome.kind).toBe("paid-without-order");
    expect(sendOrderCalls()).toHaveLength(0);
    expect(readPendingPayment()?.paymentIntentId).toBe("pi_3OtroCheckout9");
  });

  it.each([
    "",
    "?redirect_status=succeeded",
    `?payment_intent=${PI}`,
    `?payment_intent=${PI}&payment_intent_client_secret=pi_otro_secret_x`,
    `?payment_intent=javascript:alert(1)&payment_intent_client_secret=${SECRET}`,
  ])("URL sin parametros validos de Stripe (%s): no consulta ni manda nada", async (search) => {
    prepareBeforeRedirect();
    const retrieve = vi.fn();
    const outcome = await settlePaymentReturn(deps({ search, retrieve }));

    expect(outcome).toEqual({ kind: "invalid" });
    expect(retrieve).not.toHaveBeenCalled();
    expect(sendOrderCalls()).toHaveLength(0);
  });
});
