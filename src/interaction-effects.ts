/** Shared pointer / keyboard feedback for interactive controls.
 * Event delegation supports dynamically rendered cards, dialogs and navigation.
 */
const targetSelector = 'button, [role="button"], .module-card, .dash-metric, .theme-tile, .language-tile, .settings-tab-btn';
const init = () => {
  if (typeof document === 'undefined') return;
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const press = (event: PointerEvent | KeyboardEvent, keyboard = false) => {
    if (reduced?.matches) return;
    const el = event.target;
    if (!(el instanceof Element)) return;
    const target = el.closest<HTMLElement>(targetSelector);
    if (!target || target.hasAttribute('disabled') || target.getAttribute('aria-disabled') === 'true' || target.closest('[inert]')) return;
    if (event instanceof PointerEvent && event.button !== 0) return;
    const rect = target.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    target.classList.remove('ui-click-pulse');
    // Restart pulse when a user clicks rapidly.
    void target.offsetWidth;
    target.classList.add('ui-click-pulse');
    const spot = document.createElement('span');
    spot.className = 'ui-click-ripple';
    spot.setAttribute('aria-hidden', 'true');
    const diameter = Math.max(rect.width, rect.height) * 2.1;
    const x = keyboard ? rect.width / 2 : (event as PointerEvent).clientX - rect.left;
    const y = keyboard ? rect.height / 2 : (event as PointerEvent).clientY - rect.top;
    spot.style.setProperty('--ripple-size', `${diameter}px`);
    spot.style.setProperty('--ripple-x', `${x}px`);
    spot.style.setProperty('--ripple-y', `${y}px`);
    target.appendChild(spot);
    spot.addEventListener('animationend', () => spot.remove(), {once:true});
    target.addEventListener('animationend', (e) => {
      if (e.animationName === 'ui-press-flash') target.classList.remove('ui-click-pulse');
    }, {once:true});
  };
  document.addEventListener('pointerdown', event => press(event));
  document.addEventListener('keydown', event => {
    if ((event.key === 'Enter' || event.key === ' ') && !event.repeat) press(event, true);
  });
};
init();
