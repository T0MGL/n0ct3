import { ColorSwatchPicker } from "@/components/ColorSwatchPicker";
import { MASK_SWATCH_OPTIONS } from "@/components/sleep-mask/mask-swatches";
import { MASK_COLORS, type MaskColorId } from "@/lib/mask-colors";
import { cn } from "@/lib/utils";

interface MaskColorPickerProps {
  value: MaskColorId;
  onChange: (next: MaskColorId) => void;
  className?: string;
}

export const MaskColorPicker = ({ value, onChange, className }: MaskColorPickerProps) => (
  <div className={cn("flex items-center gap-3", className)}>
    <ColorSwatchPicker options={MASK_SWATCH_OPTIONS} value={value} onChange={onChange} label="Color del antifaz" />
    {/* Decorativo para el lector de pantalla: el radio seleccionado ya dice
        su nombre, y leerlo dos veces es ruido. */}
    <p aria-hidden="true" className="text-[15px] font-medium text-white">
      {MASK_COLORS[value].name}
    </p>
  </div>
);
