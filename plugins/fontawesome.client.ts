const FONTAWESOME_IDLE_DELAY = 8000;
const FONTAWESOME_INTERACTION_EVENTS = ['pointerdown', 'keydown', 'touchstart', 'scroll'];

export default defineNuxtPlugin(() => {
  if (!import.meta.client) {
    return;
  }

  let loaded = false;
  let timeoutId: number | null = null;

  const cleanup = () => {
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId);
      timeoutId = null;
    }

    FONTAWESOME_INTERACTION_EVENTS.forEach((eventName) => {
      window.removeEventListener(eventName, loadFontAwesome);
    });
  };

  const loadFontAwesome = () => {
    if (loaded) {
      return;
    }

    loaded = true;
    cleanup();

    void Promise.all([
      import('@fortawesome/fontawesome-free/css/fontawesome.min.css'),
      import('@fortawesome/fontawesome-free/css/solid.min.css'),
      import('@fortawesome/fontawesome-free/css/regular.min.css'),
      import('@fortawesome/fontawesome-free/css/brands.min.css'),
    ]).catch((error) => {
      console.error('Failed to load Font Awesome styles:', error);
    });
  };

  FONTAWESOME_INTERACTION_EVENTS.forEach((eventName) => {
    window.addEventListener(eventName, loadFontAwesome, { once: true, passive: true });
  });

  timeoutId = window.setTimeout(loadFontAwesome, FONTAWESOME_IDLE_DELAY);
});
