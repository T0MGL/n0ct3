// Optimized Framer Motion animation variants
// Reduces animation complexity and respects user preferences

const REDUCED_MOTION = typeof window !== 'undefined'
  ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
  : false;

// Fast easing function for smooth animations
export const EASING = [0.25, 0.1, 0.25, 1] as const;

// Optimized durations (shorter = better performance)
export const DURATION = {
  fast: 0.3,
  normal: 0.4,
  slow: 0.5,
} as const;

// Fade in animation (lightweight)
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: {
    duration: REDUCED_MOTION ? 0 : DURATION.fast,
    ease: EASING,
  },
};

// Fade in with slight Y movement (most common pattern)
export const fadeInUp = {
  initial: { opacity: 0, y: REDUCED_MOTION ? 0 : 15 },
  animate: { opacity: 1, y: 0 },
  transition: {
    duration: REDUCED_MOTION ? 0 : DURATION.normal,
    ease: EASING,
  },
};

// For viewport-triggered animations (whileInView)
export const fadeInUpView = {
  initial: { opacity: 0, y: REDUCED_MOTION ? 0 : 15 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.3, margin: "0px 0px -100px 0px" },
  transition: {
    duration: REDUCED_MOTION ? 0 : DURATION.fast,
    ease: EASING,
  },
};

// Stagger container for multiple items
export const staggerContainer = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: {
    staggerChildren: REDUCED_MOTION ? 0 : 0.05,
  },
};

// Stagger children items
export const staggerItem = {
  initial: { opacity: 0, y: REDUCED_MOTION ? 0 : 15 },
  animate: { opacity: 1, y: 0 },
  transition: {
    duration: REDUCED_MOTION ? 0 : DURATION.fast,
    ease: EASING,
  },
};

// Scale animation (for hover effects)
export const scaleOnHover = {
  whileHover: REDUCED_MOTION ? {} : { scale: 1.02 },
  transition: {
    duration: DURATION.fast,
    ease: EASING,
  },
};

// Fade in from left (for side content)
export const fadeInLeft = {
  initial: { opacity: 0, x: REDUCED_MOTION ? 0 : -20 },
  whileInView: { opacity: 1, x: 0 },
  viewport: { once: true, amount: 0.3 },
  transition: {
    duration: REDUCED_MOTION ? 0 : DURATION.fast,
    ease: EASING,
  },
};

// Fade in from right (for side content)
export const fadeInRight = {
  initial: { opacity: 0, x: REDUCED_MOTION ? 0 : 20 },
  whileInView: { opacity: 1, x: 0 },
  viewport: { once: true, amount: 0.3 },
  transition: {
    duration: REDUCED_MOTION ? 0 : DURATION.fast,
    ease: EASING,
  },
};
