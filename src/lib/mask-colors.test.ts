import { describe, expect, it } from "vitest";
import { resizeMaskPicks, resolveActiveMaskColor, selectedUnitAfterResize } from "@/lib/mask-colors";

describe("color activo de /sleep-mask", () => {
  it("un rosado agotado nunca es el color activo, aunque la unidad lo tenga", () => {
    expect(resolveActiveMaskColor(["negro", "rosado"], 1)).toBe("negro");
    expect(resolveActiveMaskColor(["rosado"], 0)).toBe("negro");
  });

  it("sin ninguna tocada manda la primera", () => {
    expect(resolveActiveMaskColor(["negro", "negro", "rosado"], 0)).toBe("negro");
  });

  it("si la unidad seleccionada sale del pedido manda la primera", () => {
    const quantity = 1;
    const unit = selectedUnitAfterResize(1, quantity);
    expect(unit).toBe(0);
    expect(resolveActiveMaskColor(resizeMaskPicks(["negro", "negro"], quantity), unit)).toBe("negro");
    expect(selectedUnitAfterResize(1, 3)).toBe(1);
  });

  it("siempre es un color del pedido", () => {
    expect(resolveActiveMaskColor(["negro", "rosado"], 7)).toBe("negro");
    expect(resolveActiveMaskColor(["rosado"], 7)).toBe("negro");
  });
});
