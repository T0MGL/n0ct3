import {
  AVERAGE_BAND,
  BLUE_BAND,
  averageBlocked,
  blockedFromTransmittance,
  formatNumber,
  type LensReport,
} from "@/lib/certificates";

interface BlockedHeadlineProps {
  readonly report: LensReport;
}

/**
 * La respuesta que alguien viene a buscar, antes que cualquier otra cosa.
 *
 * El parrafo de abajo existe por un problema real de lectura: en la banda de
 * 380 a 500 nm los tres lentes dan casi lo mismo, y el naranja da un decimo mas
 * que el rojo. Quien lee solo el numero grande se lleva una conclusion falsa.
 * Lo que los separa esta en la banda de 400 a 550, que incluye el verde, y esa
 * cifra tambien esta en la pagina.
 */
export const BlockedHeadline = ({ report }: BlockedHeadlineProps) => {
  const blocked = blockedFromTransmittance(report.blueBandTransmittance);
  const wideBlocked = averageBlocked(report, AVERAGE_BAND.from, AVERAGE_BAND.to);

  return (
    <div>
      <p className="text-sm text-muted-foreground">
        <span className="text-foreground">Lente {report.name.toLowerCase()}</span>, luz azul
        bloqueada de {BLUE_BAND.from} a {BLUE_BAND.to} nm
      </p>
      <p
        aria-live="polite"
        className="mt-2 font-bold leading-none tracking-tighter tabular-nums text-variant-active [font-size:clamp(3.75rem,20vw,6rem)]"
      >
        {formatNumber(blocked, 1)}
        <span className="ml-1 text-[0.42em] align-baseline">%</span>
      </p>
      <p className="mt-4 max-w-[44ch] text-base leading-relaxed text-muted-foreground">
        Deja pasar {formatNumber(report.blueBandTransmittance, 2)} % en esa banda, el Tsb
        impreso en el reporte. Los tres lentes frenan casi todo el azul: lo que los separa
        empieza en el verde, y ahí este lente bloquea{" "}
        <span className="text-foreground">{formatNumber(wideBlocked, 1)} %</span> entre{" "}
        {AVERAGE_BAND.from} y {AVERAGE_BAND.to} nm. Se ve en la curva.
      </p>
      <p className="mt-4 text-sm text-muted-foreground">
        <a
          href="#procedencia"
          className="underline decoration-border underline-offset-4 transition-colors duration-200 ease-out hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-variant-active"
        >
          {report.source.stage === "accredited"
            ? "Medición de un laboratorio acreditado"
            : "Medición del fabricante, no de un laboratorio acreditado"}
        </a>
      </p>
    </div>
  );
};
