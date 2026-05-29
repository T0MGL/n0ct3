import { motion } from "framer-motion";
import { staggerContainerVariants, staggerItemVariants } from "@/lib/animations";
import productVideo from "@/assets/nocteglasses.mp4";
import videoPoster from "@/assets/nocte-video-poster.webp";
import { useRef, useEffect } from "react";

export const ProductVideo = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    let isMounted = true;

    // Intenta reproducir el video cuando el componente se monta
    const playVideo = async () => {
      try {
        await videoElement.play();
      } catch (error) {
        // Autoplay puede ser bloqueado por el navegador. No es un error accionable:
        // el usuario reproduce manualmente con los controles.
        if (isMounted && import.meta.env.DEV) {
          console.warn("Autoplay bloqueado por el navegador:", error);
        }
      }
    };

    // Usa Intersection Observer para reproducir cuando esté visible
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && isMounted) {
            playVideo();
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(videoElement);

    return () => {
      isMounted = false;
      observer.disconnect();
    };
  }, []);

  return (
    <section data-section="product-video" className="py-6 md:py-8 lg:py-12 px-4 bg-gradient-to-b from-black via-secondary/20 to-black">
      <div className="container max-w-[900px] mx-auto">
        <motion.div
          variants={staggerContainerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="space-y-4 md:space-y-6 lg:space-y-8"
        >
          {/* Heading */}
          <motion.div variants={staggerItemVariants} className="text-center space-y-3">
            <h2 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold tracking-tight">
              NOCTE <sup className="text-[0.5em] ml-0.5">®</sup>
            </h2>
          </motion.div>

          {/* Video Container - Integrado en la página */}
          <motion.div
            variants={staggerItemVariants}
            className="relative w-full mx-auto overflow-hidden rounded-lg"
          >
            {/* Ambient glow effect - más sutil */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.1),transparent_70%)] pointer-events-none" />

            {/* Video element */}
            <video
              ref={videoRef}
              src={productVideo}
              poster={videoPoster}
              controls
              loop
              muted
              playsInline
              className="w-full h-auto relative z-10 rounded-lg"
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
