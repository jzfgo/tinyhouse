import { Button, Card, DatePicker, Divider, Tooltip, Typography } from 'antd';
import moment, { Moment } from 'moment';
import { Viewer } from '../../../../lib/types';
import { displayErrorMessage, formatListingPrice } from '../../../../lib/utils';
import { Listing as ListingData } from '../../../../lib/graphql/queries/Listing/__generated__/Listing';
import { BookingsIndex } from './types';

const { Paragraph, Title, Text } = Typography;

interface Props {
  viewer: Viewer;
  host: ListingData['listing']['host'];
  price: number;
  bookingsIndex: ListingData['listing']['bookingsIndex'];
  checkInDate: Moment | null;
  checkOutDate: Moment | null;
  setCheckInDate: (checkInDate: Moment | null) => void;
  setCheckOutDate: (checkOutDate: Moment | null) => void;
  setModalVisible: (modalVisible: boolean) => void;
}

export const ListingCreateBooking = ({
  viewer,
  host,
  price,
  bookingsIndex,
  checkInDate,
  checkOutDate,
  setCheckInDate,
  setCheckOutDate,
  setModalVisible,
}: Props) => {
  const bookingsIndexJSON: BookingsIndex = JSON.parse(bookingsIndex);

  const dateIsBooked = (currentDate: Moment) => {
    const year = moment(currentDate).year();
    const month = moment(currentDate).month();
    const day = moment(currentDate).date();

    if (bookingsIndexJSON[year] && bookingsIndexJSON[year][month]) {
      return Boolean(bookingsIndexJSON[year][month][day]);
    } else {
      return false;
    }
  };

  const disabledDate = (currentDate?: Moment) => {
    if (currentDate) {
      const dateIsBeforeEndOfDay = currentDate.isBefore(moment().endOf('day'));
      const dateIsMoreThanThreeMonthsAhead = moment(currentDate).isAfter(
        moment().endOf('day').add(90, 'days')
      );

      return (
        dateIsBeforeEndOfDay ||
        dateIsMoreThanThreeMonthsAhead ||
        dateIsBooked(currentDate)
      );
    } else {
      return false;
    }
  };

  const verifyAndSetCheckOutDate = (selectedCheckOutDate: Moment | null) => {
    if (checkInDate && selectedCheckOutDate) {
      if (moment(selectedCheckOutDate).isBefore(checkInDate, 'days')) {
        return displayErrorMessage("You can't check out before you check in!");
      }

      let dateCursor = moment(checkInDate);

      while (dateCursor.isBefore(selectedCheckOutDate, 'days')) {
        dateCursor = dateCursor.add(1, 'days');

        const year = dateCursor.year();
        const month = dateCursor.month();
        const day = dateCursor.date();

        if (
          bookingsIndexJSON[year] &&
          bookingsIndexJSON[year][month] &&
          bookingsIndexJSON[year][month][day]
        ) {
          return displayErrorMessage(
            'You cannot book a period of time that overlaps existing bookings. Please, try again!'
          );
        }
      }
    }

    setCheckOutDate(selectedCheckOutDate);
  };

  const viewerIsHost = viewer.id === host.id;
  const checkInInputDisabled = !viewer.id || viewerIsHost || !host.hasWallet;
  const checkOutInputDisabled = checkInInputDisabled || !checkInDate;
  const buttonDisabled = checkOutInputDisabled || !checkInDate || !checkOutDate;

  let buttonMessage = "You won't be charged yet";
  if (!viewer.id) {
    buttonMessage = 'You have to be signed in to book a listing!';
  } else if (viewerIsHost) {
    buttonMessage = 'You can only book your own listings!';
  } else if (!host.hasWallet) {
    buttonMessage =
      "The host has disconnected from Stripe and thus won't be able to receive payments.";
  }

  return (
    <div className="listing-booking">
      <Card className="listing-booking__card">
        <div>
          <Paragraph>
            <Title level={2} className="listing-booking__card-title">
              {formatListingPrice(price)}
              <span>/day</span>
            </Title>
          </Paragraph>
          <Divider />
          <div className="listing-booking__card-date-picker">
            <Paragraph strong>Check In</Paragraph>
            <DatePicker
              value={checkInDate ? checkInDate : undefined}
              format={'YYYY/MM/DD'}
              disabled={checkInInputDisabled}
              disabledDate={disabledDate}
              showToday={false}
              onChange={(dateValue) => setCheckInDate(dateValue)}
              onOpenChange={() => setCheckOutDate(null)}
              renderExtraFooter={() => (
                <div>
                  <Text type="secondary" className="ant-calendar-footer-text">
                    You can only book a listing within 90 days from today.
                  </Text>
                </div>
              )}
            />
          </div>
          <div className="listing-booking__card-date-picker">
            <Paragraph strong>Check Out</Paragraph>
            <DatePicker
              value={checkOutDate ? checkOutDate : undefined}
              format={'YYYY/MM/DD'}
              disabled={checkOutInputDisabled}
              disabledDate={disabledDate}
              showToday={false}
              onChange={(dateValue) => verifyAndSetCheckOutDate(dateValue)}
              dateRender={(current) => {
                if (
                  moment(current).isSame(
                    checkInDate ? checkInDate : undefined,
                    'day'
                  )
                ) {
                  return (
                    <Tooltip title="Check in date">
                      <div className="ant-calendar-date ant-calendar-date__check-in">
                        {current.date()}
                      </div>
                    </Tooltip>
                  );
                } else {
                  return (
                    <div className="ant-calendar-date">{current.date()}</div>
                  );
                }
              }}
              renderExtraFooter={() => {
                return (
                  <div>
                    <Text type="secondary" className="ant-calendar-footer-text">
                      Check-out cannot be before check-in.
                    </Text>
                  </div>
                );
              }}
            />
          </div>
        </div>
        <Divider />
        <Button
          disabled={buttonDisabled}
          size="large"
          type="primary"
          className="listing-booking__card-cta"
          onClick={() => setModalVisible(true)}
        >
          Request to book!
        </Button>
        <Text type="secondary" mark>
          {buttonMessage}
        </Text>
      </Card>
    </div>
  );
};
