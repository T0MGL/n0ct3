import { useEffect, useRef } from "react";

interface UseExitIntentOptions {
  onExitIntent: () => void;
  enabled?: boolean;
  sensitivity?: number;
  delay?: number;
}

/**
 * Custom hook to detect exit intent behavior
 * Triggers when user tries to leave the page via:
 * - Mouse moving to top of viewport (to close tab/navigate)
 * - Browser back button
 * - Attempting to close the page
 */
export const useExitIntent = ({
  onExitIntent,
  enabled = true,
  sensitivity = 20,
  delay = 2000,
}: UseExitIntentOptions) => {
  const hasTriggeredRef = useRef(false);
  const enabledTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) {
      hasTriggeredRef.current = false;
      enabledTimeRef.current = 0;
      return;
    }

    // Track when the hook was enabled to add delay before triggering
    enabledTimeRef.current = Date.now();

    const handleMouseLeave = (e: MouseEvent) => {
      // Only trigger if mouse is leaving from the top of the page
      // (typical behavior when going to browser controls)
      // Also require minimum time elapsed to prevent accidental triggers
      const timeElapsed = Date.now() - enabledTimeRef.current;
      if (
        !hasTriggeredRef.current &&
        e.clientY <= sensitivity &&
        e.relatedTarget === null &&
        timeElapsed >= delay
      ) {
        hasTriggeredRef.current = true;
        onExitIntent();
      }
    };

    // Listen for mouse movements near the top of the viewport
    document.addEventListener("mouseout", handleMouseLeave);

    return () => {
      document.removeEventListener("mouseout", handleMouseLeave);
    };
  }, [enabled, onExitIntent, sensitivity]);

  // Reset trigger when enabled state changes
  useEffect(() => {
    if (!enabled) {
      hasTriggeredRef.current = false;
    }
  }, [enabled]);
};
