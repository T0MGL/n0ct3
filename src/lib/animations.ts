// Framer Motion animation variants — premium, deliberate reveal animations
// Respects user preferences for reduced motion
// Note: For reactive reduced motion detection in components, use useReducedMotion hook

import { REDUCED_MOTION } from '@/hooks/useReducedMotion';

// Premium easing — slow start, confident settle (Apple-style ease-out)
export const EASING = [0.16, 1, 0.3, 1] as const;

// Durations — slow enough to feel intentional, fast enough to not drag
export const DURATION = {
  fast: 0.5,
  normal: 0.7,
  slow: 0.9,
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

// Fade in with Y movement (most common pattern)
export const fadeInUp = {
  initial: { opacity: 0, y: REDUCED_MOTION ? 0 : 40 },
  animate: { opacity: 1, y: 0 },
  transition: {
    duration: REDUCED_MOTION ? 0 : DURATION.normal,
    ease: EASING,
  },
};

// For viewport-triggered animations (whileInView)
export const fadeInUpView = {
  initial: { opacity: 0, y: REDUCED_MOTION ? 0 : 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.15 },
  transition: {
    duration: REDUCED_MOTION ? 0 : DURATION.normal,
    ease: EASING,
  },
};

// Stagger container variants (use with variants prop, NOT spread)
export const staggerContainerVariants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: REDUCED_MOTION ? 0 : 0.15,
      delayChildren: 0.1,
    },
  },
};

// Stagger item variants (use with variants prop, NOT spread)
export const staggerItemVariants = {
  hidden: { opacity: 0, y: REDUCED_MOTION ? 0 : 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: REDUCED_MOTION ? 0 : DURATION.normal,
      ease: EASING,
    },
  },
};

// Legacy exports for backwards compatibility (deprecated - use variants above)
export const staggerContainer = staggerContainerVariants;
export const staggerItem = staggerItemVariants;

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
  initial: { opacity: 0, x: REDUCED_MOTION ? 0 : -30 },
  whileInView: { opacity: 1, x: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: {
    duration: REDUCED_MOTION ? 0 : DURATION.normal,
    ease: EASING,
  },
};

// Fade in from right (for side content)
export const fadeInRight = {
  initial: { opacity: 0, x: REDUCED_MOTION ? 0 : 30 },
  whileInView: { opacity: 1, x: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: {
    duration: REDUCED_MOTION ? 0 : DURATION.normal,
    ease: EASING,
  },
};
