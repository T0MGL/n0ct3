import { StarIcon } from "@heroicons/react/24/solid";
import { motion } from "framer-motion";

// Import testimonial images correctly for Vite
import girlTestimonial2 from "../assets/girl-testimonial (2).webp";
import boyTestimonial1 from "../assets/boy-testimonial (1).webp";
import girlTestimonial1 from "../assets/girl-testimonial (1).webp";

const testimonials = [
  {
    name: "Dahiana A.",
    location: "Asunción",
    image: girlTestimonial2,
    rating: 5,
    title: "Valen 100% la pena",
    quote: "Literalmente me salvaron el sueño. Trabajo mucho con la compu de noche y me costaba demasiado 'apagar' el cerebro al terminar. Ahora me los pongo un rato antes y noto la diferencia enseguida.",
  },
  {
    name: "Santi M.",
    location: "Ciudad del Este",
    image: boyTestimonial1,
    rating: 5,
    title: "Superaron mis expectativas",
    quote: "Al principio pensé que era puro marketing, pero la verdad que funcionan. Los uso para viciar un rato o terminar pendientes antes de dormir y caigo rendido al toque.",
  },
  {
    name: "Lujan R.",
    location: "San Lorenzo",
    image: girlTestimonial1,
    rating: 5,
    title: "Productividad nivel hacker",
    quote: "Amo que no solo sirven para dormir mejor, sino que se ven súper bien. Los uso hasta para leer en el kindle y mis ojos ya no se sienten cansados al final del día.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

export const TestimonialsSection = () => {
  return (
    <section className="py-12 md:py-24 px-4 md:px-6 bg-black relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(239,68,68,0.1),transparent_50%)]" />

      <div className="container max-w-[1200px] mx-auto relative z-10">
        <div className="text-center mb-16 md:mb-20 space-y-4">
          <h2 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60 tracking-tight">
            Trabajan de noche. <br className="hidden md:block" /> Duermen profundo.
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-light">
            Más de 5.380 paraguayos ya hackearon su descanso
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
              className="relative flex flex-col items-center bg-[#f8f8f8] rounded-[2rem] p-8 md:p-10 shadow-xl"
            >
              {/* Profile Wrapper */}
              <div className="relative mb-6">
                <div className="w-32 h-32 md:w-36 md:h-36 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-200">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                {/* Decorative Quote Icon */}
                <div className="absolute -bottom-2 -right-2 bg-black w-14 h-14 rounded-full flex items-center justify-center shadow-lg border-4 border-white">
                  <svg
                    width="24"
                    height="20"
                    viewBox="0 0 24 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-white"
                  >
                    <path d="M10 0V9H5L8 16H3L0 9V0H10ZM24 0V9H19L22 16H17L14 9V0H24Z" fill="currentColor" />
                  </svg>
                </div>
              </div>

              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <StarIcon key={i} className="w-6 h-6 text-[#FFD700]" />
                ))}
              </div>

              {/* Title */}
              <h3 className="text-xl md:text-2xl font-black text-black text-center mb-3 tracking-tight">
                {testimonial.title}
              </h3>

              {/* Quote */}
              <p className="text-[#444] text-center leading-relaxed font-medium">
                {testimonial.quote}
              </p>

              {/* Author */}
              <div className="mt-8 pt-6 border-t border-gray-300 w-full text-center">
                <p className="font-bold text-gray-900 uppercase tracking-wider text-sm">
                  {testimonial.name}
                </p>
                <p className="text-xs text-gray-600 font-bold mt-1">
                  {testimonial.location}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
