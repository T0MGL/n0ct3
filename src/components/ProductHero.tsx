import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  type PanInfo,
} from "framer-motion";
import { cn } from "@/lib/utils";
import { VARIANT_IDS, VARIANTS, type VariantId } from "@/lib/variants";
import { useActiveVariant } from "@/lib/variant-context";

interface ProductHeroProps {
  activeVariant?: VariantId;
  onVariantChange?: (next: VariantId) => void;
  className?: string;
}

interface ImageSource {
  src: string;
  filter: string | undefined;
  isPreview: boolean;
}

const VARIANT_SOURCES: Readonly<Record<VariantId, ImageSource>> = {
  rojo: {
    src: "/nocte-rojo.webp",
    filter: undefined,
    isPreview: false,
  },
  naranja: {
    src: "/nocte-naranja.webp",
    filter: undefined,
    isPreview: false,
  },
  amarillo: {
    src: "/nocte-amarillo.webp",
    filter: undefined,
    isPreview: false,
  },
};

interface SharedSlide {
  src: string;
  alt: string;
  // Science breakdown sits on a white card; lifestyle photos fill edge to edge.
  background?: string;
  objectPosition?: string;
}

// Slides shown after the active color photo (slide 0). They are identical across
// every lens color, so they live outside VARIANT_SOURCES and never change when
// the variant changes. Order in this array is the order in the gallery.
//
// Order: [color] -> ciencia -> ritmo del dia -> lifestyle (4 slides).
const SHARED_SLIDES: readonly SharedSlide[] = [
  {
    src: "/nocte-analisis-lente.webp",
    alt: "Analisis del filtro de luz azul NOCTE, espectro de transmision de la lente y prueba de funcion del filtro naranja",
    background: "bg-white",
  },
  {
    src: "/nocte-ritmo-dia.webp",
    alt: "Sistema NOCTE de 3 tintes para cada momento del día: amarillo para la mañana y el trabajo, naranja al atardecer, rojo antes de dormir. Tu cuerpo sigue la luz, vos la controlás",
  },
  {
    src: "/nocte-lifestyle.webp",
    alt: "Pareja de noche en el sillon usando los lentes NOCTE mientras ven una laptop, junto a la caja NOCTE",
    objectPosition: "center",
  },
];

// Total slides = active color photo + every shared slide. Dots, navigation
// bounds and aria labels all derive from this, never a hardcoded literal.
const SLIDE_COUNT = SHARED_SLIDES.length + 1;

// Release thresholds for committing a swipe. Either a clear drag distance or a
// quick flick will advance the slide; anything softer snaps back.
const DRAG_OFFSET_THRESHOLD = 60;
const DRAG_VELOCITY_THRESHOLD = 400;

const IMAGE_TRANSITION = {
  duration: 0.28,
  ease: [0.16, 1, 0.3, 1] as const,
};

const HALO_TRANSITION = {
  duration: 0.6,
  ease: [0.16, 1, 0.3, 1] as const,
};

const TRACK_TRANSITION = {
  type: "spring" as const,
  stiffness: 320,
  damping: 36,
  mass: 0.7,
};

export const ProductHero = ({
  activeVariant: activeVariantProp,
  className,
}: ProductHeroProps) => {
  const ctx = useActiveVariant();
  const activeVariant = activeVariantProp ?? ctx.activeVariant;
  const setActiveVariant = ctx.setActiveVariant;
  const variant = VARIANTS[activeVariant];
  const source = VARIANT_SOURCES[activeVariant];

  const [slide, setSlide] = useState(0);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [viewportWidth, setViewportWidth] = useState(0);
  const dragX = useMotionValue(0);

  // Changing the lens color resets the gallery to slide 0 so the freshly chosen
  // color photo is what the customer sees, not the (unchanged) science slide.
  useEffect(() => {
    setSlide(0);
  }, [activeVariant]);

  // Track the viewport width so the swipe drag distance maps to real pixels and
  // the slide offset stays exact on resize.
  useEffect(() => {
    const node = viewportRef.current;
    if (!node) return;
    const measure = () => setViewportWidth(node.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const goTo = useCallback((next: number) => {
    setSlide(Math.max(0, Math.min(SLIDE_COUNT - 1, next)));
  }, []);

  const handleDragEnd = useCallback(
    (_event: ReactPointerEvent | PointerEvent, info: PanInfo) => {
      const movedFarEnough = Math.abs(info.offset.x) > DRAG_OFFSET_THRESHOLD;
      const flickedHard = Math.abs(info.velocity.x) > DRAG_VELOCITY_THRESHOLD;
      if (movedFarEnough || flickedHard) {
        goTo(slide + (info.offset.x < 0 ? 1 : -1));
      }
      dragX.set(0);
    },
    [slide, goTo, dragX],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        goTo(slide + 1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        goTo(slide - 1);
      }
    },
    [slide, goTo],
  );

  const altText = useMemo(
    () =>
      `Lentes NOCTE ${variant.id}, modo ${variant.moment.toLowerCase()}, ${variant.blockedPercent}% de bloqueo de luz azul`,
    [variant.id, variant.moment, variant.blockedPercent],
  );

  return (
    <div className={cn("relative w-full", className)}>
      <div className="relative mx-auto w-full max-w-[560px]">
        {/* Accent halo behind the product. Contained to the product area so the
            page background stays pure black, but rich enough to keep the lens
            color reading saturated. */}
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-2 inset-y-6 -z-10 rounded-[45%] blur-3xl"
          initial={false}
          animate={{
            backgroundColor: variant.lensGlow,
            opacity: [0.34, 0.45, 0.34],
          }}
          transition={{
            backgroundColor: HALO_TRANSITION,
            opacity: { duration: 5, repeat: Infinity, ease: "easeInOut" },
          }}
        />

        {/* Swipeable image stage. Slide 0 is the active color photo, followed by
            the shared slides (science, lifestyle, and social proof once added).
            Drag is locked to the X axis with touch-action pan-y, so vertical page
            scroll stays intact. */}
        <div
          ref={viewportRef}
          role="group"
          aria-roledescription="carousel"
          aria-label="Galeria del producto"
          tabIndex={0}
          onKeyDown={handleKeyDown}
          className="relative aspect-square w-full select-none overflow-hidden rounded-2xl bg-black/40 ring-1 ring-white/5 outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        >
          <motion.div
            className="flex h-full w-full"
            style={{ x: dragX, touchAction: "pan-y" }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.18}
            dragMomentum={false}
            onDragEnd={handleDragEnd}
            animate={{ x: -slide * viewportWidth }}
            transition={TRACK_TRANSITION}
          >
            {/* Slide 0: active color photo. */}
            <div
              role="group"
              aria-roledescription="slide"
              aria-label={`1 de ${SLIDE_COUNT}: foto del producto`}
              className="relative h-full w-full shrink-0"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.img
                  key={activeVariant}
                  src={source.src}
                  alt={altText}
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  draggable={false}
                  initial={{ opacity: 0, scale: 1.02 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={IMAGE_TRANSITION}
                  style={source.filter ? { filter: source.filter } : undefined}
                  className="h-full w-full object-cover"
                />
              </AnimatePresence>

              {/* Soft floor shadow that absorbs the active accent. */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-8 bottom-2 h-5 rounded-full opacity-40 blur-2xl"
                style={{ backgroundColor: variant.lensGlow }}
              />

              {/* Preview badge for variants without real product photography yet. */}
              <AnimatePresence>
                {source.isPreview && (
                  <motion.div
                    key={`preview-${activeVariant}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.25 }}
                    className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full border border-white/15 bg-black/60 px-3 py-1 backdrop-blur-md"
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/85">
                      Vista previa, llegando pronto
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Shared slides (science, lifestyle, social proof). Identical for
                every color and rendered straight from SHARED_SLIDES, so the
                count stays in lockstep with the dots and navigation bounds. */}
            {SHARED_SLIDES.map((shared, index) => (
              <div
                key={shared.src}
                role="group"
                aria-roledescription="slide"
                aria-label={`${index + 2} de ${SLIDE_COUNT}: ${shared.alt}`}
                className={cn(
                  "relative h-full w-full shrink-0",
                  shared.background,
                )}
              >
                <img
                  src={shared.src}
                  alt={shared.alt}
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                  className="h-full w-full object-cover"
                  style={
                    shared.objectPosition
                      ? { objectPosition: shared.objectPosition }
                      : undefined
                  }
                />
              </div>
            ))}
          </motion.div>

          {/* Page indicators. Clickable, keyboard reachable, and the live label
              announces the active slide for assistive tech. */}
          <div className="pointer-events-none absolute inset-x-0 bottom-3 z-10 flex items-center justify-center gap-2">
            {Array.from({ length: SLIDE_COUNT }, (_, index) => {
              const isActive = index === slide;
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => goTo(index)}
                  aria-label={`Ir a la imagen ${index + 1} de ${SLIDE_COUNT}`}
                  aria-current={isActive ? "true" : undefined}
                  className={cn(
                    "pointer-events-auto h-2 rounded-full backdrop-blur-md transition-all duration-200",
                    isActive
                      ? "w-6 bg-white"
                      : "w-2 bg-white/40 hover:bg-white/70",
                  )}
                />
              );
            })}
          </div>
        </div>

        {/* Variant moment caption. */}
        <div className="mt-3 flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: variant.lensColor, boxShadow: `0 0 10px ${variant.lensGlow}` }}
            />
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/85">
              Modo {variant.moment}
            </span>
          </div>
          <span className="text-[10px] uppercase tracking-[0.18em] text-white/55">
            {variant.momentTimeWindow}
          </span>
        </div>

        {/* Image-only color thumbnails. Independent of cart selection and of the
            gallery pagination above. Picking a color also resets the gallery to
            its first slide via the activeVariant effect. */}
        <div className="mt-4 grid grid-cols-3 gap-2 px-1">
          {VARIANT_IDS.map((id) => {
            const v = VARIANTS[id];
            const src = VARIANT_SOURCES[id];
            const selected = id === activeVariant;
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={`Ver ${v.name}`}
                onClick={() => setActiveVariant(id)}
                className={cn(
                  "group relative overflow-hidden rounded-lg aspect-square bg-black/40 transition-all duration-200",
                  selected
                    ? "ring-1 ring-white/70"
                    : "ring-1 ring-white/8 opacity-70 hover:opacity-100 hover:ring-white/30",
                )}
              >
                <img
                  src={src.src}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                  className="absolute inset-0 h-full w-full object-cover"
                  style={src.filter ? { filter: src.filter } : undefined}
                />
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-0 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/90"
                  style={{
                    background: `linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.7) 60%, rgba(0,0,0,0.85) 100%)`,
                  }}
                >
                  {id}
                </span>
                {selected && (
                  <span
                    aria-hidden="true"
                    className="absolute right-1.5 top-1.5 grid h-4 w-4 place-items-center rounded-full bg-white text-black text-[10px] font-bold"
                  >
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProductHero;
