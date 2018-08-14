let restaurant,
	reviews,
	newMap;
const dbVersion = 1;
const dbName = 'mws-restaurant-reviews';

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {  
	initMap();
	// element should be replaced with the actual target element on which you have applied scroll, use window in case of no target element
	if (window.innerWidth  > 992) {
		let lastScrollTop = 0;
		document.addEventListener('scroll', function(){
			let st = window.pageYOffset || document.documentElement.scrollTop; // Credits: "https://github.com/qeremy/so/blob/master/so.dom.js#L426"
			if (st > lastScrollTop) {
				slideDown();
			} else {
				slideUp();
			}
			lastScrollTop = st <= 0 ? 0 : st; // For Mobile or negative scrolling
		}, {
			capture: true,
			passive: true
		});
	}
});

/**
 * Initialize leaflet map
 */
initMap = () => {
	fetchRestaurantFromURL((error, restaurant) => {
		if (error) { // Got an error!
			console.error(error);
		} else {      
			newMap = L.map('map', {
				center: [restaurant.latlng.lat, restaurant.latlng.lng],
				zoom: 16,
				scrollWheelZoom: false
			});
			L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
				mapboxToken: 'pk.eyJ1IjoiZ2VkZ2FyIiwiYSI6ImNqam56ODdhODU3YTkza3RlZTM1cTY3MjYifQ.vwn5VXUqKaA_chIhXgKnQQ',
				maxZoom: 18,
				attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
          '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
          'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
				id: 'mapbox.streets'    
			}).addTo(newMap);
			fillBreadcrumb();
			DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
	  // fill reviews
	  fetchRestaurantReviewsFromURL((error, reviews) => {
				if (error) { // Got an error!
		  console.error(error);
				} else {
		  console.log('fetchRestaurantReviewsFromURL successful');
				}
	  });
		}
	});
};
 
/* window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
} */

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
	const id = getParameterByName('id');
	if (!id) { // no id found in URL
		error = 'No restaurant id in URL';
		callback(error, null);
	} else {
		DBHelper.fetchRestaurantById(id, (error, restaurant) => {
			self.restaurant = restaurant;
			if (!restaurant) {
				console.error(error);
				return;
			}
			fillRestaurantHTML();
			callback(null, restaurant);
		});
	}
};

/**
 * Get current restaurant reviews from page URL.
 */
fetchRestaurantReviewsFromURL = (callback) => {
	const id = getParameterByName('id');
	if (!id) { // no id found in URL
		error = 'No restaurant id in URL';
		callback(error, null);
	} else {
		DBHelper.fetchReviewsByRestaurantId(id, (error, reviews) => {
			self.reviews = reviews;
			console.log(reviews);
			if (!reviews) {
				console.error(error);
				return;
			}
	  fillRestaurantReviewsHTML();
			callback(null, reviews);
		});
	}
};

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
	const name = document.getElementById('restaurant-name');
	name.innerHTML = restaurant.name;

	const address = document.getElementById('restaurant-address');
	address.innerHTML = restaurant.address;

	const image = document.getElementById('restaurant-img');
	image.src = DBHelper.imageUrlForRestaurant(restaurant);
	image.alt = 'a picture of ' + restaurant.cuisine_type + ' ' + restaurant.name;

	let favorite = document.getElementById('toggle-favorite');
	if(restaurant.is_favorite == 'true'){
		favorite.checked = true;
	} else {
		favorite.checked = false;
	}


	const cuisine = document.getElementById('restaurant-cuisine');
	cuisine.innerHTML = restaurant.cuisine_type;

	// fill operating hours
	if (restaurant.operating_hours) {
		fillRestaurantHoursHTML();
	}
};

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
	const hours = document.getElementById('restaurant-hours');

	// Remove working hours before adding
	while(hours.firstChild){
		hours.removeChild(hours.firstChild);
	}

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
 * Fill all restaurant reviews HTML and add them to the webpage.
 */
fillRestaurantReviewsHTML = (reviews = self.reviews) => {
	const container = document.getElementById('reviews-container');

	if (!reviews) {
		const noReviews = document.createElement('p');
		noReviews.innerHTML = 'No reviews yet!';
		container.appendChild(noReviews);
		return;
	}
	const ul = document.getElementById('reviews-list');

	reviews.forEach(review => {
		ul.appendChild(createRestaurantReviewHTML(review));
	});
	container.appendChild(ul);
};

/**
 * Create restaurant review HTML and add it to the webpage.
 */
createRestaurantReviewHTML = (review) => {
	const li = document.createElement('li');
	li.tabIndex  = 0;

	const cardHeader = document.createElement('div');
	cardHeader.className = 'review-card-header';
	const cardBody = document.createElement('div');
	cardBody.className = 'review-card-body';
	// const cardFooter = document.createElement('div');
	// cardFooter.className = 'review-card-footer';

	const name = document.createElement('p');
	name.innerHTML = review.name;
	cardHeader.appendChild(name);

	const createdAt = document.createElement('time');
	let d = new Date(review.createdAt);
	createdAt.innerHTML = d.toLocaleString('en-US', {hour: 'numeric', minute: 'numeric', year: 'numeric', month: 'long', day: 'numeric' });
	cardHeader.appendChild(createdAt);

	li.appendChild(cardHeader);

	const rating = document.createElement('p');
	rating.innerHTML = `Rating: ${review.rating}`;
	cardBody.appendChild(rating);

	const comments = document.createElement('article');
	comments.innerHTML = review.comments;
	cardBody.appendChild(comments);

	li.appendChild(cardBody);
	//
	// const updatedAt = document.createElement('time');
	// updatedAt.innerHTML = review.updatedAt;
	// cardBody.appendChild(updatedAt);
	//
	// li.appendChild(cardFooter);

	return li;
};

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
	const breadcrumb = document.getElementById('breadcrumb');
	const li = document.createElement('li');
	li.innerHTML = restaurant.name;
	breadcrumb.appendChild(li);
};

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
	if (!url)
		url = window.location.href;
	name = name.replace(/[\[\]]/g, '\\$&');
	const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
		results = regex.exec(url);
	if (!results)
		return null;
	if (!results[2])
		return '';
	return decodeURIComponent(results[2].replace(/\+/g, ' '));
};

/**
 * Get data from restaurant review form.
 */
getRestaurantReviewFormData = (restaurant = self.restaurant) => {
	const data = {};

	data.restaurant_id = restaurant.id;
	data.name = document.getElementById('name').value;
	data.rating = document.getElementById('rating').value;
	data.comments = document.getElementById('comment').value;

	return data;
};

/**
 * Send restaurant review data.
 */
sendRestaurantReview = () => {
	const form = document.getElementById('review-form');
	const data = getRestaurantReviewFormData(restaurant = self.restaurant);
	const reviewsList = document.getElementById('reviews-list');
	if(navigator.onLine) {
		console.log('I am online => ', data);

		// Reset form
		form.reset();

		// Remove reviews before adding
		while(reviewsList.firstChild){
			reviewsList.removeChild(reviewsList.firstChild);
		}

		DBHelper.createRestaurantReview(data, function() {
			// fill reviews
			fetchRestaurantReviewsFromURL((error, reviews) => {
				if (error) { // Got an error!
					console.error(error);
				} else {
					// Focus on last reviews
					reviewsList.lastChild.focus();
					console.log('fetchRestaurantReviewsFromURL successful -- sending reviews');
					console.log(reviews);
				}
			});
		});
		console.log('restaurant reviews updated');
	} else {
		data.createdAt = Date.now();
		console.log('I am offline => ', data);

		DBHelper.addToIndexedDB(dbName, dbVersion, 'offline-reviews', [data]);

		fillRestaurantReviewsHTML([data]);
		reviewsList.lastChild.focus();

		form.reset();
		console.log('restaurant review saved offline');
	}
};

/**
 * Send favorite restaurant review data.
 */
sendFavoriteRestaurant = (restaurant = self.restaurant) => {
	const data = {};
	const checkbox = document.getElementById('toggle-favorite');

	data.checked = checkbox.checked;
	console.log('restaurant id => ' + restaurant.id);
	console.log('checkbox => ' + data.checked);

	if(navigator.onLine) {
		console.log('I am online => ', data.checked);

		if(data.checked) {
			DBHelper.favoriteRestaurant(restaurant.id, function() {
				// fill reviews
				fetchRestaurantFromURL((error, restaurant) => {
					if (error) { // Got an error!
						console.error(error);
					} else {
						console.log('restaurant set as favorite');
						console.log(restaurant);
					}
				});
			});
		} else {
			DBHelper.unfavoriteRestaurant(restaurant.id, function() {
				// fill reviews
				fetchRestaurantFromURL((error, restaurant) => {
					if (error) { // Got an error!
						console.error(error);
					} else {
						console.log('restaurant set as unfavorite');
						console.log(restaurant);
					}
				});
			});
		}
	} else {
		data.createdAt = Date.now();
		data.restaurant_id = restaurant.id;
		console.log('I am offline => ', data.checked);

		DBHelper.addToIndexedDB(dbName, dbVersion, 'offline-favorites', [data]);

		console.log('favorite restaurant saved offline');
	}
};

function slideDown()
{
	const slidingDiv = document.getElementById('restaurant-address-card');
	const slidingDivStyle = window.getComputedStyle(slidingDiv);
	const stopPosition = 360;

	if (parseFloat(slidingDivStyle.marginTop) < stopPosition)
		slidingDiv.style.marginTop = parseFloat(slidingDivStyle.marginTop) + 10 + 'px';
}

function slideUp()
{
	const slidingDiv = document.getElementById('restaurant-address-card');
	const slidingDivStyle = window.getComputedStyle(slidingDiv);
	const stopPosition = -360;

	if (parseFloat(slidingDivStyle.marginTop) > stopPosition)
		slidingDiv.style.marginTop = parseFloat(slidingDivStyle.marginTop) - 10 + 'px';
}
