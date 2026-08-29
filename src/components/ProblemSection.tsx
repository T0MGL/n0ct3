import { Reveal } from "@/components/Reveal";
import problemaImage from "@/assets/nocte-problema-noche.webp";

/**
 * Los sintomas en el orden en que se viven, de la noche al dia siguiente. El
 * cliente tiene que reconocer su propia semana en esta lista antes de que la
 * pagina le nombre el producto: si no se identifica aca, todo lo que viene
 * despues le habla a otro.
 */
const SINTOMAS: readonly string[] = [
  "Te acostás cansado y la cabeza no para",
  "Te dormís tarde aunque te hayas acostado temprano",
  "Te levantás como si no hubieras dormido nada",
  "A las cuatro de la tarde ya no rendís",
  "Te duele la cabeza y le echás la culpa al estrés",
];

export const ProblemSection = () => {
  return (
    <section
      aria-labelledby="problema-title"
      className="relative isolate overflow-hidden bg-black"
    >
      <img
        src={problemaImage}
        alt="Hombre acostado a oscuras mirando el teléfono de madrugada, con la cara iluminada por la luz azul de la pantalla"
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover object-right"
      />

      {/* Dos scrims cruzados: uno lateral para que el texto tenga fondo en
          desktop y uno vertical para mobile, donde la columna de texto se
          apoya sobre la foto entera y no al costado. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-black via-black/75 to-black/95 md:bg-gradient-to-r md:from-black md:via-black/85 md:to-transparent"
      />

      <div className="relative mx-auto flex min-h-[600px] max-w-[1400px] items-center px-4 py-20 md:min-h-[660px] md:px-6 md:py-24 lg:px-12">
        <div className="max-w-[54ch]">
          <Reveal>
            <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">
              La noche que ya conocés
            </p>
            <h2
              id="problema-title"
              className="text-[30px] font-bold leading-[1.06] tracking-tighter text-white md:text-5xl lg:text-[56px]"
            >
              Apagás la pantalla a las once y a las doce y media seguís mirando el techo.
            </h2>
          </Reveal>

          <Reveal delay={80} as="ul" className="mt-8 space-y-3 md:mt-10">
            {SINTOMAS.map((sintoma) => (
              <li key={sintoma} className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className="mt-[9px] h-1 w-4 flex-shrink-0 rounded-full bg-variant-active"
                />
                <span className="text-[15px] leading-relaxed text-white/75 md:text-lg">
                  {sintoma}
                </span>
              </li>
            ))}
          </Reveal>

          {/* El giro. Es la bisagra hacia la seccion de la ciencia: nombra la
              causa sin nombrar todavia el producto. */}
          <Reveal delay={160} className="mt-10 border-l-2 border-variant-active pl-5 md:mt-12 md:pl-6">
            <p className="text-lg font-medium leading-snug text-white md:text-2xl">
              No es insomnio. A las once de la noche tus ojos siguen recibiendo luz de
              mediodía, y tu cuerpo le cree a los ojos.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
