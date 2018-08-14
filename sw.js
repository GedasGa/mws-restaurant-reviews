importScripts('js/idb.js', 'js/dbhelper.js');

const version = 'v1.0.3';
const cacheName = 'mws-restaurant-reviews';
const cacheVersion = `${cacheName}-${version}`;
const dbVersion = 1;
const dbName = `mws-restaurant-reviews`;

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
                '/sw.js',
                '/img/1.jpg',
                '/img/2.jpg',
                '/img/3.jpg',
                '/img/4.jpg',
                '/img/5.jpg',
                '/img/6.jpg',
                '/img/7.jpg',
                '/img/8.jpg',
                '/img/9.jpg',
                '/img/10.jpg',
				'/img/undefined.jpg'
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

/**
 * On activate event, check if found there is a newer cache version,
 * if so delete the old cache
 */
self.addEventListener('activate', event => {
	event.waitUntil(
		caches.keys()
            .then(cacheNames => {
				return Promise.all(
					cacheNames.filter(cacheName => {
						return cacheName.startsWith(cacheName)
							&& !cacheName.endsWith(version);
					})
						.map(cacheName => {
							return caches.delete(cacheName);
						})
				);
            })
            .catch(err => console.log('Could not delete the old cache', err))
	);
});

/**
 * On message event, check message text and do corresponding
 * actions according to the message
 */
self.addEventListener('message', event => {
	if(event.data.action == 'skipWaiting') {
		self.skipWaiting();
	}
});

/**
 * On sync event, synchronise offline data with the server
 */
self.addEventListener('sync', function(event) {
	if(event.tag == 'syncOfflineData') {
		console.log('Background sync offline data');
		event.waitUntil(syncOfflineReviews('offline-reviews', 'reviews'));
		event.waitUntil(syncOfflineFavorites('offline-favorites'));
	}
});

function syncOfflineReviews(objStoreSrc, objStoreDst) {
	return DBHelper.getFromIndexedDB(dbName, dbVersion, objStoreSrc, (error, reviews) => {
		// Send reviews to the server
		if(reviews) {
			let promises = [];
			reviews.forEach(review => {
				let myPromise = DBHelper.createRestaurantReview(review, (error, response) => {
					DBHelper.addToIndexedDB(dbName, dbVersion, objStoreDst, [review]).then(() => {
						DBHelper.deleteFromIndexedDB(dbName, dbVersion, objStoreSrc, review.createdAt);
					})
				});
				promises.push(myPromise);
			});
			return Promise.all(promises);
		}
	});
}

function syncOfflineFavorites(objStoreSrc) {
	return DBHelper.getFromIndexedDB(dbName, dbVersion, objStoreSrc, (error, favorites) => {
		// Send reviews to the server
		if(favorites) {
			let promises = [];
			favorites.forEach(favorite => {
				if(favorite.checked){
					console.log('Pazymeta TRUE- '+ favorite.checked);
					let myPromise = DBHelper.favoriteRestaurant(favorite.restaurant_id, (error, response) => {
						DBHelper.deleteFromIndexedDB(dbName, dbVersion, objStoreSrc, favorite.createdAt);
					});
					promises.push(myPromise);
				} else {
					console.log('Pazymeta- false');
					let myPromise = DBHelper.unfavoriteRestaurant(favorite.restaurant_id, (error, response) => {
						DBHelper.deleteFromIndexedDB(dbName, dbVersion, objStoreSrc, favorite.createdAt);
					});
					promises.push(myPromise);
				}
			});
			return Promise.all(promises);
		}
	});
}