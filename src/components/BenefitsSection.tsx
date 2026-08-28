import { Reveal } from "@/components/Reveal";
import suenoProfundo from "@/assets/benefits/01-sueno-profundo.webp";
import trabajoNocturno from "@/assets/benefits/02-trabajo-nocturno.webp";
import sinDolorDeCabeza from "@/assets/benefits/03-sin-dolor-de-cabeza.webp";
import ochoHoras from "@/assets/benefits/04-ocho-horas-de-pantalla.webp";
import transicionTarde from "@/assets/benefits/05-transicion-de-la-tarde.webp";

interface Benefit {
  image: string;
  alt: string;
  title: string;
  description: string;
}

// Cada tarjeta es un momento del dia y el tinte que le corresponde, en el orden
// en que se vive: la noche primero porque es la promesa que compra la gente.
const BENEFITS: readonly Benefit[] = [
  {
    image: suenoProfundo,
    alt: "Mujer en el borde de la cama con lentes NOCTE rojos, dejando el telefono sobre la mesa de luz",
    title: "Sueño profundo",
    description:
      "El rojo bloquea el espectro que frena tu melatonina. Dejás el teléfono y tu cuerpo ya entiende que es de noche.",
  },
  {
    image: trabajoNocturno,
    alt: "Hombre trabajando de noche frente a un monitor con lentes NOCTE rojos y una lampara calida",
    title: "Trabajá de noche sin pagarlo",
    description:
      "Terminás lo que tenías que terminar y aun así te dormís. No hay que elegir entre las dos cosas.",
  },
  {
    image: sinDolorDeCabeza,
    alt: "Persona recostada en el sillon viendo una laptop de noche con lentes NOCTE rojos, con la cara distendida",
    title: "La frente se afloja",
    description:
      "Esa tensión de mirar una pantalla a oscuras es luz azul, no cansancio. Con el filtro puesto se va.",
  },
  {
    image: ochoHoras,
    alt: "Mujer en una oficina de dia frente a dos monitores con lentes NOCTE amarillos",
    title: "Ocho horas de pantalla",
    description:
      "El amarillo filtra sin tocar los colores. Trabajás todo el día y llegás a la noche sin los ojos ardiendo.",
  },
  {
    image: transicionTarde,
    alt: "Hombre junto a una ventana al atardecer con lentes NOCTE naranjas",
    title: "La bajada de la tarde",
    description:
      "El naranja es el paso intermedio. Tu ritmo empieza a bajar cuando tiene que bajar, no a las dos de la mañana.",
  },
];

export const BenefitsSection = () => {
  return (
    <section className="relative bg-black py-12 md:py-20">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(239,68,68,0.08),transparent_50%)]" />

      <div className="relative z-10">
        <Reveal
          as="header"
          className="container mx-auto mb-8 max-w-[1400px] px-4 md:mb-12 md:px-6 lg:px-12"
        >
          <h2 className="max-w-[16ch] text-3xl font-bold leading-[1.05] tracking-tighter md:text-5xl lg:text-6xl">
            Lo que cambia cuando te los ponés
          </h2>
          <p className="mt-4 max-w-[52ch] text-base leading-relaxed text-muted-foreground md:mt-5 md:text-lg">
            NOCTE no es un accesorio. Es el filtro entre tus pantallas y el reloj interno que decide a qué hora te dormís.
          </p>
        </Reveal>

        {/* Scroll horizontal nativo, igual que la galeria del hero: la fisica del
            swipe y el snap los maneja el navegador, asi que no hay un transform
            animado peleando con el dedo. La tarjeta siguiente asoma a proposito,
            es la unica senal de que hay mas. */}
        <Reveal
          className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-p-4 px-4 pb-2 scrollbar-hide md:gap-4 md:scroll-p-6 md:px-6 lg:scroll-p-12 lg:px-12"
          role="list"
          aria-label="Beneficios de NOCTE"
        >
          {BENEFITS.map((benefit) => (
            <article
              key={benefit.title}
              role="listitem"
              className="relative aspect-[3/4] w-[76vw] max-w-[300px] shrink-0 snap-start overflow-hidden rounded-2xl bg-secondary/40 md:w-[300px]"
            >
              <img
                src={benefit.image}
                alt={benefit.alt}
                loading="lazy"
                decoding="async"
                draggable={false}
                className="absolute inset-0 h-full w-full object-cover"
              />

              {/* El degradado arranca opaco abajo y muere antes de la mitad para
                  que el texto tenga contraste sin tapar la cara de la foto. */}
              <div
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black via-black/80 to-transparent"
              />

              <div className="absolute inset-x-0 bottom-0 p-5 md:p-6">
                <h3 className="text-xl font-bold leading-tight tracking-tight text-white md:text-[22px]">
                  {benefit.title}
                </h3>
                <p className="mt-1.5 text-[13px] leading-snug text-white md:text-sm">
                  {benefit.description}
                </p>
              </div>
            </article>
          ))}
        </Reveal>
      </div>
    </section>
  );
};

export default BenefitsSection;
