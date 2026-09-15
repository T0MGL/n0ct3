import { memo } from "react";
import { useCountdown } from "@/hooks/useCountdown";

// Cada unidad es una ficha, no un numero suelto entre dos puntos: asi el
// contador se lee como un reloj y no como un rectangulo con texto adentro.
// `live` es solo para los segundos, que son los unicos que se mueven a la vista.
const TimerCell = memo(({ value, label, live }: { value: string; label: string; live?: boolean }) => (
  <div className="flex flex-col items-center gap-1">
    <span className="grid min-w-[38px] place-items-center rounded-md bg-black/50 px-1.5 py-1 text-lg font-bold leading-none tabular-nums text-variant-active ring-1 ring-inset ring-white/10 sm:min-w-[42px] sm:text-xl md:text-2xl">
      <span key={live ? value : undefined} className={live ? "nocte-tick" : undefined}>
        {value}
      </span>
    </span>
    <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/70">
      {label}
    </span>
  </div>
));
TimerCell.displayName = 'TimerCell';

const Colon = () => (
  <span aria-hidden="true" className="nocte-colon px-0.5 text-lg font-bold leading-none text-variant-active sm:text-xl">
    :
  </span>
);

export const CountdownTimer = memo(() => {
  const timeLeft = useCountdown();

  const formatNumber = (num: number) => String(num).padStart(2, '0');

  const label = `Oferta termina en ${formatNumber(timeLeft.hours)} horas ${formatNumber(timeLeft.minutes)} minutos ${formatNumber(timeLeft.seconds)} segundos`;

  return (
    <div
      role="timer"
      aria-label={label}
      className="inline-flex w-auto items-center gap-3 rounded-xl border border-variant-active/25 bg-variant-active/[0.07] px-4 py-2.5 backdrop-blur-sm sm:gap-4 sm:px-5"
    >
      <span className="max-w-[104px] text-[10px] font-semibold uppercase leading-tight tracking-[0.14em] text-white sm:max-w-none sm:text-[11px]">
        Oferta termina en
      </span>
      <div aria-hidden="true" className="flex items-start gap-1">
        <TimerCell value={formatNumber(timeLeft.hours)} label="Hs" />
        <Colon />
        <TimerCell value={formatNumber(timeLeft.minutes)} label="Min" />
        <Colon />
        <TimerCell value={formatNumber(timeLeft.seconds)} label="Seg" live />
      </div>
    </div>
  );
});

CountdownTimer.displayName = 'CountdownTimer';
