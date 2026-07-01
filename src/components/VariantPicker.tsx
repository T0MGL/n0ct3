import { useCallback, useId, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { VARIANT_IDS, VARIANTS, isVariantSoldOut, type VariantId } from "@/lib/variants";

interface VariantPickerProps {
  value: VariantId;
  onChange: (next: VariantId) => void;
  label?: string;
  size?: "sm" | "md";
  className?: string;
}

const SPRING = { type: "spring" as const, stiffness: 420, damping: 32 };

// Selectable colors only. Sold-out variants still render (disabled) but never
// enter roving focus or arrow-key navigation, so keyboard users cannot land a
// selection on them.
const SELECTABLE_IDS = VARIANT_IDS.filter((id) => !isVariantSoldOut(id));

export const VariantPicker = ({
  value,
  onChange,
  label = "Color del lente",
  size = "md",
  className,
}: VariantPickerProps) => {
  const groupId = useId();
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>, currentId: VariantId) => {
      const key = event.key;
      if (key !== "ArrowRight" && key !== "ArrowLeft" && key !== "Home" && key !== "End") return;
      event.preventDefault();
      if (SELECTABLE_IDS.length === 0) return;

      const currentIndex = Math.max(0, SELECTABLE_IDS.indexOf(currentId));
      let nextIndex = currentIndex;
      if (key === "ArrowRight") nextIndex = (currentIndex + 1) % SELECTABLE_IDS.length;
      if (key === "ArrowLeft") nextIndex = (currentIndex - 1 + SELECTABLE_IDS.length) % SELECTABLE_IDS.length;
      if (key === "Home") nextIndex = 0;
      if (key === "End") nextIndex = SELECTABLE_IDS.length - 1;

      const nextId = SELECTABLE_IDS[nextIndex];
      onChange(nextId);
      refs.current[VARIANT_IDS.indexOf(nextId)]?.focus();
    },
    [onChange],
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
      {VARIANT_IDS.map((id, index) => {
        const v = VARIANTS[id];
        const soldOut = isVariantSoldOut(id);
        const selected = value === id && !soldOut;
        return (
          <button
            key={id}
            ref={(el) => { refs.current[index] = el; }}
            role="radio"
            type="button"
            aria-checked={selected}
            aria-label={soldOut ? `${v.name}, agotado` : v.name}
            aria-disabled={soldOut || undefined}
            disabled={soldOut}
            tabIndex={soldOut ? -1 : selected ? 0 : -1}
            onClick={() => { if (!soldOut) onChange(id); }}
            onKeyDown={(e) => handleKeyDown(e, id)}
            data-variant={id}
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
              className={cn("block rounded-full", dot)}
              style={{ backgroundColor: v.lensColor }}
            />
            {soldOut && (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute left-1/2 top-1/2 h-px w-[130%] -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-full bg-white/70"
              />
            )}
            {selected && (
              <motion.span
                layoutId={`vp-ring-${groupId}`}
                aria-hidden="true"
                className="absolute inset-0 rounded-full border"
                style={{ borderColor: v.lensColor }}
                transition={SPRING}
              />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default VariantPicker;
