/*
	Service Worker (PWA：可安裝成 App、離線使用)
	- 本站檔案 (html / js / data)：先抓網路 (保持最新)，離線時用快取
	- 官網卡圖・アイコン：先用快取 (看過的卡圖離線也能顯示)
	- jQuery / Chart.js (CDN)：先用快取，背景更新
	改版時不用動這支；若要強制清除舊快取，把 VERSION 加 1
*/
const VERSION = "ws-v1";
const CORE = VERSION + "-core";
const IMG = VERSION + "-img";
const IMG_MAX = 4000;	// 卡圖快取上限 (張)

const PRECACHE = [
	"./", "index.html", "summary.html", "manifest.webmanifest",
	"js/card_info.js", "js/ws_common.js", "js/ban_list.js", "js/function.js",
	"img/app/icon-192.png", "img/app/icon-512.png",
	"img/cancel_icon.png", "img/cancel_icon_black.png", "img/empty.jpg", "img/empty_black.jpg",
	"img/larrow.png", "img/larrow_black.png", "img/rarrow.png", "img/rarrow_black.png"
];

self.addEventListener("install", e => {
	e.waitUntil(caches.open(CORE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
	e.waitUntil(caches.keys()
		.then(keys => Promise.all(keys.filter(k => !k.startsWith(VERSION)).map(k => caches.delete(k))))
		.then(() => self.clients.claim()));
});

function stripSearch(req) {
	const u = new URL(req.url); u.search = "";
	return new Request(u.toString());
}

async function networkFirst(req) {
	const key = stripSearch(req);	// js 帶 ?v=時間戳，快取時去掉
	const cache = await caches.open(CORE);
	try {
		const res = await fetch(req, { cache: "no-store" });
		if(res.ok) cache.put(key, res.clone());
		return res;
	} catch(err) {
		const hit = await cache.match(key) || (req.mode == "navigate" ? await cache.match("index.html") : null);
		if(hit) return hit;
		throw err;
	}
}

async function cacheFirst(req, name, max) {
	const cache = await caches.open(name);
	const hit = await cache.match(req);
	if(hit) return hit;
	const res = await fetch(req);
	if(res.ok || res.type == "opaque") {
		cache.put(req, res.clone());
		if(max) cache.keys().then(keys => { if(keys.length > max) keys.slice(0, keys.length - max).forEach(k => cache.delete(k)); });
	}
	return res;
}

async function staleWhileRevalidate(req) {
	const cache = await caches.open(CORE);
	const hit = await cache.match(req);
	const net = fetch(req).then(res => { if(res.ok || res.type == "opaque") cache.put(req, res.clone()); return res; }).catch(() => hit);
	return hit || net;
}

self.addEventListener("fetch", e => {
	const req = e.request;
	if(req.method != "GET") return;
	const url = new URL(req.url);
	if(url.origin == location.origin) e.respondWith(networkFirst(req));
	else if(url.hostname == "ws-tcg.com" && /\.(png|jpe?g|gif|webp)$/i.test(url.pathname)) e.respondWith(cacheFirst(req, IMG, IMG_MAX));
	else if(/ajax\.googleapis\.com|cdn\.jsdelivr\.net/.test(url.hostname)) e.respondWith(staleWhileRevalidate(req));
});
