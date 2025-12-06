import { motion } from "framer-motion";
import { TruckIcon, ShieldCheckIcon, CheckBadgeIcon } from "@heroicons/react/24/outline";

const messages = [
  {
    icon: TruckIcon,
    text: "DELIVERY GRATIS A TODO PARAGUAY",
  },
  {
    icon: ShieldCheckIcon,
    text: "PAGO 100% SEGURO",
  },
  {
    icon: CheckBadgeIcon,
    text: "GARANTÍA 30 DÍAS",
  },
];

export const DeliveryBanner = () => {
  return (
    <div className="fixed top-0 left-0 w-full bg-gradient-to-r from-[#EF4444] to-[#DC2626] text-white z-[60] overflow-hidden h-9 md:h-10 flex items-center">
      <div className="absolute inset-0 flex items-center w-full">
        {/* We need multiple copies to ensure seamless loop on large screens */}
        <motion.div
          className="flex whitespace-nowrap"
          animate={{ x: ["0%", "-50%"] }}
          transition={{
            repeat: Infinity,
            ease: "linear",
            duration: 20, // Adjust speed as needed
          }}
        >
          {/* Render list enough times to cover screen width + buffer */}
          {[...Array(6)].map((_, groupIndex) => (
            <div key={groupIndex} className="flex items-center">
              {messages.map((item, i) => (
                <div key={i} className="flex items-center gap-2 mx-6 md:mx-12">
                  <item.icon className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                  <span className="text-xs md:text-sm font-medium tracking-wide">
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};
