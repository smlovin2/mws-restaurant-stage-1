/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get RESTAURANTS_URL() {
    const port = 1337; // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }

  static get REVIEWS_URL() {
    const port = 1337;
    return `http://localhost:${port}/reviews`;
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    DBHelper.getCachedRestaurants(callback).then(function() {
      fetch(DBHelper.RESTAURANTS_URL).then(response => {
        response.json().then(data => { 

          DBHelper.openDatabase().then(function(db) {
            if (!db) return;

            const tx = db.transaction('restaurants', 'readwrite');
            const store = tx.objectStore('restaurants');
            data.forEach(function(restaurant) {
              store.put(restaurant);
            });
          });

          callback(null, data); 
        });
      }).catch(error => {
        callback(error, null);
      });
    });
  }

  static getCachedRestaurants(callback) {
    return DBHelper.openDatabase().then(function(db) {
      if (!db) return; 

      const store = db.transaction('restaurants').objectStore('restaurants');
      
      return store.getAll().then(function(restaurants) {
        callback(null, restaurants);
      });
    });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      }else {
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
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
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
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i);
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
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i);
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Fetch reviews, if restaurantId is given get only reviews for that restaurant
   */
  static fetchReviews(restaurantId, callback) {
    DBHelper.getCachedReviews(callback, restaurantId).then(dbReviews => {
      fetch(DBHelper.REVIEWS_URL + `${restaurantId ? '/?restaurant_id=' + restaurantId : ''}`).then(response => {
        response.json().then(data => {
          DBHelper.openDatabase().then(db => {
            if (!db) return;

            const tx = db.transaction('reviews', 'readwrite');
            const store = tx.objectStore('reviews');
            data.forEach(function(review) {
              store.put(review);
            });
          });

          callback(null, data);
        });
      }).catch(error => {
        callback(error, null);
        callback(null, dbReviews);
      });
    });
  }

  static getCachedReviews(callback, restaurantId) {
    return DBHelper.openDatabase().then(function(db) {
      if (!db) return; 

      const store = db.transaction('reviews').objectStore('reviews');
      if (restaurantId) {
        const index = store.index('restaurant_id');
        return index.getAll(restaurantId)
      } else {
        return store.getAll()
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
  static imageUrlForRestaurant(restaurant, size) {
    const imgName = restaurant.photograph.url;
    const imgType = '.jpg';
    switch(size) {
    case 'small':
      return (`/img/${imgName}-small${imgType}`);
    case 'medium':
      return (`/img/${imgName}-medium${imgType}`);
    case 'large1x':
      return (`/img/${imgName}-800_large_1x${imgType}`);
    case 'large2x':
      return (`/img/${imgName}-1600_large_2x${imgType}`);
    default:
      return (`/img/${imgName}-small${imgType}`);
    }
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant) {
    // https://leafletjs.com/reference-1.3.0.html#marker  
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {title: restaurant.name,
        alt: restaurant.name,
        url: DBHelper.urlForRestaurant(restaurant)
      });
    marker.addTo(newMap);
    return marker;
  } 
  /*
   * static mapMarkerForRestaurant(restaurant, map) {
   * const marker = new google.maps.Marker({
   * position: restaurant.latlng,
   * title: restaurant.name,
   * url: DBHelper.urlForRestaurant(restaurant),
   * map: map,
   * animation: google.maps.Animation.DROP}
   * );
   * return marker;
   *} 
   */

  /**
   * Open IDB Database
   */
  static openDatabase() {
    if (!navigator.serviceWorker) {
      Promise.resolve();
    }

    return idb.open('restaurant-db', 2, function(upgradeDb) {
      switch(upgradeDb.oldVersion) {
        case 0:
          upgradeDb.createObjectStore('restaurants', {
            keyPath: 'id'
          });
        case 1:
          const reviewStore = upgradeDb.createObjectStore('reviews', {
            keyPath: 'id'
          });
          reviewStore.createIndex('restaurant_id', 'restaurant_id');
      }
    });
  }
}
