// Import required modules
const express = require('express');
const viewsController = require('../controllers/viewController');
const authController = require('../controllers/authController');
const bookingController = require('../controllers/bookingController');

// Create a new Express router instance
const router = express.Router();

// Middleware to show alerts for specific operations
router.use(viewsController.alert);

// Route to get an overview of tours
router.get('/', authController.isLoggedIn, viewsController.getOverview);

// Route to get details of a specific tour using its slug
router.get('/tour/:slug', authController.isLoggedIn, viewsController.getTour);

// Route to display the login form
router.get('/login', authController.isLoggedIn, viewsController.getLoginForm);

// Route to display the user's account page
router.get('/me', authController.protect, viewsController.getAccount);

// Route to get a list of the user's booked tours
router.get(
  '/my-tours',
  bookingController.createBookingCheckout, // Middleware to create a booking if needed
  authController.protect, // Ensure the user is logged in
  viewsController.getMyTours // Display the user's tours
);

// Route to update user data
router.post(
  '/submit-user-data',
  authController.protect, // Ensure the user is logged in
  viewsController.updateUserData // Handle the data update
);

// Export the router to use it in other parts of the application
module.exports = router;
