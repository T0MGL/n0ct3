import { CheckIcon, XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { useRef, useState, useEffect } from "react";

const comparisons = [
  {
    title: "Lentes Transparentes",
    specs: [
      { label: "Bloqueo de luz azul", value: "45-50%", isGood: false },
      { label: "Mejora el sueño", value: "No", isGood: false },
      { label: "Garantía", value: "0 días", isGood: false },
      { label: "Precio", value: "150k Gs", isGood: true },
    ],
  },
  {
    title: "Lentes Amarillos",
    specs: [
      { label: "Bloqueo de luz azul", value: "60-70%", isGood: false },
      { label: "Mejora el sueño", value: "Moderado", isGood: false },
      { label: "Garantía", value: "0 días", isGood: false },
      { label: "Precio", value: "279k Gs", isGood: true },
    ],
  },
  {
    title: "NOCTE Rojos",
    specs: [
      { label: "Bloqueo de luz azul", value: "99%", isGood: true },
      { label: "Mejora el sueño", value: "Máximo", isGood: true },
      { label: "Garantía", value: "30 días", isGood: true },
      { label: "Precio", value: "199k Gs", isGood: true },
    ],
    isNocte: true,
  },
];

export const ComparisonTable = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const checkScrollability = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScrollability();
    window.addEventListener('resize', checkScrollability);
    return () => window.removeEventListener('resize', checkScrollability);
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 350;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
    scrollRef.current.style.cursor = 'grabbing';
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (scrollRef.current) {
      scrollRef.current.style.cursor = 'grab';
    }
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      if (scrollRef.current) {
        scrollRef.current.style.cursor = 'grab';
      }
    }
  };

  return (
    <section className="py-8 md:py-16 px-4 md:px-6 bg-gradient-to-b from-black via-card/20 to-black">
      <div className="container max-w-[1200px] mx-auto">
        <div className="text-center mb-12 md:mb-16 space-y-4 md:space-y-6">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter px-4">
            ¿Por qué NOCTE es diferente?
          </h2>
          <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground font-light px-4 max-w-3xl mx-auto leading-relaxed">
            No todos los lentes son iguales. Aquí está la diferencia real.
          </p>
          <p className="text-sm md:text-base text-primary/80 font-medium">
            Arrastra para comparar →
          </p>
        </div>

        <div className="relative">
          {/* Left Arrow */}
          {canScrollLeft && (
            <button
              onClick={() => scroll('left')}
              className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-12 h-12 items-center justify-center bg-primary/90 hover:bg-primary rounded-full shadow-lg transition-all duration-300"
              aria-label="Scroll left"
            >
              <ChevronLeftIcon className="w-6 h-6 text-white" strokeWidth={2.5} />
            </button>
          )}

          {/* Right Arrow */}
          {canScrollRight && (
            <button
              onClick={() => scroll('right')}
              className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-12 h-12 items-center justify-center bg-primary/90 hover:bg-primary rounded-full shadow-lg transition-all duration-300"
              aria-label="Scroll right"
            >
              <ChevronRightIcon className="w-6 h-6 text-white" strokeWidth={2.5} />
            </button>
          )}

          {/* Scrollable Container */}
          <div
            ref={scrollRef}
            onScroll={checkScrollability}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            className="overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing will-change-transform"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <div className="flex gap-6 md:gap-8 pb-4 min-w-max">
              {comparisons.map((option, index) => (
                <div
                  key={index}
                  className={`p-8 md:p-10 border-2 w-[280px] md:w-[340px] flex-shrink-0 ${option.isNocte
                    ? "border-primary/50 bg-primary/5 md:scale-105"
                    : "border-border/50 bg-card/30"
                    } relative select-none will-change-transform`}
                >
                  {option.isNocte && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary px-6 py-2 text-sm font-bold shadow-lg">
                      RECOMENDADO
                    </div>
                  )}

                  <h3 className={`text-2xl md:text-3xl font-bold mb-8 text-center ${option.isNocte ? "text-primary" : "text-foreground/80"
                    }`}>
                    {option.title}
                  </h3>

                  <div className="space-y-6">
                    {option.specs.map((spec, specIndex) => (
                      <div key={specIndex} className="flex items-start justify-between gap-4">
                        <span className="text-base text-muted-foreground flex-1">
                          {spec.label}
                        </span>
                        <div className="flex items-center gap-3">
                          {spec.label !== "Precio" && (
                            spec.isGood ? (
                              <CheckIcon className="w-6 h-6 text-primary flex-shrink-0" strokeWidth={2.5} />
                            ) : (
                              <XMarkIcon className="w-6 h-6 text-muted-foreground/40 flex-shrink-0" strokeWidth={2.5} />
                            )
                          )}
                          <span className={`text-base font-bold ${option.isNocte && spec.isGood ? "text-primary" : "text-foreground"
                            }`}>
                            {spec.value}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ComparisonTable;
