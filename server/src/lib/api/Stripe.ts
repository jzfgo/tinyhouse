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
};
