import { CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";

const comparisons = [
  {
    title: "Lentes Transparentes",
    specs: [
      { label: "Bloqueo de luz azul", value: "45-50%", isGood: false },
      { label: "Mejora el sueño", value: "No", isGood: false },
      { label: "Garantía", value: "0 días", isGood: false },
      { label: "Precio", value: "150k Gs", isGood: true },
    ],
  },
  {
    title: "Lentes Amarillos",
    specs: [
      { label: "Bloqueo de luz azul", value: "60-70%", isGood: false },
      { label: "Mejora el sueño", value: "Moderado", isGood: false },
      { label: "Garantía", value: "0 días", isGood: false },
      { label: "Precio", value: "279k Gs", isGood: true },
    ],
  },
  {
    title: "NOCTE Rojos",
    specs: [
      { label: "Bloqueo de luz azul", value: "99%", isGood: true },
      { label: "Mejora el sueño", value: "Máximo", isGood: true },
      { label: "Garantía", value: "30 días", isGood: true },
      { label: "Precio", value: "280k Gs", isGood: true },
    ],
    isNocte: true,
  },
];

export const ComparisonTable = () => {
  return (
    <section className="py-16 md:py-32 px-4 md:px-6 bg-gradient-to-b from-black via-card/20 to-black">
      <div className="container max-w-[1200px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 md:mb-24 space-y-4 md:space-y-6"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter px-4">
            ¿Por qué NOCTE es diferente?
          </h2>
          <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground font-light px-4 max-w-3xl mx-auto leading-relaxed">
            No todos los lentes son iguales. Aquí está la diferencia real.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
          {comparisons.map((option, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className={`p-8 md:p-10 border-2 ${
                option.isNocte
                  ? "border-primary/50 bg-primary/5 scale-105 md:scale-110"
                  : "border-border/50 bg-card/30"
              } relative hover:scale-105 transition-transform duration-300`}
            >
              {option.isNocte && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary px-6 py-2 text-sm font-bold shadow-lg">
                  RECOMENDADO
                </div>
              )}

              <h3 className={`text-2xl md:text-3xl font-bold mb-8 text-center ${
                option.isNocte ? "text-primary" : "text-foreground/80"
              }`}>
                {option.title}
              </h3>

              <div className="space-y-6">
                {option.specs.map((spec, specIndex) => (
                  <div key={specIndex} className="flex items-start justify-between gap-4">
                    <span className="text-base text-muted-foreground flex-1">
                      {spec.label}
                    </span>
                    <div className="flex items-center gap-3">
                      {spec.label !== "Precio" && (
                        spec.isGood ? (
                          <CheckIcon className="w-6 h-6 text-primary flex-shrink-0" strokeWidth={2.5} />
                        ) : (
                          <XMarkIcon className="w-6 h-6 text-muted-foreground/40 flex-shrink-0" strokeWidth={2.5} />
                        )
                      )}
                      <span className={`text-base font-bold ${
                        option.isNocte && spec.isGood ? "text-primary" : "text-foreground"
                      }`}>
                        {spec.value}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
