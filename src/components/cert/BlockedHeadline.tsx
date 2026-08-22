import {
  BLUE_BAND,
  blockedFromTransmittance,
  formatNumber,
  type LensReport,
} from "@/lib/certificates";

interface BlockedHeadlineProps {
  readonly report: LensReport;
}

/** La respuesta que alguien viene a buscar, antes que cualquier otra cosa. */
export const BlockedHeadline = ({ report }: BlockedHeadlineProps) => (
  <div>
    <p className="text-sm text-muted-foreground">
      Luz azul bloqueada, de {BLUE_BAND.from} a {BLUE_BAND.to} nm
    </p>
    <p className="mt-2 font-bold leading-none tracking-tighter tabular-nums text-variant-active [font-size:clamp(3.75rem,20vw,6rem)]">
      {formatNumber(blockedFromTransmittance(report.blueBandTransmittance), 1)}
      <span className="ml-1 text-[0.42em] align-baseline">%</span>
    </p>
    <p className="mt-4 max-w-[42ch] text-base leading-relaxed text-muted-foreground">
      El lente deja pasar {formatNumber(report.blueBandTransmittance, 2)} %, que es el Tsb
      impreso en el reporte. El {formatNumber(blockedFromTransmittance(report.blueBandTransmittance), 1)} %
      de arriba es ese número restado de 100.
    </p>
  </div>
);
