import { useEffect, useState, type RefObject } from "react";

/**
 * true cuando el elemento ya salio de la pantalla por arriba. Un
 * IntersectionObserver y no un listener de scroll: solo corre al cruzar el
 * borde. Un elemento que todavia esta abajo (la pagina cargo con scroll
 * restaurado mas arriba) no cuenta como pasado.
 */
export const useScrolledPast = (ref: RefObject<HTMLElement>): boolean => {
  const [past, setPast] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => {
      setPast(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref]);

  return past;
};
