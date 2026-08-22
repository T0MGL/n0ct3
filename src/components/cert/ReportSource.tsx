import { formatLongDate, type LensReport } from "@/lib/certificates";

interface ReportSourceProps {
  readonly report: LensReport;
}

/**
 * De donde sale la medicion. El tipo discriminado obliga a resolver los dos
 * estados, y los nombres son los que figuran firmando el papel: la pagina no
 * afirma quien fabrica el lente, solo quien hizo y firma la medicion.
 */
export const ReportSource = ({ report }: ReportSourceProps) => {
  const { source } = report;

  if (source.stage === "accredited") {
    return (
      <>
        <h2 className="text-lg font-bold tracking-tight">Ensayo en laboratorio acreditado</h2>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          Lo midió {source.lab} bajo {source.scheme}. Reporte {source.reportNumber}, emitido el{" "}
          {formatLongDate(source.issuedOn)}.
        </p>
      </>
    );
  }

  return (
    <>
      <h2 className="text-lg font-bold tracking-tight">De dónde sale esta medición</h2>
      <p className="mt-3 text-base leading-relaxed text-muted-foreground">
        El reporte lo firma {source.measuredBy}
        {source.instrument === null ? "" : `, medido con un ${source.instrument}`}
        {source.measuredOn === null
          ? ". El documento no trae fecha de medición"
          : `, el ${formatLongDate(source.measuredOn)}`}
        . No es un laboratorio acreditado, y este documento es un reporte de medición, no un
        certificado.
      </p>
      <p className="mt-3 text-base leading-relaxed text-muted-foreground">
        Hay un ensayo en curso en Bureau Veritas bajo ISO/IEC 17025. Cuando lo entreguen, esta
        página muestra ese reporte y no este.
      </p>
    </>
  );
};
