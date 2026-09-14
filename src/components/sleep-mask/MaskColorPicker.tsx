import { ColorSwatchPicker, type SwatchOption } from "@/components/ColorSwatchPicker";
import { MASK_COLORS, MASK_COLOR_IDS, type MaskColorId } from "@/lib/mask-colors";
import { cn } from "@/lib/utils";

// El mismo selector del bump del antifaz en el checkout: teclado, lector de
// pantalla y el agotado manual (mask-colors.ts) se comportan igual en los dos.
const OPTIONS: readonly SwatchOption<MaskColorId>[] = MASK_COLOR_IDS.map((id) => ({
  id,
  name: MASK_COLORS[id].name,
  soldOutLabel: `${MASK_COLORS[id].name} agotado`,
  swatch: MASK_COLORS[id].swatch,
  ring: MASK_COLORS[id].ring,
  needsOutline: MASK_COLORS[id].needsOutline,
  soldOut: MASK_COLORS[id].soldOut,
}));

interface MaskColorPickerProps {
  value: MaskColorId;
  onChange: (next: MaskColorId) => void;
  className?: string;
}

export const MaskColorPicker = ({ value, onChange, className }: MaskColorPickerProps) => (
  <div className={cn("flex items-center gap-3", className)}>
    <ColorSwatchPicker options={OPTIONS} value={value} onChange={onChange} label="Color del antifaz" />
    {/* Decorativo para el lector de pantalla: el radio seleccionado ya dice
        su nombre, y leerlo dos veces es ruido. */}
    <p aria-hidden="true" className="text-[15px] font-medium text-white">
      {MASK_COLORS[value].name}
    </p>
  </div>
);
