import { useCallback, useId, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useSoldOutFeedback } from "@/lib/use-soldout-feedback";

export interface SwatchOption<T extends string> {
  id: T;
  /** Nombre accesible del color. */
  name: string;
  /** Lo que dice el aviso al tocar el color agotado. */
  soldOutLabel: string;
  swatch: string;
  /** Borde de la muestra seleccionada. */
  ring: string;
  /** Filete claro para muestras oscuras que se pierden contra el fondo. */
  needsOutline?: boolean;
  soldOut: boolean;
  /** Se escribe como data-variant: los lentes lo usan para el acento de su tono. */
  dataVariant?: string;
}

interface ColorSwatchPickerProps<T extends string> {
  options: readonly SwatchOption<T>[];
  value: T;
  onChange: (next: T) => void;
  label: string;
  size?: "sm" | "md";
  className?: string;
}

const SPRING = { type: "spring" as const, stiffness: 420, damping: 32 };

/**
 * Muestras de color como radiogroup. Salio de VariantPicker para que el
 * antifaz use el mismo selector que los lentes y no uno parecido: el teclado,
 * la accesibilidad y el manejo del agotado son los mismos, y un arreglo en
 * uno llega a los dos.
 *
 * Los agotados se muestran (deshabilitados, tachados) pero nunca entran al foco
 * ni a la navegacion con flechas, asi que con teclado no se puede caer en uno.
 */
export function ColorSwatchPicker<T extends string>({
  options,
  value,
  onChange,
  label,
  size = "md",
  className,
}: ColorSwatchPickerProps<T>) {
  const groupId = useId();
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const soldOutFeedback = useSoldOutFeedback();

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>, currentId: T) => {
      const key = event.key;
      if (key !== "ArrowRight" && key !== "ArrowLeft" && key !== "Home" && key !== "End") return;
      event.preventDefault();
      const selectable = options.filter((option) => !option.soldOut).map((option) => option.id);
      if (selectable.length === 0) return;

      const currentIndex = Math.max(0, selectable.indexOf(currentId));
      let nextIndex = currentIndex;
      if (key === "ArrowRight") nextIndex = (currentIndex + 1) % selectable.length;
      if (key === "ArrowLeft") nextIndex = (currentIndex - 1 + selectable.length) % selectable.length;
      if (key === "Home") nextIndex = 0;
      if (key === "End") nextIndex = selectable.length - 1;

      const nextId = selectable[nextIndex];
      onChange(nextId);
      refs.current[options.findIndex((option) => option.id === nextId)]?.focus();
    },
    [onChange, options],
  );

  const btn = size === "sm" ? "h-7 w-7" : "h-9 w-9";
  const dot = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <div
      role="radiogroup"
      aria-label={label}
      id={groupId}
      className={cn("inline-flex items-center gap-2", className)}
    >
      {options.map((option, index) => {
        const { id, soldOut } = option;
        const selected = value === id && !soldOut;
        return (
          <button
            key={id}
            ref={(el) => { refs.current[index] = el; }}
            role="radio"
            type="button"
            aria-checked={selected}
            aria-label={soldOut ? `${option.name}, agotado` : option.name}
            aria-disabled={soldOut || undefined}
            tabIndex={soldOut ? -1 : selected ? 0 : -1}
            onClick={() => (soldOut ? soldOutFeedback.show(id) : onChange(id))}
            onKeyDown={(e) => handleKeyDown(e, id)}
            data-variant={option.dataVariant}
            className={cn(
              "relative grid place-items-center rounded-full transition-[transform] duration-200",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              "focus-visible:ring-white/40",
              soldOut && "cursor-not-allowed opacity-40",
              btn,
            )}
          >
            <span
              aria-hidden="true"
              className={cn("block rounded-full", option.needsOutline && "ring-1 ring-white/35", dot)}
              style={{ backgroundColor: option.swatch }}
            />
            {soldOut && (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute left-1/2 top-1/2 h-px w-[130%] -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-full bg-white/70"
              />
            )}
            {soldOut && (
              <AnimatePresence>
                {soldOutFeedback.shownId === id && (
                  <motion.span
                    role="status"
                    aria-live="polite"
                    initial={{ opacity: 0, scale: 0.9, y: 4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 4 }}
                    transition={{ duration: 0.16, ease: "easeOut" }}
                    className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-black/90 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white ring-1 ring-red-500/40"
                  >
                    {option.soldOutLabel}
                  </motion.span>
                )}
              </AnimatePresence>
            )}
            {selected && (
              <motion.span
                layoutId={`vp-ring-${groupId}`}
                aria-hidden="true"
                className="absolute inset-0 rounded-full border"
                style={{ borderColor: option.ring }}
                transition={SPRING}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
