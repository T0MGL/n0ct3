import { motion } from "framer-motion";
import { DevicePhoneMobileIcon, ComputerDesktopIcon, ClockIcon } from "@heroicons/react/24/outline";
import productImage from "@/assets/nocte-product-hero.jpg";

const useCases = [
  {
    icon: ComputerDesktopIcon,
    title: "Trabajo Nocturno",
    description: "Úsalos mientras trabajas en tu laptop después de las 8 PM",
  },
  {
    icon: DevicePhoneMobileIcon,
    title: "Scrolling Nocturno",
    description: "Instagram, TikTok, WhatsApp - sin afectar tu sueño",
  },
  {
    icon: ClockIcon,
    title: "2-3 Horas Antes",
    description: "Póntelos 2-3 horas antes de dormir para máximos resultados",
  },
];

export const LifestyleSection = () => {
  return (
    <section className="py-16 md:py-32 px-4 md:px-6 bg-gradient-to-b from-black via-secondary/20 to-black relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.08),transparent_60%)]" />

      <div className="container max-w-[1200px] mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 md:mb-20 space-y-4 md:space-y-6"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter px-4">
            ¿Cuándo usar NOCTE?
          </h2>
          <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground font-light px-4 max-w-3xl mx-auto leading-relaxed">
            No son para dormir con ellos puestos. Son para usarlos ANTES de dormir.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-16 items-center">
          {/* Image Side */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
            className="relative order-2 lg:order-1"
          >
            <div className="absolute inset-0 bg-primary/10 rounded-full blur-[100px] scale-75" />
            <div className="relative">
              <img
                src={productImage}
                alt="NOCTE - Úsalos mientras trabajas de noche"
                className="w-full h-auto drop-shadow-[0_8px_16px_rgba(239,68,68,0.25)] max-w-[500px] mx-auto"
              />
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-primary/90 backdrop-blur-sm px-6 py-3 rounded-lg border border-primary/50 shadow-lg">
                <p className="text-sm md:text-base font-bold text-white text-center">
                  Úsalos mientras usas dispositivos
                </p>
              </div>
            </div>
          </motion.div>

          {/* Use Cases Side */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-8 order-1 lg:order-2"
          >
            {useCases.map((useCase, index) => {
              const Icon = useCase.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                  className="flex gap-6 items-start p-6 md:p-8 bg-gradient-to-r from-card/50 to-transparent border-l-2 border-primary/50 hover:border-primary transition-all duration-300"
                >
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center bg-primary/10 rounded-lg border border-primary/30">
                      <Icon className="w-6 h-6 md:w-7 md:h-7 text-primary" strokeWidth={1.5} />
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
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-16 md:mt-20 text-center"
        >
          <div className="inline-block bg-secondary/50 backdrop-blur-sm border border-primary/30 rounded-lg px-8 py-6 md:px-12 md:py-8">
            <p className="text-lg md:text-xl lg:text-2xl font-light text-foreground/90 leading-relaxed">
              El resultado: <span className="font-bold text-primary">Duermes profundo</span> sin pastillas ni melatonina artificial.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
