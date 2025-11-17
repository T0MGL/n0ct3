import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { UserIcon, PhoneIcon, HomeIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { CheckoutProgressBar } from "./CheckoutProgressBar";

interface PhoneNameFormProps {
  isOpen: boolean;
  onSubmit: (data: { name: string; phone: string; address?: string }) => void;
  onClose?: () => void;
}

export const PhoneNameForm = ({ isOpen, onSubmit, onClose }: PhoneNameFormProps) => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+595 "); // ✅ Predefined prefix
  const [address, setAddress] = useState("");
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [loading, setLoading] = useState(false);
  const phoneInputRef = useRef<HTMLInputElement>(null);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setName("");
      setPhone("+595 ");
      setAddress("");
      setErrors({});
      setLoading(false);
    }
  }, [isOpen]);

  const formatPhoneNumber = (value: string) => {
    // Always ensure it starts with +595
    if (!value.startsWith("+595")) {
      return "+595 ";
    }

    // Remove all non-digits after the prefix
    const afterPrefix = value.slice(5); // Get everything after "+595 "
    const digits = afterPrefix.replace(/\D/g, "");

    // Return formatted number
    return `+595 ${digits}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    // Prevent deletion of the prefix
    if (!newValue.startsWith("+595")) {
      setPhone("+595 ");
      return;
    }

    // If user tries to delete space after +595, restore it
    if (newValue === "+595") {
      setPhone("+595 ");
      return;
    }

    const formatted = formatPhoneNumber(newValue);
    setPhone(formatted);
    setErrors((prev) => ({ ...prev, phone: undefined }));
  };

  const handlePhoneFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Position cursor at the end (after the prefix)
    const length = e.target.value.length;
    e.target.setSelectionRange(length, length);
  };

  const handlePhoneClick = (e: React.MouseEvent<HTMLInputElement>) => {
    // If user clicks before the end of prefix, move cursor to end
    const target = e.target as HTMLInputElement;
    if (target.selectionStart !== null && target.selectionStart < 5) {
      target.setSelectionRange(5, 5); // Position after "+595 "
    }
  };

  const validateForm = () => {
    const newErrors: { name?: string; phone?: string } = {};

    // Validate name
    if (!name || name.trim().length < 3) {
      newErrors.name = "Nombre requerido (mín. 3 caracteres)";
    } else if (name.length > 60) {
      newErrors.name = "Nombre demasiado largo (máx. 60 caracteres)";
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s-]+$/.test(name)) {
      newErrors.name = "Solo letras, espacios y guiones";
    }

    // Validate phone - only digits after "+595 "
    const afterPrefix = phone.slice(5); // Remove "+595 "
    const phoneDigits = afterPrefix.replace(/\D/g, "");
    if (phoneDigits.length < 8 || phoneDigits.length > 10) {
      newErrors.phone = "Teléfono inválido (ej: +595 971 234567)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    onSubmit({
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim() || undefined,
    });

    setLoading(false);
  };

  // Validate button state - only digits after "+595 "
  const phoneDigitsOnly = phone.slice(5).replace(/\D/g, "");
  const isValid = name.trim().length >= 3 && phoneDigitsOnly.length >= 8 && phoneDigitsOnly.length <= 10;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative w-full max-w-[500px] bg-gradient-to-b from-secondary to-black border-2 border-primary rounded-2xl p-6 md:p-8 shadow-[0_20px_25px_-5px_rgba(239,68,68,0.2)]"
          >
            {/* Close Button */}
            {onClose && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary/50"
                aria-label="Cerrar"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            )}

            <div className="space-y-6">
              {/* Progress Bar */}
              <CheckoutProgressBar currentStep={2} />

              {/* Headline */}
              <div className="text-center space-y-3">
                <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                  📞 Datos de contacto
                </h2>
                <p className="text-base text-muted-foreground">
                  Para completar tu pedido y comunicarte con nosotros
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* FIELD 1 - NOMBRE COMPLETO */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                    Nombre completo
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        setErrors((prev) => ({ ...prev, name: undefined }));
                      }}
                      placeholder="Ej: Juan López"
                      maxLength={60}
                      className={`w-full pl-11 pr-4 py-3 bg-secondary border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 transition-all ${
                        errors.name ? "border-red-500" : "border-border focus:border-primary"
                      }`}
                    />
                  </div>
                  {errors.name && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-red-400"
                    >
                      {errors.name}
                    </motion.p>
                  )}
                </div>

                {/* FIELD 2 - TELÉFONO */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                    Teléfono WhatsApp
                  </label>
                  <div className="relative">
                    <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      ref={phoneInputRef}
                      type="tel"
                      value={phone}
                      onChange={handlePhoneChange}
                      onFocus={handlePhoneFocus}
                      onClick={handlePhoneClick}
                      placeholder="Ej: +595 971 234567"
                      className={`w-full pl-11 pr-4 py-3 bg-secondary border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 transition-all ${
                        errors.phone ? "border-red-500" : "border-border focus:border-primary"
                      }`}
                    />
                  </div>
                  {errors.phone && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-red-400"
                    >
                      {errors.phone}
                    </motion.p>
                  )}
                </div>

                {/* FIELD 3 - REFERENCIA (OPCIONAL) */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                    Referencia para encontrar (opcional)
                  </label>
                  <div className="relative">
                    <HomeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Ej: Cerca del supermercado, edificio azul"
                      maxLength={150}
                      className="w-full pl-11 pr-4 py-3 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={!isValid || loading}
                  variant="hero"
                  size="xl"
                  className="w-full h-14 text-base font-bold mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin">⏳</span>
                      Guardando...
                    </span>
                  ) : (
                    "Confirmar y completar compra"
                  )}
                </Button>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
