import { Reveal } from "@/components/Reveal";
import { BOX_PHOTO } from "@/components/clip-on/photos";

// Lo que se ve en la foto de la caja, en el mismo orden en que se saca.
const CONTENTS: readonly string[] = ["Clip-On Rojo", "Estuche", "Paño de limpieza", "Caja NOCTE"];

/**
 * "Que me llega." La foto va apaisada en desktop porque los cuatro objetos
 * ocupan la franja del medio del cuadro; recortarla arriba y abajo no pierde
 * nada y la seccion no se vuelve una pantalla entera de blanco.
 */
export const BoxSection = () => (
  <section aria-labelledby="clipon-box-title" className="bg-[#050505] px-5 py-24 sm:px-8 md:py-32">
    <div className="mx-auto max-w-[1200px]">
      <Reveal
        as="h2"
        id="clipon-box-title"
        className="max-w-[16ch] text-[34px] font-bold leading-[1.02] tracking-[-0.03em] text-white [text-wrap:balance] md:text-5xl lg:text-[60px]"
      >
        Lo que llega a tu casa.
      </Reveal>

      <Reveal delay={60} className="mt-12 md:mt-16">
        <img
          src={BOX_PHOTO.src}
          alt={BOX_PHOTO.alt}
          width={BOX_PHOTO.width}
          height={BOX_PHOTO.height}
          loading="lazy"
          decoding="async"
          className="aspect-square w-full rounded-2xl bg-white/[0.06] object-cover md:aspect-[16/10]"
        />
      </Reveal>

      <ul className="mt-10 grid grid-cols-2 gap-x-6 gap-y-6 md:mt-12 md:grid-cols-4 md:gap-8">
        {CONTENTS.map((item, index) => (
          <Reveal as="li" key={item} delay={index * 60} className="border-t border-white/15 pt-4">
            <span className="text-base font-semibold text-white md:text-lg">{item}</span>
          </Reveal>
        ))}
      </ul>
    </div>
  </section>
);
