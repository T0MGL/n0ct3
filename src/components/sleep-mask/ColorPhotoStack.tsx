import { useCallback, useState } from "react";
import type { ColorPhotos } from "@/components/sleep-mask/photos";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { MaskColorId } from "@/lib/mask-colors";
import { cn } from "@/lib/utils";

interface ColorPhotoStackProps {
  color: MaskColorId;
  photos: ColorPhotos;
  sizes: string;
  /** Hero: la primera foto es el LCP y las siguientes se piden al tocar un color. */
  priority?: boolean;
  className?: string;
  imgClassName?: string;
}

/**
 * La foto del antifaz en el color activo, con cruce entre colores.
 *
 * Una foto se monta recien cuando su color se pide, y la que nunca cargo se
 * desmonta si el color cambia: la carga inicial baja un solo color.
 *
 * El cruce apila: la foto que sale queda abajo a opacidad 1 y la nueva entra
 * arriba con una animacion de 0 a 1. Con transiciones cruzadas el negro de la
 * pagina se asomaba a mitad de camino, y una foto en cache aparecia de golpe
 * porque su estado inicial nunca llegaba a pintarse; una animacion arranca
 * igual. La nueva entra recien cuando cargo, asi nunca se ve un hueco. Si no
 * carga, se deja el cuadro vacio antes que mostrar un color que no se compro.
 */
export const ColorPhotoStack = ({ color, photos, sizes, priority = false, className, imgClassName }: ColorPhotoStackProps) => {
  const reduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState<MaskColorId[]>([color]);
  const [loaded, setLoaded] = useState<ReadonlySet<MaskColorId>>(() => new Set());
  const [failed, setFailed] = useState<ReadonlySet<MaskColorId>>(() => new Set());
  const [front, setFront] = useState<MaskColorId>(color);
  const [back, setBack] = useState<MaskColorId | null>(null);

  // Ajustes de estado durante el render por cambio de prop (sin efecto, sin
  // un frame intermedio con el color nuevo sin montar).
  if (!mounted.includes(color)) setMounted([...mounted, color]);

  const colorReady = loaded.has(color) || failed.has(color);
  if (colorReady && front !== color) {
    const canCrossfade = !reduceMotion && loaded.has(front) && !failed.has(color);
    setBack(canCrossfade ? front : null);
    setFront(color);
  }

  const markLoaded = useCallback((id: MaskColorId) => {
    setLoaded((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
  }, []);
  const markFailed = useCallback((id: MaskColorId) => {
    setFailed((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
  }, []);

  const rendered = mounted.filter((id) => id === color || id === front || id === back);

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {rendered.map((id) => {
        const isFront = id === front;
        const isBack = id === back;
        return (
          <img
            key={id}
            ref={(node) => {
              // Una foto en cache puede terminar antes de que React escuche su load.
              if (node?.complete && node.naturalWidth > 0) markLoaded(id);
            }}
            src={photos[id].src}
            srcSet={photos[id].srcSet}
            sizes={sizes}
            alt={photos[id].alt}
            aria-hidden={isFront ? undefined : true}
            decoding="async"
            onLoad={() => markLoaded(id)}
            onError={() => markFailed(id)}
            onAnimationEnd={isFront ? () => setBack(null) : undefined}
            // React 18 no reconoce fetchPriority en camelCase, por eso va crudo.
            {...(priority && id === mounted[0] ? { fetchpriority: "high" } : priority ? {} : { loading: "lazy" as const })}
            className={cn(
              "absolute inset-0 h-full w-full object-cover",
              isFront && "z-10",
              isFront && back !== null && "sleep-mask-photo-in",
              (isFront && !failed.has(id)) || isBack ? "opacity-100" : "opacity-0",
              imgClassName,
            )}
          />
        );
      })}
    </div>
  );
};
