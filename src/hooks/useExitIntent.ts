import { useEffect } from "react";

interface UseExitIntentOptions {
  onExitIntent: () => void;
  enabled?: boolean;
}

/**
 * Back-button exit intent.
 *
 * While `enabled`, pushes a sentinel history entry. If the user presses the
 * browser back button (desktop or mobile), the sentinel pops and we fire
 * `onExitIntent` while re-pushing the sentinel so the page stays mounted.
 *
 * Does NOT fire on tab switches, window changes, or mouse movements toward
 * the browser chrome. Only on explicit navigation away.
 */
export const useExitIntent = ({
  onExitIntent,
  enabled = true,
}: UseExitIntentOptions) => {
  useEffect(() => {
    if (!enabled) return;

    const marker = `nocte-exit-${Date.now()}-${Math.random()}`;
    let didTrigger = false;

    window.history.pushState({ __exitIntent: marker }, "");

    const onPop = () => {
      if (didTrigger) return;
      didTrigger = true;
      window.history.pushState({ __exitIntent: marker }, "");
      onExitIntent();
    };

    window.addEventListener("popstate", onPop);

    return () => {
      window.removeEventListener("popstate", onPop);
      if (!didTrigger && (window.history.state as { __exitIntent?: string } | null)?.__exitIntent === marker) {
        window.history.back();
      }
    };
  }, [enabled, onExitIntent]);
};
