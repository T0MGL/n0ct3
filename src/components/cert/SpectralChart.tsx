import { useMemo } from "react";
import {
  BLUE_BAND,
  bandExtremes,
  firstNmAbove,
  formatNumber,
  type LensReport,
} from "@/lib/certificates";

interface SpectralChartProps {
  readonly report: LensReport;
}

const NM_MIN = 280;
const NM_MAX = 780;
const VIEW_W = NM_MAX - NM_MIN;
const VIEW_H = 180;
const PAD_TOP = 5;
const PLOT_H = VIEW_H - PAD_TOP - 1;

const AXIS_TICKS = [300, 400, 500, 600, 700] as const;
const Y_TICKS = [0, 50, 100] as const;

const toX = (nm: number): number => nm - NM_MIN;
const toY = (transmittance: number): number =>
  PAD_TOP + (1 - transmittance / 100) * PLOT_H;
const toLeftPercent = (nm: number): string => `${((nm - NM_MIN) / VIEW_W) * 100}%`;

/**
 * La curva de transmitancia medida, dibujada punto por punto desde la tabla
 * espectral del reporte. No hay suavizado ni interpolacion: si el instrumento
 * midio un pico imposible, el pico se ve.
 */
export const SpectralChart = ({ report }: SpectralChartProps) => {
  const { linePath, areaPath } = useMemo(() => {
    const points = report.spectrum.map(
      (point) => `${toX(point.nm)} ${toY(point.transmittance).toFixed(2)}`,
    );
    const line = `M${points.join(" L")}`;
    return {
      linePath: line,
      areaPath: `${line} L${VIEW_W} ${VIEW_H} L0 ${VIEW_H} Z`,
    };
  }, [report.spectrum]);

  const band = bandExtremes(report, BLUE_BAND.from, BLUE_BAND.to);
  const opensAt = firstNmAbove(report, 50);
  const description =
    `Curva de transmitancia medida del lente ${report.name.toLowerCase()}, de 280 a 780 nanómetros. ` +
    `Entre ${BLUE_BAND.from} y ${BLUE_BAND.to} nanómetros la transmitancia va de ` +
    `${formatNumber(band.min, 2)} a ${formatNumber(band.max, 2)} por ciento` +
    (opensAt === null
      ? "."
      : `, y recién a partir de los ${opensAt} nanómetros el lente deja pasar más de la mitad de la luz.`);

  return (
    <figure className="m-0">
      <div className="relative pl-8">
        <div
          aria-hidden="true"
          className="absolute left-0 top-0 h-full w-7 font-mono text-[0.6875rem] text-muted-foreground"
        >
          {Y_TICKS.map((value) => (
            <span
              key={value}
              className="absolute right-0 -translate-y-1/2 tabular-nums"
              style={{ top: `${(toY(value) / VIEW_H) * 100}%` }}
            >
              {value}
            </span>
          ))}
        </div>
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          preserveAspectRatio="none"
          role="img"
          aria-label={description}
          className="block h-[clamp(140px,38vw,210px)] w-full overflow-visible"
        >
          <defs>
            <linearGradient id="cert-blue-band" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor="hsl(268 90% 62%)" stopOpacity="0.16" />
              <stop offset="0.55" stopColor="hsl(214 96% 58%)" stopOpacity="0.16" />
              <stop offset="1" stopColor="hsl(178 92% 50%)" stopOpacity="0.08" />
            </linearGradient>
          </defs>

          <rect
            x={toX(BLUE_BAND.from)}
            y={PAD_TOP}
            width={toX(BLUE_BAND.to) - toX(BLUE_BAND.from)}
            height={PLOT_H}
            fill="url(#cert-blue-band)"
          />

          {Y_TICKS.map((value) => (
            <line
              key={value}
              x1="0"
              x2={VIEW_W}
              y1={toY(value)}
              y2={toY(value)}
              stroke="hsl(0 0% 28%)"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          ))}

          {AXIS_TICKS.map((nm) => (
            <line
              key={nm}
              x1={toX(nm)}
              x2={toX(nm)}
              y1={PAD_TOP}
              y2={toY(0)}
              stroke="hsl(0 0% 22%)"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          ))}

          <path d={areaPath} fill="hsl(var(--variant-active))" fillOpacity="0.12" />
          <path
            d={linePath}
            fill="none"
            stroke="hsl(var(--variant-active))"
            strokeWidth="1.75"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {report.invalidNm.map((nm) => (
          <span
            key={nm}
            aria-hidden="true"
            className="pointer-events-none absolute top-0 block h-full w-px -translate-x-1/2 bg-white/60"
            style={{ left: toLeftPercent(nm) }}
          >
            <span className="absolute -top-1 left-1/2 block h-2 w-2 -translate-x-1/2 rounded-full border border-white/70" />
          </span>
        ))}

      </div>

      <div
        aria-hidden="true"
        className="relative ml-8 mt-2 h-4 font-mono text-[0.6875rem] text-muted-foreground"
      >
        {AXIS_TICKS.map((nm) => (
          <span
            key={nm}
            className="absolute -translate-x-1/2 tabular-nums"
            style={{ left: toLeftPercent(nm) }}
          >
            {nm}
          </span>
        ))}
      </div>

      <figcaption className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Transmitancia en porcentaje contra longitud de onda en nanómetros. La franja es la banda
        de luz azul, {BLUE_BAND.from} a {BLUE_BAND.to} nm. Los puntos son los del reporte, cada
        10 nm.
        {report.invalidNm.length > 0
          ? ` La línea vertical en ${report.invalidNm.join(" y ")} nm es la lectura inválida que se explica más abajo.`
          : ""}
      </figcaption>
    </figure>
  );
};
