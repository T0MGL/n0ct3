import { describe, expect, it } from "vitest";
import {
  RED_GLASSES,
  buildOrderLines,
  clipOnItem,
  describeOrderLines,
  describeMaskColors,
  legacyOrderFields,
  metaContent,
  metaNumItems,
  sleepMaskPackSavings,
  sleepMaskItem,
  sumLines,
  summarizeOrder,
  type CheckoutItem,
} from "@/lib/order";
import { SLEEP_MASK_PACKS } from "@/lib/sleep-mask-packs";
import type { VariantId } from "@/lib/variants";

const NO_UPSELLS = { sleepMaskPicks: [], priorityShipping: false } as const;
const lens = (quantity: number, amount: number, colors: VariantId[]): CheckoutItem => ({
  product: "lentes",
  quantity,
  amount,
  colors,
});

describe("checkout de lentes y clip-on: las lineas no cambian", () => {
  it("lente solo, con antifaz de bump y con envio", () => {
    const item = lens(1, 249000, ["rojo"]);
    expect(buildOrderLines(item, NO_UPSELLS)).toEqual([item]);
    expect(buildOrderLines(item, { sleepMaskPicks: ["negro"], priorityShipping: true })).toEqual([
      { product: "lentes", quantity: 1, amount: 249000, colors: ["rojo"] },
      { product: "sleepmask", color: "negro", quantity: 1, amount: 119000 },
      { product: "envio-prioritario", quantity: 1, amount: 10000 },
    ]);
  });

  it("los lentes rojos del checkout del antifaz no se cuelan en un pedido de lentes", () => {
    const item = lens(2, 389000, ["rojo", "amarillo"]);
    expect(buildOrderLines(item, { ...NO_UPSELLS, redGlasses: true })).toEqual([item]);
  });

  it("clip-on", () => {
    expect(buildOrderLines(clipOnItem(), NO_UPSELLS)).toEqual([
      { product: "clipon", quantity: 1, amount: 189000 },
    ]);
  });
});

describe("checkout del antifaz", () => {
  it("solo: una linea a 169.000", () => {
    const lines = buildOrderLines(sleepMaskItem(["negro"]), NO_UPSELLS);
    expect(lines).toEqual([{ product: "sleepmask", color: "negro", quantity: 1, amount: 169000 }]);
    expect(sumLines(lines)).toBe(169000);
  });

  it("con lentes rojos: antifaz primero a 119.000 y lentes a 249.000, total 368.000", () => {
    const lines = buildOrderLines(sleepMaskItem(["rosado"]), { ...NO_UPSELLS, redGlasses: true });
    expect(lines).toEqual([
      { product: "sleepmask", color: "rosado", quantity: 1, amount: 119000 },
      { product: "lentes", quantity: 1, amount: 249000, colors: ["rojo"] },
    ]);
    expect(sumLines(lines)).toBe(368000);
  });

  it("lo que el cliente ve sumar con el bump es 199.000, y separados salen 418.000", () => {
    const item = sleepMaskItem(["negro"]);
    const solo = sumLines(buildOrderLines(item, NO_UPSELLS));
    const ritual = sumLines(buildOrderLines(item, { ...NO_UPSELLS, redGlasses: true }));
    expect(ritual - solo).toBe(199000);
    expect(solo + RED_GLASSES.price - ritual).toBe(50000);
  });

  it("envio prioritario encima de los dos casos", () => {
    const item = sleepMaskItem(["negro"]);
    expect(sumLines(buildOrderLines(item, { ...NO_UPSELLS, priorityShipping: true }))).toBe(179000);
    const full = buildOrderLines(item, { sleepMaskPicks: [], redGlasses: true, priorityShipping: true });
    expect(full.map((line) => line.product)).toEqual(["sleepmask", "lentes", "envio-prioritario"]);
    expect(sumLines(full)).toBe(378000);
  });

  it("el bump del antifaz no aplica cuando el antifaz ya es el principal", () => {
    const lines = buildOrderLines(sleepMaskItem(["negro"]), { sleepMaskPicks: ["rosado", "negro"], priorityShipping: false });
    expect(lines).toEqual([{ product: "sleepmask", color: "negro", quantity: 1, amount: 169000 }]);
  });

  it("la pantalla de exito y WhatsApp nombran el antifaz con su color y los lentes rojos", () => {
    const lines = buildOrderLines(sleepMaskItem(["rosado"]), { sleepMaskPicks: [], redGlasses: true, priorityShipping: true });
    expect(summarizeOrder(lines)).toEqual({
      items: [
        { key: "sleepmask-rosado", name: "Antifaz 3D Rosado", quantity: 1 },
        { key: "lentes-rojo", name: "Lentes Rojos", quantity: 1 },
      ],
      priorityShipping: true,
    });
    expect(describeOrderLines(lines)).toBe(
      "😴 1x NOCTE® Antifaz 3D rosado para dormir\n🔴 1x NOCTE® Lentes Rojos\n🚀 Envío Prioritario VIP",
    );
  });
});

describe("packs del antifaz sin lentes", () => {
  it("la tabla divide exacto por unidad y el ahorro es contra 169.000 cada uno", () => {
    for (const pack of SLEEP_MASK_PACKS) expect(pack.price % pack.quantity).toBe(0);
    expect(SLEEP_MASK_PACKS.map((pack) => [pack.quantity, pack.price, sleepMaskPackSavings(pack)])).toEqual([
      [1, 169000, 0],
      [2, 269000, 69000],
      [3, 369000, 138000],
    ]);
  });

  it("dos del mismo color: una linea de 269.000", () => {
    const lines = buildOrderLines(sleepMaskItem(["negro", "negro"]), NO_UPSELLS);
    expect(lines).toEqual([{ product: "sleepmask", color: "negro", quantity: 2, amount: 269000 }]);
  });

  it("mezcla de colores: el pack se reparte por unidad y la suma es el pack", () => {
    const two = buildOrderLines(sleepMaskItem(["rosado", "negro"]), NO_UPSELLS);
    expect(two).toEqual([
      { product: "sleepmask", color: "negro", quantity: 1, amount: 134500 },
      { product: "sleepmask", color: "rosado", quantity: 1, amount: 134500 },
    ]);
    const three = buildOrderLines(sleepMaskItem(["negro", "rosado", "negro"]), NO_UPSELLS);
    expect(three).toEqual([
      { product: "sleepmask", color: "negro", quantity: 2, amount: 246000 },
      { product: "sleepmask", color: "rosado", quantity: 1, amount: 123000 },
    ]);
    expect(sumLines(three)).toBe(369000);
  });

  it("con lentes rojos cada antifaz va a 119.000 y el bump suma lo que dice", () => {
    const cases = [
      { picks: ["negro"], alone: 169000, ritual: 368000, bump: 199000 },
      { picks: ["negro", "rosado"], alone: 269000, ritual: 487000, bump: 218000 },
      { picks: ["rosado", "rosado", "rosado"], alone: 369000, ritual: 606000, bump: 237000 },
    ] as const;
    for (const { picks, alone, ritual, bump } of cases) {
      const item = sleepMaskItem(picks);
      const soloTotal = sumLines(buildOrderLines(item, NO_UPSELLS));
      const ritualTotal = sumLines(buildOrderLines(item, { ...NO_UPSELLS, redGlasses: true }));
      expect([soloTotal, ritualTotal, ritualTotal - soloTotal]).toEqual([alone, ritual, bump]);
    }
  });

  it("mas de tres se corta en el pack mas grande", () => {
    const item = sleepMaskItem(["negro", "negro", "negro", "rosado"]);
    expect(item).toMatchObject({ quantity: 3, amount: 369000, colors: ["negro", "negro", "negro"] });
  });

  it("nombre corto del pedido", () => {
    expect(describeMaskColors(["rosado"])).toBe("Antifaz 3D Rosado");
    expect(describeMaskColors(["rosado", "negro", "negro"])).toBe("3 antifaces 3D: 2 negros, 1 rosado");
  });
});

describe("num_items para Meta", () => {
  it("lentes y clip-on mandan la cantidad del item como siempre", () => {
    const item = lens(2, 389000, ["rojo", "rojo"]);
    const lines = buildOrderLines(item, { sleepMaskPicks: ["negro", "negro"], priorityShipping: true });
    expect(metaNumItems(item, lines)).toBe(2);
  });

  it("el antifaz manda las unidades reales, lentes incluidos y envio fuera", () => {
    const item = sleepMaskItem(["negro", "negro"]);
    expect(metaNumItems(item, buildOrderLines(item, NO_UPSELLS))).toBe(2);
    expect(metaNumItems(item, buildOrderLines(item, { sleepMaskPicks: [], redGlasses: true, priorityShipping: true }))).toBe(3);
  });
});

describe("campos de primer nivel para n8n y el Purchase del servidor", () => {
  it("lentes y clip-on quedan como estaban", () => {
    const item = lens(2, 389000, ["rojo", "naranja"]);
    expect(legacyOrderFields(item, buildOrderLines(item, NO_UPSELLS))).toEqual({ quantity: 2, colors: ["rojo", "naranja"] });
    expect(legacyOrderFields(clipOnItem(), [])).toEqual({ quantity: 1, colors: undefined });
  });

  it("antifaz con lentes manda los del lente; solo, colors vacio", () => {
    const item = sleepMaskItem(["negro"]);
    const ritual = buildOrderLines(item, { ...NO_UPSELLS, redGlasses: true });
    expect(legacyOrderFields(item, ritual)).toEqual({ quantity: 1, colors: ["rojo"] });
    expect(legacyOrderFields(item, buildOrderLines(item, NO_UPSELLS))).toEqual({ quantity: 1, colors: [] });
  });
});

describe("metaContent", () => {
  it("los ids de lentes y clip-on no se tocan", () => {
    expect(metaContent(lens(1, 249000, ["rojo"]))).toEqual({
      content_name: "NOCTE® Red Light Blocking Glasses",
      content_ids: ["nocte-red-glasses"],
    });
    expect(metaContent(lens(3, 549000, ["rojo", "naranja", "amarillo"]))).toEqual({
      content_name: "NOCTE® Red Light Blocking Glasses - Pack x3",
      content_ids: ["nocte-red-glasses-3pack"],
    });
    expect(metaContent(clipOnItem())).toEqual({
      content_name: "NOCTE® Clip-On Rojo",
      content_ids: ["nocte-clipon-rojo"],
    });
  });

  it("el antifaz tiene un id propio, el mismo en cualquier color", () => {
    const expected = { content_name: "NOCTE® Antifaz 3D para dormir", content_ids: ["nocte-sleepmask-3d"] };
    expect(metaContent(sleepMaskItem(["negro"]))).toEqual(expected);
    expect(metaContent(sleepMaskItem(["rosado"]))).toEqual(expected);
  });
});
