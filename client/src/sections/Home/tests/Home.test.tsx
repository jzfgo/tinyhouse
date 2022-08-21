import { MockedProvider } from '@apollo/react-testing';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createMemoryHistory } from 'history';
import { Router } from 'react-router-dom';
import { Home } from '..';
import { ListingsFilter } from '../../../lib/graphql/globalTypes';
import { LISTINGS } from '../../../lib/graphql/queries';

describe('Home', () => {
  // remove console error with window.scrollTo
  window.scrollTo = jest.fn();

  describe('Search input', () => {
    it('renders an empty search input on initial render', async () => {
      const history = createMemoryHistory();

      render(
        <MockedProvider mocks={[]}>
          <Router navigator={history} location={'/'}>
            <Home />
          </Router>
        </MockedProvider>
      );

      const searchInput = screen.getByPlaceholderText(
        "Search 'San Francisco'"
      ) as HTMLInputElement;

      expect(searchInput.value).toEqual('');
    });

    it('redirects the user to the /listings page when a valid search is provided', async () => {
      const history = createMemoryHistory();

      render(
        <MockedProvider mocks={[]}>
          <Router navigator={history} location={'/'}>
            <Home />
          </Router>
        </MockedProvider>
      );

      const searchInput = screen.getByPlaceholderText(
        "Search 'San Francisco'"
      ) as HTMLInputElement;

      fireEvent.change(searchInput, { target: { value: 'Toronto' } });
      fireEvent.keyDown(searchInput, { key: 'Enter', keyCode: 13 });

      expect(history.location.pathname).toBe('/listings/Toronto');
    });

    it('does not redirect the user to the /listings page when an invalid search is provided', async () => {
      const history = createMemoryHistory();

      render(
        <MockedProvider mocks={[]}>
          <Router navigator={history} location={'/'}>
            <Home />
          </Router>
        </MockedProvider>
      );

      const searchInput = screen.getByPlaceholderText(
        "Search 'San Francisco'"
      ) as HTMLInputElement;

      fireEvent.change(searchInput, { target: { value: '' } });
      fireEvent.keyDown(searchInput, { key: 'Enter', keyCode: 13 });

      expect(history.location.pathname).toBe('/');
    });
  });

  describe('Premium listings', () => {
    it('renders a loading skeleton when the listings are loading', async () => {
      const history = createMemoryHistory();

      render(
        <MockedProvider mocks={[]}>
          <Router navigator={history} location={'/'}>
            <Home />
          </Router>
        </MockedProvider>
      );

      expect(screen.getByText('Premium Listings - Loading…')).not.toBeNull();
      expect(screen.queryByText('Premium Listings')).toBeNull();
    });

    it('renders the listings when the listings are loaded', async () => {
      const listingsMock = {
        request: {
          query: LISTINGS,
          variables: {
            filter: ListingsFilter.PRICE_HIGH_TO_LOW,
            limit: 4,
            page: 1,
          },
        },
        result: {
          data: {
            listings: {
              region: null,
              total: 10,
              result: [
                {
                  id: '1',
                  title: 'Private room in center of town',
                  image:
                    'https://a0.muscache.com/im/pictures/eb9c7c6a-ee48-414c-b1ba-14e8860d59b5.jpg?im_w=720',
                  price: 34,
                  address: 'Private room in center of town',
                  numOfGuests: 1,
                },
              ],
            },
          },
        },
      };

      const history = createMemoryHistory();

      render(
        <MockedProvider mocks={[listingsMock]} addTypename={false}>
          <Router navigator={history} location={'/'}>
            <Home />
          </Router>
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.queryByText('Premium Listings - Loading…')).toBeNull();
      });
      expect(screen.getByText('Premium Listings')).not.toBeNull();
    });

    it('renders nothing when query has an error', async () => {
      const listingsMock = {
        request: {
          query: LISTINGS,
          variables: {
            filter: ListingsFilter.PRICE_HIGH_TO_LOW,
            limit: 4,
            page: 1,
          },
        },
        error: new Error('Something went wrong'),
      };

      const history = createMemoryHistory();

      render(
        <MockedProvider mocks={[listingsMock]} addTypename={false}>
          <Router navigator={history} location={'/'}>
            <Home />
          </Router>
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.queryByText('Premium Listings - Loading…')).toBeNull();
      });
      expect(screen.queryByText('Premium Listings')).toBeNull();
    });
  });
});

export {};
