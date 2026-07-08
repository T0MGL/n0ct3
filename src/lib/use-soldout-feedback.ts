import { useCallback, useEffect, useRef, useState } from "react";

// Transient tap feedback for sold-out colors. Tapping a gated variant stores
// its id in `shownId`, then it clears itself after `durationMs`. Tracking the
// id (not a bare boolean) keeps the badge scoped to the tapped swatch when more
// than one color is sold out. Tapping again resets the timer instead of
// stacking a second one, and any pending timer is cleared on unmount so it
// never fires against a dead node.
export function useSoldOutFeedback(durationMs = 1800) {
  const [shownId, setShownId] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = useCallback(() => {
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const show = useCallback(
    (id: string) => {
      clear();
      setShownId(id);
      timer.current = setTimeout(() => {
        setShownId(null);
        timer.current = null;
      }, durationMs);
    },
    [clear, durationMs],
  );

  useEffect(() => clear, [clear]);

  return { shownId, show };
}
