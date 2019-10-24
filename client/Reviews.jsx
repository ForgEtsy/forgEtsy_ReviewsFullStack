import React from 'React';
import axios from 'axios';
import faker from 'faker';
import styles from './Reviews.css';
import ReviewsBlock from './components/ReviewsBlock.js';

export default class Reviews extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      mounted: false,
      product_id: 173033626,
      reviews: [],
      product_picture: '',
      product_description: '',
      average_rating: [0, 0, 0, 0, 0],
      reviews_count: 0
    }

    this.averageStars = this.averageStars.bind(this);
    this.addMoreReviews = this.addMoreReviews.bind(this);
    this.shortenDescription = this.shortenDescription.bind(this);
    this.randomIntFromInterval = this.randomIntFromInterval.bind(this);
    this.createReviewStars = this.createReviewStars.bind(this);
  }

  // in componentDidMount have to create logic to only load 4 reviews on any refresh and onload
  componentDidMount() {
    let reviewsURL = 'http://localhost:3004/reviews';
    let productsURL = 'http://localhost:3004/products';
    // let http = 'http://ec2-3-15-210-75.us-east-2.compute.amazonaws.com/reviews';
    // let http = 'http://ec2-3-15-210-75.us-east-2.compute.amazonaws.com/products';

    // Use axios all to populate initial reviews data and to get image of current product
    //  to be posted in each review
    axios.all([
      axios.get(reviewsURL, {params: { product_id: this.state.product_id }}), 
      axios.get(productsURL, {params: { product_id: this.state.product_id }})
    ])
    .then(axios.spread((reviewsResponse, productsReponse) => {
      this.setState({
        product_picture: productsReponse.data.Images[0].url_75x75,
        product_description: productsReponse.data.description,
        reviews: reviewsResponse.data
      })
    }))
    .then(() => {
      // call average stars to calculate average stars in top banner for product
      this.shortenDescription();
      this.createReviewStars();
      this.averageStars();
      this.setState({mounted: true});
    })
    .catch((error) => {
        console.log(error);
    });
  }

  // create review array for individual reviews
  createReviewStars() {
    let allReviews = this.state.reviews.slice();

    for (let i = 0; i < allReviews.length; i++) {
      if (!Array.isArray(allReviews[i].rating)) {
        let starArr = [];
        let duplicate = allReviews[i].rating;
        let floor = Math.floor(duplicate); // 4.56 --> 4
        let difference =  duplicate - floor; //.56 --> .5
        let j = 0;

        while (j < floor) {
          starArr.push(1);
          j += 1;
        };

        if (difference) {
          starArr.push(0.5);
        }

        while (starArr.length < 5) {
          starArr.push(0);
        };
        // make review number equal to an array representing the equivalent star rating
        allReviews[i].rating = starArr; // [1, 1, 1, 1, 0.5, 0]
      };
    };

    this.setState({reviews: allReviews})
  };

  // Gets the average rating for the product and then sets state based on that number
  averageStars() {
    let total = 0;
    let i = 0;

    while (i < this.state.reviews.length) {
      let currentReview = this.state.reviews[i].rating;
      for (let j = 0; j < currentReview.length; j++) {
        // add each star to the total stars from each review rating
        total += currentReview[j];
      };

      i += 1;
    };

    let average = total/i;
    // Add the total potential full stars to the array
    let floor = Math.floor(average);
    let difference = average - floor;
    let newArr = new Array(floor).fill(1);

    // if there is a partial review, push a 0.5 star into array
    if (difference) {
      newArr.push(0.5); 
    };
    
    // if the star array's length is less than five, add zeroes to initalize greyed-out stars
    while (newArr.length < 5) {
      newArr.push(0);
    };

    this.setState({
      average_rating: newArr,
      reviews_count: i
    });
  };

  // Shortens product description to better fit to CSS grid
  shortenDescription() {
    let updatedDescription = '';
    // only include the first 30 characters in description
    for (var i = 0; i < 30; i++) {
      updatedDescription += this.state.product_description[i];
    }

    updatedDescription += '...';

    this.setState({
      product_description: updatedDescription
    });
  };

  // generates random ID for reviews & stars 
  randomIntFromInterval(min, max) { // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min);
  };

  // Adds additional reviews to database for product
  addMoreReviews() {
    const reviews = [];
    const descriptions = [];
    // generate random number of reviews between min and max
    let max = 6;
    let min = 4;
    const random = Math.floor((Math.random() * (max - min)) + min+1);

    // using Promise to return a new GET request to the API
    function getNewReview() {
      return new Promise((resolve, reject) => {
        axios.get('http://ron-swanson-quotes.herokuapp.com/v2/quotes')
        .then(function (response) {
          return resolve(response)
        })
        .catch(function (error) {
           return reject(error);
        });
      });
    };

    for (var x = 0; x < random; x++) {
      // push a newly generated review into our review descriptions array
      let newRev = getNewReview();
      descriptions.push(newRev); 
    };

    Promise.all(descriptions)
    .then(response => {
      // iterate over all new completed review promise descriptions and create
      //  new review with relevant review data
      for (let j = 0; j < response.length; j++) {
        // this random digit to add to review to ensure no duplicates are being added
        //  to reviews database
        const randomID = this.randomIntFromInterval(1, 100000);
        // call description function for new review
    
        // look at adding half star amounts into review
        let review = {
          review_id: Number(`${this.state.product_id}${j}${randomID}`),
          date: faker.date.past(45),
          description: response[j].data[0],
          rating: (Math.random() * 5),
          user_name: `${faker.name.firstName()} ${faker.name.lastName()}`,
          user_photo_url: faker.image.avatar(),
          product_id: this.state.product_id,
          product_user_image_url: this.state.product_picture
        };

        reviews.push(review);
      };
      
      return reviews;
    })
    .then((reviews) => {
      let http = 'http://localhost:3004/newReviews';
      // let http = 'http://ec2-3-15-210-75.us-east-2.compute.amazonaws.com/newReviews';    
      axios.post(http, {
        product_id: this.state.product_id,
        newReviews: reviews
      })
      .then((response) => {
        // update reviews, reviewsCount and averageRating based on new reviews in database
        this.setState({
          reviews: response.data
        }, () => {
          this.createReviewStars();
          this.averageStars();
        })
      })
      .catch((error) => {
        console.log(error);
      });
    })
    .catch((error) => {
      console.log(error);
    });
  }

  render() {
    if (this.state.mounted) {
      return (
        <div>
        <hr></hr>
            <ReviewsBlock reviews={this.state.reviews} productDescription={this.state.product_description} 
              productPicture={this.state.product_picture} reviewCount={this.state.reviews_count} 
              rating={this.state.average_rating} randomInt={this.randomIntFromInterval} 
              createReviewStars={this.createReviewStars}>
            </ReviewsBlock>
            <button className={styles.button} onClick={this.addMoreReviews}>
              <span>+ More</span>
            </button>
          <hr></hr>
        </div>
      )
  } 
    return (
      <div>Loading</div>
    )
  }
};