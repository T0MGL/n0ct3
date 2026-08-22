import {
  AVERAGE_BAND,
  BLUE_BAND,
  averageBlocked,
  formatNumber,
  type LensReport,
} from "@/lib/certificates";

interface MeasuredFiguresProps {
  readonly report: LensReport;
}

interface FigureRow {
  readonly symbol: string | null;
  readonly label: string;
  readonly value: string;
  readonly unit: string;
  readonly origin: string;
}

const buildRows = (report: LensReport): readonly FigureRow[] => [
  {
    symbol: "Tsb",
    label: `Transmitancia de luz azul, ${BLUE_BAND.from} a ${BLUE_BAND.to}\u00a0nm`,
    value: formatNumber(report.blueBandTransmittance, 2),
    unit: "%",
    origin: "Impreso en el reporte",
  },
  {
    symbol: "Tv",
    label: "Transmitancia luminosa, toda la luz visible",
    value: formatNumber(report.luminousTransmittance, 2),
    unit: "%",
    origin: "Impreso en el reporte",
  },
  {
    symbol: null,
    label: `Bloqueo promedio entre ${AVERAGE_BAND.from} y ${AVERAGE_BAND.to}\u00a0nm`,
    value: formatNumber(averageBlocked(report, AVERAGE_BAND.from, AVERAGE_BAND.to), 1),
    unit: "%",
    origin: "Calculado por NOCTE",
  },
];

export const MeasuredFigures = ({ report }: MeasuredFiguresProps) => (
  <dl className="divide-y divide-border">
    {buildRows(report).map((row) => (
      <div key={row.label} className="flex items-baseline justify-between gap-4 py-4 first:pt-0">
        <dt className="min-w-0">
          <span className="block text-sm leading-snug text-foreground">
            {row.symbol !== null && (
              <span className="mr-2 font-mono text-muted-foreground">{row.symbol}</span>
            )}
            {row.label}
          </span>
          <span className="mt-1 block text-xs text-muted-foreground">{row.origin}</span>
        </dt>
        <dd className="shrink-0 text-foreground">
          <span className="font-mono text-lg tabular-nums">{row.value}</span>
          <span className="ml-1 text-sm text-muted-foreground">{row.unit}</span>
        </dd>
      </div>
    ))}
  </dl>
);
