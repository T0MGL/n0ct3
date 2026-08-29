import { Reveal } from "@/components/Reveal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FaqEntry {
  q: string;
  a: string;
}

// Objection killers ordered by frequency in WhatsApp inbound. Copy is direct,
// no hedging, no em dash. Plain ASCII separators only.
const FAQS: ReadonlyArray<FaqEntry> = [
  {
    q: "¿Y si no me funcionan? Ya gasté en otros que no sirvieron.",
    a: "Por eso te damos 30 días completos. Probalos, dormí con ellos, y si no notás diferencia te devolvemos el 100 por ciento sin preguntas. Te quedás incluso con los lentes. La garantía es nuestra, vos no arriesgás nada.",
  },
  {
    q: "¿Cuál color me conviene?",
    a: "Amarillo si trabajás en oficina con pantallas todo el día (8 horas o más). Naranja para la transición tarde a noche cuando todavía necesitás distinguir colores. Rojo para el bloqueo máximo, dos a tres horas antes de dormir. La mayoría arranca con el rojo porque es donde más se nota la diferencia desde la primera noche.",
  },
  {
    q: "Se ven raros con todo rojo, ¿no me voy a poder ver bien?",
    a: "Tu cerebro se adapta en 5 a 10 minutos. Pasado ese tiempo ves todo normal porque tu cerebro reinterpreta los colores. El amarillo casi no distorsiona, perfecto si te molesta el tinte fuerte.",
  },
  {
    q: "¿Por qué elegir NOCTE si hay opciones más baratas?",
    a: "Honestidad primero: hay marcas más baratas y NOCTE arranca en 249.000 Gs. Pagás más, sí. ¿Qué te llevás a cambio? Tres lentes para tres momentos del día (la mayoría vende solo el rojo), 30 días de garantía, respaldo científico citado y estuche premium completo. Si querés lo más básico, otra marca está bien. Si dormís mal en serio y querés un sistema completo, NOCTE.",
  },
  {
    q: "¿Cuánto tarda el envío en Paraguay?",
    a: "El envío es gratis a todo Paraguay. Asunción y Departamento Central en 24 a 48 horas, interior del país en 2 a 4 días hábiles. Tracking incluido en todos los pedidos.",
  },
  {
    q: "¿Cómo pago?",
    a: "Tarjeta de crédito o débito, transferencia bancaria, o contraentrega en Asunción y Central. Pago seguro vía Stripe.",
  },
  {
    q: "¿Sirven sobre lentes recetados?",
    a: "No. NOCTE no se usa sobre lentes graduados, son un único marco. Si tenés receta y querés una versión adaptada, escribinos por WhatsApp y te ayudamos a evaluar opciones.",
  },
  {
    q: "¿Emiten factura con RUC?",
    a: "Sí. Al momento del checkout podés cargar tu RUC y razón social. Emitimos factura electrónica en cuanto se confirma el pago.",
  },
];

export const FAQSection = () => {
  return (
    <section
      id="faq"
      aria-labelledby="faq-title"
      className="relative bg-black px-4 pb-6 pt-20 md:px-6 md:pb-8 md:pt-28"
    >
      <div className="mx-auto max-w-[820px]">
        <Reveal as="header" className="mb-12 text-center md:mb-16">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.22em] text-variant-active">
            Dudas que detienen ventas
          </p>
          <h2
            id="faq-title"
            className="text-[clamp(2rem,4.5vw,3.5rem)] font-bold leading-[1.05] tracking-tighter text-foreground"
          >
            Lo que <span className="text-variant-active">realmente</span> te
            <br />
            preguntás antes de comprar.
          </h2>
        </Reveal>

        <Accordion
          type="single"
          collapsible
          defaultValue="faq-0"
          className="flex flex-col gap-3"
        >
          {FAQS.map((faq, i) => (
            <FaqRow key={faq.q} index={i} faq={faq} />
          ))}
        </Accordion>
      </div>
    </section>
  );
};

interface FaqRowProps {
  index: number;
  faq: FaqEntry;
}

const FaqRow = ({ index, faq }: FaqRowProps) => (
  <Reveal delay={index * 40}>
    <AccordionItem
      value={`faq-${index}`}
      className="rounded-xl border border-border/40 bg-secondary/10 px-5 transition-colors duration-300 hover:border-variant-active/40 data-[state=open]:border-variant-active/40 data-[state=open]:bg-variant-active/5 md:px-6"
    >
      <AccordionTrigger className="py-5 text-left text-[15px] font-semibold text-foreground hover:no-underline data-[state=open]:text-foreground md:text-base">
        {faq.q}
      </AccordionTrigger>
      <AccordionContent className="text-sm leading-relaxed text-muted-foreground md:text-[15px]">
        {faq.a}
      </AccordionContent>
    </AccordionItem>
  </Reveal>
);

export default FAQSection;
