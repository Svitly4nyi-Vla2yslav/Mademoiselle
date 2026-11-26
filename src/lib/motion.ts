// Motion is the default experience. Only the visitor's explicit control
// changes it during this page session; a fresh load starts enabled.
document.documentElement.dataset.motion = 'on';

export const motionEnabled = () => document.documentElement.dataset.motion === 'on';
export function setMotionEnabled(enabled: boolean) {
  document.documentElement.dataset.motion = enabled ? 'on' : 'off';
  window.dispatchEvent(new Event('cafe-motion-change'));
}
export function subscribeMotion(callback: () => void) {
  window.addEventListener('cafe-motion-change', callback);
  return () => window.removeEventListener('cafe-motion-change', callback);
}
