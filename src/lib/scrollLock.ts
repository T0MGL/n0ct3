/**
 * Global scroll lock utility with reference counting.
 * Handles multiple concurrent modals and iOS Safari correctly.
 */

let lockCount = 0;
let savedScrollY = 0;

export function lockScroll(): void {
  if (lockCount === 0) {
    savedScrollY = window.scrollY;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${savedScrollY}px`;
    document.body.style.width = '100%';
  }
  lockCount++;
}

export function unlockScroll(): void {
  if (lockCount <= 0) return;
  lockCount--;
  if (lockCount === 0) {
    const sy = savedScrollY;
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    savedScrollY = 0;
    window.scrollTo(0, sy);
  }
}
