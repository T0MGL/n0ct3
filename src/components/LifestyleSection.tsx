import { Reveal } from "@/components/Reveal";
import trioImage from "@/assets/nocte-trio-momentos.webp";
import { MOMENT_ORDER, VARIANTS } from "@/lib/variants";

export const LifestyleSection = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-black via-secondary/20 to-black px-4 py-8 md:px-6 md:py-16">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.08),transparent_60%)]" />

      <div className="container relative z-10 mx-auto max-w-[1200px]">
        <Reveal className="mb-12 text-center md:mb-20">
          <h2 className="px-4 text-4xl font-bold tracking-tighter md:text-5xl lg:text-6xl">
            ¿Cuándo usás NOCTE?
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 items-center gap-12 md:gap-16 lg:grid-cols-2">
          {/* La misma luz de la foto es la del dia: entra clara por la
              izquierda sobre el amarillo y termina en penumbra ambar sobre el
              rojo. Va sin cartel encima porque la linea de tiempo de al lado
              ya dice lo que hay que decir. */}
          <Reveal from="left" className="relative order-2 lg:order-1">
            <div className="absolute inset-0 scale-75 rounded-full bg-variant-active/10 blur-[100px]" />
            <img
              src={trioImage}
              alt="Los tres lentes NOCTE sobre una mesa, del amarillo al rojo, con la luz pasando de la mañana a la noche"
              loading="lazy"
              decoding="async"
              className="relative mx-auto h-auto w-full max-w-[560px] rounded-xl"
            />
          </Reveal>

          {/* La hora manda: es lo primero que se lee de cada fila, porque la
              duda del cliente no es "que hace el lente" sino "a que hora me
              pongo cual". El borde de cada fila lleva el color de su tramo. */}
          <div className="order-1 space-y-8 lg:order-2">
            {MOMENT_ORDER.map((id, index) => {
              const variant = VARIANTS[id];
              return (
                <Reveal
                  key={id}
                  from="right"
                  delay={index * 80}
                  className="border-l-2 bg-gradient-to-r from-card/50 to-transparent p-6 md:p-8"
                  style={{ borderColor: `${variant.accent}80` }}
                >
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-bold tabular-nums leading-none text-white md:text-4xl">
                      {variant.timeline.hour}
                    </span>
                    <span
                      className="text-[11px] font-bold uppercase tracking-[0.22em]"
                      style={{ color: variant.accent }}
                    >
                      {variant.id}
                    </span>
                  </div>
                  <p className="mt-3 text-lg font-semibold text-foreground md:text-xl">
                    {variant.timeline.scene}
                  </p>
                  <p className="mt-1.5 text-base font-light leading-relaxed text-muted-foreground md:text-lg">
                    {variant.timeline.result}
                  </p>
                </Reveal>
              );
            })}
          </div>
        </div>

        <Reveal className="mt-16 text-center md:mt-20">
          <div className="inline-block rounded-lg border border-variant-active/30 bg-secondary/50 px-8 py-6 backdrop-blur-sm md:px-12 md:py-8">
            <p className="max-w-[52ch] text-lg font-light leading-relaxed text-foreground md:text-xl lg:text-2xl">
              No se duerme con ellos puestos. Se usan antes, que es cuando{" "}
              <span className="font-bold text-variant-active">
                tu cuerpo decide a qué hora te va a dar sueño
              </span>
              .
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default LifestyleSection;
