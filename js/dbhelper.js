'use strict';

/**
 * Common database helper functions.
 */
class DBHelper {

   /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337; // Change this to your server port
    return `http://localhost:${port}`;
  }

  /**
   * Open Indexed DB database and create 4 object stores to save
   * restaurants, reviews, offline reviews and favorites data
   */
  static openIndexedDB(name, version) {
    if (!('indexedDB' in window)) {
	  console.log('This browser doesn\'t support IndexedDB');
	  return;
    }

    const dbPromise = idb.open(name, version, function(upgradeDb) {
      switch (upgradeDb.oldVersion) {
        case 0:
        // a placeholder case so that the switch block will
        // execute when the database is first created
        // (oldVersion is 0)
        case 1:
		  console.log('Creating the restaurants object store');
		  const restaurantsStore = upgradeDb.createObjectStore('restaurants', {keyPath: 'id'});
		  restaurantsStore.createIndex('name', 'name', { unique: false });
        case 2:
		  console.log('Creating the reviews object store');
		  const reviewsStore = upgradeDb.createObjectStore('reviews', {keyPath: 'id'});
		  reviewsStore.createIndex('restaurant_id', 'restaurant_id', { unique: false });
        case 3:
		  console.log('Creating the offline-reviews object store');
		  upgradeDb.createObjectStore('offline-reviews', {keyPath: 'createdAt'});
        case 4:
		  console.log('Creating the restaurants object store');
		  upgradeDb.createObjectStore('offline-favorites', {keyPath: 'createdAt'});
      }
    });

    return dbPromise;
  };

  /**
   * Add objects to the corresponding object store
   */
  static addToIndexedDB(name, version, ObjStore, objects) {
    DBHelper.openIndexedDB(name, version).then(function(db) {
      let tx = db.transaction(ObjStore, 'readwrite');
      console.log("tx => "+ tx);
		let store = tx.objectStore(ObjStore);
		console.log("store => "+ store);

      return Promise.all(objects.map(function(object) {
              console.log('Adding item => ', object);
              return store.add(object);
          })
      ).catch(function(e) {
          tx.abort();
          console.log(e);
      }).then(function() {
          console.log('All items added successfully!');
      });
    });
  };

  static openDBGetRequest(dbName, dbStore, dbVersion, callback){
    const idb =  window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
    let objectStore, objectStoreRequest, db, data;
    const request = idb.open(dbName, dbVersion);
    request.onsuccess = event => {
      db = request.result;
      const transaction = db.transaction([dbStore], 'readonly');
      transaction.oncomplete = event => {
        console.log('Transaction event complete =>', event);
      };
      objectStore = transaction.objectStore(dbStore);
      objectStoreRequest = objectStore.getAll();
      objectStoreRequest.onsuccess = event => {
        data = event.target.result;
        if(!data) {
          console.error('Error while fetching data => ', error);
            callback(error, null);
            return;
        }
        callback(null, data);
      }
    }
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    fetch(DBHelper.DATABASE_URL + '/restaurants').then((response) => {
      return response.json()
    }).then(restaurants => {
	  var something = DBHelper.addToIndexedDB(dbName, dbVersion, 'restaurants', restaurants);
	  console.log(something);
      callback(null, restaurants);
    });
    // .catch(error => { // Got an error from server.
    //   console.error('Error fetching restaurants data => ', error);
    //   this.openDBGetRequest(dbName, 'restaurants', dbVersion, callback);
    // })
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch all favorite restaurants.
   */
  static fetchFavoriteRestaurants(callback) {
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.is_favorite == true);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // No favorte restaurants in the database
          callback('There is no favorite restaurants', null);
        }
      }
    });
  }

  /**
   * Fetch all reviews.
   */
  static fetchReviews(callback) {
    fetch(DBHelper.DATABASE_URL + '/reviews').then((response) => {
      return response.json()
    }).then(reviews => {
      DBHelper.addToIndexedDB(dbName, dbVersion, 'reviews', reviews);
      callback(null, reviews);
    });
	// .catch(error => { // Got an error from server.
	// console.error('Error fetching reviews data => ', error);
	// this.openDBGetRequest(dbName, 'reviews', dbVersion, callback);
	// })
  }

  /**
   * Fetch a review by its ID.
   */
  static fetchReviewById(id, callback) {
    // fetch all reviews with proper error handling.
    DBHelper.fetchReviews((error, reviews) => {
      if (error) {
        callback(error, null);
      } else {
        const review = reviews.find(r => r.id == id);
        if (review) { // Got the restaurant
          callback(null, review);
        } else { // Review does not exist in the database
          callback('Review does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch a reviews by restaurant id.
   */
  static fetchReviewsByRestaurantId(id, callback) {
    fetch(DBHelper.DATABASE_URL + '/reviews/?restaurant_id=' + id).then((response) => {
      return response.json()
    }).then(reviews => {
	  DBHelper.addToIndexedDB(dbName, dbVersion, 'reviews', reviews);
      callback(null, reviews);
    }).catch(error => { // Got an error from server.
      console.error('Error fetching reviews data => ', error);
      this.openDBGetRequest(dbName, 'reviews', dbVersion, callback);
    })
  }

	/**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants;
        if (cuisine !== 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood !== 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) === i);
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) === i);
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Create a restaurant review.
   */
  static createRestaurantReview(data, callback) {
    fetch(DBHelper.DATABASE_URL + '/reviews', {
      method: 'POST',
      body: JSON.stringify(data)
    }).then((response) => {
		console.log(response.json());
		callback(null, response);
    }).catch(error => { // Got an error from server.
        console.error('Error sending restaurant review data => ', error);
		callback(error, null);
    })
  }

  /**
   * Favorite a restaurant.
   */
  static favoriteRestaurant(id, data) {
    fetch(DBHelper.DATABASE_URL + '/restaurants/' + id + '?is_favorite=true', {
      method: 'PUT'
    }).then((response) => {
        console.log(response.json());
    }).catch(error => { // Got an error from server.
        console.error('Error trying to add a restaurant to favorites => ', error);
    })
  }

  /**
   * Unfavorite a restaurant.
   */
  static unfavoriteRestaurant(id, data) {
    fetch(DBHelper.DATABASE_URL + '/restaurants/' + id + '?is_favorite=false', {
	  method: 'PUT'
    }).then((response) => {
        console.log(response.json());
    }).catch(error => { // Got an error from server.
        console.error('Error trying to remove a restaurant from favorites => ', error);
    })
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`/img/${restaurant.photograph}.jpg`);
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {
        title: restaurant.name,
        alt: restaurant.name,
        url: DBHelper.urlForRestaurant(restaurant)
      });
    marker.addTo(newMap);
    return marker;
  }
  /* static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  } */
}

