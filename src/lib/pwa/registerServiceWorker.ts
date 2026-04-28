export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return
  }

  if (!import.meta.env.PROD) {
    window.addEventListener('load', () => {
      void navigator.serviceWorker
        .getRegistrations()
        .then((registrations) =>
          Promise.all(registrations.map((registration) => registration.unregister())),
        )

      if ('caches' in window) {
        void caches
          .keys()
          .then((keys) =>
            Promise.all(
              keys
                .filter((key) => key.startsWith('tranem-web-'))
                .map((key) => caches.delete(key)),
            ),
          )
      }
    })
    return
  }

  window.addEventListener('load', () => {
    void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`)
  })
}
