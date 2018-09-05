var newMap;

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {  
  self.found = false;
  initMap();
});

/**
 * Initialize leaflet map
 */
const initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {      
      if (!self.newMap) {
        self.newMap = L.map('map', {
          center: [restaurant.latlng.lat, restaurant.latlng.lng],
          zoom: 16,
          scrollWheelZoom: false
        });
      }
      L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
        mapboxToken: 'pk.eyJ1Ijoic21sb3ZpbjIiLCJhIjoiY2pqZjhhY2E4NHgwNjN2bGY3eTFmY2Q4NSJ9.Y7TGawAwx5qbMJEBszPLuQ',
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
          '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
          'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        id: 'mapbox.streets'    
      }).addTo(newMap);
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
      self.found = true;
    }
  });
}; 
 
/*
 * window.initMap = () => {
 * fetchRestaurantFromURL((error, restaurant) => {
 * if (error) { // Got an error!
 * console.error(error);
 * } else {
 * self.map = new google.maps.Map(document.getElementById('map'), {
 * zoom: 16,
 * center: restaurant.latlng,
 * scrollwheel: false
 * });
 * fillBreadcrumb();
 * DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
 * }
 * });
 *} 
 */

/**
 * Get current restaurant from page URL.
 */
const fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant);
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    let error = 'No restaurant id in URL';
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      if(self.found) return;
      fillRestaurantHTML();
      callback(null, restaurant);
    });
  }
};

/**
 * Create restaurant HTML and add it to the webpage
 */
const fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const picture = document.getElementById('restaurant-img');
  ImgHelper.addImages(restaurant, picture, 'detail-img');

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  findAndFillReviewsHTML();
};

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
const fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
};

/**
 * Check if we have the reviews, if not go find them, then fill in the HTML
 */
const findAndFillReviewsHTML = () => {
  if(self.reviews) {
    fillReviewsHTML(self.reviews);
  } else {
    DBHelper.fetchReviews(self.restaurant.id, (error, reviews) => {
      if (error) {
        console.error(error);
        return;
      } else {
        self.reviews = reviews;
        fillReviewsHTML(reviews);
      }
    });
  }
};

/**
 * Create all reviews HTML and add them to the webpage.
 */
const fillReviewsHTML = (reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h2');
  title.innerHTML = 'Reviews';
  container.appendChild(title);
  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
};

/**
 * Create review HTML and add it to the webpage.
 */
const createReviewHTML = (review) => {
  const li = document.createElement('li');
  const header = document.createElement('div');
  header.className = 'review-header';
  li.appendChild(header);
  const name = document.createElement('p');
  name.className = 'review-name';
  name.innerHTML = review.name;
  header.appendChild(name);

  const date = document.createElement('p');
  date.className = 'review-date';
  const ts = new Date(review.createdAt);
  date.innerHTML = ts.toDateString();
  header.appendChild(date);

  const body = document.createElement('div');
  body.className = 'review-body';
  li.appendChild(body);

  const stars = document.createElement('div');
  stars.className = 'review-stars';
  stars.setAttribute('aria-label', `Rating ${review.rating} out of 5`);
  body.appendChild(stars);
  for (let i = 0; i < review.rating; i++) {
    const rating = document.createElement('span');
    rating.className = 'fontawesome-star marked';
    stars.appendChild(rating);
  }
  const maxStars = 5;
  for (let i = 0; i < (maxStars - review.rating); i++) {
    const rating = document.createElement('span');
    rating.className = 'fontawesome-star';
    stars.appendChild(rating);
  }

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  comments.className = 'review-comments';
  body.appendChild(comments);

  return li;
};

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
const fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
};

/**
 * Get a parameter by name from page URL.
 */
const getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
};
