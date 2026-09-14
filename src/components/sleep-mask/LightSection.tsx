import { useRef, type ReactNode } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import luz640 from "@/assets/sleep-mask/luz-640.webp";
import luz900 from "@/assets/sleep-mask/luz-900.webp";
import luz1168 from "@/assets/sleep-mask/luz-1168.webp";

const LIGHTS: readonly string[] = [
  "La luz de la calle que se cuela por la cortina.",
  "El sol que sale antes que tu alarma.",
  "La pantalla de tu pareja, que todavía no se duerme.",
  "El LED del cargador que nunca se apaga.",
];

// La foto cubre un cuadro de alto completo. En vertical se dibuja a lo alto
// (unas 1,06 veces el alto de pantalla de ancho), y sizes en vw pediria una
// foto chica que despues se estira.
//
// Es el recorte de la ventana de la escena del hero: la cortina con la luz de
// la manana y el antifaz asomando abajo. La original no da mas de 1168px de
// ancho para este recorte; en desktop se estira un poco, y como la seccion la
// va cubriendo de negro no se llega a notar.
const LIGHT_SIZES = "(orientation: portrait) 106vh, 100vw";

// Tramo del scroll en el que cada fuente de luz pasa al frente. Las cuatro
// terminan antes del 80%: lo que queda del recorrido es la oscuridad sola.
const lineRange = (index: number): [number, number] => [0.08 + index * 0.16, 0.2 + index * 0.16];

interface LightLineProps {
  text: string;
  index: number;
  progress: MotionValue<number>;
}

const LightLine = ({ text, index, progress }: LightLineProps) => {
  const opacity = useTransform(progress, lineRange(index), [0.32, 1]);
  return (
    <motion.li style={{ opacity }} className="text-[17px] leading-snug text-white md:text-xl">
      {text}
    </motion.li>
  );
};

const Photo = () => (
  <img
    src={luz900}
    srcSet={`${luz640} 640w, ${luz900} 900w, ${luz1168} 1168w`}
    sizes={LIGHT_SIZES}
    alt="Luz de mañana que entra por las cortinas de lino sobre la cama donde duerme una mujer con el antifaz NOCTE"
    loading="lazy"
    decoding="async"
    className="absolute inset-0 h-full w-full object-cover object-[30%_50%] md:object-[50%_62%]"
  />
);

const Copy = ({ children }: { children: ReactNode }) => (
  <div className="relative mx-auto flex h-full max-w-[1400px] flex-col justify-end px-5 pb-16 pt-24 sm:px-8 md:justify-center md:pb-24 lg:px-12">
    <div className="max-w-[34rem]">{children}</div>
  </div>
);

const Heading = () => (
  <h2
    id="mask-light-title"
    className="text-[34px] font-bold leading-[1.02] tracking-[-0.03em] text-white md:text-5xl lg:text-[60px]"
  >
    La luz que no controlás.
  </h2>
);

const CLOSING_LINE = "Con el antifaz puesto, oscuridad total. La noche la decidís vos.";

/**
 * La unica escena con movimiento autorado de la pagina: la habitacion del
 * hero, a pleno dia, se va apagando a medida que se scrollea, y cada fuente de
 * luz que no se puede controlar pasa al frente mientras tanto. Al final queda
 * el negro de NOCTE, que es exactamente lo que da el antifaz.
 *
 * Solo opacidad sobre un velo negro y sobre el texto, atado al scroll con
 * useScroll (sin listener propio). Con movimiento reducido no hay recorrido
 * fijo: la seccion es una pantalla ya oscurecida con todo el texto a la vista.
 */
export const LightSection = () => (useReducedMotion() ? <StillLight /> : <FadingLight />);

const StillLight = () => (
  <section aria-labelledby="mask-light-title" className="relative isolate min-h-[640px] overflow-hidden bg-black">
    <Photo />
    <div aria-hidden="true" className="absolute inset-0 bg-black/80" />
    <Copy>
      <Heading />
      <ul className="mt-8 space-y-4">
        {LIGHTS.map((light) => (
          <li key={light} className="text-[17px] leading-snug text-white md:text-xl">
            {light}
          </li>
        ))}
      </ul>
      <p className="mt-10 text-xl font-semibold leading-snug text-white md:text-2xl">{CLOSING_LINE}</p>
    </Copy>
  </section>
);

const FadingLight = () => {
  const trackRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: trackRef, offset: ["start start", "end end"] });
  const darkness = useTransform(scrollYProgress, [0.04, 0.84], [0.08, 1]);
  const closingOpacity = useTransform(scrollYProgress, [0.78, 0.92], [0, 1]);

  return (
    <section ref={trackRef} aria-labelledby="mask-light-title" className="relative h-[260svh] bg-black">
      <div className="sticky top-0 isolate h-[100svh] overflow-hidden">
        <Photo />
        {/* Piso de lectura: el texto blanco nunca queda sobre el lino claro,
            ni al principio del recorrido. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-black via-black/50 via-45% to-transparent to-75% md:bg-gradient-to-r md:from-black/90 md:via-black/45 md:to-transparent"
        />
        {/* Borde de arriba en negro: la escena entra desde el hero sin corte. */}
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black to-transparent" />
        <motion.div aria-hidden="true" style={{ opacity: darkness }} className="absolute inset-0 bg-black" />

        <Copy>
          <Heading />
          <ul className="mt-8 space-y-4">
            {LIGHTS.map((light, index) => (
              <LightLine key={light} text={light} index={index} progress={scrollYProgress} />
            ))}
          </ul>
          <motion.p
            style={{ opacity: closingOpacity }}
            className="mt-10 text-xl font-semibold leading-snug text-white md:text-2xl"
          >
            {CLOSING_LINE}
          </motion.p>
        </Copy>
      </div>
    </section>
  );
};
