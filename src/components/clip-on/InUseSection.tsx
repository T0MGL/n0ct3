import { Reveal } from "@/components/Reveal";
import { IN_USE_PHOTO } from "@/components/clip-on/photos";

/**
 * Contesta "como se me ve". El hero lo mostro sobre unos lentes en una mesa;
 * aca esta en una cara, con los lentes de siempre abajo. El texto es el mismo
 * reclamo que ya dice la home, sin porcentaje: los reportes de transmitancia
 * miden los lentes de marco completo, no el clip-on.
 */
export const InUseSection = () => (
  <section aria-labelledby="clipon-inuse-title" className="bg-[#050505] px-5 py-24 sm:px-8 md:py-32">
    <div className="mx-auto grid max-w-[1200px] items-center gap-10 md:grid-cols-12 md:gap-12 lg:gap-16">
      <Reveal as="figure" className="md:col-span-6 lg:col-span-7">
        <img
          src={IN_USE_PHOTO.src}
          alt={IN_USE_PHOTO.alt}
          width={IN_USE_PHOTO.width}
          height={IN_USE_PHOTO.height}
          loading="lazy"
          decoding="async"
          className="aspect-square w-full rounded-2xl bg-white/[0.06] object-cover"
        />
      </Reveal>

      <Reveal delay={80} className="md:col-span-6 lg:col-span-5">
        <h2
          id="clipon-inuse-title"
          className="max-w-[12ch] text-[34px] font-bold leading-[1.02] tracking-[-0.03em] text-white [text-wrap:balance] md:text-5xl lg:text-[56px]"
        >
          Tus lentes de siempre, de noche.
        </h2>
        <p className="mt-5 max-w-[42ch] text-[15px] leading-relaxed text-white/70 md:text-lg">
          Lo ponés cuando cae la noche, frente a la pantalla o antes de acostarte. Filtra la luz
          azul sin que tengas que elegir entre ver bien y dormir bien.
        </p>
      </Reveal>
    </div>
  </section>
);
