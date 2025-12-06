import { ShieldCheckIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface GuaranteeSectionProps {
  onBuyClick: () => void;
}

export const GuaranteeSection = ({ onBuyClick }: GuaranteeSectionProps) => {
  return (
    <>
      <section className="py-8 md:py-16 px-4 md:px-6 bg-black relative overflow-hidden" id="comprar">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.08),transparent_60%)]" />

        <div className="container max-w-[900px] mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            className="text-center space-y-8 md:space-y-12"
          >
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl" />
                <div className="relative w-16 h-16 md:w-20 md:h-20 bg-black border border-primary/30 rounded-full flex items-center justify-center">
                  <ShieldCheckIcon className="w-8 h-8 md:w-10 md:h-10 text-primary" strokeWidth={1.5} />
                </div>
              </div>
            </div>

            <div className="space-y-4 md:space-y-6">
              <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tighter px-4">
                Garantía 30 Días
              </h2>
              <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground font-light px-4">
                O Dinero de Vuelta. Sin sorpresas.
              </p>
            </div>

            <div className="max-w-2xl mx-auto space-y-6 md:space-y-8 py-4 md:py-8">
              <p className="text-base md:text-lg text-foreground/80 leading-relaxed font-light px-4">
                Prueba NOCTE<sup className="text-[0.3em]">®</sup> durante 30 días completos. Si no notas mejora en tu sueño,
                te devolvemos el 100% de tu dinero. Sin preguntas, sin complicaciones.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
                <Button
                  data-guarantee-cta
                  variant="hero"
                  size="xl"
                  className="w-full sm:w-auto sm:min-w-[300px] shadow-[0_0_50px_rgba(239,68,68,0.4)] text-base md:text-lg h-14 md:h-16"
                  onClick={onBuyClick}
                >
                  Comprar Ahora
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-xs md:text-sm text-muted-foreground font-light pt-4">
                <span>Envío GRATIS</span>
                <span className="hidden sm:inline">•</span>
                <span>1-2 días</span>
                <span className="hidden sm:inline">•</span>
                <span>Garantía 30 días</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default GuaranteeSection;
