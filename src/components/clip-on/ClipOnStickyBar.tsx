import { useEffect, useState, type RefObject } from "react";
import { CLIP_ON } from "@/lib/order";
import { formatPrice } from "@/lib/stripe";
import { cn } from "@/lib/utils";

interface ClipOnStickyBarProps {
  onBuyClick: () => void;
  /** El boton del hero ya salio por arriba. Lo calcula la pagina, que tambien lo usa el header. */
  heroPassed: boolean;
  closingRef: RefObject<HTMLElement>;
}

/**
 * Barra de compra fija de mobile y tablet, igual que la de /sleep-mask: en
 * desktop el boton vive en el header. Aparece pasado el hero y se va mientras
 * el cierre esta en pantalla. Observers, nada corre por frame.
 */
export const ClipOnStickyBar = ({ onBuyClick, heroPassed, closingRef }: ClipOnStickyBarProps) => {
  const [closingInView, setClosingInView] = useState(false);

  useEffect(() => {
    const closing = closingRef.current;
    if (!closing) return;
    const observer = new IntersectionObserver(([entry]) => setClosingInView(entry.isIntersecting));
    observer.observe(closing);
    return () => observer.disconnect();
  }, [closingRef]);

  const visible = heroPassed && !closingInView;

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
          <p className="truncate text-[13px] text-white/60">{CLIP_ON.name}</p>
          <p className="text-lg font-bold leading-tight tabular-nums text-white">{formatPrice(CLIP_ON.price, "pyg")}</p>
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
