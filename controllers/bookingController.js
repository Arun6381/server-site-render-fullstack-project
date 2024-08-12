// Require the Stripe library and initialize it with the secret key from environment variables
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Import models and utility functions
const Tour = require('../models/tourmodel');
const User = require('./../models/userModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsyncerr');
const factory = require('./handlerFactory');

// Function to create a checkout session for a tour booking
exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1) Get the currently booked tour by ID
  const tour = await Tour.findById(req.params.tourId);

  // 2) Create a checkout session with Stripe
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'], // Specify that payment will be made via card
    // Define the URL to redirect to after successful payment
    success_url: `${req.protocol}://${req.get('host')}/my-tours?alert=booking`,
    // Define the URL to redirect to if the payment is canceled
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email, // Use the user's email for the session
    client_reference_id: req.params.tourId, // Reference to the tour being booked
    line_items: [
      {
        name: `${tour.name} Tour`, // Name of the tour
        description: tour.summary, // Description of the tour
        images: [
          `${req.protocol}://${req.get('host')}/img/tours/${tour.imageCover}`
        ], // Image for the tour
        amount: tour.price * 100, // Price in cents
        currency: 'usd', // Currency
        quantity: 1 // Quantity of the item being purchased
      }
    ]
  });

  // 3) Send the session object as a response
  res.status(200).json({
    status: 'success',
    session
  });
});

// Function to create a booking in the database after a successful checkout
const createBookingCheckout = async session => {
  const tour = session.client_reference_id; // Get the tour ID
  const user = (await User.findOne({ email: session.customer_email })).id; // Get the user ID
  const price = session.display_items[0].amount / 100; // Get the price in dollars
  await Booking.create({ tour, user, price }); // Create a booking record
};

// Webhook handler to process Stripe events
exports.webhookCheckout = (req, res, next) => {
  const signature = req.headers['stripe-signature']; // Get the Stripe signature from headers

  let event;
  try {
    // Construct the event using Stripe's library to verify its authenticity
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    // If verification fails, respond with an error
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  // If the event type is 'checkout.session.completed', create a booking
  if (event.type === 'checkout.session.completed')
    createBookingCheckout(event.data.object);

  // Respond to Stripe to acknowledge receipt of the event
  res.status(200).json({ received: true });
};

// CRUD operations for bookings using a factory pattern
exports.createBooking = factory.createOne(Booking); // Create a new booking
exports.getBooking = factory.getOne(Booking); // Get a specific booking
exports.getAllBookings = factory.getAll(Booking); // Get all bookings
exports.updateBooking = factory.updateOne(Booking); // Update a booking
exports.deleteBooking = factory.deleteOne(Booking); // Delete a booking
