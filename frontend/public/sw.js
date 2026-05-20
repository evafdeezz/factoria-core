const CACHE_NAME = "factoria-core-v1";

const STATIC_ASSETS = [
  "/",
  "/login",
  "/athlete",
  "/coach",
];

// Instalar — cachear assets estáticos
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activar — limpiar caches antiguas
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch — network first, cache como fallback
self.addEventListener("fetch", (event) => {
  // No interceptar peticiones a la API ni a otros orígenes
  if (
    event.request.url.includes("/api/") ||
    !event.request.url.startsWith(self.location.origin)
  ) {
    return;
  }

  // Solo GET
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Guardar en cache si la respuesta es válida
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});