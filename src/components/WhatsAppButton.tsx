import { useState, useEffect } from "react";
import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/solid";

interface WhatsAppButtonProps {
  phoneNumber: string;
}

export const WhatsAppButton = ({ phoneNumber }: WhatsAppButtonProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Get ProductGallery section
      const productGallery = document.querySelector('[data-section="product-gallery"]');
      if (!productGallery) return;

      // Get the position of the ProductGallery section
      const galleryBottom = productGallery.getBoundingClientRect().bottom;

      // Show button when user scrolls past the ProductGallery
      setIsVisible(galleryBottom < 0);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Check initial state

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleClick = () => {
    const message = encodeURIComponent("Hola, me interesa obtener más información sobre NOCTE®");
    const whatsappUrl = `https://wa.me/${phoneNumber.replace(/\+/g, "")}?text=${message}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <button
      onClick={handleClick}
      className={`fixed bottom-6 right-6 z-40 bg-[#25D366] hover:bg-[#20BD5A] text-white rounded-full p-4 shadow-lg transition-all duration-300 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      }`}
      aria-label="Contactar por WhatsApp"
    >
      <ChatBubbleLeftRightIcon className="w-6 h-6" />
    </button>
  );
};
