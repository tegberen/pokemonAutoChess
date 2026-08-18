/* Change this cache name every time you want to force players 
  to invalidate their cache and download all assets again */

const CACHE_NAME = "CACHE v6.10.1.2026-07-08.0"

/* a fetch that never settles leaves respondWith pending forever, which freezes
   the game on its loading screen with no way out but restarting the browser.
   Phaser's own load.xhr.timeout does not cover images, so this is the only
   place a timeout can be applied to them */
const NETWORK_TIMEOUT_MS = 30000

const fetchWithTimeout = (request) => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), NETWORK_TIMEOUT_MS)
  return fetch(request, { signal: controller.signal }).finally(() =>
    clearTimeout(timer)
  )
}

// Cache-first strategy
const cacheFirst = (event) => {
  event.respondWith(
    caches.match(event.request).then((cacheResponse) => {
      if (cacheResponse) return cacheResponse
      return fetchWithTimeout(event.request)
        .then((networkResponse) => {
          if (networkResponse.ok && networkResponse.status !== 206) {
            // do not cache errors or partial content
            return caches.open(CACHE_NAME).then((cache) => {
              try {
                cache.put(event.request, networkResponse.clone())
              } catch (err) {
                console.error(err)
                // ignore if could not be cached
              }
              return networkResponse
            })
          }
          return networkResponse
        })
        .catch(() =>
          // one retry, then fail definitively so the loader moves on instead
          // of waiting on a request that will never come back
          fetchWithTimeout(event.request).catch(
            () =>
              new Response("", {
                status: 504,
                statusText: "Service worker network timeout"
              })
          )
        )
    })
  )
}

async function clearObsoleteCaches() {
  const cachesKeys = await caches.keys()
  return Promise.all(
    cachesKeys
      .filter((key) => key !== CACHE_NAME)
      .map((oldCache) => caches.delete(oldCache))
  )
}

self.addEventListener("fetch", async (event) => {
  const url = event.request.url
  if (
    event.request.method === "GET" &&
    (url.includes("/assets/") || url.includes("/SpriteCollab/"))
  )
    cacheFirst(event)
})

self.addEventListener("install", function () {
  self.skipWaiting() // immediately activates this service worker
})

self.addEventListener("activate", (event) => {
  event.waitUntil(clearObsoleteCaches().then(() => self.clients.claim()))
})

self.addEventListener("message", async (event) => {
  if (event.data && event.data.type === "CACHE_STATUS") {
    const keys = await caches.keys()
    const clients = await self.clients.matchAll()
    clients.forEach((client) => {
      client.postMessage({
        type: "CACHE_STATUS",
        version: CACHE_NAME.replace("CACHE v", ""),
        cached: keys.includes(CACHE_NAME)
      })
    })
  }
})
