import { motion } from "framer-motion";

interface ColorSelectorProps {
  color1: string | null;
  color2: string | null;
  onColor1Change: (color: string) => void;
  onColor2Change: (color: string) => void;
}

const colors = [
  { id: "rojo-clasico", name: "Rojo Clásico", hex: "#EF4444" },
  { id: "naranja-solar", name: "Naranja Solar", hex: "#F97316" },
  { id: "azul-noche", name: "Azul Noche", hex: "#3B82F6" },
];

export const ColorSelector = ({ color1, color2, onColor1Change, onColor2Change }: ColorSelectorProps) => {
  return (
    <div className="mb-8 space-y-6">
      <h3 className="text-base font-bold text-foreground">Elige tus 2 colores</h3>

      {/* Subsección 1 - Primera NOCTE */}
      <div className="space-y-3">
        <div>
          <p className="text-sm font-semibold text-foreground">
            Primera NOCTE<sup className="text-[0.3em]">®</sup> Red Light Blocking Glasses
          </p>
          <p className="text-xs text-muted-foreground">Precio completo: 320,000 Gs</p>
        </div>

        <div className="flex flex-wrap gap-4">
          {colors.map((color) => (
            <motion.button
              key={color.id}
              onClick={() => onColor1Change(color.id)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              animate={{
                scale: color1 === color.id ? 1.15 : 1,
                borderWidth: color1 === color.id ? "4px" : "2px",
              }}
              transition={{ duration: 0.3, type: "spring", bounce: 0.4 }}
              className={`relative flex flex-col items-center gap-2 group ${
                color1 === color.id ? "z-10" : ""
              }`}
            >
              <div
                className={`w-[60px] h-[60px] rounded-full transition-all duration-300 ${
                  color1 === color.id
                    ? "border-accent shadow-[0_0_20px_rgba(239,68,68,0.5)]"
                    : "border-muted-foreground/30 group-hover:border-accent"
                }`}
                style={{
                  backgroundColor: color.hex,
                  borderWidth: color1 === color.id ? "4px" : "2px",
                  borderStyle: "solid",
                }}
              />
              <span className="text-xs font-medium text-foreground whitespace-nowrap">
                {color.name}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Separator */}
      <div className="border-t border-border/30" />

      {/* Subsección 2 - Segunda NOCTE */}
      <div className="space-y-3">
        <div>
          <p className="text-sm font-semibold text-foreground">
            Segunda NOCTE<sup className="text-[0.3em]">®</sup> Red Light Blocking Glasses
          </p>
          <p className="text-xs text-[#FF6B6B] font-medium">
            🎯 50% OFF - Solo 160,000 Gs
          </p>
        </div>

        <div className="flex flex-wrap gap-4">
          {colors.map((color) => (
            <motion.button
              key={color.id}
              onClick={() => onColor2Change(color.id)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              animate={{
                scale: color2 === color.id ? 1.15 : 1,
                borderWidth: color2 === color.id ? "4px" : "2px",
              }}
              transition={{ duration: 0.3, type: "spring", bounce: 0.4 }}
              className={`relative flex flex-col items-center gap-2 group ${
                color2 === color.id ? "z-10" : ""
              }`}
            >
              <div
                className={`w-[60px] h-[60px] rounded-full transition-all duration-300 ${
                  color2 === color.id
                    ? "border-accent shadow-[0_0_20px_rgba(239,68,68,0.5)]"
                    : "border-muted-foreground/30 group-hover:border-accent"
                }`}
                style={{
                  backgroundColor: color.hex,
                  borderWidth: color2 === color.id ? "4px" : "2px",
                  borderStyle: "solid",
                }}
              />
              <span className="text-xs font-medium text-foreground whitespace-nowrap">
                {color.name}
              </span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};
