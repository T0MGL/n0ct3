import { StarIcon } from "@heroicons/react/24/solid";
import { StarIcon as StarOutlineIcon } from "@heroicons/react/24/outline";
import { CheckBadgeIcon } from "@heroicons/react/24/solid";
import { motion } from "framer-motion";
import testimonial1 from "@/assets/testimonial1.webp";
import testimonial2 from "@/assets/testimonial2.webp";
import testimonial3 from "@/assets/testimonial3.webp";
import testimonial4 from "@/assets/testimonial4.webp";
import testimonial5 from "@/assets/testimonial5.webp";

const testimonials = [
  {
    name: "Juan L.",
    role: "Asunción",
    rating: 5,
    date: "Hace 2 semanas",
    verified: true,
    quote: "Literal me quedaba hasta las 3am laburando y despues no podia pegar un ojo hasta las 6. Ahora me los pongo tipo 10 y a las 2 ya estoy durmiendo tranquilo. No se como pero funciona.",
    image: testimonial1,
  },
  {
    name: "María F.",
    role: "Remoto",
    rating: 5,
    date: "Hace 1 mes",
    verified: true,
    quote: "Al principio era medio esceptica pero bueno los probe. Laburo de 8 a 1am todos los dias y ahora cuando apago la compu me duermo en nada. Antes estaba 2 horas mirando el techo.",
    image: testimonial2,
  },
  {
    name: "Carlos G.",
    role: "Fernando de la Mora",
    rating: 4,
    date: "Hace 3 semanas",
    verified: true,
    quote: "Tardó un poco más de lo que esperaba en llegar, pero el producto cumple. Los uso todas las noches mientras laburo en la notebook y la verdad que duermo bastante mejor que antes.",
    image: testimonial3,
  },
  {
    name: "Andrés P.",
    role: "Encarnación",
    rating: 5,
    date: "Hace 1 semana",
    verified: true,
    quote: "Pense que era puro marketing nomas pero mi novia me regalo uno y la verdad que despues de unas semanas se nota bastante la diferencia. Duermo profundo de verdad.",
    image: testimonial4,
  },
  {
    name: "Diego R.",
    role: "Luque",
    rating: 4,
    date: "Hace 2 meses",
    verified: true,
    quote: "Soy diseñador asi que estoy toda la noche en la pantalla. Funcionan bien, duermo mejor. Lo unico es que al principio cuesta acostumbrarse a ver todo rojo, pero despues ni lo notas.",
    image: testimonial5,
  },
];

const containerVariants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  },
};

export const TestimonialsSection = () => {
  return (
    <section className="py-8 md:py-16 px-4 md:px-6 bg-black relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(239,68,68,0.08),transparent_50%)]" />

      <div className="container max-w-[1200px] mx-auto relative z-10">
        <div className="text-center mb-8 md:mb-12 space-y-3 md:space-y-4">
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold px-4">
            Trabajan de noche. Duermen profundo.
          </h2>
          <p className="text-base md:text-xl text-muted-foreground px-4">
            Emprendedores paraguayos que no sacrifican su sueño
          </p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-5"
        >
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="group p-5 md:p-6 bg-gradient-to-b from-card to-black border border-border/50 hover:border-primary/30 transition-all duration-300"
            >
              <div className="space-y-4 md:space-y-5">
                <div className="flex items-center gap-3">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-10 h-10 rounded-full object-cover object-center border border-border/50"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-foreground text-sm md:text-base">
                        {testimonial.name}
                      </p>
                      {testimonial.verified && (
                        <CheckBadgeIcon className="w-4 h-4 text-primary flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground font-light">
                      {testimonial.role}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      i < testimonial.rating ? (
                        <StarIcon key={i} className="w-3.5 h-3.5 md:w-4 md:h-4 star-gold" />
                      ) : (
                        <StarOutlineIcon key={i} className="w-3.5 h-3.5 md:w-4 md:h-4 text-muted-foreground/30" />
                      )
                    ))}
                  </div>
                  <span className="text-[10px] text-muted-foreground/60">{testimonial.date}</span>
                </div>

                <p className="text-foreground/80 leading-relaxed font-light text-sm">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
