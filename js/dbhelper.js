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
    return `http://localhost:${port}/restaurants`;
  }

  static createIndexedDB(objects, name, version) {
    return this.openDBRequest(objects, name, version);
  };

  static openDBRequest(entity, dbName, dbVersion) {
    if (!('indexedDB' in window)) {
      console.log('This browser doesn\'t support IndexedDB');
      return;
    }

    let db, objectStore;
    const idb =  window.indexedDB;
    const dbOpenRequest = idb.open(dbName, dbVersion);

    dbOpenRequest.onerror = (error) => {
      console.error('Error while opening IndexedDB => ', error.target);
    };
    dbOpenRequest.onsuccess = (event) => {
      db = event.target.result;
      if(db.transaction){
        const transaction = db.transaction(dbName, 'readwrite');
        transaction.oncomplete = event => {
          console.log('Transaction event complete =>', event);
        };
        objectStore = transaction.objectStore(dbName);
        this.addToIndexedDB(objectStore, entity);
      }
    };
    dbOpenRequest.onupgradeneeded = (event) => {
      db = event.target.result;
      objectStore = db.createObjectStore(dbName, { keyPath: 'id' });
      if(dbName === 'restaurants'){
        objectStore.createIndex('name', 'name', { unique: false });
      }
      objectStore.transaction.oncomplete = (event) => {
        console.log('Transaction event complete =>', event);
        objectStore = db.transaction([ dbName ], 'readwrite').objectStore(dbName);
        this.addToIndexedDB(objectStore, entity);
      };
    };
  };

  static openDBGetRequest(dbName, dbVersion, callback){
    const idb =  window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
    let objectStore, objectStoreRequest, db, data;
    const request = idb.open(dbName, dbVersion);
    request.onsuccess = event => {
      db = request.result;
      const transaction = db.transaction(dbName, 'readonly');
      transaction.oncomplete = event => {
        console.log('Transaction event complete =>', event);
      };
      objectStore = transaction.objectStore(dbName);
      objectStoreRequest = objectStore.getAll();
      objectStoreRequest.onsuccess = event => {
        data = event.target.result;
        if(!data){
          console.error('Error while fetching data => ', error);
            callback(error, null);
            return;
        }
        callback(null, data);
      }
    }
  }

  static addToIndexedDB(store, objects){
    objects.forEach((object) => {
      store.add(object);
    });
  };

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    fetch(DBHelper.DATABASE_URL).then((response) => {
      return response.json()
    }).then(restaurants => {
      DBHelper.createIndexedDB(restaurants, dbName, dbVersion);
      callback(null, restaurants);
    }).catch(error => { // Got an error from server.
      console.error('Error fetching restaurants data => ', error);
      this.openDBGetRequest(dbName, dbVersion, callback);
    })
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
      {title: restaurant.name,
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

