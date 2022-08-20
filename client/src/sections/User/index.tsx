import { useQuery } from '@apollo/client';
import { Col, Layout, Row } from 'antd';
import { useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { ErrorBanner, PageSkeleton } from '../../lib/components';
import { USER } from '../../lib/graphql/queries';
import {
  User as UserData,
  UserVariables,
} from '../../lib/graphql/queries/User/__generated__/User';
import { useScrollToTop } from '../../lib/hooks';
import { Viewer } from '../../lib/types';
import { UserBookings, UserListings, UserProfile } from './components';

interface Props {
  viewer: Viewer;
  setViewer: (viewer: Viewer) => void;
}

type MatchParams = {
  id: string;
};

const { Content } = Layout;
const PAGE_LIMIT = 4;

export const User = ({ viewer, setViewer }: Props) => {
  const { id } = useParams<MatchParams>();
  const location = useLocation();

  const [listingsPage, setListingsPage] = useState(1);
  const [bookingsPage, setBookingsPage] = useState(1);

  const { data, loading, error, refetch } = useQuery<UserData, UserVariables>(
    USER,
    {
      variables: {
        id: id as string,
        bookingsPage,
        listingsPage,
        limit: PAGE_LIMIT,
      },
      fetchPolicy: 'cache-and-network',
    }
  );

  useScrollToTop();

  const handleUserRefetch = async () => {
    await refetch();
  };

  const stripeError = new URLSearchParams(location.search).get('stripe_error');
  const stripeErrorBanner = stripeError ? (
    <ErrorBanner description="We had trouble connecting to Stripe. Please try again later." />
  ) : null;

  if (loading) {
    return (
      <Content className="user">
        <PageSkeleton />
      </Content>
    );
  }

  if (error) {
    return (
      <Content className="user">
        <ErrorBanner description="This user may not exist or we've encountered and error. Please, try again later."></ErrorBanner>
      </Content>
    );
  }

  const user = data ? data.user : null;
  const viewerIsUser = viewer.id === id;

  const userListings = user ? user.listings : null;
  const userBookings = user ? user.bookings : null;

  const userProfileElement = user ? (
    <UserProfile
      user={user}
      viewer={viewer}
      viewerIsUser={viewerIsUser}
      setViewer={setViewer}
      handleUserRefetch={handleUserRefetch}
    />
  ) : null;

  const userListingsElement = userListings ? (
    <UserListings
      userListings={userListings}
      listingsPage={listingsPage}
      limit={PAGE_LIMIT}
      setListingsPage={setListingsPage}
    />
  ) : null;

  const userBookingsElement = userBookings ? (
    <UserBookings
      userBookings={userBookings}
      bookingsPage={bookingsPage}
      limit={PAGE_LIMIT}
      setBookingsPage={setBookingsPage}
    />
  ) : null;

  return (
    <Content className="user">
      {stripeErrorBanner}
      <Row gutter={12} justify="space-between">
        <Col xs={24}>{userProfileElement}</Col>
        <Col xs={24}>
          {userListingsElement}
          {userBookingsElement}
        </Col>
      </Row>
    </Content>
  );
};
