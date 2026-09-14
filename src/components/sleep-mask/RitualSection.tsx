import { Reveal } from "@/components/Reveal";
import { ALL_MASK_COLORS_SOLD_OUT, type MaskColorId } from "@/lib/mask-colors";
import { RED_GLASSES, buildOrderLines, sleepMaskItem, sumLines } from "@/lib/order";
import { cn } from "@/lib/utils";
import lentes480 from "@/assets/sleep-mask/ritual-lentes-480.webp";
import lentes720 from "@/assets/sleep-mask/ritual-lentes-720.webp";
import lentes896 from "@/assets/sleep-mask/ritual-lentes-896.webp";
import antifaz480 from "@/assets/sleep-mask/ritual-antifaz-480.webp";
import antifaz720 from "@/assets/sleep-mask/ritual-antifaz-720.webp";
import antifaz1080 from "@/assets/sleep-mask/ritual-antifaz-1080.webp";

const FRAME_SIZES = "(min-width: 1240px) 340px, (min-width: 1024px) 28vw, 50vw";

const FRAMES = [
  {
    when: "Dos horas antes",
    what: "Lentes rojos",
    src: lentes720,
    srcSet: `${lentes480} 480w, ${lentes720} 720w, ${lentes896} 896w`,
    alt: "Hombre en su cuarto de noche, con la lámpara prendida y los lentes rojos NOCTE puestos",
  },
  {
    when: "Al apagar la luz",
    what: "Antifaz 3D",
    src: antifaz720,
    srcSet: `${antifaz480} 480w, ${antifaz720} 720w, ${antifaz1080} 1080w`,
    alt: "Mujer dormida con la mano bajo la mejilla y el antifaz 3D NOCTE rosado puesto",
  },
] as const;

const gs = (amount: number) => `${amount.toLocaleString("es-PY")} Gs`;

interface RitualSectionProps {
  picks: readonly MaskColorId[];
  onBuyClick: () => void;
}

/**
 * Prepara el bump de lentes rojos del checkout. La pagina no agrega los lentes
 * por su cuenta: el boton abre el mismo checkout de siempre, donde los lentes
 * esperan sin marcar. Los numeros salen de buildOrderLines, los mismos que
 * cobra el pedido, asi que esta tabla y el total del checkout no se pueden
 * contradecir.
 */
export const RitualSection = ({ picks, onBuyClick }: RitualSectionProps) => {
  const item = sleepMaskItem(picks);
  const masksLabel = item.quantity === 1 ? "Antifaz 3D" : `${item.quantity} antifaces 3D`;
  const alone = sumLines(buildOrderLines(item, { sleepMaskPicks: [], priorityShipping: false }));
  const together = sumLines(buildOrderLines(item, { sleepMaskPicks: [], redGlasses: true, priorityShipping: false }));

  return (
    <section aria-labelledby="mask-ritual-title" className="bg-[#050505] px-5 py-24 sm:px-8 md:py-32">
      {/* Mobile: titulo, diptico, precios. Desktop: diptico a la izquierda y
          titulo con precios apilados a la derecha. */}
      <div className="mx-auto grid max-w-[1200px] gap-12 lg:grid-cols-12 lg:gap-x-16 lg:gap-y-10">
        <Reveal className="order-1 lg:order-none lg:col-span-5 lg:col-start-8 lg:row-start-1 lg:self-end">
          <h2
            id="mask-ritual-title"
            className="max-w-[14ch] text-[34px] font-bold leading-[1.02] tracking-[-0.03em] text-white [text-wrap:balance] md:text-5xl lg:text-[56px]"
          >
            Dormir mejor empieza antes de acostarte.
          </h2>
          <p className="mt-5 max-w-[42ch] text-[15px] leading-relaxed text-white/70 md:text-lg">
            Los lentes rojos bloquean la luz azul de las pantallas y le avisan a tu cuerpo que ya
            es de noche. Cuando apagás la luz, el antifaz se encarga del resto.
          </p>
        </Reveal>

        {RED_GLASSES.available && (
          <Reveal delay={80} className="order-3 lg:order-none lg:col-span-5 lg:col-start-8 lg:row-start-2 lg:self-start">
            <dl className="divide-y divide-white/10 border-y border-white/10">
              <div className="flex items-baseline justify-between gap-4 py-4">
                <dt className="text-[15px] text-white/70">{masksLabel}</dt>
                <dd className="whitespace-nowrap text-lg font-semibold tabular-nums text-white">{gs(alone)}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 py-4">
                <dt>
                  <span className="block text-[15px] font-semibold text-white">{masksLabel} + Lentes Rojos</span>
                  <span className="mt-1 block text-[13px] text-white/60">
                    Separados salen {gs(alone + RED_GLASSES.price)}
                  </span>
                </dt>
                <dd className="whitespace-nowrap text-lg font-semibold tabular-nums text-white">{gs(together)}</dd>
              </div>
            </dl>

            <button
              type="button"
              onClick={onBuyClick}
              disabled={ALL_MASK_COLORS_SOLD_OUT}
              className="sleep-mask-cta mt-8 w-full sm:w-auto sm:min-w-[300px]"
            >
              Comprar ahora
            </button>
            <p className="mt-3 text-[13px] text-white/60">
              Los lentes rojos los sumás en el checkout, con un toque.
            </p>
          </Reveal>
        )}

        {/* Diptico y no dos tarjetas: es una misma noche en dos momentos. El
            segundo cuadro baja un escalon porque viene despues. */}
        <div className="order-2 grid grid-cols-2 gap-3 sm:gap-5 lg:order-none lg:col-span-7 lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:self-center">
          {FRAMES.map((frame, index) => (
            <Reveal as="figure" key={frame.what} delay={index * 90} className={cn(index === 1 && "mt-10 md:mt-16")}>
              <img
                src={frame.src}
                srcSet={frame.srcSet}
                sizes={FRAME_SIZES}
                alt={frame.alt}
                loading="lazy"
                decoding="async"
                className="aspect-[3/4] w-full rounded-xl bg-white/[0.04] object-cover"
              />
              <figcaption className="mt-3">
                <span className="block text-[13px] text-white/60">{frame.when}</span>
                <span className="block text-base font-semibold text-white md:text-lg">{frame.what}</span>
              </figcaption>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};
