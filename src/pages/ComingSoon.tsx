import { motion } from "framer-motion";
import { useEffect } from "react";

const ComingSoon = () => {
  useEffect(() => {
    document.title = "NOCTE | Próximamente";
  }, []);

  return (
    <main className="relative flex min-h-[100svh] w-full items-center justify-center overflow-hidden bg-black px-6 text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(0_86%_20%_/_0.18),_transparent_60%)]"
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        className="relative flex flex-col items-center text-center"
      >
        <span className="mb-10 select-none text-[11px] font-medium uppercase tracking-[0.5em] text-white/50 sm:text-xs">
          NOCTE
        </span>

        <h1 className="text-5xl font-semibold leading-none tracking-[-0.04em] sm:text-7xl md:text-8xl">
          Próximamente
        </h1>

        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10 h-px w-24 origin-center bg-white/30 sm:w-32"
        />
      </motion.div>
    </main>
  );
};

export default ComingSoon;
