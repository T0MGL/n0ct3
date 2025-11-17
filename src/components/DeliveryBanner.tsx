import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XMarkIcon, TruckIcon } from "@heroicons/react/24/outline";

interface DeliveryBannerProps {
  onVisibilityChange?: (isVisible: boolean) => void;
}

export const DeliveryBanner = ({ onVisibilityChange }: DeliveryBannerProps) => {
  const [isVisible, setIsVisible] = useState(true);

  // Check localStorage on mount
  useEffect(() => {
    const bannerClosed = localStorage.getItem("nocte-delivery-banner-closed");
    if (bannerClosed === "true") {
      setIsVisible(false);
      onVisibilityChange?.(false);
    } else {
      onVisibilityChange?.(true);
    }
  }, [onVisibilityChange]);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem("nocte-delivery-banner-closed", "true");
    onVisibilityChange?.(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed top-0 left-0 right-0 z-[60] overflow-hidden"
        >
          <div className="bg-gradient-to-r from-[#EF4444] to-[#DC2626] text-white">
            <div className="container max-w-[1400px] mx-auto px-4 py-2 md:py-2.5">
              <div className="flex items-center justify-center gap-2 relative">
                <TruckIcon className="w-5 h-5 flex-shrink-0" />
                <p className="text-xs md:text-sm font-medium tracking-wide text-center">
                  DELIVERY GRATIS A TODO PARAGUAY
                </p>
                <button
                  onClick={handleClose}
                  className="absolute right-0 p-1 hover:bg-white/10 rounded transition-colors duration-300"
                  aria-label="Cerrar banner."
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
