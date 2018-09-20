var newMap;
const VK_ENTER = 13;
const VK_SPACE = 32;

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  registerServiceWorker();
  initMap(); // added 
  fetchNeighborhoods();
  fetchCuisines();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
const fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
};

/**
 * Set neighborhoods HTML.
 */
const fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  for (let neighborhood of neighborhoods) {
    addOptions(neighborhood, select);
  }
};

/**
 * Fetch all cuisines and set their HTML.
 */
const fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
};

/**
 * Set cuisines HTML.
 */
const fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');
  for (let cuisine of cuisines) {
    addOptions(cuisine, select);
  }
};

const addOptions = (optionVal, select) => {
    const option = document.createElement('option');
    option.innerHTML = optionVal;
    option.value = optionVal;
    select.append(option);
}

/**
 * Initialize leaflet map, called from HTML.
 */
const initMap = () => {
  self.newMap = L.map('map', {
    center: [40.722216, -73.987501],
    zoom: 12,
    scrollWheelZoom: false
  });
  L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
    mapboxToken: 'pk.eyJ1Ijoic21sb3ZpbjIiLCJhIjoiY2pqZjhhY2E4NHgwNjN2bGY3eTFmY2Q4NSJ9.Y7TGawAwx5qbMJEBszPLuQ',
    maxZoom: 18,
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
      '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
      'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    id: 'mapbox.streets'
  }).addTo(newMap);

  updateRestaurants();
};

/**
 * Update page and map for current restaurants.
 */
const updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  });
};

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
const resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  if (self.markers) {
    self.markers.forEach(marker => marker.remove());
  }
  self.markers = [];
  self.restaurants = restaurants;
};

/**
 * Create all restaurants HTML and add them to the webpage.
 */
const fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
};

/**
 * Create restaurant HTML.
 */
const createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');

  const picture = document.createElement('picture');
  li.append(picture);

  ImgHelper.addImages(restaurant, picture, 'restaurant-img');

  const name = document.createElement('h1');
  const nameLink = document.createElement('a');
  nameLink.innerHTML = restaurant.name;
  nameLink.href = DBHelper.urlForRestaurant(restaurant);
  li.append(name);
  name.append(nameLink);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);

  return li;
};

/**
 * Add markers for current restaurants to the map.
 */
const addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.newMap);
    marker.on('click', onClick);
    function onClick() {
      window.location.href = marker.options.url;
    }
    self.markers.push(marker);
  });
};
/*
 * addMarkersToMap = (restaurants = self.restaurants) => {
 * restaurants.forEach(restaurant => {
 * // Add marker to the map
 * const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
 * google.maps.event.addListener(marker, 'click', () => {
 * window.location.href = marker.url
 * });
 * self.markers.push(marker);
 * });
 * } 
 */

/**
 * Add functionality for filter accordion 
 */
var accordion = document.getElementsByClassName('accordion')[0];
accordion.addEventListener('click', function() {
  this.classList.toggle('active');

  var panel = this.nextElementSibling;
  if (panel.style.maxHeight) {
    this.setAttribute('aria-expanded', 'false');
    panel.style.display = 'none';
    panel.style.maxHeight = null;
    this.classList.remove('fontawesome-angle-up');
    this.classList.add('fontawesome-angle-down');
  } else {
    this.setAttribute('aria-expanded', 'true');
    panel.style.display = 'block';
    panel.style.maxHeight = panel.scrollHeight + 'px';
    this.classList.remove('fontawesome-angle-down');
    this.classList.add('fontawesome-angle-up');
  }
});

accordion.addEventListener('keypress', function(event) {
  switch(event.keyCode) {
  case VK_ENTER:
  case VK_SPACE:
    event.preventDefault();
    this.click();
  }
});

/**
 * Register the service worker
 */
const registerServiceWorker = () => {
  if (!navigator.serviceWorker) return;

  navigator.serviceWorker.register('/sw.js').then(function() {
    console.log('Registration worked!');
  }).catch(function() {
    console.log('Registration failed!');
  });
};
