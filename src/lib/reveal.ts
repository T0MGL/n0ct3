/**
 * Un IntersectionObserver para toda la landing.
 *
 * Antes cada seccion traia su propio whileInView de Framer Motion: un observer
 * por elemento y, peor, la animacion corriendo en un rAF del main thread justo
 * cuando ese main thread esta ejecutando el chunk lazy de la seccion. El
 * resultado eran frames perdidos en cada entrada.
 *
 * Aca el observer solo agrega una clase. La transition la define el CSS y la
 * corre el compositor, asi que la entrada se mantiene fluida aunque el JS este
 * ocupado. El observer es un singleton a nivel de modulo porque las secciones
 * montan tarde (lazy + Suspense) y cada elemento se registra al montarse, en
 * lugar de barrer el DOM una sola vez al arranque.
 */

const REVEALED_CLASS = "is-revealed";

// -6% abajo: el elemento revela cuando ya entro de verdad, no cuando asoma un
// pixel. threshold bajo para que las secciones altas (mas que el viewport)
// tambien disparen, porque nunca van a alcanzar un ratio alto.
const OPTIONS: IntersectionObserverInit = {
  threshold: 0.12,
  rootMargin: "0px 0px -6% 0px",
};

let observer: IntersectionObserver | null = null;

// Secciones que ademas de revelar disparan algo al entrar (el morph del
// espectro arranca su curva ahi). WeakMap para que el nodo desmontado se
// libere solo.
const onRevealCallbacks = new WeakMap<Element, () => void>();

const getObserver = (): IntersectionObserver | null => {
  if (typeof IntersectionObserver === "undefined") return null;
  if (observer) return observer;

  observer = new IntersectionObserver((entries, self) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add(REVEALED_CLASS);
      self.unobserve(entry.target);

      const onReveal = onRevealCallbacks.get(entry.target);
      if (onReveal) {
        onRevealCallbacks.delete(entry.target);
        onReveal();
      }
    }
  }, OPTIONS);

  return observer;
};

/**
 * Registra un elemento para que revele al entrar en viewport. Devuelve la
 * funcion de limpieza. Sin IntersectionObserver el elemento queda visible de
 * entrada, que es el fallback correcto: nunca contenido invisible.
 */
export const observeReveal = (node: Element, onReveal?: () => void): (() => void) => {
  const io = getObserver();
  if (!io) {
    node.classList.add(REVEALED_CLASS);
    onReveal?.();
    return () => undefined;
  }

  if (onReveal) onRevealCallbacks.set(node, onReveal);
  io.observe(node);

  return () => {
    onRevealCallbacks.delete(node);
    io.unobserve(node);
  };
};
