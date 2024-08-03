/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alert';
const stripe = Stripe(
  'pk_test_51PhofJRtoqmg9Y2cedNrDonsTnlL935F7VtmD8Aphshi1uiMkbhWZlYiMHgUThEFMoSsN44itVoADb78xcxUBfMA00IjzPhCdc'
);

export const booksTour = async tourId => {
  try {
    const session = await axios.get(
      `http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`
    );
    if (session.status !== 200) throw new Error('Failed to fetch session');
    // 2) Create checkout form + chanre credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id
    });
  } catch (err) {
    console.error('Error fetching session:', err);
    showAlert('error', 'Failed to start booking session');
    e.target.textContent = 'Book tour now!';
  }
};
