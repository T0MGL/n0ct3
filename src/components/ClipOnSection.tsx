import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/Reveal";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { CLIP_ON } from "@/lib/order";
import { formatPrice } from "@/lib/stripe";
import { cn } from "@/lib/utils";
import clipOnSobreLentes from "@/assets/clip-on/clip-on-sobre-lentes-recetados.webp";
import clipOnEnUso from "@/assets/clip-on/clip-on-en-uso.webp";
import clipOnProducto from "@/assets/clip-on/clip-on-producto.webp";
import clipOnMecanismo from "@/assets/clip-on/clip-on-mecanismo-clip.webp";
import clipOnPackaging from "@/assets/clip-on/clip-on-packaging.webp";

interface ClipOnSectionProps {
  onBuyClick: () => void;
}

// El orden es el argumento. Primero la foto que explica el producto sin leer
// nada (montado sobre unos lentes recetados), despues como se ve puesto, y el
// detalle queda para el que ya se convencio y quiere mirar de cerca.
const SLIDES = [
  { src: clipOnSobreLentes, alt: "Clip-On NOCTE rojo montado sobre unos lentes recetados de carey" },
  { src: clipOnEnUso, alt: "Persona usando el Clip-On NOCTE sobre sus lentes recetados" },
  { src: clipOnProducto, alt: "Clip-On NOCTE rojo solo, sin lentes debajo" },
  { src: clipOnMecanismo, alt: "Detalle del clip con resorte y almohadillas de goma que lo sujetan a los lentes" },
  { src: clipOnPackaging, alt: "Caja NOCTE, estuche, paño de limpieza y el Clip-On rojo" },
] as const;

const SLIDE_COUNT = SLIDES.length;

/**
 * Mismo patron que la galeria del hero (ProductHero), a proposito: las dos
 * galerias de la landing tienen que sentirse de la misma familia. Scroll-snap
 * nativo, asi la inercia y el snap los pone el sistema operativo.
 *
 * Duplicado y no extraido: el hero queda fuera de este cambio, son solo dos
 * usos, y la galeria del hero tiene requisitos propios (se resetea al cambiar
 * el color, avisa la primera interaccion para mover el badge).
 */
const ClipOnGallery = () => {
  const reduceMotion = useReducedMotion();
  const [slide, setSlide] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = slideRefs.current.indexOf(entry.target as HTMLDivElement);
          if (index !== -1) setSlide(index);
        }
      },
      { root: track, threshold: 0.6 },
    );

    for (const node of slideRefs.current) {
      if (node) observer.observe(node);
    }
    return () => observer.disconnect();
  }, []);

  // Destino de la ultima navegacion. Con dos flechas seguidas el scroll suave
  // de la primera todavia va en camino: calcular desde `slide` o desde la
  // posicion actual daba la misma foto y la segunda flecha no avanzaba.
  // scrollend lo resincroniza cuando el scroll se asienta, sea swipe o no.
  const targetRef = useRef(0);
  // El scrollend de la animacion anterior puede llegar unos milisegundos
  // DESPUES del scrollTo nuevo, con la posicion vieja, y pisar el destino: la
  // flecha siguiente salia de ahi y se perdia. Se recuerda la foto donde el
  // track estaba asentado al pedir el destino nuevo, y un scrollend que
  // aterrice justo ahi mientras el destino ya es otro se ignora.
  const staleRef = useRef(-1);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const sync = () => {
      const settled = Math.round(track.scrollLeft / track.clientWidth);
      const isStale = settled === staleRef.current && settled !== targetRef.current;
      staleRef.current = -1;
      if (!isStale) targetRef.current = settled;
    };
    track.addEventListener("scrollend", sync);
    return () => track.removeEventListener("scrollend", sync);
  }, []);

  const scrollToSlide = (next: number) => {
    const track = trackRef.current;
    if (!track) return;
    const clamped = Math.max(0, Math.min(SLIDE_COUNT - 1, next));
    const current = Math.round(track.scrollLeft / track.clientWidth);
    const isSettled = Math.abs(track.scrollLeft - current * track.clientWidth) < 1;
    staleRef.current = isSettled ? current : -1;
    targetRef.current = clamped;
    track.scrollTo({
      left: clamped * track.clientWidth,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const track = event.currentTarget;
    // Sin scrollend (Safari viejo) el destino no se entera de un swipe, asi
    // que ahi manda la posicion real.
    const base =
      "onscrollend" in window ? targetRef.current : Math.round(track.scrollLeft / track.clientWidth);
    scrollToSlide(base + (event.key === "ArrowRight" ? 1 : -1));
  };

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[560px] overflow-hidden rounded-2xl bg-black/40 ring-1 ring-white/5">
      {/* Sin touch-action pan-x como en el hero: por spec deshabilita el paneo
          vertical que arranca sobre el elemento (medido, la pagina no baja), y
          cualquier valor sin pinch-zoom bloquea el zoom sobre la foto del
          mecanismo. manipulation deja los dos y solo apaga el zoom por doble tap. */}
      <div
        ref={trackRef}
        role="group"
        aria-roledescription="carousel"
        aria-label="Fotos del Clip-On"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className="peer flex h-full w-full touch-manipulation snap-x snap-mandatory overflow-x-auto overflow-y-hidden outline-none motion-safe:scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {SLIDES.map((item, index) => (
          <div
            key={item.src}
            ref={(node) => {
              slideRefs.current[index] = node;
            }}
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} de ${SLIDE_COUNT}`}
            // snap-always: sin esto un flick rapido salta dos fotos, y aca
            // cada foto es un argumento en orden.
            className="relative h-full w-full shrink-0 snap-start snap-always bg-neutral-100"
          >
            {/* Lazy tambien la primera: la seccion esta a unas diez pantallas
                del hero y eager la bajaria en la carga inicial, compitiendo con
                el LCP. El lazy nativo la trae antes de que el cliente llegue. */}
            <img
              src={item.src}
              alt={item.alt}
              width={1200}
              height={1200}
              loading="lazy"
              decoding="async"
              draggable={false}
              className="h-full w-full object-cover"
            />
          </div>
        ))}
      </div>

      {/* El foco del track va en una capa por encima: un ring sobre el propio
          scroller se pinta debajo de las fotos, que son opacas, y no se ve. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 rounded-2xl peer-focus-visible:ring-2 peer-focus-visible:ring-inset peer-focus-visible:ring-primary"
      />

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {`Imagen ${slide + 1} de ${SLIDE_COUNT}`}
      </p>

      {/* Los puntos del hero, sobre una capsula oscura: aca las fotos son de
          fondo blanco y los puntos blancos sueltos desaparecen. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-3 z-20 flex justify-center">
        <div className="flex items-center rounded-full bg-black/55 px-1 py-0.5 backdrop-blur-md">
          {SLIDES.map((item, index) => {
            const isActive = index === slide;
            return (
              <button
                key={item.src}
                type="button"
                onClick={() => scrollToSlide(index)}
                aria-label={`Ir a la imagen ${index + 1} de ${SLIDE_COUNT}`}
                aria-current={isActive ? "true" : undefined}
                className="pointer-events-auto flex h-7 items-center rounded-full px-2 outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <span
                  className={cn(
                    "block h-2 rounded-full transition-[width,background-color] duration-200 ease-out motion-reduce:transition-none",
                    isActive ? "w-6 bg-white" : "w-2 bg-white/45",
                  )}
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/**
 * La objecion de la receta, contestada.
 *
 * Va despues del segundo CTA y antes del FAQ a proposito. Arriba
 * interceptaria gente que ya venia a comprar lentes, que rinde mas por
 * guarani de trafico; quien paso dos CTA sin comprar es justamente la
 * poblacion donde vive el que no puede comprar porque usa aumento. Y el FAQ,
 * que es lo que sigue, es donde esa duda hoy termina en un callejon.
 */
export const ClipOnSection = ({ onBuyClick }: ClipOnSectionProps) => {
  return (
    <section
      aria-labelledby="clipon-title"
      className="bg-[hsl(0_0%_3%)] py-16 md:py-24"
    >
      {/* px sobre el container, como en el hero: pisa el padding de 2rem del config. */}
      <div className="container mx-auto max-w-[1200px] px-4 md:px-6">
        <div className="grid items-center gap-8 md:gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <ClipOnGallery />
          </Reveal>

          <div>
            <Reveal delay={80}>
              <h2
                id="clipon-title"
                className="text-3xl font-bold leading-[1.05] tracking-tighter md:text-4xl lg:text-5xl"
              >
                Usás lentes con aumento?
              </h2>
              <p className="mt-4 max-w-[46ch] text-base leading-relaxed text-muted-foreground md:text-lg">
                El Clip-On se engancha sobre los tuyos y se saca en un segundo. Bloquea el 99% de
                la luz azul sin que tengas que elegir entre ver bien y dormir bien.
              </p>
            </Reveal>

            <Reveal delay={160} className="mt-6 md:mt-8">
              <p className="text-3xl font-bold tracking-tight text-white md:text-4xl">
                {formatPrice(CLIP_ON.price, 'pyg')}
              </p>
              <Button
                variant="hero"
                size="xl"
                data-clipon-cta
                onClick={onBuyClick}
                className="mt-4 h-14 w-full text-base md:h-16 md:w-auto md:min-w-[300px] md:text-lg"
              >
                Llevar el Clip-On
              </Button>
              <p className="mt-3 text-sm text-muted-foreground">
                Envío gratis a todo Paraguay. Pagás al recibir.
              </p>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ClipOnSection;
