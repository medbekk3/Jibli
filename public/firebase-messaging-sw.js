/* Jibli Firebase Cloud Messaging service worker. Public Firebase web config is supplied in the script URL. */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const candidate = event.notification.data && event.notification.data.url;
  const path = typeof candidate === "string" && candidate.startsWith("/") && !candidate.startsWith("//") ? candidate : "/";
  const target = new URL(path, self.location.origin).href;
  event.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (windows) => {
    for (const client of windows) {
      if (new URL(client.url).origin === self.location.origin) {
        await client.focus();
        if ("navigate" in client) await client.navigate(target);
        return;
      }
    }
    return clients.openWindow(target);
  }));
});

importScripts("https://www.gstatic.com/firebasejs/12.7.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.7.0/firebase-messaging-compat.js");

const params = new URL(self.location.href).searchParams;
const firebaseConfig = Object.fromEntries(["apiKey", "authDomain", "projectId", "storageBucket", "messagingSenderId", "appId"].map((key) => [key, params.get(key)]).filter((entry) => entry[1]));
if (firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.messagingSenderId && firebaseConfig.appId) {
  firebase.initializeApp(firebaseConfig);
  firebase.messaging();
}