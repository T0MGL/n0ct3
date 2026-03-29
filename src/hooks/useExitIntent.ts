import { useEffect, useRef } from "react";

interface UseExitIntentOptions {
  onExitIntent: () => void;
  enabled?: boolean;
  sensitivity?: number;
  delay?: number;
}

export const useExitIntent = ({
  onExitIntent,
  enabled = true,
  sensitivity = 10,
  delay = 2000,
}: UseExitIntentOptions) => {
  const hasTriggeredRef = useRef(false);
  const enabledTimeRef = useRef<number>(0);
  const mousePositionsRef = useRef<Array<{ y: number; t: number }>>([]);

  useEffect(() => {
    if (!enabled) {
      hasTriggeredRef.current = false;
      enabledTimeRef.current = 0;
      mousePositionsRef.current = [];
      return;
    }

    enabledTimeRef.current = Date.now();

    const handleMouseMove = (e: MouseEvent) => {
      const positions = mousePositionsRef.current;
      positions.push({ y: e.clientY, t: Date.now() });
      if (positions.length > 5) positions.shift();
    };

    const handleMouseLeave = (e: MouseEvent) => {
      const timeElapsed = Date.now() - enabledTimeRef.current;

      if (hasTriggeredRef.current || timeElapsed < delay) return;
      if (e.clientY > sensitivity) return;

      const positions = mousePositionsRef.current;
      if (positions.length >= 2) {
        const recent = positions[positions.length - 1];
        const earlier = positions[Math.max(0, positions.length - 3)];
        const deltaY = recent.y - earlier.y;
        const deltaT = recent.t - earlier.t;
        if (deltaT === 0 || deltaY >= 0) return;
        const velocity = Math.abs(deltaY / deltaT);
        if (velocity < 0.3) return;
      }

      hasTriggeredRef.current = true;
      onExitIntent();
    };

    document.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.documentElement.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [enabled, onExitIntent, sensitivity, delay]);

  useEffect(() => {
    if (!enabled) {
      hasTriggeredRef.current = false;
    }
  }, [enabled]);
};
