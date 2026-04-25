const CACHE_NAME = "wateen-shell-v1";
const APP_SHELL = [
  "./",
  "./index.html",
  "./style.css?v=3",
  "./script.js?v=3",
  "./manifest.webmanifest?v=1",
  "./assets/bee.jpg",
  "./assets/wolf.jpg",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/icon-maskable-512.png",
  "./assets/icons/apple-touch-icon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const requestUrl = new URL(event.request.url);

  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match("./index.html"))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }

        const responseClone = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        return networkResponse;
      });
    })
  );
});

// =======================
// Firebase Cloud Messaging Handler
// =======================

self.addEventListener("push", (event) => {
  console.log("🔔 Push event received in Service Worker");
  
  if (!event.data) {
    console.log("Push received with no data");
    return;
  }

  try {
    const data = event.data.json();
    console.log("📨 FCM Push received:", data);

    const notificationTitle = data.notification?.title || "Wateen";
    const notificationOptions = {
      body: data.notification?.body || "New notification from Wateen",
      icon: "./assets/icons/icon-192.png",
      badge: "./assets/icons/icon-192.png",
      tag: "wateen-fcm-notification",
      requireInteraction: true,
      data: data.data || {}
    };

    console.log("📣 Showing notification:", notificationTitle);

    // عرض الإخطار
    event.waitUntil(
      self.registration.showNotification(notificationTitle, notificationOptions).then(() => {
        console.log("✅ Notification displayed successfully");
        
        // أخبر العملاء بتحديث العداد
        return self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({
              type: "REFRESH_UNREAD_COUNT",
              timestamp: new Date().toISOString()
            });
          });
        });
      }).catch((error) => {
        console.error("❌ Error showing notification:", error);
      })
    );
  } catch (error) {
    console.error("❌ Error processing push notification:", error);

    // إذا كان البيانات نصية
    if (event.data) {
      event.waitUntil(
        self.registration.showNotification("Wateen", {
          body: event.data.text(),
          icon: "./assets/icons/icon-192.png",
          badge: "./assets/icons/icon-192.png",
          tag: "wateen-fcm-notification"
        })
      );
    }
  }
});

// التعامل مع النقر على الإخطار
self.addEventListener("notificationclick", (event) => {
  console.log("👆 Notification clicked");
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // إذا كان التطبيق مفتوحاً بالفعل، ركّز عليه
      for (let client of clientList) {
        if (client.url === "/" || client.url.includes("index.html")) {
          console.log("✅ Focusing existing window");
          return client.focus();
        }
      }
      // وإلا افتح النافذة
      console.log("✅ Opening new window");
      if (clients.openWindow) {
        return clients.openWindow("./");
      }
    })
  );
});
