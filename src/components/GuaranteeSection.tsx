import { CheckIcon } from "@heroicons/react/24/outline";
import { Reveal } from "@/components/Reveal";
import { Button } from "@/components/ui/button";
import { ALL_VARIANTS_SOLD_OUT } from "@/lib/variants";

interface GuaranteeSectionProps {
  onBuyClick: () => void;
}

/**
 * Una sola vuelta de texto sobre el sello. El path mide 754px de
 * circunferencia y con el tracking de abajo esta frase entra justa: repetirla
 * la hacia dar mas de una vuelta y la cola se dibujaba encima de la cabeza
 * ("SIN PRDORMÍ"). Si se cambia la frase hay que rever fontSize y tracking.
 */
const SEAL_TEXT = "DORMÍ MEJOR EN 30 DÍAS · O DEVOLVEMOS TU DINERO · SIN PREGUNTAS · ";
const SEAL_FONT_SIZE = 12.5;
const SEAL_TRACKING = 4.2;

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
      className="relative overflow-hidden bg-gradient-to-b from-black to-[#0a0000] px-4 pb-20 pt-14 md:px-6 md:pb-28 md:pt-20"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.1),transparent_60%)]"
      />

      {/* Columna unica centrada. Antes el sello iba centrado y la columna de
          texto al costado alineada a la izquierda, asi que la seccion tenia
          dos ejes peleando y sobraba medio metro de negro abajo del sello.
          El cierre de una landing va centrado: es la unica seccion que no
          esta contando nada, esta sacando el riesgo de la mesa. */}
      <div className="container relative z-10 mx-auto flex max-w-[720px] flex-col items-center text-center">
        <Reveal from="scale">
          <RotatingSeal />
        </Reveal>

        <Reveal delay={90} className="mt-8 md:mt-10">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.22em] text-variant-active">
            Riesgo cero
          </p>
          <h2
            id="guarantee-title"
            className="mx-auto mb-5 max-w-[18ch] text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.05] tracking-tighter text-foreground"
          >
            Probalos 30 noches. Si no dormís mejor, te devolvemos cada Guaraní.
          </h2>
          <p className="mx-auto max-w-[52ch] text-base leading-relaxed text-muted-foreground md:text-lg">
            Sin formularios. Sin preguntas. Sin letra chica. Si después de 30 noches
            usándolos no notás cambios en tu sueño, escribinos por WhatsApp y te devolvemos
            el cien por ciento.
          </p>
        </Reveal>

        {/* La lista va centrada como bloque pero con el texto alineado a la
            izquierda adentro: centrar renglones de largos distintos deja los
            tildes bailando y cuesta leerlos. */}
        <Reveal delay={140} as="ul" className="mt-8 flex w-fit flex-col gap-3 text-left">
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
        </Reveal>

        <Reveal delay={190} className="mt-8 w-full">
          <Button
            data-guarantee-cta
            variant="hero"
            size="xl"
            disabled={ALL_VARIANTS_SOLD_OUT}
            className={
              ALL_VARIANTS_SOLD_OUT
                ? "w-full sm:w-auto sm:min-w-[300px]"
                : "w-full shadow-[0_8px_24px_rgba(239,68,68,0.4)] sm:w-auto sm:min-w-[300px]"
            }
            onClick={onBuyClick}
          >
            {ALL_VARIANTS_SOLD_OUT ? "Agotado · Reponemos pronto" : "Probarlos sin riesgo"}
          </Button>

          {/* Sin puntitos separadores: al envolverse en mobile, el punto
              quedaba encabezando el renglon de abajo como si fuera una vineta.
              El espacio ya separa. */}
          <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-7 gap-y-2 text-xs text-muted-foreground">
            {TRUST_BADGES.map((badge) => (
              <li key={badge} className="whitespace-nowrap">
                {badge}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
};

const RotatingSeal = () => (
  <div className="relative mx-auto flex h-[240px] w-[240px] items-center justify-center md:h-[260px] md:w-[260px]">
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
        <text
          fill="hsl(var(--variant-active))"
          fontSize={SEAL_FONT_SIZE}
          fontWeight={700}
          letterSpacing={SEAL_TRACKING}
        >
          <textPath href="#guarantee-seal-path">{SEAL_TEXT}</textPath>
        </text>
      </svg>
    </div>

    <div className="absolute inset-[30px] flex flex-col items-center justify-center rounded-full border border-variant-active/40 bg-gradient-to-br from-variant-active/25 to-variant-active/[0.08]">
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
