import type { SwatchOption } from "@/components/ColorSwatchPicker";
import { MASK_COLORS, MASK_COLOR_IDS, type MaskColorId } from "@/lib/mask-colors";

// El mismo selector del bump del antifaz en el checkout: teclado, lector de
// pantalla y el agotado manual (mask-colors.ts) se comportan igual en los dos.
export const MASK_SWATCH_OPTIONS: readonly SwatchOption<MaskColorId>[] = MASK_COLOR_IDS.map((id) => ({
  id,
  name: MASK_COLORS[id].name,
  soldOutLabel: `${MASK_COLORS[id].name} agotado`,
  swatch: MASK_COLORS[id].swatch,
  ring: MASK_COLORS[id].ring,
  needsOutline: MASK_COLORS[id].needsOutline,
  soldOut: MASK_COLORS[id].soldOut,
}));
