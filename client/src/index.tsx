import {
  ApolloClient,
  ApolloProvider,
  InMemoryCache,
  useMutation,
} from '@apollo/client';
import { Affix, Layout, Spin } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { render } from 'react-dom';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AppHeaderSkeleton, ErrorBanner } from './lib/components';
import { LOG_IN } from './lib/graphql/mutations';
import {
  LogIn as LogInData,
  LogInVariables,
} from './lib/graphql/mutations/LogIn/__generated__/LogIn';
import { Viewer } from './lib/types';
import reportWebVitals from './reportWebVitals';
import {
  AppHeader,
  Home,
  Host,
  Listing,
  Listings,
  Login,
  NotFound,
  Stripe,
  User,
} from './sections';
import './styles/index.css';

const client = new ApolloClient({
  uri: '/api',
  cache: new InMemoryCache(),
  headers: {
    'X-CSRF-TOKEN': sessionStorage.getItem('token') || '',
  },
});

const initialViewer: Viewer = {
  id: null,
  token: null,
  avatar: null,
  hasWallet: null,
  didRequest: false,
};

const App = () => {
  const [viewer, setViewer] = useState<Viewer>(initialViewer);

  const [logIn, { error }] = useMutation<LogInData, LogInVariables>(LOG_IN, {
    onCompleted: (data) => {
      if (data && data.logIn) {
        setViewer(data.logIn);

        if (data.logIn.token) {
          sessionStorage.setItem('token', data.logIn.token);
        } else {
          sessionStorage.removeItem('token');
        }
      }
    },
  });

  const logInRef = useRef(logIn);

  useEffect(() => {
    logInRef.current();
  }, []);

  if (!viewer.didRequest && !error) {
    <Layout className="app-skeleton">
      <AppHeaderSkeleton />
      <div className="app-skeleton__spin-section">
        <Spin size="large" tip="Launching TinyHouse" />
      </div>
    </Layout>;
  }

  const logInErrorBannerElement = error ? (
    <ErrorBanner description="We weren't able to verify if you were logged in. Please try again later!" />
  ) : null;

  return (
    <Router>
      <Layout id="app">
        {logInErrorBannerElement}
        <Affix offsetTop={0} className="app__affix-header">
          <AppHeader viewer={viewer} setViewer={setViewer} />
        </Affix>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="host" element={<Host viewer={viewer} />} />
          <Route path="listing/:id" element={<Listing viewer={viewer} />} />
          <Route path="listings" element={<Listings />} />
          <Route path="listings/:location" element={<Listings />} />
          <Route path="login" element={<Login setViewer={setViewer} />} />
          <Route
            path="user/:id"
            element={<User viewer={viewer} setViewer={setViewer} />}
          />
          <Route
            path="stripe"
            element={<Stripe viewer={viewer} setViewer={setViewer} />}
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </Router>
  );
};

render(
  <ApolloProvider client={client}>
    <App />
  </ApolloProvider>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
