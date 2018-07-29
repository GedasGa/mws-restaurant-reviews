const version = 'v1.0.1';
const cacheName = 'mws-restaurant-reviews';
const cacheVersion = `${cacheName}-${version}`;

/**
 * Install service worker and create a cache
 * for static files and images
 */
self.addEventListener('install', event => {
    console.log('Installing Service Worker...');
    event.waitUntil(
        caches.open(cacheVersion).then(cache => {
            console.log('Create', cache);
            return cache.addAll([
                '/',
                '/index.html',
                '/restaurant.html',
                '/data/restaurants.json',
                '/css/styles.css',
                '/js/dbhelper.js',
                '/js/main.js',
                '/js/register-sw.js',
                '/js/restaurant_info.js',
                '/js/sw.js',
                '/img/1.jpg',
                '/img/2.jpg',
                '/img/3.jpg',
                '/img/4.jpg',
                '/img/5.jpg',
                '/img/6.jpg',
                '/img/7.jpg',
                '/img/8.jpg',
                '/img/9.jpg',
                '/img/10.jpg'
            ])
        })
    );
});

/**
 * On fetch event, check cache for corresponding files, if found
 * in cache return them, otherwise fetch requested url to the network
 */
self.addEventListener('fetch', (event) => {
    console.log(event.request.url);
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});