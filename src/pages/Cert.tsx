import { useEffect, useState } from "react";
import { BlockedHeadline } from "@/components/cert/BlockedHeadline";
import { LensSelector } from "@/components/cert/LensSelector";
import { MeasuredFigures } from "@/components/cert/MeasuredFigures";
import { ReportActions } from "@/components/cert/ReportActions";
import { ReportCaveats, StandardsNote } from "@/components/cert/ReportNotes";
import { ReportSource } from "@/components/cert/ReportSource";
import { SpectralChart } from "@/components/cert/SpectralChart";
import { TechnicalDetail } from "@/components/cert/TechnicalDetail";
import {
  DEFAULT_LENS_ID,
  PAGE_UPDATED_ON,
  formatLongDate,
  getReport,
  type LensId,
} from "@/lib/certificates";

const PAGE_TITLE = "Reportes de transmitancia de los lentes | NOCTE ®";

/**
 * /cert. La URL va impresa en las tarjetas de garantia y no cambia nunca, asi
 * que el color se elige aca adentro y no en la ruta ni en un query param.
 */
export const Cert = () => {
  const [lensId, setLensId] = useState<LensId>(DEFAULT_LENS_ID);
  // El bloque de datos se rehace al cambiar de lente. Sin esta bandera el fade
  // tambien correria en la primera pintura y retrasaria el LCP sin ganar nada.
  const [hasSwapped, setHasSwapped] = useState(false);
  const report = getReport(lensId);

  const handleLensChange = (id: LensId) => {
    setHasSwapped(true);
    setLensId(id);
  };

  // La pagina tiene su propio entry HTML con el title correcto. Esto solo cubre
  // el caso de llegar por navegacion interna del SPA.
  useEffect(() => {
    document.title = PAGE_TITLE;
  }, []);

  return (
    <div data-variant={lensId} className="flex min-h-[100dvh] flex-col bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto w-full max-w-[38rem] px-5 py-4">
          <a
            href="/"
            className="inline-block text-xl font-bold tracking-tighter transition-opacity duration-200 ease-out hover:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-variant-active"
          >
            NOCTE
            <sup className="ml-0.5 text-[0.5em]">®</sup>
          </a>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[38rem] flex-1 px-5 pb-24">
        <div className="pb-6 pt-6">
          <h1 className="text-3xl font-bold tracking-tighter md:text-4xl">
            Reportes de transmitancia
          </h1>
          <p className="mt-2 text-base leading-relaxed text-muted-foreground">
            Cuánta luz deja pasar cada lente, medido punto por punto.
          </p>
        </div>

        <LensSelector value={lensId} onChange={handleLensChange} />

        <div key={lensId} className={hasSwapped ? "cert-swap" : undefined}>
          <section className="pt-8">
            <h2 className="sr-only">Luz azul bloqueada por el lente {report.name.toLowerCase()}</h2>
            <BlockedHeadline report={report} />
            <div className="mt-10">
              <SpectralChart report={report} />
            </div>
          </section>

          <section className="mt-12 border-t border-border pt-10">
            <h2 className="sr-only">Cifras medidas del lente {report.name.toLowerCase()}</h2>
            <MeasuredFigures report={report} />
          </section>

          <section id="procedencia" className="mt-12 border-t border-border pt-10">
            <ReportSource report={report} />
          </section>

          <StandardsNote report={report} />

          <ReportCaveats report={report} />

          <section className="mt-10 border-t border-border pt-8">
            <h2 className="sr-only">Reporte completo del lente {report.name.toLowerCase()}</h2>
            <ReportActions report={report} />
          </section>
        </div>

        {/* Fuera del bloque que se rehace, para no cerrarle el detalle en la
            cara a quien esta comparando dos lentes. */}
        <section className="mt-10">
          <h2 className="sr-only">Detalle técnico</h2>
          <TechnicalDetail report={report} />
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto w-full max-w-[38rem] px-5 py-8">
          <a
            href="/"
            className="text-sm text-muted-foreground underline decoration-border underline-offset-4 transition-colors duration-200 ease-out hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-variant-active"
          >
            Ver los lentes en nocte.studio
          </a>
          <p className="mt-4 text-xs text-muted-foreground">
            Página actualizada el {formatLongDate(PAGE_UPDATED_ON)}.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Cert;
