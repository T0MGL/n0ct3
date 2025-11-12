import { EyeIcon, BoltIcon, MoonIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";

const benefits = [
  {
    icon: EyeIcon,
    title: "Alivia Fatiga Ocular",
    description: "Bloquea luz azul (400-550nm) que causa cansancio después de 8 horas de pantalla.",
  },
  {
    icon: BoltIcon,
    title: "Reduce Dolores de Cabeza",
    description: "Sin más migrañas por tensión digital. Usuarios reportan 70% menos dolores.",
  },
  {
    icon: MoonIcon,
    title: "Mejora el Sueño",
    description: "Duermes 2-3 horas EXTRA cada noche. Sueño profundo, sin despertares.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

export const BenefitsSection = () => {
  return (
    <section className="py-16 md:py-32 px-4 md:px-6 bg-black relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(239,68,68,0.08),transparent_50%)]" />

      <div className="container max-w-[1200px] mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 md:mb-20 space-y-3 md:space-y-4"
        >
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold px-4">
            ¿Por qué NOCTE funciona?
          </h2>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 lg:gap-12"
        >
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <motion.div
                key={index}
                variants={itemVariants}
                className="group relative p-8 md:p-10 bg-gradient-to-b from-card to-black border border-border/50 hover:border-primary/50 transition-all duration-500"
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
