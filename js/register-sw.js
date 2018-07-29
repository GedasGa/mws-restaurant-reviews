/**
 * Service Worker Registration
 */
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/js/sw.js')
        .then(function(registration) {
            registration.addEventListener('updatefound', function() {
                // If updatefound is fired, it means that there's
                // a new service worker being installed.
                let installingWorker = registration.installing;
                console.log('A new service worker is being installed:', installingWorker);
            });
        })
        .catch(function(err) {
            console.log('Service worker registration failed:', err);
        });
} else {
    console.log('Service workers are not supported.');
}