import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { XMarkIcon, EnvelopeIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface ExitIntentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExitIntentModal = ({ isOpen, onClose }: ExitIntentModalProps) => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes("@")) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Send email to webhook
      const response = await fetch("https://n8n.thebrightidea.ai/webhook/offerpopout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          timestamp: new Date().toISOString(),
          discountOffered: "10%",
          originalPrice: 279000,
          discountedPrice: Math.round(279000 * 0.9), // 10% discount
        }),
      });

      if (response.ok) {
        setIsSubmitted(true);

        // Wait a moment to show success message, then close and navigate
        setTimeout(() => {
          onClose();
          navigate("/");
        }, 2000);
      } else {
        console.error("Failed to send email to webhook");
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Error sending email:", error);
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
    navigate("/");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[500px] bg-gradient-to-b from-secondary to-black border border-primary/30 rounded-xl p-8 md:p-10 shadow-[0_20px_60px_-15px_rgba(239,68,68,0.3)]"
          >
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>

            {!isSubmitted ? (
              <div className="space-y-6">
                {/* Headline */}
                <div className="space-y-3 text-center">
                  <h2 className="text-2xl md:text-3xl font-bold text-primary leading-tight">
                    ¡Espera! No pierdas tu progreso 🎁
                  </h2>
                  <p className="text-lg md:text-xl font-semibold text-foreground">
                    Te regalamos 10% adicional de descuento
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Déjanos tu email y te enviaremos un cupón especial con{" "}
                    <span className="text-primary font-semibold">10% de descuento adicional</span>{" "}
                    sobre el precio promocional de 279.000 Gs.{" "}
                    <span className="text-foreground font-medium">Podrás volver cuando quieras para completar tu compra.</span>
                  </p>
                </div>

                {/* Price Comparison */}
                <div className="p-4 bg-secondary/30 border border-primary/20 rounded-lg space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Precio actual</span>
                    <span className="text-foreground font-medium line-through">
                      279.000 Gs
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-foreground font-semibold">Con cupón del 10%</span>
                    <span className="text-2xl font-bold text-primary">
                      {Math.round(279000 * 0.9).toLocaleString('es-PY')} Gs
                    </span>
                  </div>
                  <p className="text-xs text-center text-primary/80 pt-2">
                    ¡Ahorras {Math.round(279000 * 0.1).toLocaleString('es-PY')} Gs adicionales!
                  </p>
                </div>

                {/* Email Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="relative">
                    <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@email.com"
                      required
                      className="w-full pl-10 pr-4 py-3 bg-secondary/50 border border-border/50 rounded-lg text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="hero"
                    size="xl"
                    disabled={isSubmitting || !email}
                    className="w-full h-12 text-base font-semibold"
                  >
                    {isSubmitting ? "Enviando..." : "Obtener mi cupón del 10%"}
                  </Button>
                </form>

                {/* Skip option */}
                <button
                  onClick={handleClose}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  No gracias, volver al inicio
                </button>
              </div>
            ) : (
              <div className="space-y-6 text-center py-8">
                <div className="w-16 h-16 mx-auto bg-primary/20 rounded-full flex items-center justify-center">
                  <EnvelopeIcon className="w-8 h-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-primary">
                    ¡Listo!
                  </h3>
                  <p className="text-muted-foreground">
                    Revisa tu email para obtener tu cupón de descuento del 10%
                  </p>
                </div>
                <p className="text-sm text-muted-foreground/70">
                  Redirigiendo al inicio...
                </p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ExitIntentModal;
