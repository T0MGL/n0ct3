import { describe, expect, it } from "vitest";
import {
  DEFAULT_MASK_COLOR,
  maskColorFromSearch,
  resizeMaskPicks,
  resolveActiveMaskColor,
  selectedUnitAfterResize,
} from "@/lib/mask-colors";

describe("color activo de /sleep-mask", () => {
  it("con colores mezclados manda la unidad seleccionada", () => {
    expect(resolveActiveMaskColor(["negro", "rosado"], 1)).toBe("rosado");
    expect(resolveActiveMaskColor(["negro", "rosado"], 0)).toBe("negro");
  });

  it("sin ninguna tocada manda la primera", () => {
    expect(resolveActiveMaskColor(["rosado", "negro", "negro"], 0)).toBe("rosado");
  });

  it("si la unidad seleccionada sale del pedido manda la primera", () => {
    const quantity = 1;
    const unit = selectedUnitAfterResize(1, quantity);
    expect(unit).toBe(0);
    expect(resolveActiveMaskColor(resizeMaskPicks(["negro", "rosado"], quantity), unit)).toBe("negro");
    expect(selectedUnitAfterResize(1, 3)).toBe(1);
  });

  it("tocar el color que una unidad ya tiene la selecciona igual", () => {
    // La pagina marca la unidad en cada onChange, cambie o no el color.
    const picks = ["rosado", "negro"] as const;
    expect(resolveActiveMaskColor(picks, 0)).toBe("rosado");
    expect(resolveActiveMaskColor(picks, 1)).toBe("negro");
  });

  it("siempre es un color del pedido", () => {
    expect(resolveActiveMaskColor(["negro", "rosado"], 7)).toBe("negro");
    expect(resolveActiveMaskColor(["rosado"], 7)).toBe("rosado");
  });
});

describe("color inicial por ?color=", () => {
  it("preselecciona el color del link", () => {
    expect(maskColorFromSearch("?color=rosado")).toBe("rosado");
    expect(maskColorFromSearch("?utm_source=meta&color=negro")).toBe("negro");
  });

  it("sin parametro o con un valor que no existe cae en el default", () => {
    expect(maskColorFromSearch("")).toBe(DEFAULT_MASK_COLOR);
    expect(maskColorFromSearch("?color=ROSADO")).toBe(DEFAULT_MASK_COLOR);
    expect(maskColorFromSearch("?color=constructor")).toBe(DEFAULT_MASK_COLOR);
  });
});
