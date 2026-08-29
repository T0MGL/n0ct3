import { Reveal } from "@/components/Reveal";
import productVideo from "@/assets/nocteglasses.mp4";
import videoPoster from "@/assets/nocte-video-poster.webp";
import { useRef, useEffect, useState } from "react";

export const ProductVideo = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  // El video corre sin controles, en loop y mudo: se comporta como un gif y
  // esa es la lectura que queremos. Pero si el navegador bloquea el autoplay
  // (ahorro de datos, reduced motion del sistema, alguna politica de iOS) sin
  // controles queda un poster congelado sin forma de arrancarlo. Ahi y solo
  // ahi aparecen los controles.
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    let isMounted = true;

    const playVideo = async () => {
      try {
        await videoElement.play();
      } catch (error) {
        if (!isMounted) return;
        setAutoplayBlocked(true);
        if (import.meta.env.DEV) {
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
        <div className="space-y-4 md:space-y-6 lg:space-y-8">
          {/* Heading */}
          <Reveal className="space-y-3 text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-variant-active">
              La prueba de la tarjeta
            </p>
            <h2 className="text-2xl font-bold tracking-tighter md:text-3xl lg:text-4xl xl:text-5xl">
              Miralo con tus propios ojos
            </h2>
            <p className="mx-auto max-w-[46ch] text-base text-muted-foreground md:text-lg">
              La misma tarjeta de prueba de luz azul, vista a través del cristal NOCTE y a
              través de un lente común.
            </p>
          </Reveal>

          {/* El video es vertical 9:16. Sin tope de ancho se estiraba a los 900
              del contenedor, o sea 836 por 1486 en desktop: un bloque mas alto
              que la pantalla, y ademas escalando la fuente de 720 hacia arriba.
              Con el tope entra entero en el viewport y se ve nitido. */}
          <Reveal delay={70} className="relative mx-auto w-full max-w-[420px] overflow-hidden rounded-lg">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.1),transparent_70%)]" />

            <video
              ref={videoRef}
              src={productVideo}
              poster={videoPoster}
              controls={autoplayBlocked}
              loop
              muted
              playsInline
              className="relative z-10 h-auto w-full rounded-lg"
              preload="metadata"
            >
              Tu navegador no soporta el elemento de video.
            </video>
          </Reveal>
        </div>
      </div>
    </section>
  );
};

export default ProductVideo;
