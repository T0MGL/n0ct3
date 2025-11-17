import { useState, useEffect } from "react";

interface TimeLeft {
  hours: number;
  minutes: number;
  seconds: number;
}

export const CountdownTimer = () => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const STORAGE_KEY = 'nocte-countdown-target';

    // Get or create target date
    const getTargetDate = (): Date => {
      const stored = sessionStorage.getItem(STORAGE_KEY);

      if (stored) {
        const storedDate = new Date(stored);
        // If stored date is in the future, use it
        if (storedDate.getTime() > Date.now()) {
          return storedDate;
        }
      }

      // Create new target date 24 hours from now
      const newTarget = new Date();
      newTarget.setHours(newTarget.getHours() + 24);
      sessionStorage.setItem(STORAGE_KEY, newTarget.toISOString());
      return newTarget;
    };

    let targetDate = getTargetDate();

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;

      if (distance < 0) {
        // Reset to 24 hours when countdown ends
        targetDate = new Date();
        targetDate.setHours(targetDate.getHours() + 24);
        sessionStorage.setItem(STORAGE_KEY, targetDate.toISOString());
      }

      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatNumber = (num: number) => String(num).padStart(2, '0');

  return (
    <div className="inline-flex flex-col sm:flex-row items-center gap-2 sm:gap-3 bg-primary/10 border border-primary/30 px-4 sm:px-5 py-3 backdrop-blur-sm w-full sm:w-auto">
      <span className="text-[10px] sm:text-xs text-foreground/70 font-medium uppercase tracking-wider">
        Oferta termina en
      </span>
      <div className="flex items-center gap-1">
        <div className="flex flex-col items-center min-w-[32px] sm:min-w-[36px]">
          <span className="text-lg sm:text-xl md:text-2xl font-bold text-primary tabular-nums">
            {formatNumber(timeLeft.hours)}
          </span>
        </div>
        <span className="text-primary/50 font-bold text-base sm:text-lg">:</span>
        <div className="flex flex-col items-center min-w-[32px] sm:min-w-[36px]">
          <span className="text-lg sm:text-xl md:text-2xl font-bold text-primary tabular-nums">
            {formatNumber(timeLeft.minutes)}
          </span>
        </div>
        <span className="text-primary/50 font-bold text-base sm:text-lg">:</span>
        <div className="flex flex-col items-center min-w-[32px] sm:min-w-[36px]">
          <span className="text-lg sm:text-xl md:text-2xl font-bold text-primary tabular-nums">
            {formatNumber(timeLeft.seconds)}
          </span>
        </div>
      </div>
    </div>
  );
};
