import { useCallback, useEffect, useRef, useState } from "react";

// Transient tap feedback for sold-out colors. Tapping a gated variant flips
// `visible` on, then it clears itself after `durationMs`. Tapping again while
// still visible resets the timer instead of stacking a second one, and any
// pending timer is cleared on unmount so it never fires against a dead node.
export function useSoldOutFeedback(durationMs = 1800) {
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = useCallback(() => {
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const show = useCallback(() => {
    clear();
    setVisible(true);
    timer.current = setTimeout(() => {
      setVisible(false);
      timer.current = null;
    }, durationMs);
  }, [clear, durationMs]);

  useEffect(() => clear, [clear]);

  return { visible, show };
}
