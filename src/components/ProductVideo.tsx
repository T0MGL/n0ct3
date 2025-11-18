import { motion } from "framer-motion";
import { fadeInUpView } from "@/lib/animations";
import productVideo from "@/assets/nocteglasses.mp4";

export const ProductVideo = () => {
  return (
    <section data-section="product-video" className="py-16 md:py-24 px-4 bg-gradient-to-b from-black via-secondary/20 to-black">
      <div className="container max-w-[1200px] mx-auto">
        <motion.div
          {...fadeInUpView}
          className="space-y-6 md:space-y-8"
        >
          {/* Heading */}
          <div className="text-center space-y-3">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
              Ve los <span className="text-primary">NOCTE<sup className="text-[0.5em] ml-0.5">®</sup></span> en acción
            </h2>
            <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto">
              Descubre cómo nuestros lentes de bloqueo de luz roja se ven y se sienten en la vida real
            </p>
          </div>

          {/* Video Container */}
          <motion.div
            {...fadeInUpView}
            transition={{ ...fadeInUpView.transition, delay: 0.2 }}
            className="relative w-full overflow-hidden bg-gradient-to-b from-black via-card/20 to-black border border-gold/30 shadow-[0_4px_6px_rgba(0,0,0,0.1)]"
          >
            {/* Ambient glow effect */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.15),transparent_60%)] pointer-events-none" />

            {/* Video element */}
            <video
              src={productVideo}
              controls
              loop
              muted
              playsInline
              className="w-full h-auto relative z-10"
              preload="metadata"
            >
              Tu navegador no soporta el elemento de video.
            </video>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default ProductVideo;
