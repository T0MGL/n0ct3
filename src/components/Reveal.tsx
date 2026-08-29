import { useCallback, useRef, type CSSProperties, type ElementType, type HTMLAttributes } from "react";
import { observeReveal } from "@/lib/reveal";

/**
 * Desde donde entra. El default sube; el resto existe porque ya habia
 * secciones que entraban de costado o escalando y esa diferencia es
 * intencional: una landing donde las 27 entradas son identicas se lee como
 * plantilla. "fade" es para cuando el elemento no debe moverse (texto sobre
 * una foto, cualquier cosa dentro de un contenedor con overflow oculto).
 */
type RevealFrom = "up" | "left" | "right" | "scale" | "fade";

interface RevealProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  from?: RevealFrom;
  /** Retraso en ms. Para escalonar hermanos: 60 a 80ms entre items, no mas. */
  delay?: number;
  /** Se dispara una vez, cuando el elemento entra. Para secciones que ademas
   *  de aparecer arrancan algo propio (una curva que se dibuja, un contador). */
  onReveal?: () => void;
}

type RevealStyle = CSSProperties & { "--reveal-delay"?: string };

export const Reveal = ({
  as: Tag = "div",
  from = "up",
  delay = 0,
  className,
  style,
  children,
  onReveal,
  ...rest
}: RevealProps) => {
  // El cleanup vive en un ref porque un callback ref de React 18 no puede
  // devolver la funcion de limpieza (eso llega recien en React 19).
  const cleanup = useRef<(() => void) | null>(null);

  // Por ref para que el callback ref no dependa de la identidad de onReveal:
  // si dependiera, cada render con una arrow function nueva desregistraria y
  // volveria a registrar el nodo, y el reveal se dispararia de nuevo.
  const onRevealRef = useRef(onReveal);
  onRevealRef.current = onReveal;

  const setNode = useCallback((node: HTMLElement | null) => {
    cleanup.current?.();
    cleanup.current = node ? observeReveal(node, () => onRevealRef.current?.()) : null;
  }, []);

  const revealStyle: RevealStyle | undefined = delay
    ? { ...style, "--reveal-delay": `${delay}ms` }
    : style;

  return (
    <Tag ref={setNode} data-reveal={from} className={className} style={revealStyle} {...rest}>
      {children}
    </Tag>
  );
};

export default Reveal;
