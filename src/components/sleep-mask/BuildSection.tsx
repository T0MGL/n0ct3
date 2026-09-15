import { Reveal } from "@/components/Reveal";
import { ColorPhotoStack } from "@/components/sleep-mask/ColorPhotoStack";
import {
  BUILD_CUP_PHOTOS,
  BUILD_CUP_SIZES,
  BUILD_FRONT_PHOTOS,
  BUILD_SIDE_SIZES,
  BUILD_STRAP_PHOTOS,
  type ColorPhotos,
} from "@/components/sleep-mask/photos";
import type { MaskColorId } from "@/lib/mask-colors";
import { cn } from "@/lib/utils";

interface Detail {
  title: string;
  body: string;
  photos: ColorPhotos;
  sizes: string;
}

// Solo lo que el antifaz cumple y se ve en las fotos: oscuridad, la copa que
// no toca los parpados, la correa y que es suave. Nada de materiales, medidas
// ni porcentajes que no esten verificados.
const CUP: Detail = {
  title: "Copa 3D contorneada",
  body: "Las copas rodean los ojos y no apoyan sobre los párpados. Cero presión, toda la noche.",
  photos: BUILD_CUP_PHOTOS,
  sizes: BUILD_CUP_SIZES,
};

const SIDE_DETAILS: readonly Detail[] = [
  {
    title: "Frente suave",
    body: "Suave al tacto, con el NOCTE al frente.",
    photos: BUILD_FRONT_PHOTOS,
    sizes: BUILD_SIDE_SIZES,
  },
  {
    title: "Correa ajustable",
    body: "La regulás a la medida de tu cabeza.",
    photos: BUILD_STRAP_PHOTOS,
    sizes: BUILD_SIDE_SIZES,
  },
];

interface DetailFigureProps {
  detail: Detail;
  color: MaskColorId;
  imageClassName: string;
  className?: string;
  delay?: number;
}

const DetailFigure = ({ detail, color, imageClassName, className, delay }: DetailFigureProps) => (
  <Reveal as="figure" delay={delay} className={className}>
    <ColorPhotoStack
      color={color}
      photos={detail.photos}
      sizes={detail.sizes}
      className={cn("w-full rounded-xl bg-white/[0.04]", imageClassName)}
    />
    <figcaption className="mt-4">
      <h3 className="text-lg font-semibold tracking-[-0.01em] text-white md:text-xl">{detail.title}</h3>
      <p className="mt-1.5 max-w-[36ch] text-[15px] leading-relaxed text-white/65">{detail.body}</p>
    </figcaption>
  </Reveal>
);

interface BuildSectionProps {
  activeColor: MaskColorId;
}

/**
 * Como esta hecho, en fotos de cerca. La copa manda porque es la objecion
 * real ("me va a apretar los ojos"); la correa y el frente la acompanan en
 * chico. En mobile los dos chicos van lado a lado para que la seccion no sean
 * tres pantallas de foto.
 */
export const BuildSection = ({ activeColor }: BuildSectionProps) => (
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
        <DetailFigure detail={CUP} color={activeColor} className="md:col-span-7" imageClassName="aspect-square md:aspect-[4/5]" />
        <div className="grid grid-cols-2 gap-4 md:col-span-5 md:grid-cols-1 md:gap-10">
          {SIDE_DETAILS.map((detail, index) => (
            <DetailFigure
              key={detail.title}
              detail={detail}
              color={activeColor}
              delay={80 + index * 60}
              imageClassName="aspect-square md:aspect-[4/3]"
            />
          ))}
        </div>
      </div>
    </div>
  </section>
);
