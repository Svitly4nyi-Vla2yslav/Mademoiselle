const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
export const motionEnabled = () => document.documentElement.dataset.motion === 'on';
export function setMotionEnabled(enabled: boolean) {
  document.documentElement.dataset.motion = enabled ? 'on' : 'off';
  window.dispatchEvent(new Event('cafe-motion-change'));
}
export function subscribeMotion(callback: () => void) {
  window.addEventListener('cafe-motion-change', callback);
  return () => window.removeEventListener('cafe-motion-change', callback);
}
document.documentElement.dataset.motion = preference.matches ? 'off' : 'on';
preference.addEventListener('change', () => setMotionEnabled(!preference.matches));
