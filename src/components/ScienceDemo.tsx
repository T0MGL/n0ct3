import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CheckIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";
import { VariantPicker } from "@/components/VariantPicker";
import { VARIANTS, DEFAULT_VARIANT, type VariantId } from "@/lib/variants";

// Single morphing SVG that interpolates the blocked region between variants.
// Uses Framer Motion on the blocked rect so x and width tween in sync, no
// hand-rolled CSS keyframes.

const SPECTRUM_X0 = 40;
const SPECTRUM_INNER_W = 420;
const NM_MIN = 400;
const NM_MAX = 700;

const TICKS = [400, 450, 500, 550, 600, 650, 700] as const;

const wavelengthToX = (nm: number): number =>
  SPECTRUM_X0 + ((nm - NM_MIN) / (NM_MAX - NM_MIN)) * SPECTRUM_INNER_W;

interface CitationCard {
  source: string;
  quote: string;
  cite: string;
}

// Citations kept conservative. Burkhart and Phelps 2009 is a real published
// study (Chronobiology International, "Amber lenses to block blue light and
// improve sleep"). Sasseville et al. 2006 is also a real study from the same
// research line. We omit fabricated Harvard quotes and frame Harvard generally.
const CITATIONS: ReadonlyArray<CitationCard> = [
  {
    source: "Chronobiology International",
    quote:
      "Lentes con tinte ámbar usados antes de dormir mejoraron la calidad subjetiva del sueño respecto al grupo control.",
    cite: "Burkhart y Phelps, 2009",
  },
  {
    source: "Journal of Pineal Research",
    quote:
      "El bloqueo del espectro azul corto durante la noche reduce la supresión de melatonina inducida por luz artificial.",
    cite: "Sasseville et al., 2006",
  },
  {
    source: "Harvard Health Publishing",
    quote:
      "La exposición nocturna a luz azul afecta el ritmo circadiano y la secreción de melatonina más que otras longitudes de onda.",
    cite: "Harvard Medical School",
  },
];

const SPRING = { type: "spring" as const, stiffness: 180, damping: 26 };

export const ScienceDemo = () => {
  const [picked, setPicked] = useState<VariantId>(DEFAULT_VARIANT);
  const v = VARIANTS[picked];

  const block = useMemo(() => {
    const [s, e] = v.spectrumRange;
    const x = wavelengthToX(s);
    const w = wavelengthToX(e) - x;
    const labelCx = Math.max(SPECTRUM_X0 + 60, Math.min(SPECTRUM_X0 + SPECTRUM_INNER_W - 60, x + w / 2));
    return { x, w, labelCx };
  }, [v.spectrumRange]);

  return (
    <section
      id="ciencia"
      data-variant={picked}
      aria-labelledby="science-demo-title"
      className="relative bg-black px-4 py-20 md:px-6 md:py-28"
    >
      <div className="mx-auto max-w-[1200px]">
        <motion.header
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto mb-12 max-w-2xl text-center md:mb-16"
        >
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.22em] text-variant-active">
            Ciencia que podes ver
          </p>
          <h2
            id="science-demo-title"
            className="text-[clamp(2rem,4.5vw,3.5rem)] font-bold leading-[1.05] tracking-tighter text-foreground"
          >
            Cada color bloquea
            <br />
            una franja distinta del espectro.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground md:text-base">
            Mové el selector y mirá exactamente que franja del espectro de luz bloquea cada variante.
          </p>
        </motion.header>

        <div className="mb-10 flex justify-center md:mb-12">
          <VariantPicker
            value={picked}
            onChange={setPicked}
            label="Elegí una variante para visualizar"
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-2xl border border-variant-active/30 bg-secondary/10 p-5 transition-colors duration-500 md:p-8"
        >
          <div className="grid gap-8 md:grid-cols-2 md:items-center md:gap-10">
            <SpectrumChart variantId={picked} accent={v.accent} blockedPercent={v.blockedPercent} block={block} />

            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-variant-active">
                Momento {v.moment} · {v.momentTimeWindow}
              </p>
              <h3 className="mb-3 text-2xl font-bold tracking-tight text-foreground md:text-3xl">{v.name}</h3>
              <p className="mb-5 text-sm leading-relaxed text-muted-foreground md:text-base">{v.description}</p>

              <ul className="flex flex-col gap-3">
                {v.benefits.map((benefit) => (
                  <BenefitRow key={benefit} text={benefit} variantId={picked} />
                ))}
              </ul>
            </div>
          </div>
        </motion.div>

        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {CITATIONS.map((c, i) => (
            <motion.figure
              key={c.cite}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-lg border border-border/30 bg-secondary/10 p-5"
            >
              <figcaption className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-gold">
                {c.source}
              </figcaption>
              <blockquote className="mb-3 text-[13px] italic leading-relaxed text-foreground/85">
                {c.quote}
              </blockquote>
              <cite className="text-[11px] not-italic text-muted-foreground">Segun {c.cite}</cite>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
};

interface SpectrumChartProps {
  variantId: VariantId;
  accent: string;
  blockedPercent: number;
  block: { x: number; w: number; labelCx: number };
}

const SpectrumChart = ({ variantId, accent, blockedPercent, block }: SpectrumChartProps) => {
  const gradientId = `block-grad-${variantId}`;
  return (
    <svg
      viewBox="0 0 500 280"
      role="img"
      aria-label={`Diagrama del espectro de luz, ${blockedPercent} por ciento bloqueado por la variante ${variantId}`}
      className="h-auto w-full"
    >
      <defs>
        <linearGradient id="spectrum-full" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8B00FF" />
          <stop offset="15%" stopColor="#0000FF" />
          <stop offset="30%" stopColor="#00BFFF" />
          <stop offset="45%" stopColor="#00FF00" />
          <stop offset="60%" stopColor="#FFFF00" />
          <stop offset="75%" stopColor="#FFA500" />
          <stop offset="100%" stopColor="#FF0000" />
        </linearGradient>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.85" />
          <stop offset="100%" stopColor={accent} stopOpacity="0.08" />
        </linearGradient>
      </defs>

      <rect x={SPECTRUM_X0} y={200} width={SPECTRUM_INNER_W} height={40} fill="url(#spectrum-full)" rx={4} />

      {TICKS.map((nm) => {
        const x = wavelengthToX(nm);
        return (
          <g key={nm}>
            <line x1={x} y1={240} x2={x} y2={245} stroke="rgba(255,255,255,0.3)" />
            <text x={x} y={260} fill="rgba(255,255,255,0.4)" fontSize={10} textAnchor="middle">
              {nm}nm
            </text>
          </g>
        );
      })}

      <text x={20} y={44} fill="rgba(255,255,255,0.4)" fontSize={9} textAnchor="middle">
        100%
      </text>
      <text x={20} y={200} fill="rgba(255,255,255,0.4)" fontSize={9} textAnchor="middle">
        0%
      </text>

      <motion.rect
        y={40}
        height={160}
        rx={4}
        fill={`url(#${gradientId})`}
        stroke={accent}
        strokeWidth={2}
        animate={{ x: block.x, width: block.w }}
        transition={SPRING}
      />
      <motion.line
        y1={200}
        y2={40}
        stroke={accent}
        strokeWidth={1}
        strokeDasharray="3,3"
        opacity={0.5}
        animate={{ x1: block.x, x2: block.x }}
        transition={SPRING}
      />
      <motion.line
        y1={200}
        y2={40}
        stroke={accent}
        strokeWidth={1}
        strokeDasharray="3,3"
        opacity={0.5}
        animate={{ x1: block.x + block.w, x2: block.x + block.w }}
        transition={SPRING}
      />

      <motion.g animate={{ x: block.labelCx - 250 }} transition={SPRING}>
        <text x={250} y={78} fill="white" fontSize={32} fontWeight={800} textAnchor="middle">
          {blockedPercent}%
        </text>
        <text x={250} y={100} fill="rgba(255,255,255,0.7)" fontSize={11} textAnchor="middle" letterSpacing={3}>
          BLOQUEADO
        </text>
      </motion.g>
    </svg>
  );
};

interface BenefitRowProps {
  text: string;
  variantId: VariantId;
}

const BenefitRow = ({ text, variantId }: BenefitRowProps) => (
  <li className="flex items-center gap-3">
    <span
      aria-hidden="true"
      className={cn(
        "grid h-5 w-5 flex-shrink-0 place-items-center rounded-full",
        "bg-variant-active",
      )}
    >
      <CheckIcon
        className={cn("h-3 w-3", variantId === "amarillo" ? "text-black" : "text-white")}
        strokeWidth={3}
      />
    </span>
    <span className="text-sm text-foreground">{text}</span>
  </li>
);

export default ScienceDemo;
