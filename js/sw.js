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
                '/manifest.json',
                '/restaurant.html',
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
 *
 * Credits: https://developers.google.com/web/fundamentals/primers/service-workers
 */
self.addEventListener('fetch', event => {
    if (event.request.url.includes('restaurant.html?id=')) {
        const strippedurl = event.request.url.split('?')[0];
        console.log('== event ==', event);
        event.respondWith(
            caches.match(strippedurl)
                .then(function (response) {
                    return response || fetch(event.response);
                })
        );
        console.log('== caches ==', caches);
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache hit - return response
                if (response) {
                    return response;
                }

                // IMPORTANT: Clone the request. A request is a stream and
                // can only be consumed once. Since we are consuming this
                // once by cache and once by the browser for fetch, we need
                // to clone the response.
                const fetchRequest = event.request.clone();

                // if requested asset not in cache, get from network
                return fetch(fetchRequest)
                    .then(response => {
                        // Check if we received a valid response
                        if(!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // IMPORTANT: Clone the response. A response is a stream
                        // and because we want the browser to consume the response
                        // as well as the cache consuming the response, we need
                        // to clone it so we have two streams.
                        let responseToCache = response.clone();

                        caches.open(cacheVersion)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            })
                            .catch(err => console.log('Could not save data to the cache', err));
                        return response;
                    });
            })
            .catch(err => console.log('Could not handle the fetch request', err))
    );
});