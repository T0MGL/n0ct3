import { Reveal } from "@/components/Reveal";
import { ColorPhotoStack } from "@/components/sleep-mask/ColorPhotoStack";
import { RITUAL_FRAME_SIZES, RITUAL_MASK_PHOTOS } from "@/components/sleep-mask/photos";
import { ALL_MASK_COLORS_SOLD_OUT, type MaskColorId } from "@/lib/mask-colors";
import { RED_GLASSES, buildOrderLines, sleepMaskItem, sumLines } from "@/lib/order";
import { cn } from "@/lib/utils";
import lentes480 from "@/assets/sleep-mask/ritual-lentes-480.webp";
import lentes720 from "@/assets/sleep-mask/ritual-lentes-720.webp";
import lentes896 from "@/assets/sleep-mask/ritual-lentes-896.webp";

const GLASSES_FRAME = {
  src: lentes720,
  srcSet: `${lentes480} 480w, ${lentes720} 720w, ${lentes896} 896w`,
  alt: "Hombre en su cuarto de noche, con la lámpara prendida y los lentes rojos NOCTE puestos",
} as const;

const FRAME_CLASS = "aspect-[3/4] w-full rounded-xl bg-white/[0.04]";

const gs = (amount: number) => `${amount.toLocaleString("es-PY")} Gs`;

interface RitualSectionProps {
  picks: readonly MaskColorId[];
  /** El color activo de la pagina: el cuadro del antifaz lo sigue. */
  activeColor: MaskColorId;
  onBuyClick: () => void;
}

/**
 * Prepara el bump de lentes rojos del checkout. La pagina no agrega los lentes
 * por su cuenta: el boton abre el mismo checkout de siempre, donde los lentes
 * esperan sin marcar. Los numeros salen de buildOrderLines, los mismos que
 * cobra el pedido, asi que esta tabla y el total del checkout no se pueden
 * contradecir.
 */
export const RitualSection = ({ picks, activeColor, onBuyClick }: RitualSectionProps) => {
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
          <Reveal as="figure">
            <img
              src={GLASSES_FRAME.src}
              srcSet={GLASSES_FRAME.srcSet}
              sizes={RITUAL_FRAME_SIZES}
              alt={GLASSES_FRAME.alt}
              loading="lazy"
              decoding="async"
              className={cn(FRAME_CLASS, "object-cover")}
            />
            <figcaption className="mt-3">
              <span className="block text-[13px] text-white/60">Dos horas antes</span>
              <span className="block text-base font-semibold text-white md:text-lg">Lentes rojos</span>
            </figcaption>
          </Reveal>
          <Reveal as="figure" delay={90} className="mt-10 md:mt-16">
            <ColorPhotoStack
              color={activeColor}
              photos={RITUAL_MASK_PHOTOS}
              sizes={RITUAL_FRAME_SIZES}
              className={FRAME_CLASS}
            />
            <figcaption className="mt-3">
              <span className="block text-[13px] text-white/60">Al apagar la luz</span>
              <span className="block text-base font-semibold text-white md:text-lg">Antifaz 3D</span>
            </figcaption>
          </Reveal>
        </div>
      </div>
    </section>
  );
};
