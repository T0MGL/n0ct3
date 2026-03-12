import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { XMarkIcon, ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";
import { useEffect } from "react";
import { lockScroll, unlockScroll } from "@/lib/scrollLock";

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

  const message = encodeURIComponent(
    "Hola, estaba por comprar los lentes NOCTE pero tengo una consulta..."
  );
  const whatsappUrl = `https://wa.me/595991893587?text=${message}`;

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
            className="relative w-full max-w-[420px] bg-gradient-to-b from-secondary to-black border border-primary/30 rounded-xl p-8 shadow-[0_20px_60px_-15px_rgba(239,68,68,0.3)]"
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
              {/* Icon */}
              <div className="w-14 h-14 mx-auto bg-[#25D366]/15 rounded-full flex items-center justify-center">
                <ChatBubbleLeftRightIcon className="w-7 h-7 text-[#25D366]" />
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
                <Button
                  type="button"
                  size="xl"
                  className="w-full h-12 text-base font-semibold bg-[#25D366] hover:bg-[#20BD5A] text-white border-0 mt-2"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
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
