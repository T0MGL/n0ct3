/*
 * /clip-on, la landing del Clip-On Rojo. Destino del trafico de ads para el
 * que usa lentes con aumento, que en la landing de lentes no puede comprar.
 *
 * Misma casa que /sleep-mask: el negro de NOCTE, Satoshi, el rojo solo en lo
 * que se toca para comprar, el mismo checkout y el mismo pixel. Cambia el
 * orden, que sigue las dudas de este cliente:
 *   me reconozco (usas aumento?) -> como se me ve -> como se engancha y se
 *   saca -> que me llega -> pago al recibir y tengo garantia -> dudas -> compro.
 *
 * Reclamos: solo los que ya estan aprobados en el sitio. Es un lente rojo que
 * se engancha sobre los lentes recetados, se saca en un segundo y filtra la luz
 * azul. Sin porcentaje: el 99% sale de los reportes de transmitancia de los
 * lentes de marco completo, y el clip-on no tiene reporte propio.
 */

import { useCallback, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { NocteMark } from "@/components/NocteMark";
import { useCheckoutFlow } from "@/components/checkout/useCheckoutFlow";
import { BoxSection } from "@/components/clip-on/BoxSection";
import { ClipOnClosing } from "@/components/clip-on/ClipOnClosing";
import { ClipOnFaq } from "@/components/clip-on/ClipOnFaq";
import { ClipOnHero } from "@/components/clip-on/ClipOnHero";
import { ClipOnStickyBar } from "@/components/clip-on/ClipOnStickyBar";
import { InUseSection } from "@/components/clip-on/InUseSection";
import { MechanismSection } from "@/components/clip-on/MechanismSection";
import {
  CLIP_ON_DESCRIPTION,
  CLIP_ON_SHARE_IMAGE,
  CLIP_ON_SHARE_TITLE,
  CLIP_ON_TITLE,
  CLIP_ON_URL,
} from "@/components/clip-on/seo";
// Los hechos de tienda, la fuente y el boton son los de /sleep-mask, tal cual.
// Si aparece una tercera landing, esto se muda a una carpeta compartida.
import { AssuranceSection } from "@/components/sleep-mask/AssuranceSection";
import { useScrolledPast } from "@/components/sleep-mask/useScrolledPast";
import "@/components/sleep-mask/sleep-mask.css";
import { trackViewContent } from "@/lib/meta-pixel";
import { CLIP_ON, clipOnItem, metaContent } from "@/lib/order";
import { getStripe } from "@/lib/stripe";
import { cn } from "@/lib/utils";

// Sin categoria ni descripcion de salud: el dominio ya tiene un antecedente de
// clasificacion de salud en Meta y esto lo lee cualquier crawler.
const PRODUCT_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "NOCTE® Clip-On Rojo",
  description: "Clip-On de lente rojo que se engancha sobre tus lentes recetados y se saca en un segundo.",
  // El SKU de Ordefy, no el content_id del pixel: son dos identidades distintas.
  sku: "NOCTE-CLIPON-ROJO",
  brand: { "@type": "Brand", name: "NOCTE" },
  image: CLIP_ON_SHARE_IMAGE.url,
  url: CLIP_ON_URL,
  offers: {
    "@type": "Offer",
    url: CLIP_ON_URL,
    price: CLIP_ON.price,
    priceCurrency: "PYG",
    availability: "https://schema.org/InStock",
  },
};

// selector -> valor. Son los mismos que escribe clip-on.html en el build (ver
// seo.ts); aca cubren al que llega navegando desde la home, que trae el head
// de index.html.
const META_CONTENT: ReadonlyArray<readonly [string, string]> = [
  ['meta[name="title"]', CLIP_ON_TITLE],
  ['meta[name="description"]', CLIP_ON_DESCRIPTION],
  ['meta[property="og:url"]', CLIP_ON_URL],
  ['meta[property="og:title"]', CLIP_ON_SHARE_TITLE],
  ['meta[property="og:description"]', CLIP_ON_DESCRIPTION],
  ['meta[property="og:image"]', CLIP_ON_SHARE_IMAGE.url],
  ['meta[property="og:image:type"]', CLIP_ON_SHARE_IMAGE.type],
  ['meta[property="og:image:width"]', String(CLIP_ON_SHARE_IMAGE.width)],
  ['meta[property="og:image:height"]', String(CLIP_ON_SHARE_IMAGE.height)],
  ['meta[property="og:image:alt"]', CLIP_ON_SHARE_IMAGE.alt],
  ['meta[name="twitter:url"]', CLIP_ON_URL],
  ['meta[name="twitter:title"]', CLIP_ON_SHARE_TITLE],
  ['meta[name="twitter:description"]', CLIP_ON_DESCRIPTION],
  ['meta[name="twitter:image"]', CLIP_ON_SHARE_IMAGE.url],
  ['meta[name="twitter:image:alt"]', CLIP_ON_SHARE_IMAGE.alt],
];

/**
 * Title, meta, canonical y el Product de schema.org (con el precio de
 * order.ts) mientras la pagina esta montada. Al salir vuelve lo que habia.
 */
const useDocumentMeta = () => {
  useEffect(() => {
    const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    const previousTitle = document.title;
    const previousCanonical = canonical?.href;
    const restores = META_CONTENT.flatMap(([selector, value]) => {
      const tag = document.querySelector<HTMLMetaElement>(selector);
      if (!tag) return [];
      const previous = tag.content;
      tag.content = value;
      return [() => (tag.content = previous)];
    });

    document.title = CLIP_ON_TITLE;
    if (canonical) canonical.href = CLIP_ON_URL;

    const jsonLd = document.createElement("script");
    jsonLd.type = "application/ld+json";
    jsonLd.textContent = JSON.stringify(PRODUCT_JSON_LD);
    document.head.appendChild(jsonLd);

    return () => {
      document.title = previousTitle;
      if (canonical && previousCanonical !== undefined) canonical.href = previousCanonical;
      for (const restore of restores) restore();
      jsonLd.remove();
    };
  }, []);
};

const checkoutLabel = () => `NOCTE® ${CLIP_ON.name}`;

const preloadCheckout = () => {
  getStripe();
  void import("@/components/checkout/PhoneNameForm");
  void import("@/components/checkout/StripeCheckoutModal");
};

const ClipOn = () => {
  const heroCtaRef = useRef<HTMLButtonElement>(null);
  const closingRef = useRef<HTMLElement>(null);
  // AddToCart una vez por visita, como en /sleep-mask y en la de lentes.
  const atcFiredRef = useRef(false);

  const { startBuyFlow, modals } = useCheckoutFlow({
    initialItem: clipOnItem,
    checkoutLabel,
    exitIntentProduct: "el Clip-On NOCTE",
  });

  useDocumentMeta();
  const pastHero = useScrolledPast(heroCtaRef);

  // El PageView lo manda RouteTracker. ViewContent con la identidad del
  // clip-on que ya usan AddToCart, InitiateCheckout y Purchase (metaContent).
  useEffect(() => {
    trackViewContent({
      ...metaContent(clipOnItem()),
      value: CLIP_ON.price,
      currency: "PYG",
    });
  }, []);

  useEffect(() => {
    const idle = window.requestIdleCallback;
    if (typeof idle === "function") {
      const handle = idle(preloadCheckout);
      return () => window.cancelIdleCallback(handle);
    }
    const timer = setTimeout(preloadCheckout, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleBuyClick = useCallback(() => {
    startBuyFlow(clipOnItem(), !atcFiredRef.current);
    atcFiredRef.current = true;
  }, [startBuyFlow]);

  return (
    <div data-variant="rojo" className="sleep-mask-page min-h-[100dvh] bg-black text-white">
      <header className="pointer-events-none fixed inset-x-0 top-0 z-30">
        {/* Pasado el hero la barra se vuelve solida: si no, la marca queda
            encima del texto y de las fotos blancas de las secciones. */}
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
            <NocteMark title={null} className="h-[20px] w-auto text-white md:h-[22px]" />
          </Link>
          {/* Hasta tablet la compra la sostiene la barra fija de abajo. */}
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
        </div>
      </header>

      <main>
        <ClipOnHero onBuyClick={handleBuyClick} ctaRef={heroCtaRef} />
        <InUseSection />
        <MechanismSection />
        <BoxSection />
        <AssuranceSection />
        <ClipOnFaq />
        <ClipOnClosing onBuyClick={handleBuyClick} sectionRef={closingRef} />
      </main>

      <footer className="border-t border-white/10 bg-black px-5 pb-28 pt-12 sm:px-8 lg:pb-14">
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

      <ClipOnStickyBar onBuyClick={handleBuyClick} heroPassed={pastHero} closingRef={closingRef} />

      {modals}
    </div>
  );
};

export default ClipOn;
