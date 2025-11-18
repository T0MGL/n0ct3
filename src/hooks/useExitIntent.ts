import { useEffect, useRef } from "react";

interface UseExitIntentOptions {
  onExitIntent: () => void;
  enabled?: boolean;
  sensitivity?: number;
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
  sensitivity = 50,
}: UseExitIntentOptions) => {
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      hasTriggeredRef.current = false;
      return;
    }

    const handleMouseLeave = (e: MouseEvent) => {
      // Only trigger if mouse is leaving from the top of the page
      // (typical behavior when going to browser controls)
      if (
        !hasTriggeredRef.current &&
        e.clientY <= sensitivity &&
        e.relatedTarget === null
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
