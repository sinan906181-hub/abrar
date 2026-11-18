/**
 * Centralized Global Animation System
 * Consistent timing, easing curves, spring physics, and reduced-motion utilities.
 */

export const EASE_CINEMATIC = [0.16, 1, 0.3, 1] as const;
export const EASE_CURTAIN = [0.76, 0, 0.24, 1] as const;
export const EASE_SILK = [0.22, 1, 0.36, 1] as const;

export const SPRING_MAGNETIC = {
  type: 'spring' as const,
  stiffness: 260,
  damping: 20,
  mass: 0.5,
};

export const SPRING_TILT = {
  type: 'spring' as const,
  stiffness: 220,
  damping: 24,
  mass: 0.6,
};

export const SPRING_CURSOR = {
  type: 'spring' as const,
  stiffness: 420,
  damping: 32,
  mass: 0.35,
};

export const SPRING_ELASTIC = {
  type: 'spring' as const,
  stiffness: 340,
  damping: 18,
  mass: 0.65,
};

export const VIEWPORT_CONFIG = {
  once: true,
  amount: 0.16,
} as const;

export const DURATION = {
  instant: 0.16,
  fast: 0.24,
  base: 0.45,
  slow: 0.72,
  cinematic: 0.95,
} as const;
