import { motion } from "framer-motion";
import { staggerContainerVariants, staggerItemVariants } from "@/lib/animations";
import { GiftIcon, ShieldCheckIcon, EyeIcon } from "@heroicons/react/24/outline";
import productImage1 from "@/assets/productimage1.webp";
import productImage2 from "@/assets/productimage2.webp";
import productImage3 from "@/assets/productimage3.webp";

const items = [
  {
    icon: ShieldCheckIcon,
    title: "Estuche Premium",
    description: "Estuche rígido magnético con acabado en cuero y logo NOCTE grabado.",
    image: productImage1,
  },
  {
    icon: EyeIcon,
    title: "Lentes NOCTE®",
    description: "Lentes con filtro rojo de grado óptico que bloquean el 99.9% de luz azul y verde.",
    image: productImage2,
  },
  {
    icon: GiftIcon,
    title: "Kit Completo",
    description: "Incluye bolsa de microfibra con logo NOCTE para limpieza y transporte.",
    image: productImage3,
  },
];

export const UnboxingSection = () => {
  return (
    <section className="py-12 md:py-20 px-4 md:px-6 bg-gradient-to-b from-black via-secondary/10 to-black relative overflow-hidden">
      <div className="container max-w-[1200px] mx-auto relative z-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={staggerContainerVariants}
        >
          {/* Header */}
          <motion.div
            variants={staggerItemVariants}
            className="text-center mb-10 md:mb-16 space-y-4"
          >
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter">
              ¿Qué incluyen tus lentes NOCTE?
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground font-light max-w-2xl mx-auto leading-relaxed">
              Todo lo que necesitás para empezar a dormir mejor, desde la primera noche.
            </p>
          </motion.div>

          {/* Grid of 3 product photos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                variants={staggerItemVariants}
                className="group relative bg-secondary/20 border border-border/20 rounded-lg overflow-hidden hover:border-primary/30 transition-all duration-300"
              >
                {/* Product image */}
                <div className="relative aspect-square overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/30 to-transparent" />
                </div>

                {/* Text content */}
                <div className="p-5 md:p-6 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 flex items-center justify-center bg-primary/10 rounded-md border border-primary/20">
                      <Icon className="w-5 h-5 text-primary" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-lg md:text-xl font-bold tracking-tight">
                      {item.title}
                    </h3>
                  </div>
                  <p className="text-sm md:text-base text-muted-foreground font-light leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default UnboxingSection;
