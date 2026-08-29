import { formatBytes, type LensReport } from "@/lib/certificates";

interface ReportActionsProps {
  readonly report: LensReport;
}

// Sin iconos a proposito: las dos etiquetas se explican solas y la pagina se
// abre escaneando un QR con datos moviles, no hay por que arrastrar una
// libreria de iconos entera para decorar dos botones.
const BASE_ACTION =
  "flex items-center justify-center rounded-lg px-5 py-3.5 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-variant-active";

export const ReportActions = ({ report }: ReportActionsProps) => (
  <div>
    <div className="grid gap-3 sm:grid-cols-2">
      <a
        href={report.pdf.href}
        target="_blank"
        rel="noopener noreferrer"
        className={`${BASE_ACTION} bg-foreground text-background`}
      >
        Ver el reporte completo
      </a>
      <a
        href={report.pdf.href}
        download={report.pdf.downloadAs}
        className={`${BASE_ACTION} border border-border text-foreground`}
      >
        Descargar
      </a>
    </div>
    <p className="mt-3 text-xs text-muted-foreground">
      PDF del lente {report.name.toLowerCase()}, {formatBytes(report.pdf.bytes)}. Se abre en una
      pestaña nueva.
    </p>
  </div>
);
