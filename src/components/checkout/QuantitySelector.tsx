import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { XMarkIcon, TruckIcon, PlusIcon, MinusIcon } from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";

interface QuantitySelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: (quantity: number, totalPrice: number) => void;
}

const BUNDLES = [
  {
    id: 'personal',
    quantity: 1,
    price: 199000,
    unitPrice: 199000,
    label: "Personal",
    badge: null,
    highlighted: false,
  },
  {
    id: 'pareja',
    quantity: 2,
    price: 299000,
    unitPrice: 149500,
    label: "Pack Pareja",
    badge: "🔥 MÁS VENDIDO: Ahorrás Gs. 99.000",
    highlighted: true,
    savings: 99000,
  },
  {
    id: 'oficina',
    quantity: 3,
    price: 429000,
    unitPrice: 143000,
    label: "Pack Oficina",
    badge: "Super Ahorro",
    highlighted: false,
    savings: 168000,
    allowExtraUnits: true,
  },
] as const;

const EXTRA_UNIT_PRICE = 143000;

export const QuantitySelector = ({ isOpen, onClose, onContinue }: QuantitySelectorProps) => {
  const [selectedBundleIndex, setSelectedBundleIndex] = useState(1);
  const [extraUnits, setExtraUnits] = useState(0);
  const [showWhatsAppOffer, setShowWhatsAppOffer] = useState(false);
  const [hasShownOffer, setHasShownOffer] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedBundleIndex(1);
      setExtraUnits(0);
      setShowWhatsAppOffer(false);
      setHasShownOffer(false);
    }
  }, [isOpen]);

  const handleCloseAttempt = () => {
    if (!hasShownOffer) {
      setShowWhatsAppOffer(true);
      setHasShownOffer(true);
    } else {
      onClose();
    }
  };

  const handleWhatsAppContact = () => {
    const phone = "595991893587";
    const message = encodeURIComponent(
      "Hola! Estaba viendo los lentes NOCTE y tengo algunas dudas antes de comprar."
    );
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
    setShowWhatsAppOffer(false);
  };

  const handleContinueShopping = () => {
    setShowWhatsAppOffer(false);
  };

  const handleExit = () => {
    setShowWhatsAppOffer(false);
    onClose();
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const selectedBundle = BUNDLES[selectedBundleIndex];
  const isOfficePackSelected = selectedBundleIndex === 2;
  const finalQuantity = isOfficePackSelected
    ? selectedBundle.quantity + extraUnits
    : selectedBundle.quantity;
  const finalPrice = isOfficePackSelected
    ? selectedBundle.price + (extraUnits * EXTRA_UNIT_PRICE)
    : selectedBundle.price;

  const handleBundleSelect = (index: number) => {
    const bundle = BUNDLES[index];

    if (index !== 2) {
      // Personal o Pack Pareja: avanzar inmediatamente al hacer clic
      onContinue(bundle.quantity, bundle.price);
    } else {
      // Pack Oficina: mostrar selector de unidades
      setSelectedBundleIndex(index);
      setExtraUnits(0);
    }
  };

  const handleAddUnit = () => {
    setExtraUnits(prev => Math.min(prev + 1, 7));
  };

  const handleRemoveUnit = () => {
    setExtraUnits(prev => Math.max(prev - 1, 0));
  };

  const handleContinue = () => {
    onContinue(finalQuantity, finalPrice);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4"
          onClick={handleCloseAttempt}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[500px] bg-gradient-to-b from-secondary to-black border border-border/50 rounded-xl p-8 md:p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] max-h-[90dvh] overflow-y-auto"
          >
            {/* Close Button */}
            <button
              onClick={handleCloseAttempt}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>

            {/* Content */}
            <div className="space-y-8">
              {/* Headline */}
              <div className="space-y-4 text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
                  Elige tu Pack NOCTE<sup className="text-[0.3em]">®</sup>
                </h2>
                <p className="text-base text-muted-foreground leading-relaxed">
                  Aprovecha nuestras ofertas especiales
                </p>
              </div>

              {/* Bundle Options */}
              <div className="space-y-4">
                {BUNDLES.map((bundle, index) => {
                  const isSelected = selectedBundleIndex === index;
                  const unitPrice = bundle.quantity === 1 ? bundle.price : Math.floor(bundle.price / bundle.quantity);

                  return (
                    <motion.button
                      key={bundle.id}
                      onClick={() => handleBundleSelect(index)}
                      className={`
                        relative w-full p-5 rounded-lg border-2 transition-all duration-300
                        ${isSelected
                          ? bundle.highlighted
                            ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                            : 'border-primary bg-primary/5'
                          : bundle.highlighted
                            ? 'border-primary/40 bg-secondary/20 hover:border-primary/60'
                            : 'border-border/30 bg-secondary/10 hover:border-border/50'
                        }
                        ${bundle.highlighted ? 'ring-2 ring-primary/30' : ''}
                      `}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {/* Badge */}
                      {bundle.badge && (
                        <div className={`
                          absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap
                          ${bundle.highlighted
                            ? 'bg-gradient-to-r from-primary to-[#DC2626] text-white shadow-lg'
                            : 'bg-gold text-black'
                          }
                        `}>
                          {bundle.badge}
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`
                            w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
                            ${isSelected ? 'border-primary' : 'border-border/50'}
                          `}>
                            {isSelected && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-3 h-3 rounded-full bg-primary"
                              />
                            )}
                          </div>

                          <div className="text-left">
                            <p className={`
                              text-lg font-bold
                              ${bundle.highlighted ? 'text-primary' : 'text-foreground'}
                            `}>
                              {bundle.quantity} {bundle.quantity === 1 ? 'Unidad' : 'Unidades'}
                            </p>
                            <p className="text-sm text-muted-foreground">{bundle.label}</p>
                            {bundle.quantity > 1 && (
                              <p className="text-xs text-muted-foreground/70 mt-1">
                                {unitPrice.toLocaleString('es-PY')} Gs c/u
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <p className={`
                            text-2xl font-bold
                            ${bundle.highlighted ? 'text-primary' : 'text-foreground'}
                          `}>
                            {bundle.price.toLocaleString('es-PY')} Gs
                          </p>
                          {'savings' in bundle && bundle.savings && (
                            <p className="text-xs text-gold font-medium mt-1">
                              Ahorrás {bundle.savings.toLocaleString('es-PY')} Gs
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Extra Units Control - Only for Pack Oficina */}
              <AnimatePresence>
                {isOfficePackSelected && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="p-5 bg-gold/10 border border-gold/30 rounded-lg space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            ¿Necesitás más unidades?
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Mismo precio de descuento: {EXTRA_UNIT_PRICE.toLocaleString('es-PY')} Gs c/u
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={handleRemoveUnit}
                            disabled={extraUnits === 0}
                            className={`
                              w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all
                              ${extraUnits === 0
                                ? 'border-border/30 text-muted-foreground/50 cursor-not-allowed'
                                : 'border-gold text-gold hover:bg-gold/10 active:scale-95'
                              }
                            `}
                          >
                            <MinusIcon className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center text-lg font-bold text-foreground">
                            {finalQuantity}
                          </span>
                          <button
                            onClick={handleAddUnit}
                            disabled={extraUnits >= 7}
                            className={`
                              w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all
                              ${extraUnits >= 7
                                ? 'border-border/30 text-muted-foreground/50 cursor-not-allowed'
                                : 'border-gold text-gold hover:bg-gold/10 active:scale-95'
                              }
                            `}
                          >
                            <PlusIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      {extraUnits > 0 && (
                        <div className="pt-3 border-t border-gold/20 flex justify-between items-center">
                          <p className="text-sm text-muted-foreground">
                            {selectedBundle.quantity} base + {extraUnits} extra
                          </p>
                          <p className="text-lg font-bold text-gold">
                            Total: {finalPrice.toLocaleString('es-PY')} Gs
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Free Shipping Banner */}
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="flex items-center justify-center gap-2">
                  <TruckIcon className="w-5 h-5 text-primary" />
                  <p className="text-sm text-primary font-medium">
                    Envío gratis a todo el Paraguay 🇵🇾
                  </p>
                </div>
              </div>

              {/* Botón Continuar - solo para Pack Oficina */}
              {isOfficePackSelected && (
                <Button
                  onClick={handleContinue}
                  variant="hero"
                  size="xl"
                  className="w-full h-14 text-base font-semibold"
                >
                  Continuar con {finalQuantity} {finalQuantity === 1 ? 'unidad' : 'unidades'} - {finalPrice.toLocaleString('es-PY')} Gs
                </Button>
              )}

              {/* Trust Indicators */}
              <p className="text-center text-xs text-muted-foreground/60 leading-relaxed">
                Soporte real por WhatsApp · Envíos a todo Paraguay · Pago al recibir
              </p>
            </div>

            {/* WhatsApp Downsell Overlay */}
            <AnimatePresence>
              {showWhatsAppOffer && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-50 flex items-center justify-center bg-black/95 p-6 rounded-xl backdrop-blur-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="text-center space-y-5 max-w-md w-full">
                    <div className="space-y-3">
                      <div className="w-16 h-16 mx-auto bg-green-500/10 rounded-full flex items-center justify-center">
                        <svg className="w-10 h-10 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                      </div>
                      <h2 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
                        ¿Tenés alguna duda antes de comprar?
                      </h2>
                      <p className="text-base text-muted-foreground leading-relaxed px-2">
                        Nuestro equipo está disponible por WhatsApp para ayudarte.
                        <span className="block mt-2 text-foreground font-medium">
                          Respondemos en menos de 2 minutos 🇵🇾
                        </span>
                      </p>
                    </div>

                    <div className="text-left space-y-2 bg-secondary/30 border border-border/30 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>Resolvemos todas tus dudas sobre el producto</span>
                      </p>
                      <p className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>Te asesoramos en elegir el pack ideal</span>
                      </p>
                      <p className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>Atención personalizada en español 🇵🇾</span>
                      </p>
                    </div>

                    <div className="pt-2 space-y-3">
                      <Button
                        type="button"
                        variant="hero"
                        size="xl"
                        className="w-full h-14 text-base font-semibold bg-green-500 hover:bg-green-600"
                        onClick={handleWhatsAppContact}
                      >
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        Hablar por WhatsApp
                      </Button>
                      <button
                        type="button"
                        onClick={handleContinueShopping}
                        className="w-full text-sm font-medium text-foreground hover:text-primary transition-colors py-2 underline"
                      >
                        Continuar eligiendo pack
                      </button>
                      <button
                        type="button"
                        onClick={handleExit}
                        className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
                      >
                        Salir
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default QuantitySelector;
