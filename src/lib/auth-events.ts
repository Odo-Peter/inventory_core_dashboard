/**
 * Tiny event bus so the axios interceptor (outside React) can notify the auth
 * provider about session-level failures without importing React.
 */
export type AuthEventName = 'unauthorized' | 'forbidden' | 'pin-change-required';

const target = new EventTarget();

function eventName(name: AuthEventName) {
  return `auth:${name}`;
}

export function emitAuthEvent(name: AuthEventName) {
  target.dispatchEvent(new Event(eventName(name)));
}

export function subscribeAuthEvent(name: AuthEventName, handler: () => void) {
  const listener = () => handler();
  target.addEventListener(eventName(name), listener);

  return () => target.removeEventListener(eventName(name), listener);
}
