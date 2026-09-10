import { ColorSwatchPicker, type SwatchOption } from "@/components/ColorSwatchPicker";
import { VARIANT_IDS, VARIANTS, isVariantSoldOut, type VariantId } from "@/lib/variants";

interface VariantPickerProps {
  value: VariantId;
  onChange: (next: VariantId) => void;
  label?: string;
  size?: "sm" | "md";
  className?: string;
}

// Los tres tonos del lente como muestras. El selector en si es el mismo que
// usa el antifaz (ColorSwatchPicker); aca solo se traducen los datos.
const LENS_OPTIONS: readonly SwatchOption<VariantId>[] = VARIANT_IDS.map((id) => ({
  id,
  name: VARIANTS[id].name,
  soldOutLabel: `${id.charAt(0).toUpperCase()}${id.slice(1)} agotado`,
  swatch: VARIANTS[id].lensColor,
  ring: VARIANTS[id].lensColor,
  soldOut: isVariantSoldOut(id),
  dataVariant: id,
}));

export const VariantPicker = ({
  value,
  onChange,
  label = "Color del lente",
  size = "md",
  className,
}: VariantPickerProps) => (
  <ColorSwatchPicker
    options={LENS_OPTIONS}
    value={value}
    onChange={onChange}
    label={label}
    size={size}
    className={className}
  />
);

export default VariantPicker;
