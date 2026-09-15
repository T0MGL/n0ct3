import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { MASK_COLORS, MASK_COLOR_IDS } from "@/lib/mask-colors";
import { SLEEP_MASK_SOLO_PRICE } from "@/lib/sleep-mask-packs";
import { SLEEP_MASK_URL, sleepMaskJsonLd, sleepMaskSku } from "@/components/sleep-mask/seo";
import { renderSleepMaskHtml } from "../../../vite.sleep-mask";

const read = (file: string) => readFileSync(new URL(`../../../${file}`, import.meta.url), "utf8");

describe("JSON-LD de /sleep-mask", () => {
  const jsonLd = sleepMaskJsonLd();

  it("una variante por color con el SKU que manda el backend a Ordefy", () => {
    const server = read("nocte-backend/server.js");
    expect(jsonLd.hasVariant.map((variant) => variant.sku)).toEqual(MASK_COLOR_IDS.map(sleepMaskSku));
    for (const id of MASK_COLOR_IDS) expect(server).toContain(`sku: '${sleepMaskSku(id)}'`);
  });

  it("precio y stock salen del catalogo, no de un numero aparte", () => {
    for (const [index, id] of MASK_COLOR_IDS.entries()) {
      const { offers } = jsonLd.hasVariant[index];
      expect(offers.price).toBe(SLEEP_MASK_SOLO_PRICE);
      expect(offers.availability).toBe(
        MASK_COLORS[id].soldOut ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
      );
      expect(offers.url).toBe(`${SLEEP_MASK_URL}?color=${id}`);
    }
  });

  it("sin rating ni reseñas", () => {
    expect(JSON.stringify(jsonLd)).not.toMatch(/aggregateRating|review|priceValidUntil/i);
  });
});

describe("sleep-mask.html", () => {
  const index = read("index.html");
  const html = renderSleepMaskHtml(index);
  const head = html.slice(0, html.indexOf("</head>"));

  it("cambia el head de los lentes por el del antifaz y deja el body igual", () => {
    expect(html.slice(html.indexOf("</head>"))).toBe(index.slice(index.indexOf("</head>")));
    expect(head.match(/<title>/g)).toHaveLength(1);
    expect(head.match(/rel="canonical"/g)).toHaveLength(1);
    expect(head.match(/application\/ld\+json/g)).toHaveLength(1);
    expect(head).toContain(`<link rel="canonical" href="${SLEEP_MASK_URL}" />`);
    expect(head).not.toMatch(/reviewCount|og-image\.webp|Lentes/);
  });

  it("el JSON-LD embebido es el mismo objeto", () => {
    const script = head.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    expect(JSON.parse(script?.[1] ?? "")).toEqual(sleepMaskJsonLd());
  });

  it("si index.html cambia de forma el build se cae en vez de publicar el head de los lentes", () => {
    expect(() => renderSleepMaskHtml(index.replace(/<link rel="canonical"[^>]*>/, ""))).toThrow(/canonical/);
  });
});
