import type { Ref } from "react";
import { HERO_PHOTO } from "@/components/clip-on/photos";
import { StarRating } from "@/components/StarRating";
import { CLIP_ON } from "@/lib/order";
import { formatPrice } from "@/lib/stripe";

interface ClipOnHeroProps {
  onBuyClick: () => void;
  ctaRef: Ref<HTMLButtonElement>;
}

/**
 * La pregunta es el filtro: el que no usa aumento se va y el que usa se
 * reconoce en la primera linea. La foto va enmarcada y no a sangre como en
 * /sleep-mask: es de estudio sobre blanco, y fundirla en el negro la ensucia.
 *
 * Sin Reveal: el primer viewport se lee entero aunque ninguna animacion corra.
 */
export const ClipOnHero = ({ onBuyClick, ctaRef }: ClipOnHeroProps) => (
  <section
    aria-labelledby="clipon-hero-title"
    className="mx-auto max-w-[1400px] px-5 pb-14 pt-[4.5rem] sm:px-8 lg:grid lg:min-h-[100dvh] lg:grid-cols-12 lg:items-center lg:gap-12 lg:px-12 lg:pb-16 lg:pt-24"
  >
    <div className="lg:order-2 lg:col-span-7">
      <img
        src={HERO_PHOTO.src}
        alt={HERO_PHOTO.alt}
        width={HERO_PHOTO.width}
        height={HERO_PHOTO.height}
        // Crudo por la misma razon que en ProductHero: React 18 no reconoce
        // fetchPriority en camelCase.
        {...{ fetchpriority: "high" }}
        decoding="async"
        // En mobile la foto va mas apaisada para que el boton entre sin
        // scroll en un viewport de 375x667, el mas chico que medimos. El
        // producto esta centrado: el recorte se come fondo blanco, no el
        // clip-on.
        className="aspect-[5/3] w-full rounded-2xl bg-white/[0.06] object-cover ring-1 ring-white/10 sm:aspect-[4/3]"
      />
    </div>

    <div className="mt-7 lg:order-1 lg:col-span-5 lg:mt-0">
      <p className="text-[15px] font-medium text-white/60">NOCTE® Clip-On Rojo</p>
      <h1
        id="clipon-hero-title"
        className="mt-2 max-w-[12ch] text-[38px] font-bold leading-[1.02] tracking-[-0.035em] text-white [text-wrap:balance] sm:text-5xl lg:text-[64px] lg:leading-[0.98]"
      >
        Usás lentes con aumento?
      </h1>
      <p className="mt-4 max-w-[40ch] text-[15px] leading-snug text-white/70 lg:mt-6 lg:text-lg lg:leading-relaxed">
        Se engancha sobre tus lentes y se saca en un segundo. Filtrás la luz azul de noche sin
        dejar tu receta.
      </p>

      {/* Numeros de Ordefy al 2026-09-22: 48 calificaciones de entrega, todas
          de 5 estrellas, y 627 clientes con un pedido entregado. Van a mano y
          envejecen: antes de tocarlos, volver a consultarlos. La primera linea
          dice que miden las estrellas, para que el +600 no se lea como resenas. */}
      <StarRating
        label="5/5 en 48 entregas calificadas"
        note="+600 clientes en Paraguay"
        className="mt-4 items-start lg:mt-6"
      />

      <p className="mt-5 text-[28px] font-bold leading-none tracking-[-0.02em] tabular-nums text-white lg:mt-8 lg:text-4xl">
        {formatPrice(CLIP_ON.price, "pyg")}
      </p>

      <button
        ref={ctaRef}
        type="button"
        onClick={onBuyClick}
        className="sleep-mask-cta mt-4 w-full lg:mt-5 lg:w-auto lg:min-w-[320px]"
      >
        Comprar ahora
      </button>
      <p className="mt-3 text-[13px] text-white/60 lg:text-sm">
        Envío gratis a todo Paraguay. Pagás al recibir.
      </p>
    </div>
  </section>
);
