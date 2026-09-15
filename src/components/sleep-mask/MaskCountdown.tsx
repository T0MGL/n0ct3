import { useCountdown } from "@/hooks/useCountdown";
import { cn } from "@/lib/utils";

const pad = (value: number) => String(value).padStart(2, "0");

const unit = (value: number, singular: string, plural: string) => `${value} ${value === 1 ? singular : plural}`;

/**
 * El mismo reloj de la landing de lentes (useCountdown, misma clave), en una
 * sola linea para no empujar el boton de compra fuera de la primera pantalla.
 * Solo pantalla: el precio del pack no depende de que llegue a cero.
 */
export const MaskCountdown = ({ className }: { className?: string }) => {
  const { hours, minutes, seconds, ready } = useCountdown();
  return (
    <p
      role="timer"
      aria-label={`La oferta termina en ${unit(hours, "hora", "horas")}, ${unit(minutes, "minuto", "minutos")} y ${unit(seconds, "segundo", "segundos")}`}
      className={cn("flex items-baseline gap-2 text-[13px] text-white/65", className)}
    >
      <span>La oferta termina en</span>
      {/* Hasta la primera lectura el hueco queda reservado e invisible: el
          00:00:00 de relleno se leeria como una oferta ya vencida. */}
      <span
        aria-hidden="true"
        className={cn("font-semibold tracking-[0.02em] text-white tabular-nums", !ready && "invisible")}
      >
        {pad(hours)}:{pad(minutes)}:{pad(seconds)}
      </span>
    </p>
  );
};
