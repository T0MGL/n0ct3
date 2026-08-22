import {
  blockedFromTransmittance,
  formatNumber,
  hasFailingStandard,
  type LensReport,
} from "@/lib/certificates";

interface ReportNotesProps {
  readonly report: LensReport;
}

interface Note {
  readonly title: string;
  readonly paragraphs: readonly string[];
}

const buildNotes = (report: LensReport): readonly Note[] => {
  const notes: Note[] = [];

  if (hasFailingStandard(report)) {
    notes.push({
      title: "Por qué el reporte dice FAIL",
      paragraphs: [
        "Este reporte evalúa el lente contra normas de anteojos de sol. Lo que reprueba son los requisitos de conducción: reconocer la señal verde y la azul de un semáforo, dejar pasar un mínimo de luz entre 475 y 650 nm, y llegar a la transmitancia luminosa del 75 % que esas normas piden para manejar de noche.",
        "Un lente hecho para filtrar casi toda la luz azul y verde no puede cumplir esos requisitos. Es la consecuencia directa de para qué está hecho, no una falla de fabricación. NOCTE no es un anteojo de sol y no se maneja con estos lentes puestos.",
      ],
    });
  } else {
    notes.push({
      title: "Este reporte no marca incumplimientos",
      paragraphs: [
        `El reporte pasa todas las verificaciones que evalúa. Eso no lo vuelve mejor lente: las pasa porque deja pasar bastante más luz que los otros dos, que es exactamente lo que dice el ${formatNumber(blockedFromTransmittance(report.blueBandTransmittance), 1)} % de arriba.`,
      ],
    });
  }

  if (report.source.stage === "manufacturer") {
    notes.push({
      title: "Sin cifras de ultravioleta",
      paragraphs: [
        "Mientras la medición sea del fabricante, esta página no publica ningún número de UV, para ninguno de los tres lentes. El reporte del amarillo imprime valores de UV, pero salen del mismo rango donde está su lectura inválida, así que no son confiables. Aplicamos el mismo criterio a los tres. El UV se publica cuando lo mida el laboratorio acreditado.",
      ],
    });
  }

  for (const caveat of report.caveats) {
    notes.push({ title: caveat.title, paragraphs: [caveat.body] });
  }

  return notes;
};

export const ReportNotes = ({ report }: ReportNotesProps) => (
  <div className="space-y-4">
    {buildNotes(report).map((note) => (
      <aside key={note.title} className="rounded-lg bg-white/[0.025] p-5">
        <h2 className="text-base font-bold tracking-tight">{note.title}</h2>
        {note.paragraphs.map((paragraph) => (
          <p key={paragraph} className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {paragraph}
          </p>
        ))}
      </aside>
    ))}
  </div>
);
