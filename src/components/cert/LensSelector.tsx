import { LENS_IDS, type LensId } from "@/lib/certificates";

interface LensSelectorProps {
  readonly value: LensId;
  readonly onChange: (id: LensId) => void;
}

const LENS_LABEL: Readonly<Record<LensId, string>> = {
  rojo: "Rojo",
  naranja: "Naranja",
  amarillo: "Amarillo",
};

// Clases estaticas para que el JIT de Tailwind las vea. Cada muestra lleva su
// propio color, no el del lente activo.
const SWATCH_CLASS: Readonly<Record<LensId, string>> = {
  rojo: "bg-variant-rojo",
  naranja: "bg-variant-naranja",
  amarillo: "bg-variant-amarillo",
};

export const LensSelector = ({ value, onChange }: LensSelectorProps) => (
  <fieldset>
    <legend className="text-sm text-muted-foreground mb-3">Elegí el lente</legend>
    <div className="grid grid-cols-3 gap-2">
      {LENS_IDS.map((id) => (
        <div key={id}>
          <input
            type="radio"
            name="lente"
            id={`lente-${id}`}
            value={id}
            checked={value === id}
            onChange={() => onChange(id)}
            className="peer sr-only"
          />
          <label
            htmlFor={`lente-${id}`}
            className="flex cursor-pointer select-none items-center justify-center gap-1.5 rounded-full border border-border px-1.5 py-3 text-[0.8125rem] font-medium sm:gap-2 sm:px-3 sm:text-sm text-muted-foreground transition-[color,border-color,background-color,transform] duration-200 ease-out active:scale-[0.98] peer-checked:border-variant-active peer-checked:bg-white/[0.04] peer-checked:text-foreground peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-variant-active"
          >
            <span aria-hidden="true" className={`h-2.5 w-2.5 shrink-0 rounded-full ${SWATCH_CLASS[id]}`} />
            {LENS_LABEL[id]}
          </label>
        </div>
      ))}
    </div>
  </fieldset>
);
