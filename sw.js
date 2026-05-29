const CACHE_NAME = "a3z-finance-v3";
const APP_SHELL = [
	"./",
	"./index.html",
	"./manifest.json",
	"./css/style.css",
	"./js/main.js",
	"./js/projects.js",
	"./js/ui-home.js",
	"./js/ui.js",
	"./js/calc.js",
	"./js/months.js",
	"./js/storage.js",
	"./js/transactions.js",
	"./js/importExport.js",
	"./icons/logo-192.png",
	"./icons/logo-512.png",
	"./images/logo.png"
];

self.addEventListener("install", event => {
	event.waitUntil(
		caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
	);
	self.skipWaiting();
});

self.addEventListener("activate", event => {
	event.waitUntil(
		caches.keys().then(keys => Promise.all(
			keys
				.filter(key => key !== CACHE_NAME)
				.map(key => caches.delete(key))
		))
	);
	self.clients.claim();
});

self.addEventListener("fetch", event => {
	const request = event.request;
	const url = new URL(request.url);

	if (request.method !== "GET") return;

	if (request.mode === "navigate") {
		event.respondWith(
			fetch(request)
				.then(response => {
					const copy = response.clone();
					caches.open(CACHE_NAME).then(cache => cache.put("./index.html", copy));
					return response;
				})
				.catch(() => caches.match("./index.html"))
		);
		return;
	}

	if (url.origin !== self.location.origin) return;

	if (request.destination === "script" || request.destination === "style") {
		event.respondWith(
			fetch(request)
				.then(response => {
					const copy = response.clone();
					caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
					return response;
				})
				.catch(() => caches.match(request))
		);
		return;
	}

	event.respondWith(
		caches.match(request).then(cached => {
			if (cached) return cached;
			return fetch(request).then(response => {
				const copy = response.clone();
				caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
				return response;
			});
		})
	);
});
