import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface WhatsAppHelpModalProps {
    isOpen: boolean;
    onClose: () => void;
    onContinue: () => void;
    onExit: () => void;
    orderNumber: string;
}

export const WhatsAppHelpModal = ({
    isOpen,
    onClose,
    onContinue,
    onExit,
    orderNumber,
}: WhatsAppHelpModalProps) => {
    const handleWhatsAppContact = () => {
        const phone = "595991893587";
        const message = encodeURIComponent(
            `Hola! Estaba por comprar NOCTE pero tengo algunas dudas. Mi orden: ${orderNumber}`
        );
        window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 p-4 md:p-6 backdrop-blur-sm"
                    onClick={(e) => e.stopPropagation()}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative w-full max-w-[450px] bg-black border border-white/10 rounded-3xl p-6 md:p-10 shadow-2xl overflow-y-auto max-h-[90vh]"
                    >
                        {/* Close icon for quick exit if they really want to */}
                        <button
                            onClick={onExit}
                            className="absolute top-4 right-4 text-muted-foreground hover:text-white transition-colors"
                        >
                            <XMarkIcon className="w-6 h-6" />
                        </button>

                        <div className="text-center space-y-6 md:space-y-8">
                            {/* WhatsApp Icon with Pulse Effect */}
                            <div className="relative inline-block">
                                <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping" />
                                <div className="relative w-20 h-20 md:w-24 md:h-24 mx-auto bg-green-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                                    <svg className="w-12 h-12 md:w-14 md:h-14 text-white" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                    </svg>
                                </div>
                            </div>

                            {/* Title & Description */}
                            <div className="space-y-4">
                                <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-white leading-tight tracking-tight">
                                    ¿Necesitás ayuda para completar tu pedido?
                                </h2>
                                <p className="text-base md:text-lg text-white/60 leading-relaxed max-w-sm mx-auto">
                                    Nuestro equipo está online por WhatsApp para asistirte{" "}
                                    <span className="text-white font-bold underline decoration-green-500">
                                        ahora mismo.
                                    </span>
                                </p>
                                <div className="flex items-center justify-center gap-2 py-1">
                                    <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                    <p className="text-sm font-bold text-green-500 uppercase tracking-widest">
                                        Disponibles ahora 🇵🇾
                                    </p>
                                </div>
                            </div>

                            {/* Checklist */}
                            <div className="grid grid-cols-1 gap-3 text-left bg-white/5 border border-white/10 rounded-2xl p-4 md:p-6">
                                {[
                                    "Resolvemos dudas sobre talles y color",
                                    "Ayuda paso a paso con el pago",
                                    "Atención humana y personalizada",
                                ].map((text, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="flex-shrink-0 w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center">
                                            <svg className="w-3 h-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <span className="text-sm md:text-base text-white/80 font-medium">{text}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Actions */}
                            <div className="space-y-4 pt-4">
                                <Button
                                    onClick={handleWhatsAppContact}
                                    className="w-full h-16 bg-green-500 hover:bg-green-600 text-white rounded-2xl text-lg font-bold shadow-[0_10px_20px_-5px_rgba(34,197,94,0.4)] transition-all hover:scale-[1.02] active:scale-[0.98] group"
                                >
                                    <svg className="w-6 h-6 mr-3 group-hover:animate-bounce" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                    </svg>
                                    Hablar por WhatsApp
                                </Button>

                                <button
                                    onClick={onContinue}
                                    className="w-full text-white/50 hover:text-white transition-colors text-sm font-medium pt-2"
                                >
                                    Continuar sin ayuda
                                </button>

                                <button
                                    onClick={onExit}
                                    className="w-full text-white/20 hover:text-white/40 transition-colors text-xs font-light py-2"
                                >
                                    Cerrar y salir del checkout
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
