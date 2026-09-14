import { Reveal } from "@/components/Reveal";
import { cn } from "@/lib/utils";
import copa640 from "@/assets/sleep-mask/copa-3d-640.webp";
import copa960 from "@/assets/sleep-mask/copa-3d-960.webp";
import copa1400 from "@/assets/sleep-mask/copa-3d-1400.webp";
import frente480 from "@/assets/sleep-mask/frente-480.webp";
import frente720 from "@/assets/sleep-mask/frente-720.webp";
import frente1080 from "@/assets/sleep-mask/frente-1080.webp";
import correa480 from "@/assets/sleep-mask/correa-480.webp";
import correa720 from "@/assets/sleep-mask/correa-720.webp";
import correa1068 from "@/assets/sleep-mask/correa-1068.webp";

interface Detail {
  title: string;
  body: string;
  src: string;
  srcSet: string;
  sizes: string;
  alt: string;
}

// Solo lo que el antifaz cumple y se ve en las fotos: oscuridad, la copa que
// no toca los parpados, la correa y que es suave. Nada de materiales, medidas
// ni porcentajes que no esten verificados.
const CUP: Detail = {
  title: "Copa 3D contorneada",
  body: "Las copas rodean los ojos y no apoyan sobre los párpados. Cero presión, toda la noche.",
  src: copa960,
  srcSet: `${copa640} 640w, ${copa960} 960w, ${copa1400} 1400w`,
  sizes: "(min-width: 1240px) 680px, (min-width: 768px) 56vw, 100vw",
  alt: "Interior del antifaz NOCTE: dos copas 3D acolchadas con el hueco para cada ojo",
};

const SIDE_DETAILS: readonly Detail[] = [
  {
    title: "Frente suave",
    body: "Suave al tacto, con el NOCTE al frente.",
    src: frente720,
    srcSet: `${frente480} 480w, ${frente720} 720w, ${frente1080} 1080w`,
    sizes: "(min-width: 1240px) 480px, (min-width: 768px) 39vw, 50vw",
    alt: "Frente del antifaz NOCTE negro con el logo en blanco, apoyado sobre sábanas",
  },
  {
    title: "Correa ajustable",
    body: "La regulás a la medida de tu cabeza.",
    src: correa720,
    srcSet: `${correa480} 480w, ${correa720} 720w, ${correa1068} 1068w`,
    sizes: "(min-width: 1240px) 480px, (min-width: 768px) 39vw, 50vw",
    alt: "Correa del antifaz NOCTE con la hebilla para regular el largo",
  },
];

interface DetailFigureProps {
  detail: Detail;
  imageClassName: string;
  className?: string;
  delay?: number;
}

const DetailFigure = ({ detail, imageClassName, className, delay }: DetailFigureProps) => (
  <Reveal as="figure" delay={delay} className={className}>
    <img
      src={detail.src}
      srcSet={detail.srcSet}
      sizes={detail.sizes}
      alt={detail.alt}
      loading="lazy"
      decoding="async"
      className={cn("w-full rounded-xl bg-white/[0.04] object-cover", imageClassName)}
    />
    <figcaption className="mt-4">
      <h3 className="text-lg font-semibold tracking-[-0.01em] text-white md:text-xl">{detail.title}</h3>
      <p className="mt-1.5 max-w-[36ch] text-[15px] leading-relaxed text-white/65">{detail.body}</p>
    </figcaption>
  </Reveal>
);

/**
 * Como esta hecho, en fotos de cerca. La copa manda porque es la objecion
 * real ("me va a apretar los ojos"); la correa y el frente la acompanan en
 * chico. En mobile los dos chicos van lado a lado para que la seccion no sean
 * tres pantallas de foto.
 */
export const BuildSection = () => (
  <section aria-labelledby="mask-build-title" className="bg-black px-5 py-24 sm:px-8 md:py-32">
    <div className="mx-auto max-w-[1200px]">
      <Reveal
        as="h2"
        id="mask-build-title"
        className="max-w-[16ch] text-[34px] font-bold leading-[1.02] tracking-[-0.03em] text-white [text-wrap:balance] md:text-5xl lg:text-[60px]"
      >
        Oscuridad total sin tocarte los ojos.
      </Reveal>

      <div className="mt-12 grid gap-10 md:mt-16 md:grid-cols-12 md:gap-8 lg:gap-12">
        <DetailFigure detail={CUP} className="md:col-span-7" imageClassName="aspect-square md:aspect-[4/5]" />
        <div className="grid grid-cols-2 gap-4 md:col-span-5 md:grid-cols-1 md:gap-10">
          {SIDE_DETAILS.map((detail, index) => (
            <DetailFigure
              key={detail.title}
              detail={detail}
              delay={80 + index * 60}
              imageClassName="aspect-square md:aspect-[4/3]"
            />
          ))}
        </div>
      </div>
    </div>
  </section>
);
