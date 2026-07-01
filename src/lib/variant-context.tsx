import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { DEFAULT_VARIANT, isVariantId, resolveSelectableVariant, type VariantId } from "@/lib/variants";

interface VariantContextValue {
  activeVariant: VariantId;
  setActiveVariant: (next: VariantId) => void;
}

const VariantContext = createContext<VariantContextValue | null>(null);

interface VariantProviderProps {
  children: ReactNode;
  initial?: VariantId;
}

// Single source of truth for the active lens variant. The provider mirrors the
// active id onto <html data-variant="..."> so every CSS rule that reads
// --variant-active picks up the change without prop drilling. Components that
// need the typed value pull it via useActiveVariant().
export const VariantProvider = ({ children, initial }: VariantProviderProps) => {
  const [activeVariant, setActiveVariantState] = useState<VariantId>(() => {
    if (initial && isVariantId(initial)) return resolveSelectableVariant(initial);
    return DEFAULT_VARIANT;
  });

  useEffect(() => {
    const root = document.documentElement;
    const previous = root.getAttribute("data-variant");
    root.setAttribute("data-variant", activeVariant);
    return () => {
      if (previous) {
        root.setAttribute("data-variant", previous);
      } else {
        root.removeAttribute("data-variant");
      }
    };
  }, [activeVariant]);

  const setActiveVariant = useCallback((next: VariantId) => {
    const sellable = resolveSelectableVariant(next);
    setActiveVariantState((current) => (current === sellable ? current : sellable));
  }, []);

  const value = useMemo<VariantContextValue>(
    () => ({ activeVariant, setActiveVariant }),
    [activeVariant, setActiveVariant],
  );

  return <VariantContext.Provider value={value}>{children}</VariantContext.Provider>;
};

export const useActiveVariant = (): VariantContextValue => {
  const ctx = useContext(VariantContext);
  if (!ctx) {
    throw new Error("useActiveVariant must be used inside <VariantProvider>");
  }
  return ctx;
};
