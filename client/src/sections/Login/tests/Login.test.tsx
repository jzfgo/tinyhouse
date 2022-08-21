import { MockedProvider } from '@apollo/react-testing';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { GraphQLError } from 'graphql';
import { createMemoryHistory } from 'history';
import { Route, Router, Routes } from 'react-router-dom';
import { Login } from '..';
import { LOG_IN } from '../../../lib/graphql/mutations';
import { AUTH_URL } from '../../../lib/graphql/queries';

const defaultProps = {
  setViewer: jest.fn(),
};

describe('Login', () => {
  // remove console error with window.scrollTo
  window.scrollTo = jest.fn();

  describe('AUTH_URL Query', () => {
    it('redirects the user when query is successful', async () => {
      Object.defineProperty(window, 'location', {
        writable: true,
        value: { assign: jest.fn() },
      });

      const authUrlMock = {
        request: {
          query: AUTH_URL,
        },
        result: {
          data: {
            authUrl: 'https://www.google.com',
          },
        },
      };

      const history = createMemoryHistory({
        initialEntries: ['/login'],
      });

      render(
        <MockedProvider mocks={[authUrlMock]} addTypename={false}>
          <Router navigator={history} location={'/login'}>
            <Routes>
              <Route path="/login" element={<Login {...defaultProps} />} />
            </Routes>
          </Router>
        </MockedProvider>
      );

      const authUrlButton = screen.getByRole('button');
      fireEvent.click(authUrlButton);

      await waitFor(() => {
        expect(window.location.assign).toHaveBeenCalledWith(
          'https://www.google.com'
        );
      });

      expect(
        screen.queryByText(
          "Sorry! We weren't able to log you in. Please try again later!"
        )
      ).toBeNull();
    });

    it('does not redirect the user when query is unsuccessful', async () => {
      Object.defineProperty(window, 'location', {
        writable: true,
        value: { assign: jest.fn() },
      });

      const authUrlMock = {
        request: {
          query: AUTH_URL,
        },
        errors: [new GraphQLError('Something went wrong')],
      };

      const history = createMemoryHistory({
        initialEntries: ['/login'],
      });

      render(
        <MockedProvider mocks={[authUrlMock]} addTypename={false}>
          <Router navigator={history} location={'/login'}>
            <Routes>
              <Route path="/login" element={<Login {...defaultProps} />} />
            </Routes>
          </Router>
        </MockedProvider>
      );

      const authUrlButton = screen.getByRole('button');
      fireEvent.click(authUrlButton);

      await waitFor(() => {
        expect(
          screen.getByText(
            "Sorry! We weren't able to log you in. Please try again later!"
          )
        ).not.toBeNull();
      });
      expect(window.location.assign).not.toHaveBeenCalled();
    });
  });

  describe('LOGIN Mutation', () => {
    describe('when the "code" parameter is not present in the /login route', () => {
      it('does not fire the mutation', async () => {
        const loginMock = {
          request: {
            query: LOG_IN,
            variables: {
              input: {
                code: '1234',
              },
            },
          },
          result: {
            data: {
              logIn: {
                id: '111',
                token: 'abcdefg',
                avatar: 'https://www.example.com/avatar.jpg',
                hasWallet: false,
                didRequest: true,
              },
            },
          },
        };

        const history = createMemoryHistory({
          initialEntries: ['/login'],
        });

        render(
          <MockedProvider mocks={[loginMock]} addTypename={false}>
            <Router navigator={history} location={'/login'}>
              <Routes>
                <Route path="/login" element={<Login {...defaultProps} />} />
              </Routes>
            </Router>
          </MockedProvider>
        );

        await waitFor(() => {
          expect(history.location.pathname).not.toBe('/user/111');
        });
      });
    });

    describe('when the "code" parameter is present in the /login route', () => {
      it('redirects the user to their user page when the mutation is successful', async () => {
        const loginMock = {
          request: {
            query: LOG_IN,
            variables: {
              input: {
                code: '1234',
              },
            },
          },
          result: {
            data: {
              logIn: {
                id: '111',
                token: 'abcdefg',
                avatar: 'https://www.example.com/avatar.jpg',
                hasWallet: false,
                didRequest: true,
              },
            },
          },
        };

        const history = createMemoryHistory({
          initialEntries: ['/login?code=1234'],
        });

        render(
          <MockedProvider mocks={[loginMock]} addTypename={false}>
            <Router navigator={history} location={'/login?code=1234'}>
              <Routes>
                <Route path="/login" element={<Login {...defaultProps} />} />
              </Routes>
            </Router>
          </MockedProvider>
        );

        await waitFor(() => {
          expect(history.location.pathname).toBe('/user/111');
        });
      });

      it('does not redirect the user to their user page and displays and error message when the mutation is unsuccessful', async () => {
        const loginMock = {
          request: {
            query: LOG_IN,
            variables: {
              input: {
                code: '1234',
              },
            },
          },
          result: {
            data: {
              logIn: {
                id: '111',
                token: 'abcdefg',
                avatar: 'https://www.example.com/avatar.jpg',
                hasWallet: false,
                didRequest: true,
              },
            },
          },
          errors: [new GraphQLError('Something went wrong')],
        };

        const history = createMemoryHistory({
          initialEntries: ['/login?code=1234'],
        });

        render(
          <MockedProvider mocks={[loginMock]} addTypename={false}>
            <Router navigator={history} location={'/login?code=1234'}>
              <Routes>
                <Route path="/login" element={<Login {...defaultProps} />} />
              </Routes>
            </Router>
          </MockedProvider>
        );

        await waitFor(() => {
          expect(history.location.pathname).not.toBe('/user/111');
        });

        expect(
          screen.getByText(
            "Sorry! We weren't able to log you in. Please try again later!"
          )
        ).not.toBeNull();
      });
    });
  });
});

export {};
