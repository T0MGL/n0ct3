import { DevicePhoneMobileIcon, ComputerDesktopIcon, ClockIcon } from "@heroicons/react/24/outline";
import { Reveal } from "@/components/Reveal";
import productImage from "@/assets/nocte-product.webp";

const useCases = [
  {
    icon: ComputerDesktopIcon,
    title: "Trabajo Nocturno",
    description: "Usalos mientras trabajás en tu laptop después de las 8 PM",
  },
  {
    icon: DevicePhoneMobileIcon,
    title: "Scrolling Nocturno",
    description: "Instagram, TikTok, WhatsApp, sin afectar tu sueño",
  },
  {
    icon: ClockIcon,
    title: "2-3 Horas Antes",
    description: "Ponételos 2-3 horas antes de dormir para máximos resultados",
  },
];

// Stable variant objects at module scope (not recreated on each render)
export const LifestyleSection = () => {
  return (
    <section className="py-8 md:py-16 px-4 md:px-6 bg-gradient-to-b from-black via-secondary/20 to-black relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.08),transparent_60%)]" />

      <div className="container max-w-[1200px] mx-auto relative z-10">
        <Reveal className="text-center mb-12 md:mb-20 space-y-4 md:space-y-6">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter px-4">
            ¿Cuándo usar NOCTE?
          </h2>
          <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground font-light px-4 max-w-3xl mx-auto leading-relaxed">
            No son para dormir con ellos puestos. Son para usarlos ANTES de dormir.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-16 items-center">
          {/* Image Side */}
          <Reveal from="left" className="relative order-2 lg:order-1">
            <div className="absolute inset-0 bg-variant-active/10 rounded-full blur-[100px] scale-75" />
            <div className="relative">
              <img
                src={productImage}
                alt="NOCTE: úsalos mientras trabajas de noche"
                loading="lazy"
                decoding="async"
                className="w-full h-auto drop-shadow-[0_8px_16px_rgba(239,68,68,0.25)] max-w-[500px] mx-auto"
              />
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-variant-active/90 backdrop-blur-sm px-6 py-3 rounded-lg border border-variant-active/50 shadow-lg">
                <p className="text-sm md:text-base font-bold text-white text-center">
                  Úsalos mientras usas dispositivos
                </p>
              </div>
            </div>
          </Reveal>

          {/* Use Cases Side */}
          <div className="space-y-8 order-1 lg:order-2">
            {useCases.map((useCase, index) => {
              const Icon = useCase.icon;
              return (
                <Reveal
                  key={useCase.title}
                  from="right"
                  delay={index * 80}
                  className="flex gap-6 items-start p-6 md:p-8 bg-gradient-to-r from-card/50 to-transparent border-l-2 border-variant-active/50 transition-colors duration-300 hover:border-variant-active"
                >
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center bg-variant-active/10 rounded-lg border border-variant-active/30">
                      <Icon className="w-6 h-6 md:w-7 md:h-7 text-variant-active" strokeWidth={1.5} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl md:text-2xl font-bold text-foreground">
                      {useCase.title}
                    </h3>
                    <p className="text-base md:text-lg text-muted-foreground leading-relaxed font-light">
                      {useCase.description}
                    </p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>

        {/* Bottom CTA */}
        <Reveal className="mt-16 md:mt-20 text-center">
          <div className="inline-block bg-secondary/50 backdrop-blur-sm border border-variant-active/30 rounded-lg px-8 py-6 md:px-12 md:py-8">
            <p className="text-lg md:text-xl lg:text-2xl font-light text-foreground leading-relaxed">
              El resultado: <span className="font-bold text-variant-active">Dormís profundo</span> sin pastillas ni melatonina artificial.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default LifestyleSection;
