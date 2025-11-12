import { useState, useEffect } from "react";

interface TimeLeft {
  hours: number;
  minutes: number;
  seconds: number;
}

export const CountdownTimer = () => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    // Set target date to 24 hours from now
    const targetDate = new Date();
    targetDate.setHours(targetDate.getHours() + 24);

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;

      if (distance < 0) {
        clearInterval(timer);
        // Reset to 24 hours when countdown ends
        targetDate.setHours(targetDate.getHours() + 24);
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
