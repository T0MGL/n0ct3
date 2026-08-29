import { PlayIcon } from "@heroicons/react/24/solid";
import { Reveal } from "@/components/Reveal";
import productVideo from "@/assets/nocteglasses.mp4";
import videoPoster from "@/assets/nocte-video-poster.webp";
import { useRef, useEffect, useState } from "react";

export const ProductVideo = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  // El video corre sin barra de controles nunca: mudo, en loop y arrancando
  // solo. Se lee como un gif y esa es la idea. Lo unico que puede fallar es el
  // autoplay (ahorro de datos, reduced motion del sistema, alguna politica de
  // iOS) y ahi sin nada quedaria un poster congelado sin forma de arrancarlo,
  // asi que en ese caso aparece un boton de play propio, no la barra nativa.
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    let isMounted = true;

    let resolveWarmed: () => void = () => undefined;
    const warmed = new Promise<void>((resolve) => {
      resolveWarmed = resolve;
    });

    // Con reduced-motion no se arranca solo: un loop de 17 segundos que el
    // sistema pidio no reproducir es exactamente lo que la preferencia cubre.
    // Queda el boton, asi que se puede ver igual.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setAutoplayBlocked(true);
      return;
    }

    const playVideo = async () => {
      // El warmup llama load(), que resetea el elemento y aborta cualquier
      // play() en vuelo. Si los dos observers resuelven en el mismo tick (scroll
      // rapido, entrada por ancla) el play rechazaba con AbortError y se
      // prendia el boton encima de un video que arrancaba igual. Se espera al
      // warmup, y un AbortError no cuenta como autoplay bloqueado.
      await warmed;
      if (!isMounted) return;
      try {
        await videoElement.play();
        if (isMounted) setAutoplayBlocked(false);
      } catch (error) {
        if (!isMounted) return;
        if (error instanceof DOMException && error.name === "AbortError") return;
        setAutoplayBlocked(true);
        if (import.meta.env.DEV) {
          console.warn("Autoplay bloqueado por el navegador:", error);
        }
      }
    };

    // Fuera de pantalla se pausa. Un loop de 17 segundos corriendo mientras el
    // cliente lee el resto de la pagina gasta bateria por nada.
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!isMounted) return;
          if (entry.isIntersecting) {
            playVideo();
          } else if (!videoElement.paused) {
            videoElement.pause();
          }
        });
      },
      { threshold: 0.5 },
    );

    // Precarga adelantada. Con preload="metadata" el archivo empezaba a bajar
    // recien cuando el video ya estaba a media pantalla, asi que se veia el
    // poster quieto un rato y despues arrancaba de golpe. Este segundo
    // observador dispara la descarga 800px antes de que se vea, y para cuando
    // le toca reproducir ya tiene buffer.
    const warmup = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        warmup.disconnect();
        videoElement.preload = "auto";
        videoElement.load();
        resolveWarmed();
      },
      { rootMargin: "800px 0px" },
    );

    warmup.observe(videoElement);
    observer.observe(videoElement);

    return () => {
      isMounted = false;
      warmup.disconnect();
      observer.disconnect();
    };
  }, []);

  const handleManualPlay = () => {
    videoRef.current?.play().then(
      () => setAutoplayBlocked(false),
      () => undefined,
    );
  };

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
              // El poster es el cuadro 0 exacto del archivo. El anterior era
              // otra toma, un poco mas cerrada, asi que al aparecer el primer
              // cuadro real el encuadre saltaba: eso era el "aparece de
              // repente". Si se recorta o se reencoda el video, este poster se
              // regenera con el, o vuelve el salto.
              poster={videoPoster}
              loop
              muted
              playsInline
              disablePictureInPicture
              className="relative z-10 h-auto w-full rounded-lg"
              preload="metadata"
            >
              Tu navegador no soporta el elemento de video.
            </video>

            {autoplayBlocked && (
              <button
                type="button"
                onClick={handleManualPlay}
                aria-label="Reproducir la prueba de la tarjeta"
                className="absolute inset-0 z-20 grid place-items-center bg-black/30 transition-colors duration-200 hover:bg-black/20"
              >
                <span className="grid h-16 w-16 place-items-center rounded-full bg-white/90 shadow-lg transition-transform duration-200 active:scale-95">
                  <PlayIcon className="ml-1 h-7 w-7 text-black" />
                </span>
              </button>
            )}
          </Reveal>
        </div>
      </div>
    </section>
  );
};

export default ProductVideo;
