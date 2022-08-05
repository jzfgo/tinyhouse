import { google, people_v1 } from 'googleapis';
import {
  AddressComponent,
  AddressType,
  Client,
} from '@googlemaps/google-maps-services-js';

const auth = new google.auth.OAuth2(
  process.env.G_CLIENT_ID,
  process.env.G_CLIENT_SECRET,
  `${process.env.PUBLIC_URL}/login`
);

const maps = new Client({});

interface ParsedAddress {
  country: string | null;
  admin: string | null;
  city: string | null;
}

const parseAddress = (addressComponents: AddressComponent[]): ParsedAddress => {
  let country = null;
  let admin = null;
  let city = null;

  for (const component of addressComponents) {
    if (component.types.includes(AddressType.country)) {
      country = component.long_name;
    }

    if (component.types.includes(AddressType.administrative_area_level_1)) {
      admin = component.long_name;
    }

    if (
      component.types.includes(AddressType.locality) ||
      component.types.includes(AddressType.postal_town)
    ) {
      city = component.long_name;
    }
  }

  return {
    country,
    admin,
    city,
  };
};

export const Google = {
  authUrl: auth.generateAuthUrl({
    access_type: 'online',
    scope: [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ],
  }),
  logIn: async (code: string): Promise<{ user: people_v1.Schema$Person }> => {
    const { tokens } = await auth.getToken(code);

    auth.setCredentials(tokens);

    const { data } = await google.people({ version: 'v1', auth }).people.get({
      resourceName: 'people/me',
      personFields: 'emailAddresses,names,photos',
    });

    return { user: data };
  },

  geocode: async (address: string): Promise<ParsedAddress> => {
    const res = await maps.geocode({
      params: {
        address,
        key: `${process.env.G_GEOCODING_API_KEY}`,
      },
      timeout: 1000, // milliseconds
    });

    if (res.status < 200 || res.status >= 299) {
      throw new Error('failed to geocode address');
    }

    const { results } = res.data;
    const [firstResult] = results;

    return parseAddress(firstResult?.address_components ?? []);
  },
};
