import { motion } from "framer-motion";
import { CheckIcon, MinusIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";

// Honest comparison vs the closest local competitor and generic blue-light
// glasses. Specific competitor numbers are framed as "aprox" because we do
// not control their public claims and they change. NOCTE column reflects the
// product as currently sold (3 variants, 30 day guarantee, 229k starting).

type CellTone = "good" | "weak" | "neutral";

interface ComparisonRow {
  feature: string;
  somnix: { text: string; tone: CellTone };
  generico: { text: string; tone: CellTone };
  nocte: { text: string; tone: CellTone };
  highlight?: boolean;
}

const ROWS: ReadonlyArray<ComparisonRow> = [
  {
    feature: "Bloqueo luz azul (lente nocturno)",
    somnix: { text: "Aprox 99%", tone: "good" },
    generico: { text: "20 a 30%", tone: "weak" },
    nocte: { text: "99%", tone: "good" },
  },
  {
    feature: "Variantes por momento del día",
    somnix: { text: "1 sola", tone: "weak" },
    generico: { text: "No", tone: "weak" },
    nocte: { text: "3 (Día, Tarde, Noche)", tone: "good" },
    highlight: true,
  },
  {
    feature: "Garantía devolución",
    somnix: { text: "7 días", tone: "neutral" },
    generico: { text: "0 días", tone: "weak" },
    nocte: { text: "30 días", tone: "good" },
    highlight: true,
  },
  {
    feature: "Envío Asunción y Central",
    somnix: { text: "Variable", tone: "neutral" },
    generico: { text: "Pago", tone: "weak" },
    nocte: { text: "Gratis 24 a 48hs", tone: "good" },
  },
  {
    feature: "Estuche y accesorios incluidos",
    somnix: { text: "Basico", tone: "neutral" },
    generico: { text: "No", tone: "weak" },
    nocte: { text: "Estuche, paño y bolsa", tone: "good" },
    highlight: true,
  },
  {
    feature: "Modos día, tarde, noche en mismo pack",
    somnix: { text: "No", tone: "weak" },
    generico: { text: "No", tone: "weak" },
    nocte: { text: "Sí, mezclás libre", tone: "good" },
    highlight: true,
  },
  {
    feature: "Certificación del marco",
    somnix: { text: "No publicado", tone: "neutral" },
    generico: { text: "Genérico", tone: "weak" },
    nocte: { text: "Marco TR90", tone: "good" },
  },
  {
    feature: "Precio desde",
    somnix: { text: "197.000 Gs", tone: "neutral" },
    generico: { text: "180k a 250k", tone: "neutral" },
    nocte: { text: "229.000 Gs", tone: "neutral" },
  },
];

const ROW_VARIANTS = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

export const ComparisonTable = () => {
  return (
    <section
      id="comparativa"
      aria-labelledby="comparison-title"
      className="relative bg-gradient-to-b from-black via-[#0a0000] to-black px-4 py-20 md:px-6 md:py-28"
    >
      <div className="mx-auto max-w-[980px]">
        <motion.header
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto mb-10 max-w-2xl text-center md:mb-14"
        >
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.22em] text-variant-active">
            Compara antes de comprar
          </p>
          <h2
            id="comparison-title"
            className="text-[clamp(2rem,4.5vw,3.5rem)] font-bold leading-[1.05] tracking-tighter text-foreground"
          >
            Somnix es <span className="text-muted-foreground/70">más barato.</span>
            <br />
            NOCTE es <span className="text-variant-active">más completo.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground md:text-base">
            Somnix arranca en 197.000 Gs y está bien si querés lo más básico. Si dormís mal en serio, esto es lo que cambia con NOCTE: tres lentes para tres momentos del día, treinta días de garantía y respaldo científico real.
          </p>
        </motion.header>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          transition={{ staggerChildren: 0.05, delayChildren: 0.1 }}
          className="overflow-hidden rounded-2xl border border-border/40 bg-secondary/10"
        >
          <div
            role="table"
            aria-label="Comparación entre NOCTE, Somnix y lentes genéricos"
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
                  <p className="text-sm font-bold text-foreground/70">Somnix</p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    Competencia
                  </p>
                </div>
                <div
                  role="columnheader"
                  scope="col"
                  className="bg-secondary/20 px-3 py-5 text-center"
                >
                  <p className="text-sm font-bold text-foreground/70">Genéricos</p>
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
                <motion.div
                  key={row.feature}
                  role="row"
                  variants={ROW_VARIANTS}
                  className={cn(
                    "grid grid-cols-[1.6fr_1fr_1fr_1.2fr]",
                    i < ROWS.length - 1 && "border-b border-border/20",
                  )}
                >
                  <div
                    role="rowheader"
                    scope="row"
                    className="px-4 py-4 text-[13px] text-foreground/75"
                  >
                    {row.feature}
                  </div>
                  <ComparisonCell value={row.somnix} />
                  <ComparisonCell value={row.generico} />
                  <ComparisonCell value={row.nocte} highlight nocte />
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        <p className="mt-6 text-center text-[11px] text-muted-foreground/70">
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
            value.tone === "weak" && "text-muted-foreground/40",
          )}
          strokeWidth={2.5}
          aria-hidden="true"
        />
      )}
      <span
        className={cn(
          "font-semibold leading-tight",
          nocte ? "text-foreground" : "text-foreground/65",
          value.tone === "weak" && !nocte && "text-foreground/45",
        )}
      >
        {value.text}
      </span>
    </div>
  );
};

export default ComparisonTable;
