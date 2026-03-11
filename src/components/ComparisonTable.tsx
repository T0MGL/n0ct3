import { CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";

const products = [
  { key: "transparentes", label: "Transparentes", isNocte: false },
  { key: "amarillos", label: "Amarillos", isNocte: false },
  { key: "nocte", label: "NOCTE", isNocte: true },
];

const features = [
  {
    label: "Bloqueo de luz azul",
    values: {
      transparentes: { text: "45-50%", isGood: false },
      amarillos: { text: "60-70%", isGood: false },
      nocte: { text: "99%", isGood: true },
    },
  },
  {
    label: "Mejora el sueño",
    values: {
      transparentes: { text: "No", isGood: false },
      amarillos: { text: "Moderado", isGood: false },
      nocte: { text: "Máximo", isGood: true },
    },
  },
  {
    label: "Garantía",
    values: {
      transparentes: { text: "0 días", isGood: false },
      amarillos: { text: "0 días", isGood: false },
      nocte: { text: "30 días", isGood: true },
    },
  },
  {
    label: "Precio",
    values: {
      transparentes: { text: "150k Gs", isGood: false },
      amarillos: { text: "279k Gs", isGood: false },
      nocte: { text: "229k Gs", isGood: true },
    },
  },
];

export const ComparisonTable = () => {
  return (
    <section className="py-8 md:py-16 px-4 md:px-6 bg-gradient-to-b from-black via-card/20 to-black">
      <div className="container max-w-[800px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-8 md:mb-12 space-y-4"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter px-4">
            ¿Por qué NOCTE es diferente?
          </h2>
          <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground font-light px-4 max-w-3xl mx-auto leading-relaxed">
            No todos los lentes son iguales. Aquí está la diferencia real.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="border border-border/40 overflow-hidden"
        >
          {/* Header row */}
          <div className="grid grid-cols-[1fr_repeat(3,minmax(0,1fr))]">
            <div className="p-3 md:p-4" />
            {products.map((product) => (
              <div
                key={product.key}
                className={`p-3 md:p-5 text-center ${
                  product.isNocte
                    ? "bg-primary/10 border-x border-primary/30"
                    : "bg-card/20"
                }`}
              >
                {product.isNocte && (
                  <span className="inline-block text-[10px] md:text-xs font-bold text-primary bg-primary/15 px-2 py-0.5 mb-1.5 tracking-wider">
                    RECOMENDADO
                  </span>
                )}
                <h3
                  className={`text-sm md:text-lg font-bold ${
                    product.isNocte ? "text-primary" : "text-foreground/70"
                  }`}
                >
                  {product.label}
                </h3>
              </div>
            ))}
          </div>

          {/* Feature rows */}
          {features.map((feature, index) => (
            <div
              key={index}
              className={`grid grid-cols-[1fr_repeat(3,minmax(0,1fr))] ${
                index < features.length - 1 ? "border-b border-border/20" : ""
              }`}
            >
              {/* Label */}
              <div className="p-3 md:p-4 flex items-center">
                <span className="text-xs md:text-sm text-muted-foreground leading-tight">
                  {feature.label}
                </span>
              </div>

              {/* Values */}
              {products.map((product) => {
                const val =
                  feature.values[product.key as keyof typeof feature.values];
                const isPriceRow = feature.label === "Precio";
                return (
                  <div
                    key={product.key}
                    className={`p-3 md:p-4 flex flex-col items-center justify-center gap-1 ${
                      product.isNocte
                        ? "bg-primary/5 border-x border-primary/30"
                        : ""
                    }`}
                  >
                    {!isPriceRow && (
                      val.isGood ? (
                        <CheckIcon
                          className="w-4 h-4 md:w-5 md:h-5 text-primary"
                          strokeWidth={2.5}
                        />
                      ) : (
                        <XMarkIcon
                          className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground/30"
                          strokeWidth={2.5}
                        />
                      )
                    )}
                    <span
                      className={`text-xs md:text-sm font-semibold text-center leading-tight ${
                        product.isNocte && val.isGood
                          ? "text-primary"
                          : val.isGood
                          ? "text-foreground"
                          : "text-foreground/50"
                      }`}
                    >
                      {val.text}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default ComparisonTable;
