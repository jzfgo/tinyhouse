import stripe from 'stripe';

const client = new stripe(`${process.env.S_SECRET_KEY}`, {
  apiVersion: '2022-08-01',
  maxNetworkRetries: 0,
  typescript: true,
});

export const Stripe = {
  connect: async (code: string): Promise<stripe.OAuthToken> => {
    const response = await client.oauth.token({
      grant_type: 'authorization_code',
      code,
    });

    return response;
  },
  charge: async (
    amount: number,
    source: string,
    stripeAccount: string
  ): Promise<stripe.Charge> => {
    const response = await client.charges.create(
      {
        amount,
        currency: 'usd',
        source,
        application_fee_amount: Math.round(amount * 0.05),
      },
      {
        stripe_account: stripeAccount,
      }
    );

    if (response.status !== 'succeeded') {
      throw new Error('Failed to create charge with Stripe');
    }

    return response;
  },
};
