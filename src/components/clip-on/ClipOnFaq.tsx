import { Reveal } from "@/components/Reveal";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ALL_MASK_COLORS_SOLD_OUT } from "@/lib/mask-colors";
import { CLIP_ON, SLEEP_MASK } from "@/lib/order";
import { formatPrice } from "@/lib/stripe";

interface FaqEntry {
  q: string;
  a: string;
}

// Las respuestas de tienda (envio, pago, factura, garantia) son las mismas que
// ya dicen la home y /sleep-mask, con las mismas palabras. Los precios salen
// de order.ts: si cambian, cambian aca solos.
//
// La que no esta, a proposito: "filtra lo mismo que los NOCTE?". No hay
// reporte de transmitancia propio del clip-on, y cualquier respuesta seria
// una afirmacion sin respaldo.
const FAQS: readonly FaqEntry[] = [
  {
    q: "¿Cómo se pone?",
    a: "Lo apoyás sobre el frente de tus lentes y el clip con resorte lo sujeta. Para sacarlo lo levantás del frente y sale en un segundo, sin tocar tus lentes.",
  },
  {
    q: "¿Cuánto sale y cómo pago?",
    a: `El Clip-On Rojo sale ${formatPrice(CLIP_ON.price, "pyg")}. El envío es gratis a todo Paraguay y pagás cuando lo recibís, en efectivo, QR o transferencia, o con tarjeta en el checkout.`,
  },
  {
    q: "¿Cuánto tarda en llegar?",
    a: "Asunción y Departamento Central en 24 a 48 horas, interior del país en 2 a 4 días hábiles.",
  },
  ...(ALL_MASK_COLORS_SOLD_OUT
    ? []
    : [
        {
          q: "¿Puedo sumar el antifaz?",
          a: `Sí. En el checkout sumás el Antifaz 3D a ${formatPrice(SLEEP_MASK.price, "pyg")}, con un toque.`,
        },
      ]),
  {
    q: "¿Emiten factura con RUC?",
    a: "Sí. Al momento del checkout podés cargar tu RUC y razón social. Emitimos factura electrónica en cuanto se confirma el pago.",
  },
  {
    q: "¿Y si no me convence?",
    a: "Tenés 30 días de garantía de satisfacción desde que lo recibís. Nos escribís por WhatsApp con tu número de pedido, coordinamos el retiro y te devolvemos lo que pagaste.",
  },
];

export const ClipOnFaq = () => (
  <section aria-labelledby="clipon-faq-title" className="border-t border-white/10 bg-black px-5 py-24 sm:px-8 md:py-32">
    <div className="mx-auto grid max-w-[1200px] gap-10 lg:grid-cols-12 lg:gap-16">
      <Reveal as="header" className="lg:col-span-4">
        <h2
          id="clipon-faq-title"
          className="max-w-[14ch] text-[34px] font-bold leading-[1.02] tracking-[-0.03em] text-white [text-wrap:balance] md:text-5xl"
        >
          Lo que preguntan antes de comprarlo.
        </h2>
      </Reveal>

      <Accordion type="single" collapsible className="lg:col-span-8">
        {FAQS.map((faq, index) => (
          <AccordionItem key={faq.q} value={`clipon-faq-${index}`} className="border-white/10">
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
