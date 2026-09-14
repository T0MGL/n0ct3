import { useEffect, useState, type RefObject } from "react";
import { ALL_MASK_COLORS_SOLD_OUT, MASK_COLORS, type MaskColorId } from "@/lib/mask-colors";
import { SLEEP_MASK_SOLO_PRICE } from "@/lib/order";
import { cn } from "@/lib/utils";

interface MaskStickyBarProps {
  color: MaskColorId;
  onBuyClick: () => void;
  /** El boton del hero ya salio por arriba. Lo calcula la pagina, que tambien lo usa el header. */
  heroPassed: boolean;
  closingRef: RefObject<HTMLElement>;
}

/**
 * Barra de compra fija, mobile y tablet (en desktop el boton va en el header). Aparece cuando el boton del hero ya quedo
 * arriba y se va mientras el cierre, que tiene su propio boton, esta en
 * pantalla. Observers y no un listener de scroll: nada corre por frame.
 */
export const MaskStickyBar = ({ color, onBuyClick, heroPassed, closingRef }: MaskStickyBarProps) => {
  const [closingInView, setClosingInView] = useState(false);

  useEffect(() => {
    const closing = closingRef.current;
    if (!closing) return;
    const observer = new IntersectionObserver(([entry]) => setClosingInView(entry.isIntersecting));
    observer.observe(closing);
    return () => observer.disconnect();
  }, [closingRef]);

  const visible = heroPassed && !closingInView && !ALL_MASK_COLORS_SOLD_OUT;

  return (
    <div
      aria-hidden={visible ? undefined : true}
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-black/90 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl lg:hidden",
        "transition-[transform,opacity] duration-300 ease-out motion-reduce:transition-none",
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0",
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-[13px] text-white/60">Antifaz 3D {MASK_COLORS[color].name}</p>
          <p className="text-lg font-bold leading-tight tabular-nums text-white">
            {SLEEP_MASK_SOLO_PRICE.toLocaleString("es-PY")} Gs
          </p>
        </div>
        <button
          type="button"
          onClick={onBuyClick}
          tabIndex={visible ? undefined : -1}
          className="sleep-mask-cta sleep-mask-cta--compact"
        >
          Comprar ahora
        </button>
      </div>
    </div>
  );
};
