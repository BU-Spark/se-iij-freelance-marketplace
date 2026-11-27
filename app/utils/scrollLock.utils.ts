let locks = 0;

/**
 * Stops the page behind a drawer or popup from scrolling, and returns the release.
 * Counted, so one popup inside another unlocks only when both are gone, in whichever order.
 */
export function lockScroll(): () => void {
  locks += 1;
  document.body.style.overflow = 'hidden';

  return () => {
    locks -= 1;
    if (locks === 0) document.body.style.overflow = '';
  };
}
