/**
 * Service Worker Registration
 */
if ('serviceWorker' in navigator) {
	let manageServiceWorker = new ManageServiceWorker();
	manageServiceWorker.registerServiceWorker();
} else {
    console.log('Service workers are not supported.');
}

/**
 * Helper methods to Manage Service Worker:
 * 	-register a new Service Worker;
 * 	-track Service Worker installation progress, when new worker is installed call an updateReady function;
 * 	-show confirmation window to a user when a new version of Service Worker is available;
 *
 * Credits: https://github.com/jakearchibald/wittr
 */
function ManageServiceWorker() {

	this.registerServiceWorker = function() {
		let manageServiceWorker = this;

		navigator.serviceWorker.register('/sw.js')
            .then(function(reg) {
                if (!navigator.serviceWorker.controller) {
                    return;
                }

                if (reg.waiting) {
                    manageServiceWorker.updateReady(reg.waiting);
                    return;
                }

                if (reg.installing) {
                    manageServiceWorker.trackInstalling(reg.installing);
                    return;
                }

                reg.addEventListener('updatefound', function() {
					// If updatefound is fired, it means that there's
					// a new service worker being installed.
                    manageServiceWorker.trackInstalling(reg.installing);
                });
		    })
            .catch(function(err) {
                console.log('Service worker registration failed:', err);
			});

		// Listen for the controlling service worker changing and reload the page
		navigator.serviceWorker.addEventListener('controllerchange', function() {
			window.location.reload();
		})
	};

	this.trackInstalling = function(worker) {
		let manageServiceWorker = this;
		worker.addEventListener('statechange', function() {
			if (worker.state == 'installed') {
				manageServiceWorker.updateReady(worker);
			}
		});
	};

	this.updateReady = function(worker) {
	    let confirmDialog = window.confirm("New Service Worker version available. Would you like to update?");
		if (confirmDialog == true) {
			worker.postMessage({action: 'skipWaiting'});
		} else {
			return;
		}
	};
}




