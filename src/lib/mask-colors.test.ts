import { describe, expect, it } from "vitest";
import {
  MASK_COLOR_IDS,
  resizeMaskPicks,
  resolveActiveMaskColor,
  selectedUnitAfterResize,
} from "@/lib/mask-colors";

describe("catalogo del antifaz", () => {
  it("negro es el unico color: el rosado salio de la web", () => {
    expect(MASK_COLOR_IDS).toEqual(["negro"]);
  });
});

describe("color activo de /sleep-mask", () => {
  it("sin ninguna unidad tocada manda la primera", () => {
    expect(resolveActiveMaskColor(["negro", "negro"], 0)).toBe("negro");
  });

  it("si la unidad seleccionada sale del pedido manda la primera", () => {
    const unit = selectedUnitAfterResize(1, 1);
    expect(unit).toBe(0);
    expect(resolveActiveMaskColor(resizeMaskPicks(["negro", "negro"], 1), unit)).toBe("negro");
    expect(selectedUnitAfterResize(1, 3)).toBe(1);
  });

  it("siempre es un color del pedido", () => {
    expect(resolveActiveMaskColor(["negro"], 7)).toBe("negro");
    expect(resolveActiveMaskColor([], 0)).toBe("negro");
  });

  it("al crecer el pedido completa con negro", () => {
    expect(resizeMaskPicks(["negro"], 3)).toEqual(["negro", "negro", "negro"]);
  });
});
