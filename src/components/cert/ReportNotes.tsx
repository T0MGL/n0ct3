import { hasFailingStandard, type LensReport } from "@/lib/certificates";

interface ReportNotesProps {
  readonly report: LensReport;
}

interface Note {
  readonly title: string;
  readonly paragraphs: readonly string[];
}

const Notes = ({ notes }: { notes: readonly Note[] }) => (
  <>
    {notes.map((note) => (
      <section key={note.title} className="mt-10 border-t border-border pt-8">
        <h2 className="text-base font-bold tracking-tight">{note.title}</h2>
        {note.paragraphs.map((paragraph) => (
          <p key={paragraph} className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {paragraph}
          </p>
        ))}
      </section>
    ))}
  </>
);

/** Por que el reporte dice FAIL. Va antes del boton que abre el PDF. */
const buildStandardsNote = (report: LensReport): readonly Note[] => {
  const notes: Note[] = [];

  if (hasFailingStandard(report)) {
    notes.push({
      title: "Por qué el reporte dice FAIL",
      paragraphs: [
        "Este reporte evalúa el lente contra normas de anteojos de sol. Lo que reprueba son los requisitos de conducción: reconocer la señal verde y la azul de un semáforo, dejar pasar un mínimo de luz entre 475 y 650 nm, y llegar a la transmitancia luminosa del 75 % que esas normas piden para manejar de noche.",
        "Reprobar esos ítems es la definición del producto, no un defecto. Un lente hecho para filtrar casi toda la luz azul y verde no puede cumplirlos. NOCTE no es un anteojo de sol y no se maneja con estos lentes puestos.",
      ],
    });
  } else {
    notes.push({
      title: "Este reporte no marca incumplimientos",
      paragraphs: [
        "El reporte pasa todas las verificaciones que corre, y no imprime un resultado global. No es comparable con el FAIL de los otros dos, por dos razones.",
        "La primera es que las pasa porque deja pasar bastante más luz, que es lo mismo que dicen las cifras de arriba.",
        "La segunda es que le tomaron un examen más corto. Se evaluó contra la edición 2013+A1:2015 de la ISO 12312-1, mientras que el rojo y el naranja se evaluaron contra la de 2022 y además contra ANSI Z80.3 y AS/NZS 1067. La lista de lo que este reporte no mide está en el detalle técnico.",
      ],
    });
  }

  return notes;
};

/** Lo que queda por advertir: UV y lecturas invalidas del propio reporte. */
const buildCaveatNotes = (report: LensReport): readonly Note[] => {
  const notes: Note[] = [];

  if (report.source.stage === "manufacturer") {
    notes.push({
      title: "Sin cifras de ultravioleta",
      paragraphs: [
        "Mientras la medición no venga de un laboratorio acreditado, esta página no publica ningún número de UV, para ninguno de los tres lentes. El reporte del amarillo imprime tres valores de UV y dos de ellos caen en el rango donde está su lectura inválida. Antes que publicar unos sí y otros no, aplicamos el mismo criterio a los tres. El UV se publica cuando lo mida el laboratorio acreditado.",
      ],
    });
  }

  for (const caveat of report.caveats) {
    notes.push({ title: caveat.title, paragraphs: [caveat.body] });
  }

  return notes;
};

export const StandardsNote = ({ report }: ReportNotesProps) => (
  <Notes notes={buildStandardsNote(report)} />
);

export const ReportCaveats = ({ report }: ReportNotesProps) => (
  <Notes notes={buildCaveatNotes(report)} />
);
