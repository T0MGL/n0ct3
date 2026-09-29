import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildPaidOrder } from "@/components/checkout/paidOrder";

// Fijado contra el body que armaba handlePaymentSuccess en origin/main (fafb54b)
// antes de mover el camino de exito a paidOrder.ts: mismas claves, mismo orden,
// mismos valores. Si esto cambia, cambia lo que llega a Ordefy y a n8n.
const GOLDEN_ORDER_BODY =
  '{"name":"Lucía Benítez","phone":"+595 981 555123","location":"Luque","address":"Av. Aviadores 1234",' +
  '"lat":-25.27,"long":-57.48,"ruc":"4123456-7",' +
  '"lines":[{"product":"lentes","quantity":2,"amount":349000,"colors":["rojo","amarillo"]},' +
  '{"product":"envio-prioritario","quantity":1,"amount":10000}],' +
  '"quantity":2,"total":359000,"orderNumber":"#NOC-0928-4417","paymentIntentId":"pi_3QxGolden01",' +
  '"email":"lucia@example.com","paymentType":"Card","isPaid":true,"deliveryType":"premium",' +
  '"colors":["rojo","amarillo"],"fbp":"fb.1.1727530000000.1843092211","fbc":"fb.1.1727530000000.IwAR3xyz",' +
  '"attribution":{"source":"meta","utm_source":"meta","utm_campaign":"sep","captured_at":"2026-09-28T14:00:00.000Z","touch":"last"}}';

const GOLDEN_PURCHASE =
  '{"value":359000,"currency":"PYG","content_name":"NOCTE® Red Light Blocking Glasses - Pack x2",' +
  '"content_ids":["nocte-red-glasses-2pack"],"num_items":2,"order_id":"#NOC-0928-4417"}';

beforeEach(() => {
  const touch = { source: "meta", utm_source: "meta", utm_campaign: "sep", captured_at: "2026-09-28T14:00:00.000Z" };
  const storage = new Map([["nocte_attribution_v1", JSON.stringify({ first: touch, last: touch })]]);
  vi.stubGlobal("window", {
    localStorage: { getItem: (key: string) => storage.get(key) ?? null, setItem: () => undefined, removeItem: () => undefined },
    location: { href: "https://nocte.studio/", hostname: "nocte.studio", protocol: "https:" },
  });
  vi.stubGlobal("document", { cookie: "_fbp=fb.1.1727530000000.1843092211; _fbc=fb.1.1727530000000.IwAR3xyz", referrer: "" });
  vi.setSystemTime(new Date("2026-09-28T15:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("el pedido de un pago con tarjeta", () => {
  it("sale igual que antes de mover el camino de exito", () => {
    const paid = buildPaidOrder(
      {
        item: { product: "lentes", quantity: 2, amount: 349000, colors: ["rojo", "amarillo"] },
        name: "Lucía Benítez",
        phone: "+595 981 555123",
        location: "Luque",
        address: "Av. Aviadores 1234",
        lat: -25.27,
        long: -57.48,
        ruc: "4123456-7",
        email: undefined,
        orderNumber: "#NOC-0928-4417",
      },
      {
        paymentIntentId: "pi_3QxGolden01",
        paymentType: "Card",
        isPaid: true,
        deliveryType: "premium",
        lines: [
          { product: "lentes", quantity: 2, amount: 349000, colors: ["rojo", "amarillo"] },
          { product: "envio-prioritario", quantity: 1, amount: 10000 },
        ],
        finalTotal: 359000,
        email: "lucia@example.com",
      },
    );

    expect(JSON.stringify(paid.order)).toBe(GOLDEN_ORDER_BODY);
    expect(JSON.stringify(paid.purchase)).toBe(GOLDEN_PURCHASE);
  });
});
