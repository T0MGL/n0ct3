import { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { CountdownTimer } from "@/components/CountdownTimer";
import {
  MoonIcon,
  ShieldCheckIcon,
  ComputerDesktopIcon,
  FaceSmileIcon
} from "@heroicons/react/24/outline";
import { StarIcon } from "@heroicons/react/24/solid";
import { motion, AnimatePresence, useInView } from "framer-motion";
import tarjetasImage from "@/assets/tarjetas.webp";
import { LivePurchaseNotification, getRandomBuyer } from "@/components/LivePurchaseNotification";
import { BundleSelector } from "@/components/BundleSelector";
import { ProductHero } from "@/components/ProductHero";
import { AuthorityBadge } from "@/components/AuthorityBadge";
import { trackViewContent } from "@/lib/meta-pixel";
import { getDeliveryDates } from "@/lib/delivery-utils";
import { ORIGINAL_UNIT_PRICE } from "@/lib/bundles";
import { ALL_VARIANTS_SOLD_OUT, VARIANTS, type VariantId } from "@/lib/variants";
import { useActiveVariant } from "@/lib/variant-context";

interface HeroSectionProps {
  onBuyClick: () => void;
  selectedBundleIndex: number;
  onBundleSelect: (index: number) => void;
  selectedPrice: number;
  selectedQuantity: number;
  picks: VariantId[];
  onPickChange: (unitIndex: number, next: VariantId) => void;
  /** El badge de autoridad vive aca hasta que se posa en el header. */
  badgeCollapsed: boolean;
  badgeDocked: boolean;
  onGalleryInteract: () => void;
  /** Carga el pack de tres con los tres colores de una. */
  onSelectFullSet: () => void;
}

export const HeroSection = ({
  onBuyClick,
  selectedBundleIndex,
  onBundleSelect,
  selectedPrice,
  selectedQuantity,
  picks,
  onPickChange,
  badgeCollapsed,
  badgeDocked,
  onGalleryInteract,
  onSelectFullSet,
}: HeroSectionProps) => {
  const { activeVariant, setActiveVariant } = useActiveVariant();

  // Cart unit 1 nudges the hero image once on mount so the initial frame matches
  // the default cart color. Afterwards image and cart move together: the
  // ProductHero thumbnails and the unit-1 picker both go through
  // handlePickChange, so what the customer sees is what the order carries.
  const didSyncInitialPick = useRef(false);
  useEffect(() => {
    if (didSyncInitialPick.current) return;
    didSyncInitialPick.current = true;
    const unitOne = picks[0];
    if (unitOne && unitOne !== activeVariant) setActiveVariant(unitOne);
  }, [picks, activeVariant, setActiveVariant]);

  const handlePickChange = (unitIndex: number, next: VariantId) => {
    onPickChange(unitIndex, next);
    if (unitIndex === 0) setActiveVariant(next);
  };
  const ctaRef = useRef<HTMLDivElement>(null);
  const ctaInView = useInView(ctaRef, { amount: 0.5 });
  const variant = VARIANTS[activeVariant];

  // Live purchase notification
  const [showPurchaseNotification, setShowPurchaseNotification] = useState(false);
  const [currentBuyer, setCurrentBuyer] = useState(() => getRandomBuyer());
  const hasShownPurchaseRef = useRef(false);

  // Memoize delivery dates calculation (doesn't change during session)
  const deliveryDates = useMemo(() => getDeliveryDates(), []);

  // Dynamic stock counter (resets daily, creates urgency)
  const [stockLeft, setStockLeft] = useState(() => {
    const today = new Date().toDateString();
    try {
      const stored = localStorage.getItem('nocte-stock-data');
      if (stored) {
        const data = JSON.parse(stored);
        if (data.date === today) {
          return data.stock;
        }
      }
    } catch {
      // Corrupted localStorage data - reset
    }

    // Static stock of 17 units
    const newStock = 17;
    try {
      localStorage.setItem('nocte-stock-data', JSON.stringify({ date: today, stock: newStock }));
    } catch {
      // localStorage unavailable (private browsing, etc.)
    }
    return newStock;
  });

  // Animated stock number display
  const [displayStock, setDisplayStock] = useState(stockLeft);
  const [stockAnimating, setStockAnimating] = useState(false);

  // Track ViewContent when hero section is viewed
  useEffect(() => {
    trackViewContent();

    // Preload checkout modals after a short delay (for mobile users)
    const preloadTimer = setTimeout(() => {
      import("@/components/checkout/PhoneNameForm");
      import("@/components/checkout/StripeCheckoutModal");
    }, 2000);

    return () => clearTimeout(preloadTimer);
  }, []);

  // Live purchase notification - shows once per session after 8 seconds.
  // Suppressed while everything is sold out: no fake purchases on a page
  // that cannot sell.
  useEffect(() => {
    if (ALL_VARIANTS_SOLD_OUT) return;
    if (hasShownPurchaseRef.current) return;

    const timers: ReturnType<typeof setTimeout>[] = [];

    const purchaseTimer = setTimeout(() => {
      if (hasShownPurchaseRef.current) return;
      hasShownPurchaseRef.current = true;

      setCurrentBuyer(getRandomBuyer());
      setShowPurchaseNotification(true);

      // Animate stock decrease after notification appears
      timers.push(setTimeout(() => {
        const newStock = Math.max(stockLeft - 1, 1);

        // Trigger pulse animation on stock indicator
        setStockAnimating(true);

        // Update the display number with dramatic effect
        timers.push(setTimeout(() => {
          setDisplayStock(newStock);
          setStockLeft(newStock);

          // Update localStorage
          const today = new Date().toDateString();
          try {
            localStorage.setItem('nocte-stock-data', JSON.stringify({ date: today, stock: newStock }));
          } catch { /* localStorage unavailable */ }

          // Stop animation after a bit
          timers.push(setTimeout(() => setStockAnimating(false), 1500));
        }, 300));
      }, 1500));

    }, 8000);

    timers.push(purchaseTimer);

    return () => timers.forEach(clearTimeout);
  }, [stockLeft]);

  // Crossed-out original price based on selected quantity
  const originalPrice = ORIGINAL_UNIT_PRICE * selectedQuantity;

  return (
    <section
      data-variant={activeVariant}
      className="relative min-h-[85vh] lg:min-h-screen flex items-start lg:items-center overflow-x-hidden bg-black transition-colors duration-500"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none transition-opacity duration-500"
        style={{
          background: `radial-gradient(ellipse 60% 40% at 50% 30%, hsl(var(--variant-active) / 0.035), transparent 65%)`,
        }}
      />

      <div className="container max-w-[1400px] mx-auto px-4 md:px-6 lg:px-12 relative z-10 pt-[80px] md:pt-[88px] pb-6 md:pb-12">
        {/* Mobile-First Layout */}
        <div className="flex flex-col lg:grid lg:grid-cols-[1fr_1fr] gap-4 md:gap-8 lg:gap-14 items-start lg:items-center">

          {/* Product Hero - Order 1 on mobile (shows first) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            // Arriba y no centrada. La columna de contenido mide casi el doble
            // que la galeria, asi que centrarla dejaba 300px de negro arriba de
            // la foto con el titulo ya empezado al costado. Pegarla con sticky
            // tampoco sirve: la galeria mide 783px y en un portatil de 800 de
            // alto, con el header fijo arriba, las miniaturas de color quedarian
            // permanentemente fuera de pantalla.
            className="relative order-1 w-full lg:self-start"
          >
            {/* Badge de autoridad. Vive sobre la esquina de la foto hasta
                que el cliente toca la galeria: ahi se va al header. Ver
                AuthorityBadge para el vuelo. */}
            {!badgeDocked && (
              <AuthorityBadge
                collapsed={badgeCollapsed}
                docked={false}
                className="absolute left-2 top-4 z-20 md:left-4 md:top-2"
              />
            )}

            <ProductHero
              activeVariant={activeVariant}
              onVariantChange={(next) => handlePickChange(0, next)}
              onGalleryInteract={onGalleryInteract}
            />
          </motion.div>

          {/* Content - Order 2 on mobile */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-4 md:space-y-5 lg:space-y-6 order-2 w-full"
          >
            {/* Main Title */}
            <div className="space-y-3">
              {/* Variant-aware eyebrow with blocked percent badge. */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <span
                  className="inline-flex items-center gap-1.5 rounded-md border bg-white/[0.04] px-2.5 py-1.5 text-[12px] font-semibold text-white"
                  style={{ borderColor: `${variant.accent}66` }}
                >
                  <ShieldCheckIcon
                    className="h-4 w-4"
                    style={{ color: variant.accent }}
                  />
                  Bloquea{" "}
                  <span style={{ color: variant.accent }}>
                    {variant.blockedPercent}%
                  </span>{" "}
                  <span className="font-medium text-white">luz azul</span>
                </span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-white">
                  Modo {variant.moment}
                </span>
              </div>

              {/* El titulo nombra el sistema, no el SKU. La mayoria del
                  trafico entra por el ad de los tres momentos, asi que abrir
                  con "Lentes Rojos" le habla al color que se llevo el click y
                  no a lo que se vende. Efecto lateral: al ser fijo, cambiar de
                  lente ya no reescribe el h1 ni empuja la pagina. */}
              <h1 className="text-[28px] font-bold leading-[1.08] tracking-tight text-white md:text-4xl lg:text-5xl">
                Un lente para cada momento del día
              </h1>

              {/* Cada color va pintado de su propio tono: la bajada es el mapa
                  de las tres miniaturas de arriba, no una frase mas. */}
              <p className="max-w-md text-base leading-snug text-white md:text-lg">
                De mañana el{" "}
                <span className="font-semibold" style={{ color: VARIANTS.amarillo.accent }}>
                  amarillo
                </span>{" "}
                para enfocarte, de tarde el{" "}
                <span className="font-semibold" style={{ color: VARIANTS.naranja.accent }}>
                  naranja
                </span>{" "}
                para no apagarte, de noche el{" "}
                <span className="font-semibold" style={{ color: VARIANTS.rojo.accent }}>
                  rojo
                </span>{" "}
                para dormir profundo.
              </p>

              {/* La unica linea que cambia con el color: confirma la eleccion.
                  Reserva su alto maximo porque las tres descripciones no miden
                  lo mismo, y el swap va por CSS y no por AnimatePresence: con
                  mode="wait" el nodo viejo se iba, quedaba el hueco 280ms y
                  recien despues entraba el nuevo. Ese hueco era el salto. */}
              <p
                key={`desc-${variant.id}`}
                className="nocte-swap min-h-[60px] max-w-md text-sm text-white/80 md:min-h-[48px] md:text-base"
              >
                {variant.description}
              </p>

              {/* Star Rating + Social Proof */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-0.5">
                  <StarIcon className="w-5 h-5 star-gold" />
                  <StarIcon className="w-5 h-5 star-gold" />
                  <StarIcon className="w-5 h-5 star-gold" />
                  <StarIcon className="w-5 h-5 star-gold" />
                  <div className="relative w-5 h-5">
                    <StarIcon className="w-5 h-5 text-muted-foreground absolute" />
                    <div className="overflow-hidden absolute inset-0" style={{ width: '80%' }}>
                      <StarIcon className="w-5 h-5 star-gold" />
                    </div>
                  </div>
                </div>
                <p className="text-sm text-foreground font-medium">
                  4.8/5 (+5.380 Clientes Satisfechos)
                </p>
              </div>
            </div>

            {/* Benefits Grid - 2x2 Icons */}
            <div className="grid grid-cols-2 gap-3 md:gap-4 py-1">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-variant-active/10 flex items-center justify-center flex-shrink-0">
                  <ComputerDesktopIcon className="w-6 h-6 text-variant-active" />
                </div>
                <span className="text-sm md:text-base font-medium text-white">Trabaja en Pantallas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-variant-active/10 flex items-center justify-center flex-shrink-0">
                  <ShieldCheckIcon className="w-6 h-6 text-variant-active" />
                </div>
                <span className="text-sm md:text-base font-medium text-white">Bloquea Luz Azul</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-variant-active/10 flex items-center justify-center flex-shrink-0">
                  <FaceSmileIcon className="w-6 h-6 text-variant-active" />
                </div>
                <span className="text-sm md:text-base font-medium text-white">Cero Migrañas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-variant-active/10 flex items-center justify-center flex-shrink-0">
                  <MoonIcon className="w-6 h-6 text-variant-active" />
                </div>
                <span className="text-sm md:text-base font-medium text-white">Dormí Profundo</span>
              </div>
            </div>

            {/* Bundle Selector with inline per-unit color picker */}
            <BundleSelector
              selectedIndex={selectedBundleIndex}
              onSelect={onBundleSelect}
              picks={picks}
              onPickChange={handlePickChange}
              onSelectFullSet={onSelectFullSet}
            />

            {/* Price */}
            <div className="flex items-center gap-3">
              <span className="text-base text-foreground line-through">
                Gs. {originalPrice.toLocaleString('es-PY')}
              </span>
              <span className="text-4xl md:text-5xl font-bold text-white">
                Gs. {selectedPrice.toLocaleString('es-PY')}
              </span>
            </div>

            {/* Stock Urgency Indicator (sold-out notice when nothing is sellable) */}
            {ALL_VARIANTS_SOLD_OUT ? (
              <div className="inline-flex items-center gap-2 px-4 py-2 border border-white/15 bg-white/[0.04] rounded-lg">
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white/40" />
                <span className="text-sm font-semibold text-white">
                  Stock agotado. Reponemos pronto.
                </span>
              </div>
            ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{
                opacity: 1,
                scale: stockAnimating ? [1, 1.08, 1] : 1,
              }}
              transition={{
                delay: stockAnimating ? 0 : 0.3,
                duration: stockAnimating ? 0.6 : 0.4,
                repeat: stockAnimating ? 2 : 0,
              }}
              style={{
                willChange: 'transform, box-shadow',
                backgroundColor: `${variant.accent}10`,
                borderColor: `${variant.accent}33`,
                boxShadow: stockAnimating ? `0 0 14px -2px ${variant.lensGlow}` : 'none',
              }}
              className="inline-flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors duration-300"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span
                  className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                  style={{ backgroundColor: variant.accent }}
                />
                <span
                  className="relative inline-flex rounded-full h-2.5 w-2.5"
                  style={{ backgroundColor: variant.accent }}
                />
              </span>
              <span className="text-sm font-semibold" style={{ color: variant.accent }}>
                Solo quedan{" "}
                <AnimatePresence mode="wait">
                  <motion.span
                    key={displayStock}
                    initial={{ opacity: 0, y: -10, scale: 1.2 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.8 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className={`inline-block font-bold ${stockAnimating ? 'text-white' : ''}`}
                  >
                    {displayStock}
                  </motion.span>
                </AnimatePresence>
                {" "}unidades en stock
              </span>
            </motion.div>
            )}

            {/* CTA Button */}
            <div className="space-y-3">
              <div
                ref={ctaRef}
                className={ctaInView && !ALL_VARIANTS_SOLD_OUT ? "nocte-cta-pulse" : undefined}
              >
                <Button
                  data-hero-cta
                  variant="hero"
                  size="xl"
                  disabled={ALL_VARIANTS_SOLD_OUT}
                  className="w-full h-14 md:h-16 text-base md:text-lg font-bold transition-shadow duration-300"
                  style={ALL_VARIANTS_SOLD_OUT ? undefined : { boxShadow: `0 10px 28px -12px ${variant.lensGlow}` }}
                  onClick={onBuyClick}
                >
                  {ALL_VARIANTS_SOLD_OUT
                    ? "AGOTADO · VUELVE PRONTO"
                    : `COMPRAR AHORA · Gs. ${selectedPrice.toLocaleString('es-PY')}`}
                </Button>
              </div>

              {/* Dynamic Delivery Date */}
              {!ALL_VARIANTS_SOLD_OUT && (
                <p className="text-sm text-center lg:text-left text-accent font-medium">
                  📦 Pedí hoy y recibí entre el {deliveryDates.startDay} y {deliveryDates.endDay}
                </p>
              )}
            </div>

            {/* Payment Methods */}
            <div className="flex justify-center lg:justify-start pt-2">
              <img
                src={tarjetasImage}
                alt="Visa, Mastercard, Apple Pay, Google Pay"
                className="h-11 w-auto opacity-95 md:h-12"
              />
            </div>

            {/* Countdown Timer */}
            <div className="flex justify-center lg:justify-start pt-2">
              <CountdownTimer />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Live Purchase Notification */}
      <LivePurchaseNotification
        isVisible={showPurchaseNotification}
        buyerName={currentBuyer.name}
        buyerCity={currentBuyer.city}
        onDismiss={() => setShowPurchaseNotification(false)}
      />
    </section>
  );
};
