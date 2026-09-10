import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/Reveal";
import { CLIP_ON } from "@/lib/order";
import { formatPrice } from "@/lib/stripe";
import clipOnSobreLentes from "@/assets/clip-on/clip-on-sobre-lentes-recetados.webp";
import clipOnEnUso from "@/assets/clip-on/clip-on-en-uso.webp";

interface ClipOnSectionProps {
  onBuyClick: () => void;
}

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
      className="bg-[hsl(0_0%_3%)] px-4 py-16 md:px-6 md:py-24"
    >
      <div className="container mx-auto max-w-[1200px]">
        <div className="grid items-center gap-8 md:gap-12 lg:grid-cols-12 lg:gap-16">
          <Reveal className="lg:col-span-7">
            <div className="overflow-hidden rounded-xl border border-border/40 bg-secondary/20">
              <img
                src={clipOnSobreLentes}
                alt="Clip-On NOCTE rojo montado sobre unos lentes recetados de carey"
                width={1200}
                height={1200}
                loading="lazy"
                decoding="async"
                className="aspect-[4/3] w-full object-cover"
              />
            </div>
          </Reveal>

          <div className="lg:col-span-5">
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

            {/* Puesto. Va chico a proposito: prueba que se ve bien encima de
                los lentes de uno, no compite con la foto de producto. */}
            <Reveal
              delay={140}
              className="mt-6 w-[180px] overflow-hidden rounded-xl border border-border/40 bg-secondary/20 md:mt-8 md:w-[200px]"
            >
              <img
                src={clipOnEnUso}
                alt="Persona usando el Clip-On NOCTE sobre sus lentes recetados"
                width={1200}
                height={1200}
                loading="lazy"
                decoding="async"
                className="aspect-square w-full object-cover"
              />
            </Reveal>

            <Reveal delay={200} className="mt-6 md:mt-8">
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
