import { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from "framer-motion";

// Single-beat reveal: as the section enters the viewport, the blue spectral peak
// at 455nm collapses, going from "sin proteccion" to "con proteccion". One pass,
// it does not loop. The whole animation is driven by one motion value `t` (0 to 1)
// so every derived path, opacity and label reads from the same timeline.
//
// Geometry and apex math are lifted verbatim from the validated frame render
// (founder-os/outputs/nocte/ceo/assets/spectrum-creative/frame-render.html) so the
// on-site component matches the signed-off creative exactly. Spectrum stops match
// ScienceDemo.tsx, which keeps the wavelength to color mapping consistent across
// the landing.

const BASELINE = 520;
const SPECTRUM_BLUE = "#00BFFF";
const ANIM_DURATION_MS = 2200;

const lerp = (a: number, b: number, k: number): number => a + (b - a) * k;

// easeInOutQuad, the same curve the static renderer used for `ease`.
const easeInOutQuad = (t: number): number =>
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

const buildCurvePath = (ease: number): string => {
  const apex1y = lerp(175, 516, ease);
  const apex2y = lerp(70, 516, ease);
  const apex3y = lerp(70, 516, ease);
  const apex4y = lerp(130, 510, ease);

  return `M 120 ${BASELINE}
    C 150 ${BASELINE}, 175 ${lerp(360, 518, ease)}, 205 ${apex1y}
    C 222 ${apex2y}, 255 ${apex3y}, 278 ${apex4y}
    C 320 ${lerp(235, 500, ease)}, 380 ${lerp(330, 470, ease)}, 460 ${lerp(400, 420, ease)}
    C 560 ${lerp(460, 400, ease)}, 680 ${lerp(490, 440, ease)}, 820 505
    L 820 ${BASELINE} Z`;
};

// The ghost is the frozen "sin proteccion" silhouette of the blue peak. It does
// not morph, it just fades in as the live curve flattens, so the eye reads the
// difference between before and after.
const GHOST_PATH = `M 120 520
  C 150 520, 175 360, 205 175
  C 222 70, 255 70, 278 130
  C 320 235, 353 300, 353 300`;

const TICKS: ReadonlyArray<{ x: number; nm: number }> = [
  { x: 120, nm: 400 },
  { x: 248, nm: 455 },
  { x: 353, nm: 500 },
  { x: 587, nm: 600 },
  { x: 820, nm: 700 },
];

interface MorphChartProps {
  t: MotionValue<number>;
  reduced: boolean;
}

const MorphChart = ({ t, reduced }: MorphChartProps) => {
  const curveRef = useRef<SVGPathElement>(null);
  const ease = useTransform(t, easeInOutQuad);

  const ghostOpacity = useTransform(ease, (e) => e * 0.6);
  const zoneOpacity = useTransform(ease, (e) => (Math.max(0, e - 0.35) / 0.65) * 0.12);
  const tagOpacity = useTransform(ease, (e) => Math.max(0, e - 0.55) / 0.45);

  // The `d` attribute is not a CSS property, so it cannot ride on motion's
  // `style`. We subscribe the eased value and write the rebuilt path straight
  // to the element. This keeps the morph on the same timeline without a per
  // frame React render.
  useEffect(() => {
    const node = curveRef.current;
    if (!node) return;
    if (reduced) {
      node.setAttribute("d", buildCurvePath(1));
      return;
    }
    node.setAttribute("d", buildCurvePath(ease.get()));
    const unsubscribe = ease.on("change", (e) => node.setAttribute("d", buildCurvePath(e)));
    return unsubscribe;
  }, [ease, reduced]);

  return (
    <svg
      viewBox="0 0 900 620"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={
        reduced
          ? "Diagrama del espectro de luz. El pico de luz azul a 455 nanómetros está aplanado, bloqueando el 99 por ciento de la luz azul."
          : "Diagrama del espectro de luz. El pico de luz azul a 455 nanómetros se aplana al activar la protección, bloqueando el 99 por ciento de la luz azul."
      }
      className="h-auto w-full"
    >
      <defs>
        <linearGradient
          id="blm-spectrum"
          x1="120"
          y1="0"
          x2="820"
          y2="0"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#8B00FF" />
          <stop offset="0.15" stopColor="#0000FF" />
          <stop offset="0.30" stopColor="#00BFFF" />
          <stop offset="0.45" stopColor="#00FF00" />
          <stop offset="0.60" stopColor="#FFFF00" />
          <stop offset="0.75" stopColor="#FFA500" />
          <stop offset="1" stopColor="#FF0000" />
        </linearGradient>
      </defs>

      <motion.rect
        x={120}
        y={60}
        width={233}
        height={460}
        rx={6}
        fill="#FFFFFF"
        style={reduced ? { opacity: 0.12 } : { opacity: zoneOpacity }}
      />

      <path ref={curveRef} fill="url(#blm-spectrum)" d={buildCurvePath(reduced ? 1 : 0)} />

      <motion.path
        d={GHOST_PATH}
        fill="none"
        stroke={SPECTRUM_BLUE}
        strokeWidth={3}
        strokeDasharray="7 7"
        style={reduced ? { opacity: 0.6 } : { opacity: ghostOpacity }}
      />

      <motion.g style={reduced ? { opacity: 1 } : { opacity: tagOpacity }}>
        <text
          x={236}
          y={120}
          textAnchor="middle"
          fill={SPECTRUM_BLUE}
          style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 30 }}
        >
          99%
        </text>
        <text
          x={236}
          y={156}
          textAnchor="middle"
          fill="hsl(var(--foreground))"
          style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 22 }}
        >
          BLOQUEADO
        </text>
      </motion.g>

      <path d="M 120 60 L 120 520" stroke="rgba(255,255,255,0.55)" strokeWidth={3} fill="none" />
      <path d="M 120 520 L 830 520" stroke="rgba(255,255,255,0.55)" strokeWidth={3} fill="none" />

      {TICKS.map(({ x, nm }) => (
        <g key={nm}>
          <line x1={x} y1={520} x2={x} y2={532} stroke="rgba(255,255,255,0.30)" strokeWidth={1.5} />
          <text
            x={x}
            y={560}
            textAnchor="middle"
            fill="rgba(255,255,255,0.50)"
            style={{ fontWeight: 700, fontSize: 25 }}
          >
            {nm}
          </text>
        </g>
      ))}

      <text
        x={475}
        y={592}
        textAnchor="middle"
        fill="rgba(255,255,255,0.45)"
        style={{ fontWeight: 800, fontSize: 23, letterSpacing: 1, textTransform: "uppercase" }}
      >
        Longitud de onda (nm)
      </text>
    </svg>
  );
};

export const BlueLightMorph = () => {
  const reduced = useReducedMotion() ?? false;
  const t = useMotionValue(reduced ? 1 : 0);
  const hasRun = useRef(false);

  // `isProtected` flips at the animation midpoint so the headline and subtitle
  // swap in sync with the curve crossing into the flattened state.
  const [isProtected, setIsProtected] = useState(reduced);

  useEffect(() => {
    if (reduced) {
      setIsProtected(true);
      t.set(1);
      return;
    }
    const unsubscribe = t.on("change", (value) =>
      setIsProtected((prev) => {
        const next = value >= 0.5;
        return prev === next ? prev : next;
      }),
    );
    return unsubscribe;
  }, [reduced, t]);

  const playOnce = () => {
    if (reduced || hasRun.current) return;
    hasRun.current = true;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / ANIM_DURATION_MS);
      t.set(progress);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  return (
    <section
      id="luz-azul"
      aria-labelledby="blue-light-morph-title"
      className="relative bg-background px-4 py-20 md:px-6 md:py-28"
    >
      <div className="mx-auto max-w-[1100px]">
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 24 }}
          whileInView={
            reduced
              ? undefined
              : { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
          }
          viewport={{ once: true, amount: 0.4 }}
          onViewportEnter={playOnce}
          className="mx-auto mb-10 max-w-2xl text-center md:mb-14"
        >
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.22em] text-primary">
            La ciencia detrás de NOCTE
          </p>
          <h2
            id="blue-light-morph-title"
            className="text-[clamp(2rem,5vw,3.75rem)] font-black uppercase leading-[0.98] tracking-tighter text-foreground"
          >
            {isProtected ? "Con" : "Sin"} protección de{" "}
            <span className="text-primary">luz azul.</span>
          </h2>
          <p className="mx-auto mt-4 min-h-[2.5rem] max-w-xl text-base text-muted-foreground">
            {isProtected
              ? "Bloqueás el 99% de la luz azul dañina antes de que llegue a tus ojos."
              : "Toda la luz azul de la pantalla llega directo a tus ojos."}
          </p>
        </motion.div>

        <motion.div
          initial={reduced ? false : { opacity: 0, y: 24 }}
          whileInView={
            reduced
              ? undefined
              : { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } }
          }
          viewport={{ once: true, amount: 0.2 }}
          className="rounded-2xl border border-primary/25 bg-secondary/10 p-4 md:p-8"
        >
          <MorphChart t={t} reduced={reduced} />
        </motion.div>
      </div>
    </section>
  );
};

export default BlueLightMorph;
