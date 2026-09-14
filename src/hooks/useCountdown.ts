import { useEffect, useState } from "react";

export interface TimeLeft {
  hours: number;
  minutes: number;
  seconds: number;
  /** false hasta la primera lectura del reloj: antes marca 00:00:00 de relleno. */
  ready: boolean;
}

// Un solo reloj para todo el sitio: el visitante que pasa de / a /sleep-mask ve
// la misma cuenta. 24 horas rodantes guardadas en el navegador; al vencer
// arranca otra vuelta.
const STORAGE_KEY = "nocte-countdown-target";
const DAY_MS = 24 * 60 * 60 * 1000;

const newTarget = (): Date => {
  const target = new Date(Date.now() + DAY_MS);
  try {
    localStorage.setItem(STORAGE_KEY, target.toISOString());
  } catch {
    // localStorage no disponible (navegacion privada): la cuenta vive solo en memoria.
  }
  return target;
};

const readTarget = (): Date => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const date = new Date(stored);
      if (date.getTime() > Date.now()) return date;
    }
  } catch {
    // localStorage no disponible
  }
  return newTarget();
};

/**
 * Cuenta regresiva de la oferta. Es solo pantalla: nada del checkout, del
 * pedido ni del backend la lee, y que llegue a cero no cierra ninguna venta.
 */
export const useCountdown = (): TimeLeft => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ hours: 0, minutes: 0, seconds: 0, ready: false });

  useEffect(() => {
    let target = readTarget();

    const update = () => {
      let distance = target.getTime() - Date.now();
      if (distance < 0) {
        target = newTarget();
        distance = target.getTime() - Date.now();
      }

      const hours = Math.floor((distance % DAY_MS) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft((prev) =>
        prev.ready && prev.hours === hours && prev.minutes === minutes && prev.seconds === seconds
          ? prev
          : { hours, minutes, seconds, ready: true },
      );
    };

    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  return timeLeft;
};
