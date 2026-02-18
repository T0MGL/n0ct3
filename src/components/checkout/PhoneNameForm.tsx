import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { UserIcon, PhoneIcon, HomeIcon, XMarkIcon, MapPinIcon, CheckIcon } from "@heroicons/react/24/outline";
import { CheckoutProgressBar } from "./CheckoutProgressBar";
import { API_CONFIG } from "@/lib/stripe";

interface PhoneNameFormProps {
  isOpen: boolean;
  onSubmit: (data: { name: string; phone: string; location: string; address: string; lat?: number; long?: number }) => void;
  onClose?: () => void;
}

export const PhoneNameForm = ({ isOpen, onSubmit, onClose }: PhoneNameFormProps) => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+595 "); // ✅ Predefined prefix
  const [address, setAddress] = useState("");
  const [detectedLocation, setDetectedLocation] = useState<string | null>(null);
  const [showManualLocation, setShowManualLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationCoords, setLocationCoords] = useState<{ lat?: number; long?: number }>({});
  const [errors, setErrors] = useState<{ name?: string; phone?: string; address?: string }>({});
  const [loading, setLoading] = useState(false);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const isMountedRef = useRef(true);

  // Track component mounted state to prevent state updates after unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setName("");
      setPhone("+595 ");
      setAddress("");
      setDetectedLocation(null);
      setShowManualLocation(false);
      setLocationError(null);
      setIsLoadingLocation(false);
      setLocationCoords({});
      setErrors({});
      setLoading(false);
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open (iOS-safe)
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
    } else {
      const scrollY = document.body.style.top;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, parseInt(scrollY || '0') * -1);
    }
    return () => {
      const scrollY = document.body.style.top;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      if (scrollY) window.scrollTo(0, parseInt(scrollY) * -1);
    };
  }, [isOpen]);

  // Detect fake phone numbers with suspicious patterns
  const isFakePhoneNumber = (digits: string): boolean => {
    // All same digit (e.g., 981111111)
    if (/^(\d)\1+$/.test(digits)) return true;

    // Sequential repeating pairs (e.g., 981222333, 981223344)
    if (/^(\d{2,3})(\d)\2{2,}(\d)\3{2,}$/.test(digits)) return true;

    // Common fake patterns: ascending/descending sequences
    if (/^9[789]1?(123456|234567|345678|456789|987654|876543|765432)/.test(digits)) return true;

    // Mirror patterns (e.g., 981123321)
    if (digits.length >= 6) {
      const firstHalf = digits.slice(0, Math.floor(digits.length / 2));
      const secondHalf = digits.slice(-Math.floor(digits.length / 2));
      const reversedSecond = secondHalf.split('').reverse().join('');
      if (firstHalf === reversedSecond) return true;
    }

    // Three or more same consecutive digits anywhere (e.g., 981111234)
    if (/(\d)\1{3,}/.test(digits)) return true;

    // Two groups of 3+ same digits (e.g., 981222333)
    if (/(\d)\1{2,}.*(\d)\2{2,}/.test(digits)) return true;

    return false;
  };

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

    // Real-time validation for fake numbers
    const digits = formatted.slice(5).replace(/\D/g, "");
    if (digits.length >= 8 && isFakePhoneNumber(digits)) {
      setErrors((prev) => ({ ...prev, phone: "Por favor, introducí un número válido" }));
    } else {
      setErrors((prev) => ({ ...prev, phone: undefined }));
    }
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

  const handleUseLocation = () => {
    setIsLoadingLocation(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError("Tu navegador no soporta geolocalización");
      setIsLoadingLocation(false);
      setShowManualLocation(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        // Check if component is still mounted before updating state
        if (!isMountedRef.current) return;

        const { latitude, longitude } = position.coords;

        try {
          console.log(`📍 GPS coordinates obtained: ${latitude}, ${longitude}`);

          // Call backend reverse geocoding API
          const response = await fetch(`${API_CONFIG.baseUrl}/api/reverse-geocode`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              lat: latitude,
              lng: longitude,
            }),
          });

          // Check again after async operation
          if (!isMountedRef.current) return;

          if (!response.ok) {
            throw new Error(`Reverse geocoding failed: ${response.status}`);
          }

          const data = await response.json();
          console.log('✅ Reverse geocoding result:', data);

          // Final check before state updates
          if (!isMountedRef.current) return;

          // Use the precise address from reverse geocoding
          const locationText = data.city || data.formattedAddress || "Paraguay";
          setDetectedLocation(locationText);
          setLocationCoords({ lat: latitude, long: longitude });
          setIsLoadingLocation(false);
        } catch (err) {
          // Check if component is still mounted before updating state
          if (!isMountedRef.current) return;

          console.error("Location processing error:", err);

          // Fallback: use coordinates with generic location
          console.log('⚠️ Reverse geocoding failed, using fallback');
          setDetectedLocation("Paraguay (coordenadas GPS obtenidas)");
          setLocationCoords({ lat: latitude, long: longitude });
          setIsLoadingLocation(false);
        }
      },
      (err) => {
        // Check if component is still mounted before updating state
        if (!isMountedRef.current) return;

        console.error("Geolocation error:", err);
        setLocationError("Permiso denegado para acceder a tu ubicación");
        setDetectedLocation(null);
        setIsLoadingLocation(false);
        setShowManualLocation(true);
      }
    );
  };

  const validateForm = () => {
    const newErrors: { name?: string; phone?: string; address?: string } = {};

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
    } else if (isFakePhoneNumber(phoneDigits)) {
      newErrors.phone = "Por favor, introducí un número válido";
    }

    // Validate address (either detected or manual)
    if (!detectedLocation && address.trim().length < 10) {
      newErrors.address = "La dirección debe tener al menos 10 caracteres";
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
      location: detectedLocation || address.trim(),
      address: address.trim(),
      lat: locationCoords.lat,
      long: locationCoords.long,
    });

    setLoading(false);
  };

  // Validate button state
  const phoneDigitsOnly = phone.slice(5).replace(/\D/g, "");
  const hasValidLocation = detectedLocation || address.trim().length >= 10;
  const isValidPhone = phoneDigitsOnly.length >= 8 && phoneDigitsOnly.length <= 10 && !isFakePhoneNumber(phoneDigitsOnly);
  const isValid = name.trim().length >= 3 && isValidPhone && hasValidLocation;

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
            className="relative w-full max-w-[500px] bg-gradient-to-b from-secondary to-black border-2 border-primary rounded-2xl p-6 md:p-8 shadow-[0_20px_25px_-5px_rgba(239,68,68,0.2)] max-h-[90dvh] overflow-y-auto overscroll-y-contain"
          >
            <div className="space-y-6">
              {/* Header with Progress Bar and Close Button */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <CheckoutProgressBar currentStep={1} />
                </div>
                {onClose && (
                  <button
                    onClick={onClose}
                    className="shrink-0 p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary/50 -mt-1"
                    aria-label="Cerrar"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Trust Block */}
              <div className="text-center space-y-2">
                <p className="text-sm font-medium text-foreground">
                  Compra sin riesgo en Paraguay 🇵🇾
                </p>
                <div className="flex flex-col items-center gap-1 text-xs text-muted-foreground">
                  <span>✓ +1.000 entregas realizadas</span>
                  <span>✓ Soporte via WhatsApp</span>
                  <span>✓ Pagás al recibir</span>
                </div>
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
                      className={`w-full pl-11 pr-4 py-3 bg-secondary border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 transition-all ${errors.name ? "border-red-500" : "border-border focus:border-primary"
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
                      className={`w-full pl-11 pr-4 py-3 bg-secondary border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 transition-all ${errors.phone ? "border-red-500" : "border-border focus:border-primary"
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

                {/* LOCATION SECTION */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2 pb-2 border-b border-border/30">
                    <MapPinIcon className="w-5 h-5 text-primary" />
                    <label className="block text-sm font-semibold text-foreground">
                      Ubicación de entrega
                    </label>
                  </div>

                  {/* Detected Location Display */}
                  {detectedLocation && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-primary/10 border border-primary/30 rounded-lg"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckIcon className="w-5 h-5 text-primary" />
                          <p className="text-sm font-semibold text-foreground">
                            {detectedLocation}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setDetectedLocation(null);
                            setLocationCoords({});
                            setShowManualLocation(true);
                          }}
                          className="text-xs text-muted-foreground hover:text-foreground"
                        >
                          Cambiar
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Error Display - only show if not in manual mode */}
                  {locationError && !showManualLocation && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
                    >
                      <p className="text-xs text-red-400">{locationError}</p>
                    </motion.div>
                  )}

                  {/* Use Location Button */}
                  {!detectedLocation && !showManualLocation && (
                    <div className="space-y-2">
                      <Button
                        type="button"
                        onClick={handleUseLocation}
                        disabled={isLoadingLocation}
                        variant="outline"
                        size="lg"
                        className="w-full bg-transparent border-border/50 hover:bg-secondary/50"
                      >
                        {isLoadingLocation ? (
                          <span className="flex items-center gap-2">
                            <div className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Detectando ubicación...
                          </span>
                        ) : (
                          <>
                            <MapPinIcon className="w-4 h-4 mr-2" />
                            Usar mi ubicación actual
                          </>
                        )}
                      </Button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowManualLocation(true);
                          setLocationError(null); // Clear any location errors
                        }}
                        className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        O ingresar manualmente
                      </button>
                    </div>
                  )}

                  {/* Manual Location Entry */}
                  {showManualLocation && !detectedLocation && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-2"
                    >
                      <label className="block text-sm font-medium text-foreground">
                        Dirección completa
                      </label>
                      <div className="relative">
                        <HomeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                          type="text"
                          value={address}
                          onChange={(e) => {
                            setAddress(e.target.value);
                            setErrors((prev) => ({ ...prev, address: undefined }));
                            // Clear location error when user starts typing
                            if (locationError) {
                              setLocationError(null);
                            }
                          }}
                          placeholder="Ej: Asunción, Av. Mariscal López 1234"
                          className={`w-full pl-11 pr-4 py-3 bg-secondary border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 transition-all ${errors.address ? "border-red-500" : "border-border focus:border-primary"
                            }`}
                        />
                      </div>
                      {errors.address && (
                        <motion.p
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-xs text-red-400"
                        >
                          {errors.address}
                        </motion.p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Incluye ciudad y dirección (mínimo 10 caracteres)
                      </p>
                    </motion.div>
                  )}
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
                    "Confirmar y continuar al pago"
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

export default PhoneNameForm;
