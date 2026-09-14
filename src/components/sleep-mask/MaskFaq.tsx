import { Reveal } from "@/components/Reveal";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { MASK_SOLD_OUT_NOTICE } from "@/lib/mask-colors";

interface FaqEntry {
  q: string;
  a: string;
}

// Las dudas que frenan la compra de un antifaz, en el orden en que aparecen:
// si molesta, cuando se usa, que colores hay, como se paga y que pasa si no
// convence. El agotado sale del mismo flag que el selector.
const FAQS: readonly FaqEntry[] = [
  {
    q: "¿Aprieta los ojos?",
    a: "No. Las copas 3D rodean los ojos y no apoyan sobre los párpados, así que no sentís presión aunque lo uses toda la noche.",
  },
  {
    q: "¿Sirve para la siesta o para viajar?",
    a: "Sí. Sirve en cualquier momento en que necesités oscuridad: la siesta, dormir de día después de un turno de noche, el avión o el colectivo.",
  },
  {
    q: "¿Qué colores hay?",
    a: `Negro y rosado. Los dos tienen la misma copa 3D y la misma correa ajustable.${MASK_SOLD_OUT_NOTICE ? ` ${MASK_SOLD_OUT_NOTICE}` : ""}`,
  },
  {
    q: "¿Cómo pago y cuánto sale el envío?",
    a: "El delivery es gratis a todo Paraguay. Pagás cuando lo recibís, en efectivo, QR o transferencia, o con tarjeta en el checkout.",
  },
  {
    q: "¿Y si no me convence?",
    a: "Tenés 30 días de garantía de satisfacción desde que lo recibís. Nos escribís por WhatsApp con tu número de pedido, coordinamos el retiro y te devolvemos lo que pagaste.",
  },
];

export const MaskFaq = () => (
  <section aria-labelledby="mask-faq-title" className="border-t border-white/10 bg-black px-5 py-24 sm:px-8 md:py-32">
    <div className="mx-auto grid max-w-[1200px] gap-10 lg:grid-cols-12 lg:gap-16">
      <Reveal as="header" className="lg:col-span-4">
        <h2
          id="mask-faq-title"
          className="max-w-[14ch] text-[34px] font-bold leading-[1.02] tracking-[-0.03em] text-white [text-wrap:balance] md:text-5xl"
        >
          Lo que preguntan antes de comprarlo.
        </h2>
      </Reveal>

      <Accordion type="single" collapsible className="lg:col-span-8">
        {FAQS.map((faq, index) => (
          <AccordionItem key={faq.q} value={`mask-faq-${index}`} className="border-white/10">
            <AccordionTrigger className="py-6 text-left text-[17px] font-semibold text-white hover:no-underline md:text-lg">
              {faq.q}
            </AccordionTrigger>
            <AccordionContent className="max-w-[60ch] pb-6 text-[15px] leading-relaxed text-white/70 md:text-base">
              {faq.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  </section>
);
