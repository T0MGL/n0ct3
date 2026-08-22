import type { ReactNode } from "react";
import { AVERAGE_BAND, BLUE_BAND, type LensReport } from "@/lib/certificates";

interface TechnicalDetailProps {
  readonly report: LensReport;
}

const Block = ({ title, children }: { title: string; children: ReactNode }) => (
  <div>
    <h3 className="text-sm font-bold tracking-tight">{title}</h3>
    <div className="mt-2 space-y-2 text-sm leading-relaxed text-muted-foreground">{children}</div>
  </div>
);

export const TechnicalDetail = ({ report }: TechnicalDetailProps) => (
  <details className="group rounded-lg border border-border">
    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-lg px-5 py-4 text-sm font-medium transition-colors duration-200 ease-out hover:text-variant-active focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-variant-active [&::-webkit-details-marker]:hidden">
      Detalle técnico del reporte
      <span
        aria-hidden="true"
        className="h-2 w-2 shrink-0 -translate-y-1 rotate-45 border-b border-r border-muted-foreground transition-transform duration-200 ease-out group-open:translate-y-0 group-open:-rotate-[135deg]"
      />
    </summary>

    <div className="space-y-6 border-t border-border px-5 py-5">
      <Block title="Qué lente es">
        <p>
          {report.lensCode === null
            ? "El reporte no imprime un código de lente."
            : `El reporte imprime el código de lente ${report.lensCode}.`}{" "}
          La referencia interna de NOCTE para los tres tonos es {report.internalRef}, y esa no
          figura en el reporte. El documento corresponde al lente, no al armazón.
        </p>
      </Block>

      <Block title="Qué significan las siglas">
        <p>
          <span className="font-mono text-foreground">Tsb</span> es el porcentaje de la luz
          entre {BLUE_BAND.from} y {BLUE_BAND.to} nm que atraviesa el lente. Cuanto más bajo,
          más azul frena.
        </p>
        <p>
          <span className="font-mono text-foreground">Tv</span> es la transmitancia luminosa:
          cuánta luz visible total pasa. Define qué tan oscuro se ve el lente, no cuánto azul
          bloquea. Son cosas distintas.
        </p>
      </Block>

      <Block title={`Cómo calculamos el promedio de ${AVERAGE_BAND.from} a ${AVERAGE_BAND.to} nm`}>
        <p>
          Tomamos los puntos de la tabla espectral del reporte, cada 10 nm, entre{" "}
          {AVERAGE_BAND.from} y {AVERAGE_BAND.to} nm. Sacamos el promedio aritmético de esas
          transmitancias y lo restamos de 100. Los puntos marcados como inválidos quedan
          afuera del cálculo.
        </p>
        <p>
          Es la única cifra de esta página que no está impresa en el papel. Cualquiera puede
          rehacerla con la tabla del PDF.
        </p>
      </Block>

      <Block title="Normas evaluadas en este reporte">
        <ul className="space-y-1">
          {report.standards.map((standard) => (
            <li key={standard.name} className="flex items-baseline justify-between gap-4">
              <span>{standard.name}</span>
              <span className="shrink-0 font-mono text-xs text-foreground">
                {standard.outcome}
              </span>
            </li>
          ))}
        </ul>
        <p>
          {report.globalResultPrinted
            ? "El reporte imprime ese resultado global para cada norma."
            : "El reporte no imprime un resultado global. Esa columna resume el resultado de cada ítem que sí evalúa."}
        </p>
      </Block>

      {report.notEvaluated.length > 0 && (
        <Block title="Qué no evalúa este reporte">
          <ul className="space-y-2">
            {report.notEvaluated.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Block>
      )}

      {report.failedItems.length > 0 && (
        <Block title="Qué ítems reprueba, exactamente">
          <ul className="space-y-2">
            {report.failedItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Block>
      )}

      {report.source.stage === "manufacturer" && (
        <Block title="Sobre el título impreso en el PDF">
          <p>
            El PDF de este lente lleva impreso «{report.pdf.printedTitle}» en el encabezado. Es
            el texto que trae la plantilla del equipo de medición. Lo que estás viendo es un
            reporte de medición, no un certificado.
          </p>
        </Block>
      )}
    </div>
  </details>
);
