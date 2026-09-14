import { useCountdown } from "@/hooks/useCountdown";
import { cn } from "@/lib/utils";

const pad = (value: number) => String(value).padStart(2, "0");

/**
 * El mismo reloj de la landing de lentes (useCountdown, misma clave), en una
 * sola linea para no empujar el boton de compra fuera de la primera pantalla.
 * Solo pantalla: el precio del pack no depende de que llegue a cero.
 */
export const MaskCountdown = ({ className }: { className?: string }) => {
  const { hours, minutes, seconds } = useCountdown();
  return (
    <p
      role="timer"
      aria-label={`La oferta termina en ${hours} horas, ${minutes} minutos y ${seconds} segundos`}
      className={cn("flex items-baseline gap-2 text-[13px] text-white/65", className)}
    >
      <span>La oferta termina en</span>
      <span aria-hidden="true" className="font-semibold tracking-[0.02em] text-white tabular-nums">
        {pad(hours)}:{pad(minutes)}:{pad(seconds)}
      </span>
    </p>
  );
};
