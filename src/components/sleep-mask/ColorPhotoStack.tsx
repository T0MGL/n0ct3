import { useCallback, useState } from "react";
import type { ColorPhotos } from "@/components/sleep-mask/photos";
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
 * Solo se monta la foto de un color cuando ese color se pide, y una que nunca
 * llego a cargar se desmonta si el color cambia: la carga inicial baja una
 * sola, y una seccion lazy que todavia no se vio no baja el color viejo. Las fotos quedan apiladas en el mismo cuadro (el alto lo
 * reserva el contenedor), y la nueva recien toma opacidad 1 cuando ya cargo:
 * mientras baja se sigue viendo la anterior, nunca un hueco. El cruce es solo
 * opacidad y con movimiento reducido es directo.
 *
 * La visibilidad no depende de ningun observer: la seccion puede haber
 * revelado hace rato o no haber llegado todavia, el color se aplica igual.
 */
export const ColorPhotoStack = ({ color, photos, sizes, priority = false, className, imgClassName }: ColorPhotoStackProps) => {
  const [mounted, setMounted] = useState<MaskColorId[]>([color]);
  const [loaded, setLoaded] = useState<ReadonlySet<MaskColorId>>(() => new Set());
  const [lastShown, setLastShown] = useState<MaskColorId>(color);

  // Ajuste de estado durante el render por cambio de prop: evita un frame con
  // el color nuevo sin montar que haria un efecto.
  if (!mounted.includes(color)) setMounted([...mounted, color]);

  const shown = loaded.has(color) || !loaded.has(lastShown) ? color : lastShown;
  if (shown !== lastShown) setLastShown(shown);

  const markLoaded = useCallback((id: MaskColorId) => {
    setLoaded((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
  }, []);

  const rendered = mounted.filter((id) => id === color || loaded.has(id));

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {rendered.map((id) => (
        <img
          key={id}
          ref={(node) => {
            // Una foto que ya estaba en cache puede terminar antes de que React
            // escuche su load.
            if (node?.complete && node.naturalWidth > 0) markLoaded(id);
          }}
          src={photos[id].src}
          srcSet={photos[id].srcSet}
          sizes={sizes}
          alt={photos[id].alt}
          aria-hidden={id === shown ? undefined : true}
          decoding="async"
          onLoad={() => markLoaded(id)}
          // React 18 no reconoce fetchPriority en camelCase, por eso va crudo.
          {...(priority && id === mounted[0] ? { fetchpriority: "high" } : priority ? {} : { loading: "lazy" as const })}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity [transition-duration:250ms] ease-out motion-reduce:transition-none",
            id === shown ? "opacity-100" : "opacity-0",
            imgClassName,
          )}
        />
      ))}
    </div>
  );
};
