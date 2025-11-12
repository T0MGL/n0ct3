import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { MapPinIcon, HomeIcon, CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface LocationModalProps {
  isOpen: boolean;
  onLocationSubmit: (location: { city: string; address: string; lat?: number; long?: number }) => void;
  onClose?: () => void;
}

const cities = [
  "Asunción",
  "Central",
  "Itapúa",
  "Alto Paraná",
  "Canindeyú",
  "Cordillera",
  "Paraguarí",
  "Caaguazú",
  "Misiones",
  "Ñeembucú",
];

export const LocationModal = ({ isOpen, onLocationSubmit, onClose }: LocationModalProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [fullAddress, setFullAddress] = useState<string>("");
  const [detectedLocation, setDetectedLocation] = useState<string | null>(null);
  const [showManualEntry, setShowManualEntry] = useState(false);

  const handleUseLocation = () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError("Tu navegador no soporta geolocalización");
      setLoading(false);
      setShowManualEntry(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          setDetectedLocation("Cargando tu ubicación...");

          // Simular delay de API
          await new Promise((resolve) => setTimeout(resolve, 1000));

          // Por ahora asumimos Asunción
          const city = "Asunción, Paraguay";
          setDetectedLocation(city);

          // Auto-advance después de 2 segundos
          setTimeout(() => {
            onLocationSubmit({ city, address: "", lat: latitude, long: longitude });
          }, 2000);
        } catch (err) {
          setError("No pudimos detectar tu ubicación");
          setDetectedLocation(null);
          setLoading(false);
          setShowManualEntry(true);
        }
      },
      (err) => {
        console.error("Geolocation error:", err);
        setError("Permiso denegado");
        setLoading(false);
        setShowManualEntry(true);
      }
    );
  };

  const handleManualSubmit = () => {
    if (selectedCity && fullAddress.trim()) {
      onLocationSubmit({ city: selectedCity, address: fullAddress.trim() });
    }
  };

  const isManualValid = selectedCity && fullAddress.trim().length >= 10;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative w-full max-w-[500px] bg-gradient-to-b from-secondary to-black border border-border/50 rounded-xl p-8 md:p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)]"
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
              {/* Step Indicator */}
              <p className="text-xs text-muted-foreground text-center">
                Paso 1 de 2: Ubicación
              </p>

              {/* Headline */}
              <div className="text-center space-y-3">
                <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                  ¿Dónde estás?
                </h2>
                <p className="text-base text-muted-foreground">
                  Necesitamos tu ubicación para coordinar el envío
                </p>
              </div>

              {/* Detected Location Display */}
              {detectedLocation && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-primary/10 border border-primary/30 rounded-lg text-center"
                >
                  <p className="text-sm font-semibold text-foreground flex items-center justify-center gap-2">
                    <MapPinIcon className="w-5 h-5 text-primary" />
                    {detectedLocation}
                  </p>
                </motion.div>
              )}

              {/* Error Display */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg"
                >
                  <p className="text-sm text-red-400 text-center">{error}</p>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    No hay problema, selecciona tu ciudad abajo
                  </p>
                </motion.div>
              )}

              {/* Use Location Button */}
              {!detectedLocation && !showManualEntry && (
                <div className="space-y-3">
                  <Button
                    onClick={handleUseLocation}
                    disabled={loading}
                    variant="hero"
                    size="xl"
                    className="w-full h-14 text-base font-semibold"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin">⏳</span>
                        Detectando ubicación...
                      </span>
                    ) : (
                      <>
                        <MapPinIcon className="w-5 h-5 mr-2" />
                        Usar mi ubicación actual
                      </>
                    )}
                  </Button>

                  <button
                    onClick={() => setShowManualEntry(true)}
                    className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    O ingresar manualmente
                  </button>
                </div>
              )}

              {/* Manual Entry */}
              {showManualEntry && !detectedLocation && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {/* City Selector - Premium Grid */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-foreground">
                      Selecciona tu ciudad
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {cities.map((city) => (
                        <button
                          key={city}
                          onClick={() => setSelectedCity(city)}
                          className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                            selectedCity === city
                              ? "bg-primary/10 border-primary text-foreground"
                              : "bg-secondary/30 border-border/30 text-muted-foreground hover:border-border hover:bg-secondary/50"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span>{city}</span>
                            {selectedCity === city && (
                              <CheckIcon className="w-4 h-4 text-primary" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Address Field - Shows when city is selected */}
                  {selectedCity && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      transition={{ duration: 0.3 }}
                      className="space-y-2"
                    >
                      <label className="block text-sm font-medium text-foreground">
                        Dirección completa
                      </label>
                      <div className="relative">
                        <HomeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                          type="text"
                          value={fullAddress}
                          onChange={(e) => setFullAddress(e.target.value)}
                          placeholder="Ej: Av. Mariscal López 1234, entre Brasilia y Sacramento"
                          className="w-full pl-11 pr-4 py-3 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Mínimo 10 caracteres
                      </p>
                    </motion.div>
                  )}

                  {/* Submit Button */}
                  <Button
                    onClick={handleManualSubmit}
                    disabled={!isManualValid}
                    variant="hero"
                    size="xl"
                    className="w-full h-14 text-base font-semibold mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continuar
                  </Button>
                </motion.div>
              )}

              {/* Privacy Note */}
              <p className="text-xs text-muted-foreground text-center">
                Tu ubicación es privada y no se comparte
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
