import { useState, useEffect, useRef, memo } from "react";

interface TimeLeft {
  hours: number;
  minutes: number;
  seconds: number;
}

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
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ hours: 0, minutes: 0, seconds: 0 });
  const targetDateRef = useRef<Date | null>(null);

  useEffect(() => {
    const STORAGE_KEY = 'nocte-countdown-target';

    // Get or create target date
    const getTargetDate = (): Date => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const storedDate = new Date(stored);
          if (storedDate.getTime() > Date.now()) {
            return storedDate;
          }
        }
      } catch {
        // localStorage unavailable
      }

      // Create new target date 24 hours from now
      const newTarget = new Date();
      newTarget.setHours(newTarget.getHours() + 24);
      try {
        localStorage.setItem(STORAGE_KEY, newTarget.toISOString());
      } catch {
        // localStorage unavailable
      }
      return newTarget;
    };

    targetDateRef.current = getTargetDate();

    const updateTimer = () => {
      if (!targetDateRef.current) return;

      const now = Date.now();
      let distance = targetDateRef.current.getTime() - now;

      if (distance < 0) {
        // Reset to 24 hours when countdown ends
        targetDateRef.current = new Date();
        targetDateRef.current.setHours(targetDateRef.current.getHours() + 24);
        try {
          localStorage.setItem(STORAGE_KEY, targetDateRef.current.toISOString());
        } catch {
          // localStorage unavailable
        }
        distance = targetDateRef.current.getTime() - Date.now();
      }

      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft(prev => {
        // Only update if values changed to prevent unnecessary re-renders
        if (prev.hours === hours && prev.minutes === minutes && prev.seconds === seconds) {
          return prev;
        }
        return { hours, minutes, seconds };
      });
    };

    // Initial update
    updateTimer();

    const timer = setInterval(updateTimer, 1000);

    return () => clearInterval(timer);
  }, []);

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
