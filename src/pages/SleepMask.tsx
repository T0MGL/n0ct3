/*
 * /sleep-mask, la landing del Antifaz 3D. Destino del trafico de ads del
 * antifaz: la landing de lentes no linkea aca a proposito, porque cambiar una
 * orden de lentes por una de antifaz pierde contribucion.
 *
 * THESIS: la noche que apagas a voluntad. La pagina no vende un accesorio de
 * dormir sobre fondo pastel; muestra la luz que el cliente no controla y la
 * apaga.
 * OWN-WORLD: las fotos son de dia, lino claro y luz de ventana, y son el mundo
 * que el antifaz apaga. Todo lo demas es el negro de NOCTE con el rojo como
 * unico acento, y el rojo solo en lo que se toca para comprar.
 * STORY: me reconozco en la luz que se cuela, entiendo que la copa no toca los
 * ojos, veo el ritual con los lentes rojos, se que pago al recibir. Compro.
 * FIRST VIEWPORT (390): la escena en uso arriba fundiendose en negro, titular
 * de dos lineas, una linea de soporte, color y precio en la misma fila, boton
 * a lo ancho. Todo visible sin scroll y sin esperar ninguna animacion.
 * FORM: una idea por pantalla. Hero partido, escena fija que se oscurece con
 * el scroll, detalle en bento, diptico del ritual, hechos de tienda, preguntas,
 * cierre. Seed: brief pineado por nocte-ceo, sin sorteo.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { NocteMark } from "@/components/NocteMark";
import { useCheckoutFlow } from "@/components/checkout/useCheckoutFlow";
import { AssuranceSection } from "@/components/sleep-mask/AssuranceSection";
import { BuildSection } from "@/components/sleep-mask/BuildSection";
import { ClosingSection } from "@/components/sleep-mask/ClosingSection";
import { LightSection } from "@/components/sleep-mask/LightSection";
import { MaskFaq } from "@/components/sleep-mask/MaskFaq";
import { MaskHero } from "@/components/sleep-mask/MaskHero";
import { MaskStickyBar } from "@/components/sleep-mask/MaskStickyBar";
import { RitualSection } from "@/components/sleep-mask/RitualSection";
import { useScrolledPast } from "@/components/sleep-mask/useScrolledPast";
import "@/components/sleep-mask/sleep-mask.css";
import { ALL_MASK_COLORS_SOLD_OUT, DEFAULT_MASK_COLOR, MASK_COLORS, resolveSelectableMaskColor, type MaskColorId } from "@/lib/mask-colors";
import { trackViewContent } from "@/lib/meta-pixel";
import { SLEEP_MASK, SLEEP_MASK_SOLO_PRICE, metaContent, sleepMaskItem, type CheckoutItem } from "@/lib/order";
import { getStripe } from "@/lib/stripe";
import { cn } from "@/lib/utils";

const PAGE_TITLE = "Antifaz 3D para dormir | NOCTE®";
const PAGE_DESCRIPTION =
  "Antifaz 3D NOCTE: oscuridad total y cero presión en los párpados. Delivery gratis a todo Paraguay y pago contra entrega. 169.000 Gs.";

const initialItem = () => sleepMaskItem(DEFAULT_MASK_COLOR);

const checkoutLabel = (item: CheckoutItem) =>
  item.product === "sleepmask" ? `NOCTE® Antifaz 3D ${MASK_COLORS[item.color].name}` : `NOCTE® ${SLEEP_MASK.name}`;

/**
 * Titulo, descripcion y canonical propios mientras la pagina esta montada. El
 * index.html es uno solo para todo el sitio y habla de los lentes; al salir se
 * devuelve lo que habia.
 */
const useDocumentMeta = () => {
  useEffect(() => {
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    const previous = {
      title: document.title,
      description: description?.content,
      canonical: canonical?.href,
    };

    document.title = PAGE_TITLE;
    if (description) description.content = PAGE_DESCRIPTION;
    if (canonical) canonical.href = "https://nocte.studio/sleep-mask";

    return () => {
      document.title = previous.title;
      if (description && previous.description !== undefined) description.content = previous.description;
      if (canonical && previous.canonical !== undefined) canonical.href = previous.canonical;
    };
  }, []);
};

const preloadCheckout = () => {
  getStripe();
  void import("@/components/checkout/PhoneNameForm");
  void import("@/components/checkout/StripeCheckoutModal");
};

const SleepMask = () => {
  const [color, setColor] = useState<MaskColorId>(DEFAULT_MASK_COLOR);
  const heroCtaRef = useRef<HTMLButtonElement>(null);
  const closingRef = useRef<HTMLElement>(null);
  // AddToCart una vez por visita, como en la landing de lentes: el embudo de
  // Meta necesita el ATC antes del InitiateCheckout, no uno por cada toque.
  const atcFiredRef = useRef(false);

  const { startBuyFlow, modals } = useCheckoutFlow({
    initialItem,
    checkoutLabel,
    exitIntentProduct: "el antifaz NOCTE",
  });

  useDocumentMeta();
  const pastHero = useScrolledPast(heroCtaRef);

  // El PageView lo manda RouteTracker. ViewContent con la identidad del
  // antifaz, la misma que llevan AddToCart, InitiateCheckout y Purchase.
  useEffect(() => {
    trackViewContent({
      ...metaContent(initialItem()),
      value: SLEEP_MASK_SOLO_PRICE,
      currency: "PYG",
    });
  }, []);

  // Stripe y los modales se precalientan con el navegador libre, para que el
  // primer toque en comprar no espere la red.
  useEffect(() => {
    const idle = window.requestIdleCallback;
    if (typeof idle === "function") {
      const handle = idle(preloadCheckout);
      return () => window.cancelIdleCallback(handle);
    }
    const timer = setTimeout(preloadCheckout, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleColorChange = useCallback((next: MaskColorId) => {
    setColor(resolveSelectableMaskColor(next));
  }, []);

  const handleBuyClick = useCallback(() => {
    startBuyFlow(sleepMaskItem(color), !atcFiredRef.current);
    atcFiredRef.current = true;
  }, [startBuyFlow, color]);

  return (
    <div data-variant="rojo" className="sleep-mask-page min-h-[100dvh] bg-black text-white">
      <header className="pointer-events-none fixed inset-x-0 top-0 z-30">
        {/* Sobre la foto del hero alcanza una sombra para la marca. Pasado el
            hero la barra se vuelve solida: si no, la marca queda encima del
            texto de las secciones. */}
        <div aria-hidden="true" className="absolute inset-0 h-24 bg-gradient-to-b from-black/60 to-transparent" />
        <div
          aria-hidden="true"
          className={cn(
            "absolute inset-0 border-b border-white/10 bg-black/85 backdrop-blur-xl transition-opacity duration-300 ease-out motion-reduce:transition-none",
            pastHero ? "opacity-100" : "opacity-0",
          )}
        />
        <div className="relative mx-auto flex h-16 max-w-[1400px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <Link
            to="/"
            aria-label="NOCTE, ir al inicio"
            className="pointer-events-auto -m-2 rounded-md p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            <NocteMark title={null} className="h-[20px] w-auto text-white [filter:drop-shadow(0_1px_8px_rgba(0,0,0,0.45))] md:h-[22px]" />
          </Link>
          {/* En mobile la compra la sostiene la barra fija de abajo. */}
          {!ALL_MASK_COLORS_SOLD_OUT && (
            <div className="pointer-events-auto hidden lg:block">
              <button
                type="button"
                onClick={handleBuyClick}
                onPointerEnter={preloadCheckout}
                className="sleep-mask-cta sleep-mask-cta--compact"
              >
                Comprar ahora
              </button>
            </div>
          )}
        </div>
      </header>

      <main>
        <MaskHero color={color} onColorChange={handleColorChange} onBuyClick={handleBuyClick} ctaRef={heroCtaRef} />
        <LightSection />
        <BuildSection />
        <RitualSection color={color} onBuyClick={handleBuyClick} />
        <AssuranceSection />
        <MaskFaq />
        <ClosingSection
          color={color}
          onColorChange={handleColorChange}
          onBuyClick={handleBuyClick}
          sectionRef={closingRef}
        />
      </main>

      <footer className="border-t border-white/10 bg-black px-5 pb-28 pt-12 sm:px-8 md:pb-14">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-5 text-center md:flex-row md:justify-between md:text-left">
          <NocteMark className="h-4 w-auto text-white" />
          <nav aria-label="Legal" className="flex items-center gap-6 text-[13px] text-white/60">
            <Link to="/terminos-y-condiciones" className="hover:text-white">
              Términos y Condiciones
            </Link>
            <Link to="/politica-de-privacidad" className="hover:text-white">
              Política de Privacidad
            </Link>
          </nav>
          <p className="text-xs text-white/50">© {new Date().getFullYear()} NOCTE® Todos los derechos reservados</p>
        </div>
      </footer>

      <MaskStickyBar color={color} onBuyClick={handleBuyClick} heroCtaRef={heroCtaRef} closingRef={closingRef} />

      {modals}
    </div>
  );
};

export default SleepMask;
