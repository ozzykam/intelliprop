import Stripe from 'stripe';

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (stripeInstance) {
    return stripeInstance;
  }

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('Missing STRIPE_SECRET_KEY environment variable');
  }

  stripeInstance = new Stripe(key, {
    apiVersion: '2023-10-16' as Stripe.LatestApiVersion,
  });

  return stripeInstance;
}
