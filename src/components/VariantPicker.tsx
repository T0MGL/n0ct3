import { useCallback, useId, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { VARIANT_IDS, VARIANTS, type VariantId } from "@/lib/variants";

interface VariantPickerProps {
  value: VariantId;
  onChange: (next: VariantId) => void;
  label?: string;
  size?: "sm" | "md";
  className?: string;
}

const SPRING = { type: "spring" as const, stiffness: 420, damping: 32 };

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
    (event: React.KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
      const key = event.key;
      if (key !== "ArrowRight" && key !== "ArrowLeft" && key !== "Home" && key !== "End") return;
      event.preventDefault();
      let nextIndex = currentIndex;
      if (key === "ArrowRight") nextIndex = (currentIndex + 1) % VARIANT_IDS.length;
      if (key === "ArrowLeft") nextIndex = (currentIndex - 1 + VARIANT_IDS.length) % VARIANT_IDS.length;
      if (key === "Home") nextIndex = 0;
      if (key === "End") nextIndex = VARIANT_IDS.length - 1;
      const nextId = VARIANT_IDS[nextIndex];
      onChange(nextId);
      refs.current[nextIndex]?.focus();
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
        const selected = value === id;
        return (
          <button
            key={id}
            ref={(el) => { refs.current[index] = el; }}
            role="radio"
            type="button"
            aria-checked={selected}
            aria-label={v.name}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            data-variant={id}
            className={cn(
              "relative grid place-items-center rounded-full transition-[transform] duration-200",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              "focus-visible:ring-white/40",
              btn,
            )}
          >
            <span
              aria-hidden="true"
              className={cn("block rounded-full", dot)}
              style={{ backgroundColor: v.lensColor }}
            />
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
