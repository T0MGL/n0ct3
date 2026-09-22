import { Reveal } from "@/components/Reveal";
import { DETACHED_PHOTO, MECHANISM_PHOTO, type ClipOnPhoto } from "@/components/clip-on/photos";
import { cn } from "@/lib/utils";

interface Step {
  title: string;
  body: string;
  photo: ClipOnPhoto;
}

// Lo que dicen las fotos y nada mas: el clip con resorte y las almohadillas lo
// sujetan, y se saca en un segundo. Ni medidas ni compatibilidad con marcos
// que no esten verificadas.
const ON: Step = {
  title: "Se engancha",
  body: "El clip con resorte y las almohadillas de goma lo sujetan al frente de tus lentes.",
  photo: MECHANISM_PHOTO,
};

const OFF: Step = {
  title: "Se saca en un segundo",
  body: "Lo levantás del frente y tus lentes quedan como siempre.",
  photo: DETACHED_PHOTO,
};

interface StepFigureProps {
  step: Step;
  imageClassName: string;
  className?: string;
  delay?: number;
}

const StepFigure = ({ step, imageClassName, className, delay }: StepFigureProps) => (
  <Reveal as="figure" delay={delay} className={className}>
    <img
      src={step.photo.src}
      alt={step.photo.alt}
      width={step.photo.width}
      height={step.photo.height}
      loading="lazy"
      decoding="async"
      className={cn("w-full rounded-2xl bg-white/[0.06] object-cover", imageClassName)}
    />
    <figcaption className="mt-4">
      <h3 className="text-lg font-semibold tracking-[-0.01em] text-white md:text-xl">{step.title}</h3>
      <p className="mt-1.5 max-w-[36ch] text-[15px] leading-relaxed text-white/65">{step.body}</p>
    </figcaption>
  </Reveal>
);

/**
 * La objecion de fondo del que usa aumento: "no quiero andar sacandome los
 * lentes". El clip manda en grande porque es lo que sostiene la promesa; el
 * clip suelto baja un escalon en desktop porque es el paso que viene despues.
 */
export const MechanismSection = () => (
  <section aria-labelledby="clipon-mechanism-title" className="bg-black px-5 py-24 sm:px-8 md:py-32">
    <div className="mx-auto max-w-[1200px]">
      <Reveal
        as="h2"
        id="clipon-mechanism-title"
        className="max-w-[16ch] text-[34px] font-bold leading-[1.02] tracking-[-0.03em] text-white [text-wrap:balance] md:text-5xl lg:text-[60px]"
      >
        Se engancha. Se saca.
      </Reveal>

      <div className="mt-12 grid gap-10 md:mt-16 md:grid-cols-12 md:gap-8 lg:gap-12">
        <StepFigure step={ON} className="md:col-span-7" imageClassName="aspect-square md:aspect-[4/5]" />
        <StepFigure
          step={OFF}
          delay={80}
          className="md:col-span-5 md:mt-32"
          imageClassName="aspect-[4/3] md:aspect-square"
        />
      </div>
    </div>
  </section>
);
