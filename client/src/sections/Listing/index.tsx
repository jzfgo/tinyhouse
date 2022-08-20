import { useQuery } from '@apollo/client';
import { Col, Layout, Row } from 'antd';
import { Moment } from 'moment';
import { useMemo, useState } from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { ErrorBanner, PageSkeleton } from '../../lib/components';
import { LISTING } from '../../lib/graphql/queries';
import {
  Listing as ListingData,
  ListingVariables,
} from '../../lib/graphql/queries/Listing/__generated__/Listing';
import { Viewer } from '../../lib/types';
import {
  ListingBookings,
  ListingCreateBooking,
  ListingCreateBookingModal,
  ListingDetails,
} from './components';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

interface MatchParams {
  id: string;
}

interface Props extends RouteComponentProps<MatchParams> {
  viewer: Viewer;
}

const { Content } = Layout;
const PAGE_LIMIT = 3;

export const Listing = ({ match, viewer }: Props) => {
  const stripePromise = useMemo(
    () => loadStripe(`${process.env.REACT_APP_S_PUBLISHABLE_KEY}`),
    []
  );

  const [bookingsPage, setBookingsPage] = useState(1);
  const [checkInDate, setCheckInDate] = useState<Moment | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<Moment | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const { loading, data, error, refetch } = useQuery<
    ListingData,
    ListingVariables
  >(LISTING, {
    variables: { id: match.params.id, bookingsPage, limit: PAGE_LIMIT },
  });

  const clearBookingData = () => {
    setModalVisible(false);
    setCheckInDate(null);
    setCheckOutDate(null);
  };

  const handleListingRefetch = async () => {
    await refetch();
  };

  if (loading) {
    return (
      <Content className="listings">
        <PageSkeleton />
      </Content>
    );
  }

  if (error) {
    return (
      <Content className="listings">
        <ErrorBanner description="This listing may not exist or we've encountered and error. Please, try again soon." />
      </Content>
    );
  }

  const listing = data ? data.listing : null;
  const listingBookings = listing ? listing.bookings : null;

  const listingDetailsElement = listing ? (
    <ListingDetails listing={listing} />
  ) : null;

  const listingBookingsElement = listingBookings ? (
    <ListingBookings
      listingBookings={listingBookings}
      bookingsPage={bookingsPage}
      limit={PAGE_LIMIT}
      setBookingsPage={setBookingsPage}
    />
  ) : null;

  const listingCreateBookingElement = listing ? (
    <ListingCreateBooking
      viewer={viewer}
      host={listing.host}
      price={listing.price}
      bookingsIndex={listing.bookingsIndex}
      checkInDate={checkInDate}
      checkOutDate={checkOutDate}
      setCheckInDate={setCheckInDate}
      setCheckOutDate={setCheckOutDate}
      setModalVisible={setModalVisible}
    />
  ) : null;

  const listingCreateBookingModalElement =
    listing && checkInDate && checkOutDate ? (
      <Elements stripe={stripePromise}>
        <ListingCreateBookingModal
          id={listing.id}
          price={listing.price}
          modalVisible={modalVisible}
          checkInDate={checkInDate}
          checkOutDate={checkOutDate}
          setModalVisible={setModalVisible}
          clearBookingData={clearBookingData}
          handleListingRefetch={handleListingRefetch}
        />
      </Elements>
    ) : null;

  return (
    <Content className="listings">
      <Row gutter={24} justify="space-between">
        <Col xs={24} lg={14}>
          {listingDetailsElement}
          {listingBookingsElement}
        </Col>
        <Col xs={24} lg={10}>
          {listingCreateBookingElement}
        </Col>
      </Row>
      {listingCreateBookingModalElement}
    </Content>
  );
};
