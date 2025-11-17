import { StarIcon } from "@heroicons/react/24/solid";
import { motion } from "framer-motion";

const testimonials = [
  {
    name: "Juan López",
    role: "Founder, Asunción",
    rating: 5,
    quote: "Llevaba 3 meses sin dormir bien. Con NOCTE cambió todo. Ahora duermo 7-8 horas seguidas sin despertarme.",
  },
  {
    name: "María Fernández",
    role: "Desarrolladora, Remote",
    rating: 5,
    quote: "Probé otros lentes transparentes y no funcionaban. Con NOCTE es REAL. Duermo profundo cada noche.",
  },
  {
    name: "Carlos Gómez",
    role: "Emprendedor Tech, Fernando de la Mora",
    rating: 5,
    quote: "30 días de garantía sin riesgo. Ya llevo 2 meses, no me lo saco nunca. Lo mejor que invertí este año.",
  },
  {
    name: "Andrea Pérez",
    role: "Consultora, Encarnación",
    rating: 5,
    quote: "Literalmente cambió mi productividad. Duermo mejor = trabajo mejor. Recomiendo NOCTE al 100%.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

export const TestimonialsSection = () => {
  return (
    <section className="py-16 md:py-32 px-4 md:px-6 bg-black relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(239,68,68,0.08),transparent_50%)]" />

      <div className="container max-w-[1200px] mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          className="text-center mb-8 md:mb-12 space-y-3 md:space-y-4"
        >
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold px-4">
            Confían en NOCTE
          </h2>
          <p className="text-base md:text-xl text-muted-foreground px-4">
            Emprendedores paraguayos duermen mejor
          </p>
        </motion.div>

        {/* Rating Summary Banner */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.4, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
          className="max-w-3xl mx-auto mb-12 md:mb-16"
        >
          <div className="bg-gradient-to-b from-secondary/40 to-secondary/20 backdrop-blur-sm border border-accent/30 rounded-lg p-8 md:p-10 shadow-[0_4px_6px_rgba(0,0,0,0.1)]">
            <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10">
              {/* Star Rating Display */}
              <div className="flex flex-col items-center gap-3">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon key={i} className="w-7 h-7 md:w-8 md:h-8 text-accent" />
                  ))}
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl md:text-5xl font-bold text-accent">4.7</span>
                  <span className="text-lg md:text-xl text-muted-foreground font-light">de 5</span>
                </div>
              </div>

              {/* Divider */}
              <div className="hidden md:block w-px h-20 bg-border/50" />

              {/* Customer Count */}
              <div className="flex flex-col items-center gap-2 text-center">
                <p className="text-3xl md:text-4xl font-bold text-foreground">1,174</p>
                <p className="text-base md:text-lg text-muted-foreground font-light">
                  clientes satisfechos
                </p>
                <p className="text-xs md:text-sm text-accent/80 font-medium mt-1">
                  ★ Reviews verificadas
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6"
        >
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="group p-6 md:p-8 bg-gradient-to-b from-card to-black border border-border/50 hover:border-primary/30 transition-all duration-300"
            >
              <div className="space-y-5 md:space-y-6">
                <div className="flex gap-0.5">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <StarIcon key={i} className="w-3.5 h-3.5 md:w-4 md:h-4 text-accent" />
                  ))}
                </div>

                <p className="text-foreground/80 leading-relaxed font-light text-sm">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>

                <div className="pt-4 border-t border-border/30">
                  <p className="font-semibold text-foreground text-sm md:text-base">
                    {testimonial.name}
                  </p>
                  <p className="text-xs text-muted-foreground font-light mt-1">
                    {testimonial.role}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
