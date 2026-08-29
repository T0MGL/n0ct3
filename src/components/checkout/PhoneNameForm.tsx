import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { UserIcon, PhoneIcon, HomeIcon, XMarkIcon, MapPinIcon, CheckIcon, BuildingOfficeIcon, DocumentTextIcon, EnvelopeIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import { CheckoutProgressBar } from "./CheckoutProgressBar";
import { API_CONFIG } from "@/lib/stripe";
import { lockScroll, unlockScroll } from "@/lib/scrollLock";
import { PARAGUAY_CITIES } from "@/data/paraguayCities";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface PhoneNameFormProps {
  isOpen: boolean;
  onSubmit: (data: { name: string; phone: string; location: string; address: string; isGeolocated: boolean; lat?: number; long?: number; ruc?: string; email?: string }) => void;
  onClose?: () => void;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Documento fiscal paraguayo: RUC con dígito verificador (4123456-7) o cédula sola (4123456)
const DOCUMENT_REGEX = /^\d{5,9}(-\d)?$/;

// El email aparece recien cuando el documento ya tiene cuerpo. Seis digitos
// es la cedula paraguaya mas corta en circulacion, asi que abajo de eso el
// campo todavia no le dice nada al cliente.
const DOCUMENT_DIGITS_TO_REVEAL_EMAIL = 6;

type FormErrors = {
  name?: string;
  phone?: string;
  address?: string;
  city?: string;
  email?: string;
  ruc?: string;
};

// El orden es el de lectura del formulario: al fallar, el foco va al primero
// que aparece en pantalla, no al primero que devuelva el objeto.
const FIELD_ORDER = ["name", "phone", "ruc", "email", "city", "address"] as const;

const FIELD_LABELS: Record<(typeof FIELD_ORDER)[number], string> = {
  name: "nombre",
  phone: "teléfono",
  ruc: "RUC o cédula",
  email: "email",
  city: "ciudad",
  address: "dirección",
};

const listToSentence = (items: string[]) =>
  items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} y ${items[items.length - 1]}`;

/**
 * Deja los dígitos que van después del +595 fijo del campo.
 *
 * El campo ya muestra el prefijo, así que cuando alguien pega su número
 * completo el 595 aparece dos veces, y cuando lo pega como se escribe acá
 * (0981...) viaja un 0 que no existe con código de país. Las dos formas
 * armaban un número que Ordefy tenía que salvar del otro lado.
 */
const toParaguayDigits = (value: string) => {
  let digits = value.replace(/\D/g, "");
  while (digits.startsWith("595") && digits.length > 9) {
    digits = digits.slice(3);
  }
  if (digits.startsWith("0")) {
    digits = digits.replace(/^0+/, "");
  }
  return digits.slice(0, 10);
};

const normalizeDocument = (value: string) => {
  const [base, ...verifier] = value.replace(/[^\d-]/g, "").split("-");
  if (!base) return "";
  return verifier.length ? `${base}-${verifier.join("").slice(0, 1)}` : base;
};

export const PhoneNameForm = ({ isOpen, onSubmit, onClose }: PhoneNameFormProps) => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+595 "); // ✅ Predefined prefix
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [ruc, setRuc] = useState("");
  const [invoiceEmail, setInvoiceEmail] = useState("");
  const [emailRevealed, setEmailRevealed] = useState(false);
  const [emailRevealDone, setEmailRevealDone] = useState(false);
  const [customPrefix, setCustomPrefix] = useState(false);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [detectedLocation, setDetectedLocation] = useState<string | null>(null);
  const [showManualLocation, setShowManualLocation] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationCoords, setLocationCoords] = useState<{ lat?: number; long?: number }>({});
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const rucInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const cityFieldRef = useRef<HTMLInputElement>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const cityInputRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true);
  const prefersReducedMotion = useReducedMotion();

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
      setCity("");
      setAddress("");
      setRuc("");
      setInvoiceEmail("");
      setEmailRevealed(false);
      setEmailRevealDone(false);
      setCustomPrefix(false);
      setShowCitySuggestions(false);
      setDetectedLocation(null);
      setShowManualLocation(true);
      setLocationError(null);
      setIsLoadingLocation(false);
      setLocationCoords({});
      setErrors({});
      setLoading(false);
    }
  }, [isOpen]);

  // Close city suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (cityInputRef.current && !cityInputRef.current.contains(e.target as Node)) {
        setShowCitySuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Prevent body scroll when modal is open (iOS-safe, ref-counted)
  useEffect(() => {
    if (!isOpen) return;
    lockScroll();
    return () => { unlockScroll(); };
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

    return false;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    if (customPrefix) {
      // Free editing mode: just ensure "+" at start.
      if (!newValue.startsWith("+")) {
        setPhone("+" + newValue.replace(/[^0-9]/g, ""));
      } else {
        // Keep "+" and digits/spaces only
        setPhone("+" + newValue.slice(1).replace(/[^0-9 ]/g, ""));
      }
      setErrors((prev) => ({ ...prev, phone: undefined }));
      return;
    }

    // Default Paraguay mode: lock +595 prefix.
    // Que el valor no arranque con "+595" son dos casos distintos: borraron
    // dentro del prefijo, y ahi lo que queda es un pedazo de "+595"; o
    // reemplazaron todo pegando el numero, y ahi hay que normalizarlo.
    if (!newValue.startsWith("+595") && "+595".startsWith(newValue)) {
      setPhone("+595 ");
      setErrors((prev) => ({ ...prev, phone: undefined }));
      return;
    }

    const digits = toParaguayDigits(
      newValue.startsWith("+595") ? newValue.slice(4) : newValue,
    );
    setPhone(`+595 ${digits}`);

    // Real-time validation for fake numbers
    if (digits.length >= 8 && isFakePhoneNumber(digits)) {
      setErrors((prev) => ({ ...prev, phone: "Por favor, introducí un número válido" }));
    } else {
      setErrors((prev) => ({ ...prev, phone: undefined }));
    }
  };

  const handlePhoneFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (!customPrefix) {
      const length = e.target.value.length;
      e.target.setSelectionRange(length, length);
    }
  };

  const handlePhoneClick = (e: React.MouseEvent<HTMLInputElement>) => {
    if (!customPrefix) {
      const target = e.target as HTMLInputElement;
      if (target.selectionStart !== null && target.selectionStart < 5) {
        target.setSelectionRange(5, 5);
      }
    }
  };

  // Ref to abort in-flight geocoding requests on unmount
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const handleUseLocation = () => {
    setIsLoadingLocation(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError("Tu navegador no soporta geolocalización");
      setIsLoadingLocation(false);
      setShowManualLocation(true);
      return;
    }

    // Abort any previous in-flight request
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        if (!isMountedRef.current || controller.signal.aborted) return;

        const { latitude, longitude } = position.coords;

        try {
          const response = await fetch(`${API_CONFIG.baseUrl}/api/reverse-geocode`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat: latitude, lng: longitude }),
            signal: controller.signal,
          });

          if (!isMountedRef.current) return;

          if (!response.ok) {
            throw new Error(`Reverse geocoding failed: ${response.status}`);
          }

          const data = await response.json();

          if (!isMountedRef.current) return;

          const locationText = data.city || data.formattedAddress || "Paraguay";
          setDetectedLocation(locationText);
          setLocationCoords({ lat: latitude, long: longitude });
          setIsLoadingLocation(false);
        } catch (err) {
          if (!isMountedRef.current || controller.signal.aborted) return;

          if (import.meta.env.DEV) {
            console.error("Location processing error:", err);
          }
          setDetectedLocation("Paraguay (coordenadas GPS obtenidas)");
          setLocationCoords({ lat: latitude, long: longitude });
          setIsLoadingLocation(false);
        }
      },
      (err) => {
        if (!isMountedRef.current) return;

        if (import.meta.env.DEV) {
          console.error("Geolocation error:", err);
        }
        setLocationError("Permiso denegado para acceder a tu ubicación");
        setDetectedLocation(null);
        setIsLoadingLocation(false);
        setShowManualLocation(true);
      },
      { timeout: 10000, enableHighAccuracy: false, maximumAge: 300000 }
    );
  };

  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {};

    // Validate name
    if (!name || name.trim().length < 3) {
      newErrors.name = "Nombre requerido (mín. 3 caracteres)";
    } else if (name.length > 60) {
      newErrors.name = "Nombre demasiado largo (máx. 60 caracteres)";
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s-]+$/.test(name)) {
      newErrors.name = "Solo letras, espacios y guiones";
    }

    // Validate phone
    if (customPrefix) {
      // Custom country code: just check minimum length (code + number).
      const allDigits = phone.replace(/\D/g, "");
      if (allDigits.length < 10) {
        newErrors.phone = "Número inválido (incluí código de país + número)";
      }
    } else {
      // Paraguay mode: digits after "+595 ".
      const afterPrefix = phone.slice(5);
      const phoneDigits = afterPrefix.replace(/\D/g, "");
      if (phoneDigits.length < 8 || phoneDigits.length > 10) {
        newErrors.phone = "Teléfono inválido (ej: +595 971 234567)";
      } else if (isFakePhoneNumber(phoneDigits)) {
        newErrors.phone = "Por favor, introducí un número válido";
      }
    }

    // Validate location (either GPS-detected or manual city + address)
    if (!detectedLocation) {
      if (!city.trim()) {
        newErrors.city = "Seleccioná una ciudad";
      }
      if (address.trim().length < 5) {
        newErrors.address = "Ingresá tu dirección (mín. 5 caracteres)";
      }
    }

    // Todo pedido se factura y la cédula alcanza para quien no tiene RUC. Con
    // número del exterior el documento pasa a opcional: esa persona puede no
    // tener uno paraguayo, y exigirlo la dejaba sin poder comprar.
    const documentTrimmed = ruc.trim();
    if (!documentTrimmed) {
      if (!customPrefix) {
        newErrors.ruc = "Ingresá tu RUC o cédula";
      }
    } else if (!DOCUMENT_REGEX.test(documentTrimmed)) {
      newErrors.ruc = "Documento inválido. Va sin puntos: 4123456 o 4123456-7";
    }

    // El email solo sirve para mandar la copia de la factura: se valida si lo cargan.
    const emailTrimmed = invoiceEmail.trim();
    if (emailTrimmed && (!EMAIL_REGEX.test(emailTrimmed) || emailTrimmed.length > 120)) {
      newErrors.email = "Email inválido";
    }

    setErrors(newErrors);
    return newErrors;
  };

  const focusFirstError = (formErrors: FormErrors) => {
    const refs: Record<(typeof FIELD_ORDER)[number], React.RefObject<HTMLInputElement>> = {
      name: nameInputRef,
      phone: phoneInputRef,
      ruc: rucInputRef,
      email: emailInputRef,
      city: cityFieldRef,
      address: addressInputRef,
    };
    const first = FIELD_ORDER.find((field) => formErrors[field]);
    const input = first ? refs[first].current : null;
    if (!input) return;
    input.scrollIntoView({ block: "center", behavior: prefersReducedMotion ? "auto" : "smooth" });
    input.focus({ preventScroll: true });
  };

  // Filter cities based on input
  const filteredCities = city.trim().length >= 2
    ? PARAGUAY_CITIES.filter((c) =>
        c.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
          .includes(city.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""))
      ).slice(0, 6)
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      focusFirstError(formErrors);
      return;
    }

    setLoading(true);

    onSubmit({
      name: name.trim(),
      phone: phone.trim(),
      location: detectedLocation || city.trim(),
      address: address.trim(),
      isGeolocated: !!detectedLocation,
      lat: locationCoords.lat,
      long: locationCoords.long,
      ruc: ruc.trim() || undefined,
      email: invoiceEmail.trim() || undefined,
    });

    setLoading(false);
  };

  // Validate button state
  const missingFields = FIELD_ORDER.filter((field) => errors[field]).map((field) => FIELD_LABELS[field]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 touch-none"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative w-full max-w-[500px] bg-gradient-to-b from-secondary to-black border-2 border-variant-active rounded-2xl p-6 md:p-8 shadow-[0_20px_25px_-5px_rgba(239,68,68,0.2)] max-h-[90dvh] overflow-y-auto overscroll-contain touch-auto"
          >
            <div className="space-y-6">
              {/* Header with Progress Bar and Close Button */}
              <div className="flex items-start justify-between gap-4">
                {/* El progress bar trae su propio mb-6 porque el paso 2 lo
                    necesita. Acá lo neutralizamos: con el space-y-6 del modal
                    ya hay separación, y sumados dejaban un vacío de 48px. */}
                <div className="flex-1 min-w-0 [&>div]:mb-0">
                  <CheckoutProgressBar currentStep={1} />
                </div>
                {onClose && (
                  <button
                    onClick={onClose}
                    type="button"
                    className="shrink-0 p-2.5 -m-1 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary/50"
                    aria-label="Cerrar"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Form */}
              {/* Sin encabezado "Tus datos": el paso ya se llama "Datos de
                  entrega" en la barra de progreso justo arriba, asi que era la
                  misma palabra dos veces y 46px de alto para no decir nada. Los
                  campos arrancan directo. "Ubicacion de entrega" si conserva su
                  divisor porque ahi si cambia el tema. */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* FIELD 1 - NOMBRE COMPLETO */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                    Nombre completo
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      ref={nameInputRef}
                      type="text"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        setErrors((prev) => ({ ...prev, name: undefined }));
                      }}
                      placeholder="Ej: Juan López"
                      maxLength={60}
                      className={`w-full pl-11 pr-4 py-3 bg-secondary border rounded-lg text-base text-foreground placeholder:text-white/45 focus:outline-none focus:ring-2 focus:ring-variant-active/40 transition-all ${errors.name ? "border-red-500" : "border-border focus:border-variant-active"
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
                      className={`w-full pl-11 pr-4 py-3 bg-secondary border rounded-lg text-base text-foreground placeholder:text-white/45 focus:outline-none focus:ring-2 focus:ring-variant-active/40 transition-all ${errors.phone ? "border-red-500" : "border-border focus:border-variant-active"
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
                  <button
                    type="button"
                    onClick={() => {
                      if (customPrefix) {
                        setCustomPrefix(false);
                        setPhone("+595 ");
                      } else {
                        setCustomPrefix(true);
                        setPhone("+");
                        // Sin documento obligatorio, el email es la unica via
                        // para mandarle la factura, asi que se muestra igual.
                        setEmailRevealed(true);
                        setErrors((prev) => ({ ...prev, phone: undefined, ruc: undefined }));
                        // Focus and place cursor after "+"
                        setTimeout(() => phoneInputRef.current?.focus(), 0);
                      }
                    }}
                    className="text-[13px] text-foreground underline underline-offset-4 decoration-foreground/25 hover:text-foreground hover:decoration-foreground/60 transition-colors"
                  >
                    {customPrefix ? "Volver a +595 (Paraguay)" : "¿Otro país?"}
                  </button>
                </div>

                {/* FIELD 3 - DOCUMENTO FISCAL (obligatorio: todo pedido se factura) */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                    RUC o cédula{customPrefix && <span className="font-normal text-foreground"> (opcional)</span>}
                  </label>
                  <div className="relative">
                    <DocumentTextIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      ref={rucInputRef}
                      type="text"
                      value={ruc}
                      onChange={(e) => {
                        const next = normalizeDocument(e.target.value);
                        setRuc(next);
                        // Una vez revelado no se vuelve a esconder: colapsarlo
                        // al borrar un digito haria saltar el formulario entero
                        // bajo el dedo.
                        if (next.replace(/\D/g, "").length >= DOCUMENT_DIGITS_TO_REVEAL_EMAIL) {
                          setEmailRevealed(true);
                        }
                        setErrors((prev) => ({ ...prev, ruc: undefined }));
                      }}
                      placeholder="Ej: 4123456-7"
                      maxLength={12}
                      inputMode="tel"
                      autoComplete="off"
                      className={`w-full pl-11 pr-4 py-3 bg-secondary border rounded-lg text-base text-foreground placeholder:text-white/45 focus:outline-none focus:ring-2 focus:ring-variant-active/40 transition-all ${errors.ruc ? "border-red-500" : "border-border focus:border-variant-active"
                        }`}
                    />
                  </div>
                  {errors.ruc ? (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-red-400"
                    >
                      {errors.ruc}
                    </motion.p>
                  ) : (
                    <p className="text-[13px] text-foreground">
                      {customPrefix
                        ? "Es para la factura. Con documento paraguayo sale a tu nombre."
                        : "Es para emitir tu factura. Si no tenés RUC, poné tu cédula."}
                    </p>
                  )}
                </div>

                {/* FIELD 4 - EMAIL (opcional, aparece recien con el documento cargado) */}
                {emailRevealed && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{
                      duration: prefersReducedMotion ? 0 : 0.28,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    onAnimationComplete={() => setEmailRevealDone(true)}
                    // El overflow solo hace falta mientras la altura se anima.
                    // Si queda puesto, recorta el focus ring del input.
                    className={`space-y-2 ${emailRevealDone ? "" : "overflow-hidden"}`}
                  >
                    <label className="block text-sm font-medium text-foreground">
                      Email <span className="font-normal text-foreground">(opcional)</span>
                    </label>
                    <div className="relative">
                      <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        ref={emailInputRef}
                        type="email"
                        value={invoiceEmail}
                        onChange={(e) => {
                          setInvoiceEmail(e.target.value);
                          setErrors((prev) => ({ ...prev, email: undefined }));
                        }}
                        placeholder="nombre@email.com"
                        maxLength={120}
                        autoComplete="email"
                        inputMode="email"
                        className={`w-full pl-11 pr-4 py-3 bg-secondary border rounded-lg text-base text-foreground placeholder:text-white/45 focus:outline-none focus:ring-2 focus:ring-variant-active/40 transition-all ${errors.email ? "border-red-500" : "border-border focus:border-variant-active"
                          }`}
                      />
                    </div>
                    {errors.email ? (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-red-400"
                      >
                        {errors.email}
                      </motion.p>
                    ) : (
                      <p className="text-[13px] text-foreground">
                        Para enviarte la factura electrónica.
                      </p>
                    )}
                  </motion.div>
                )}

                {/* LOCATION SECTION */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2 pb-2 border-b border-border/30">
                    <MapPinIcon className="w-5 h-5 text-variant-active" />
                    <h3 className="text-sm font-semibold text-foreground">
                      Ubicación de entrega
                    </h3>
                  </div>

                  {/* Detected Location Display */}
                  {detectedLocation && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-variant-active/10 border border-variant-active/30 rounded-lg"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckIcon className="w-5 h-5 text-variant-active" />
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
                          className="text-[13px] text-foreground underline underline-offset-4 decoration-foreground/25 hover:text-foreground hover:decoration-foreground/60 transition-colors"
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


                  {/* Manual Location Entry: City autocomplete + Address */}
                  {showManualLocation && !detectedLocation && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-3"
                    >
                      {/* El GPS completa ciudad y direccion de una: es el camino
                          rapido, no una nota al pie. */}
                      <button
                        type="button"
                        onClick={handleUseLocation}
                        disabled={isLoadingLocation}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-border bg-secondary/40 text-sm font-medium text-foreground hover:bg-secondary hover:border-variant-active/40 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoadingLocation ? (
                          <>
                            <div className="inline-block w-4 h-4 border border-white/30 border-t-white rounded-full animate-spin" />
                            Detectando...
                          </>
                        ) : (
                          <>
                            <MapPinIcon className="w-4 h-4 text-variant-active" />
                            Usar mi ubicación actual
                          </>
                        )}
                      </button>
                      {/* City autocomplete */}
                      <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-foreground">
                          Ciudad
                        </label>
                        <div className="relative" ref={cityInputRef}>
                          <BuildingOfficeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
                          <input
                            ref={cityFieldRef}
                            type="text"
                            value={city}
                            onChange={(e) => {
                              setCity(e.target.value);
                              setShowCitySuggestions(true);
                              setErrors((prev) => ({ ...prev, city: undefined }));
                            }}
                            onFocus={() => {
                              if (city.trim().length >= 2) setShowCitySuggestions(true);
                            }}
                            placeholder="Ej: Asunción, Ciudad del Este..."
                            autoComplete="off"
                            className={`w-full pl-11 pr-4 py-3 bg-secondary border rounded-lg text-base text-foreground placeholder:text-white/45 focus:outline-none focus:ring-2 focus:ring-variant-active/40 transition-all ${errors.city ? "border-red-500" : "border-border focus:border-variant-active"}`}
                          />
                          {/* Suggestions dropdown */}
                          {showCitySuggestions && filteredCities.length > 0 && (
                            <div className="absolute z-50 w-full mt-1 bg-secondary border border-border rounded-lg shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                              {filteredCities.map((suggestion) => (
                                <button
                                  key={suggestion}
                                  type="button"
                                  onClick={() => {
                                    setCity(suggestion);
                                    setShowCitySuggestions(false);
                                    setErrors((prev) => ({ ...prev, city: undefined }));
                                  }}
                                  className="w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-variant-active/10 transition-colors"
                                >
                                  {suggestion}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        {errors.city && (
                          <motion.p
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-xs text-red-400"
                          >
                            {errors.city}
                          </motion.p>
                        )}
                      </div>

                      {/* Address field */}
                      <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-foreground">
                          Dirección
                        </label>
                        <div className="relative">
                          <HomeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                          <input
                            ref={addressInputRef}
                            type="text"
                            value={address}
                            onChange={(e) => {
                              setAddress(e.target.value);
                              setErrors((prev) => ({ ...prev, address: undefined }));
                            }}
                            placeholder="Ej: Av. Mariscal López 1234"
                            className={`w-full pl-11 pr-4 py-3 bg-secondary border rounded-lg text-base text-foreground placeholder:text-white/45 focus:outline-none focus:ring-2 focus:ring-variant-active/40 transition-all ${errors.address ? "border-red-500" : "border-border focus:border-variant-active"}`}
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
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Las dos pruebas que contestan la duda del momento de pagar,
                    contra el boton y no en la cabecera. */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-foreground">
                  <span className="flex items-center gap-1.5">
                    <CheckIcon className="w-4 h-4 shrink-0 text-variant-active" strokeWidth={2.5} />
                    Pagás al recibir
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckIcon className="w-4 h-4 shrink-0 text-variant-active" strokeWidth={2.5} />
                    Soporte via WhatsApp
                  </span>
                </div>

                {/* Consent Disclosure */}
                <p className="text-xs leading-relaxed text-foreground">
                  Al continuar, acepto los{" "}
                  <a
                    href="/terminos-y-condiciones"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-foreground transition-colors"
                  >
                    Términos y Condiciones
                  </a>{" "}
                  y la{" "}
                  <a
                    href="/politica-de-privacidad"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-foreground transition-colors"
                  >
                    Política de Privacidad
                  </a>
                </p>

                {missingFields.length > 0 && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: prefersReducedMotion ? 0 : 0.2, ease: [0.16, 1, 0.3, 1] }}
                    role="alert"
                    className="text-[13px] text-red-400"
                  >
                    Falta completar: {listToSentence(missingFields)}.
                  </motion.p>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  variant="hero"
                  size="xl"
                  className="group w-full h-14 text-base font-bold mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin">⏳</span>
                      Guardando...
                    </span>
                  ) : (
                    <>
                      Continuar
                      <ArrowRightIcon className="transition-transform duration-300 group-hover:translate-x-0.5" strokeWidth={2.5} />
                    </>
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
