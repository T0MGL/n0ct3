import { CheckIcon, MinusIcon } from "@heroicons/react/24/outline";
import { Reveal } from "@/components/Reveal";
import { cn } from "@/lib/utils";

// Honest comparison vs other blue-light brands and generic glasses. Competitor
// cells come from RONAN's public pages (checked Aug 2026) and say plainly when
// they publish nothing, so we never put a number in their mouth. Free shipping
// is theirs and it stays in. No price row on purpose: price moves every runout
// and the durable difference is COD reach, not the sticker.

type CellTone = "good" | "weak" | "neutral";

interface ComparisonRow {
  feature: string;
  competidor: { text: string; tone: CellTone };
  generico: { text: string; tone: CellTone };
  nocte: { text: string; tone: CellTone };
  highlight?: boolean;
}

const ROWS: ReadonlyArray<ComparisonRow> = [
  {
    feature: "Bloqueo luz azul (lente nocturno)",
    competidor: { text: "No publica el dato", tone: "weak" },
    generico: { text: "20 a 30%", tone: "weak" },
    nocte: { text: "99%", tone: "good" },
  },
  {
    feature: "Variantes por momento del día",
    competidor: { text: "1 sola", tone: "weak" },
    generico: { text: "No", tone: "weak" },
    nocte: { text: "3 (Día, Tarde, Noche)", tone: "good" },
    highlight: true,
  },
  {
    feature: "Garantía devolución",
    competidor: { text: "7 días", tone: "neutral" },
    generico: { text: "0 días", tone: "weak" },
    nocte: { text: "30 días", tone: "good" },
    highlight: true,
  },
  {
    feature: "Envío Asunción y Central",
    competidor: { text: "Gratis, sin plazo publicado", tone: "neutral" },
    generico: { text: "Pago", tone: "weak" },
    nocte: { text: "Gratis 24 a 48hs", tone: "good" },
  },
  {
    feature: "Estuche y accesorios incluidos",
    competidor: { text: "Básico", tone: "neutral" },
    generico: { text: "No", tone: "weak" },
    nocte: { text: "Estuche, paño y bolsa", tone: "good" },
    highlight: true,
  },
  {
    feature: "Modos día, tarde, noche en mismo pack",
    competidor: { text: "No", tone: "weak" },
    generico: { text: "No", tone: "weak" },
    nocte: { text: "Sí, mezclás libre", tone: "good" },
    highlight: true,
  },
  {
    feature: "Pagás al recibir, también al interior",
    competidor: { text: "Solo Gran Asunción", tone: "weak" },
    generico: { text: "Pago adelantado", tone: "weak" },
    nocte: { text: "Sí, en todo el interior", tone: "good" },
    highlight: true,
  },
];

export const ComparisonTable = () => {
  return (
    <section
      id="comparativa"
      aria-labelledby="comparison-title"
      className="relative bg-gradient-to-b from-black via-[#0a0000] to-black px-4 py-20 md:px-6 md:py-28"
    >
      <div className="mx-auto max-w-[980px]">
        <Reveal as="header" className="mx-auto mb-10 max-w-2xl text-center md:mb-14">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.22em] text-variant-active">
            Compara antes de comprar
          </p>
          <h2
            id="comparison-title"
            className="text-[clamp(2rem,4.5vw,3.5rem)] font-bold leading-[1.05] tracking-tighter text-foreground"
          >
            Otras marcas son <span className="text-muted-foreground">más baratas.</span>
            <br />
            NOCTE es <span className="text-variant-active">más completo.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground md:text-base">
            Hay opciones más baratas y están bien si querés lo más básico. Si dormís mal en serio, esto es lo que cambia con NOCTE: tres lentes para tres momentos del día, treinta días de garantía y respaldo científico real.
          </p>
        </Reveal>

        <div className="overflow-hidden rounded-2xl border border-border/40 bg-secondary/10">
          <div
            role="table"
            aria-label="Comparación entre NOCTE, otras marcas y lentes genéricos"
            className="w-full text-sm"
          >
            <div role="rowgroup">
              <div
                role="row"
                className="grid grid-cols-[1.6fr_1fr_1fr_1.2fr] border-b border-border/40"
              >
                <div role="columnheader" aria-label="Característica" className="px-4 py-5" />
                <div
                  role="columnheader"
                  scope="col"
                  className="bg-secondary/20 px-3 py-5 text-center"
                >
                  <p className="text-sm font-bold text-foreground">Otras marcas</p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    Competencia
                  </p>
                </div>
                <div
                  role="columnheader"
                  scope="col"
                  className="bg-secondary/20 px-3 py-5 text-center"
                >
                  <p className="text-sm font-bold text-foreground">Genéricos</p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    Mercado libre
                  </p>
                </div>
                <div
                  role="columnheader"
                  scope="col"
                  className="border-x border-variant-active/40 bg-variant-active/10 px-3 py-5 text-center"
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-variant-active">
                    Recomendado
                  </p>
                  <p className="mt-1 text-base font-extrabold tracking-tight text-variant-active">
                    NOCTE<sup className="text-[0.5em]">®</sup>
                  </p>
                </div>
              </div>
            </div>

            <div role="rowgroup">
              {ROWS.map((row, i) => (
                <Reveal
                  key={row.feature}
                  role="row"
                  from="fade"
                  delay={80 + i * 50}
                  className={cn(
                    "grid grid-cols-[1.6fr_1fr_1fr_1.2fr]",
                    i < ROWS.length - 1 && "border-b border-border/20",
                  )}
                >
                  <div
                    role="rowheader"
                    scope="row"
                    className="px-4 py-4 text-[13px] text-foreground"
                  >
                    {row.feature}
                  </div>
                  <ComparisonCell value={row.competidor} />
                  <ComparisonCell value={row.generico} />
                  <ComparisonCell value={row.nocte} highlight nocte />
                </Reveal>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-[11px] text-muted-foreground">
          Datos de competidores tomados de sus páginas públicas. Pueden variar sin aviso.
        </p>
      </div>
    </section>
  );
};

interface ComparisonCellProps {
  value: { text: string; tone: CellTone };
  highlight?: boolean;
  nocte?: boolean;
}

const ComparisonCell = ({ value, highlight, nocte }: ComparisonCellProps) => {
  const Icon = value.tone === "good" ? CheckIcon : value.tone === "weak" ? MinusIcon : null;
  return (
    <div
      role="cell"
      className={cn(
        "flex flex-col items-center justify-center gap-1 px-3 py-4 text-center text-[13px]",
        highlight && "border-x border-variant-active/30 bg-variant-active/5",
      )}
    >
      {Icon && (
        <Icon
          className={cn(
            "h-4 w-4",
            value.tone === "good" && (nocte ? "text-variant-active" : "text-emerald-400"),
            value.tone === "weak" && "text-muted-foreground",
          )}
          strokeWidth={2.5}
          aria-hidden="true"
        />
      )}
      <span
        className={cn(
          "font-semibold leading-tight",
          nocte ? "text-foreground" : "text-foreground",
          value.tone === "weak" && !nocte && "text-foreground",
        )}
      >
        {value.text}
      </span>
    </div>
  );
};

export default ComparisonTable;
