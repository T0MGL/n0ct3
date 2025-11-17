import { EyeIcon, BoltIcon, MoonIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { fadeInUpView, staggerContainer, staggerItem } from "@/lib/animations";

const benefits = [
  {
    icon: EyeIcon,
    title: "Trabaja sin fatiga ocular",
    description: "Úsalos durante tus sesiones nocturnas de trabajo. Bloquean la luz azul (400-550nm) que quema tus ojos después de 8+ horas de pantalla. Termina tu día sin ojos rojos ni cansancio visual.",
  },
  {
    icon: BoltIcon,
    title: "Cero dolores de cabeza",
    description: "La luz azul de las pantallas causa tensión que termina en migrañas. Con NOCTE, trabajas tranquilo. El 70% de nuestros usuarios reportan eliminación total de dolores de cabeza nocturnos.",
  },
  {
    icon: MoonIcon,
    title: "Duerme profundo (el beneficio real)",
    description: "Úsalos mientras trabajas o scrolleas de noche. Tu cerebro producirá melatonina naturalmente como si fuera de noche. Resultado: te duermes más rápido y despiertas descansado. No magic pills, solo ciencia.",
  },
];

export const BenefitsSection = () => {
  return (
    <section className="py-16 md:py-32 px-4 md:px-6 bg-black relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(239,68,68,0.08),transparent_50%)]" />

      <div className="container max-w-[1200px] mx-auto relative z-10">
        <motion.div
          {...fadeInUpView}
          className="text-center mb-12 md:mb-20 space-y-3 md:space-y-4"
        >
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold px-4">
            Trabaja de noche sin sacrificar tu sueño
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground font-light max-w-2xl mx-auto">
            NOCTE no es un accesorio. Es tu protección contra la luz azul que te mantiene despierto cuando deberías estar durmiendo.
          </p>
        </motion.div>

        <motion.div
          {...staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 lg:gap-12"
        >
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <motion.div
                key={index}
                variants={staggerItem}
                className="group relative p-8 md:p-10 bg-gradient-to-b from-card to-black border border-border/50 hover:border-primary/50 transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative space-y-5 md:space-y-6">
                  <div className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center">
                    <Icon className="w-9 h-9 md:w-10 md:h-10 text-primary" strokeWidth={1.5} />
                  </div>

                  <h3 className="text-xl md:text-2xl font-bold tracking-tight">
                    {benefit.title}
                  </h3>

                  <p className="text-sm md:text-base text-muted-foreground leading-relaxed font-light">
                    {benefit.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

export default BenefitsSection;
