import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { WhatsAppGlyph } from "@/components/WhatsAppGlyph";
import { useEffect } from "react";
import { lockScroll, unlockScroll } from "@/lib/scrollLock";
import { buildWhatsAppUrl } from "@/lib/contact";

interface ExitIntentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExitIntentModal = ({ isOpen, onClose }: ExitIntentModalProps) => {
  // Prevent body scroll when modal is open (ref-counted)
  useEffect(() => {
    if (!isOpen) return;
    lockScroll();
    return () => { unlockScroll(); };
  }, [isOpen]);

  const whatsappUrl = buildWhatsAppUrl(
    "Hola, estaba por comprar los lentes NOCTE pero tengo una consulta..."
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[420px] bg-gradient-to-b from-secondary to-black border border-variant-active/30 rounded-xl p-8 shadow-[0_20px_60px_-15px_rgba(239,68,68,0.3)]"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Cerrar"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>

            <div className="space-y-5 text-center">
              {/* El logo real de WhatsApp, no una burbuja de chat generica: el
                  modal promete WhatsApp y el icono tiene que confirmarlo de una. */}
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366]/15">
                <WhatsAppGlyph className="h-7 w-7 text-[#25D366]" />
              </div>

              {/* Headline */}
              <div className="space-y-2">
                <h2 className="text-xl md:text-2xl font-bold text-foreground leading-tight">
                  ¿Tenés alguna duda?
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Hablá con nosotros por WhatsApp y te ayudamos
                  con cualquier consulta sobre los lentes NOCTE.
                </p>
              </div>

              {/* WhatsApp CTA */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
              >
                {/* bg-none apaga el degradado del variant por defecto del
                    Button: es background-image, asi que sin esto se dibuja
                    encima del verde y el boton salia del color del lente. */}
                <Button
                  type="button"
                  size="xl"
                  className="mt-2 h-12 w-full border-0 bg-none bg-[#25D366] text-base font-semibold text-white hover:bg-[#20BD5A]"
                >
                  <WhatsAppGlyph className="mr-2 h-5 w-5" />
                  Chatear por WhatsApp
                </Button>
              </a>

              {/* Skip option */}
              <button
                onClick={onClose}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                No gracias, seguir comprando
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ExitIntentModal;
