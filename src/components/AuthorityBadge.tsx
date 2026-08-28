import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AuthorityBadgeProps {
  /** Oculta la frase del medio. Docked implica collapsed. */
  collapsed: boolean;
  /** Posado en el header, al lado del wordmark, en vez de sobre la foto. */
  docked: boolean;
  className?: string;
}

// Un solo layoutId compartido por los dos puntos de montaje. Cuando el badge
// deja de renderizarse sobre la galeria y aparece en el header, Framer mide las
// dos cajas y lo hace volar entre ellas: no hay dos badges cruzandose en opacity
// ni una posicion fija con numeros a mano.
const LAYOUT_ID = "nocte-authority-badge";

// Vuelo largo a proposito. Es un elemento que se va de la foto para dejarla ver,
// y la unica forma de que se lea como que se movio (y no como que desaparecio y
// aparecio otro) es que el ojo lo pueda seguir.
const FLIGHT = { duration: 0.72, ease: [0.22, 0.61, 0.36, 1] as const };

export const AuthorityBadge = ({
  collapsed,
  docked,
  className,
}: AuthorityBadgeProps) => (
  <motion.div
    layoutId={LAYOUT_ID}
    layout
    initial={false}
    transition={{ layout: FLIGHT }}
    className={cn(
      "relative flex items-center gap-1.5 overflow-hidden whitespace-nowrap rounded-md font-semibold text-white shadow-lg",
      docked
        ? "nocte-glint px-2 py-[3px] text-[11px]"
        : "px-3 py-1.5 text-xs md:text-sm",
      className,
    )}
    style={{
      background:
        "linear-gradient(90deg, hsl(var(--variant-active)), hsl(var(--variant-active) / 0.75))",
      willChange: "transform, width",
    }}
  >
    <motion.span layout="position" transition={FLIGHT}>
      #1
    </motion.span>
    <AnimatePresence mode="popLayout" initial={false}>
      {!collapsed && !docked && (
        <motion.span
          key="mid"
          layout="position"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 0.61, 0.36, 1] }}
        >
          Lentes Anti-Luz Azul en Paraguay
        </motion.span>
      )}
    </AnimatePresence>
    <motion.span layout="position" transition={FLIGHT}>
      🇵🇾
    </motion.span>
  </motion.div>
);

export default AuthorityBadge;
