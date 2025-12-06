import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { motion } from "framer-motion";

const faqs = [
  {
    question: "¿Los uso para dormir o para trabajar?",
    answer: "Para trabajar/usar pantallas de noche. No son lentes para ponerte a dormir. Los usas mientras trabajas, estudias o scrolleas de noche (2-3 horas antes de dormir). Bloquean la luz azul que le dice a tu cerebro 'despierta', permitiendo que tu cuerpo produzca melatonina naturalmente. Resultado: cuando terminas tu sesión y vas a dormir, te dormís rápido y profundo.",
  },
  {
    question: "¿Cuál es la garantía de NOCTE?",
    answer: "30 días completos. Si después de usar NOCTE durante tus sesiones nocturnas no dormís mejor en 30 días, devolvemos 100% de tu dinero. Sin preguntas, sin sorpresas. Garantía clara y honesta.",
  },
  {
    question: "¿Cuánto tarda en llegar NOCTE?",
    answer: "Envío GRATIS a Asunción y Departamento Central. 1-2 días hábiles después de comprar. Packaging premium incluido.",
  },
  {
    question: "¿Funcionan si trabajo hasta las 2-3AM?",
    answer: "Sí, justamente para eso están diseñados. Úsalos durante tus sesiones nocturnas de trabajo (aunque sea hasta las 5AM). Tu cerebro producirá melatonina como si fuera de noche, permitiéndote dormir cuando termines tu día. Muchos emprendedores nocturnos reportan resultados increíbles.",
  },
  {
    question: "¿Qué incluye la caja de NOCTE?",
    answer: "1 par de lentes rojos NOCTE • Estuche premium (negro + dorado) • Paño de limpieza • Tarjeta de garantía (30 días)",
  },
];

export const FAQSection = () => {
  return (
    <section className="py-8 md:py-16 px-4 md:px-6 bg-gradient-to-b from-black via-card/20 to-black">
      <div className="container max-w-[900px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          className="text-center mb-12 md:mb-20 space-y-3 md:space-y-4"
        >
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold px-4">
            Preguntas Frecuentes
          </h2>
        </motion.div>

        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="border border-border/50 bg-black/50 backdrop-blur-sm px-5 md:px-8 hover:border-primary/30 transition-colors"
            >
              <AccordionTrigger className="text-left text-sm md:text-base lg:text-lg font-medium hover:text-primary py-5 md:py-6">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-sm md:text-base text-muted-foreground leading-relaxed font-light whitespace-pre-line pb-5 md:pb-6">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQSection;
