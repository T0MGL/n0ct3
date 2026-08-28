import { CheckIcon } from "@heroicons/react/24/outline";
import { Reveal } from "@/components/Reveal";
import { Button } from "@/components/ui/button";
import { ALL_VARIANTS_SOLD_OUT } from "@/lib/variants";

interface GuaranteeSectionProps {
  onBuyClick: () => void;
}

const SEAL_TEXT =
  "DORMÍ MEJOR EN 30 DÍAS · O DEVOLVEMOS TU DINERO · SIN PREGUNTAS · ";

const TRUST_POINTS: ReadonlyArray<string> = [
  "Los lentes los quedás vos, no los tenés que devolver",
  "Reembolso en 48 horas por la misma vía de pago",
  "Vos asumís cero riesgo, la garantía es nuestra",
];

const TRUST_BADGES: ReadonlyArray<string> = [
  "Envío gratis a todo Paraguay",
  "Garantía 30 días",
  "Soporte directo por WhatsApp",
];

export const GuaranteeSection = ({ onBuyClick }: GuaranteeSectionProps) => {
  return (
    <section
      id="garantia"
      aria-labelledby="guarantee-title"
      className="relative overflow-hidden bg-gradient-to-b from-black to-[#0a0000] px-4 pb-20 pt-10 md:px-6 md:pb-28 md:pt-14"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.1),transparent_60%)]"
      />

      <div className="container relative z-10 mx-auto grid max-w-[1000px] items-center gap-12 md:grid-cols-[1fr_1.4fr] md:gap-14">
        <Reveal from="scale" className="relative mx-auto">
          <RotatingSeal />
        </Reveal>

        <Reveal delay={90}>
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.22em] text-variant-active">
            Riesgo cero
          </p>
          <h2
            id="guarantee-title"
            className="mb-5 text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.05] tracking-tighter text-foreground"
          >
            Probalos 30 noches.
            <br />
            Si no dormís mejor, te devolvemos cada Guaraní.
          </h2>
          <p className="mb-7 text-base leading-relaxed text-muted-foreground md:text-lg">
            Sin formularios. Sin preguntas. Sin letra chica. Si después de 30 noches usándolos no notás cambios en tu sueño, escribinos por WhatsApp y te devolvemos el cien por ciento.
          </p>

          <ul className="mb-8 flex flex-col gap-3">
            {TRUST_POINTS.map((point) => (
              <li key={point} className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="grid h-6 w-6 flex-shrink-0 place-items-center rounded-full bg-variant-active"
                >
                  <CheckIcon className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                </span>
                <span className="text-sm text-foreground md:text-[15px]">{point}</span>
              </li>
            ))}
          </ul>

          <Button
            data-guarantee-cta
            variant="hero"
            size="xl"
            disabled={ALL_VARIANTS_SOLD_OUT}
            className={
              ALL_VARIANTS_SOLD_OUT
                ? "w-full sm:w-auto sm:min-w-[280px]"
                : "w-full sm:w-auto sm:min-w-[280px] shadow-[0_8px_24px_rgba(239,68,68,0.4)]"
            }
            onClick={onBuyClick}
          >
            {ALL_VARIANTS_SOLD_OUT ? "Agotado · Reponemos pronto" : "Probarlos sin riesgo"}
          </Button>

          <ul className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
            {TRUST_BADGES.map((badge, i) => (
              <li key={badge} className="flex items-center gap-2">
                {i > 0 && (
                  <span aria-hidden="true" className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                )}
                <span>{badge}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
};

const RotatingSeal = () => (
  <div className="relative mx-auto flex h-[260px] w-[260px] items-center justify-center md:h-[280px] md:w-[280px]">
    <div
      aria-hidden="true"
      className="nocte-seal-spin absolute inset-0 rounded-full border-[3px] border-variant-active"
    >
      <svg viewBox="0 0 280 280" className="absolute inset-0 h-full w-full">
        <defs>
          <path
            id="guarantee-seal-path"
            d="M 140,140 m -120,0 a 120,120 0 1,1 240,0 a 120,120 0 1,1 -240,0"
          />
        </defs>
        <text fill="hsl(var(--variant-active))" fontSize={13} fontWeight={700} letterSpacing={6}>
          <textPath href="#guarantee-seal-path">{SEAL_TEXT.repeat(2)}</textPath>
        </text>
      </svg>
    </div>

    <div className="absolute inset-[30px] flex flex-col items-center justify-center rounded-full border border-variant-active/40 bg-gradient-to-br from-variant-active/20 to-variant-active/5">
      <span className="text-[64px] font-extrabold leading-none tracking-tighter text-variant-active">
        30
      </span>
      <span className="mt-1 text-[12px] tracking-[0.2em] text-foreground">DÍAS</span>
      <span className="mt-1 text-[11px] tracking-[0.15em] text-muted-foreground">
        GARANTÍA TOTAL
      </span>
    </div>
  </div>
);

export default GuaranteeSection;
