import { formatLongDate, type LensReport } from "@/lib/certificates";

interface ReportSourceProps {
  readonly report: LensReport;
}

/**
 * De donde sale la medicion. El estado del reporte cambia el texto entero, y
 * el tipo discriminado obliga a resolver los dos casos.
 */
export const ReportSource = ({ report }: ReportSourceProps) => {
  const { source } = report;

  if (source.stage === "accredited") {
    return (
      <div>
        <h2 className="text-lg font-bold tracking-tight">Ensayo en laboratorio acreditado</h2>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          Lo midió {source.lab} bajo {source.scheme}. Reporte {source.reportNumber}, emitido el{" "}
          {formatLongDate(source.issuedOn)}.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-bold tracking-tight">Medición del fabricante</h2>
      <p className="mt-3 text-base leading-relaxed text-muted-foreground">
        La midió el fabricante del lente con su propio instrumento ({source.instrument})
        {source.measuredOn === null
          ? ". El documento no trae fecha de medición"
          : `, el ${formatLongDate(source.measuredOn)}`}
        . El fabricante no es un laboratorio acreditado, y este documento es un reporte de
        medición, no un certificado.
      </p>
      <p className="mt-3 text-base leading-relaxed text-muted-foreground">
        Hay un ensayo en curso en Bureau Veritas bajo ISO/IEC 17025. Cuando entreguen el
        reporte, esta página va a mostrar ese en lugar de este.
      </p>
    </div>
  );
};
