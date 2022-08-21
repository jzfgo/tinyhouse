import { useQuery } from '@apollo/client';
import { Col, Row, Typography } from 'antd';
import { Content } from 'antd/lib/layout/layout';
import { Link, useNavigate } from 'react-router-dom';
import { ListingsFilter } from '../../lib/graphql/globalTypes';
import { LISTINGS } from '../../lib/graphql/queries';
import {
  Listings as ListingsData,
  ListingsVariables,
} from '../../lib/graphql/queries/Listings/__generated__/Listings';
import { useScrollToTop } from '../../lib/hooks';
import { displayErrorMessage } from '../../lib/utils';
import cancunImage from '../Home/assets/cancun.jpg';
import mapBackground from '../Home/assets/map-background.jpg';
import sanFranciscoImage from '../Home/assets/san-fransisco.jpg';
import { HomeHero, HomeListings, HomeListingsSkeleton } from './components';

const { Title, Paragraph } = Typography;

const PAGE_LIMIT = 4;
const PAGE_NUMBER = 1;

export const Home = () => {
  const navigate = useNavigate();

  const { loading, data } = useQuery<ListingsData, ListingsVariables>(
    LISTINGS,
    {
      variables: {
        filter: ListingsFilter.PRICE_HIGH_TO_LOW,
        limit: PAGE_LIMIT,
        page: PAGE_NUMBER,
      },
      fetchPolicy: 'cache-and-network',
    }
  );

  useScrollToTop();

  const onSearch = (value: string) => {
    const trimmedValue = value.trim();

    if (trimmedValue) {
      navigate(`/listings/${trimmedValue}`);
    } else {
      return displayErrorMessage('Please enter a valid search!');
    }
  };

  const renderListingsSection = () => {
    if (loading) {
      return <HomeListingsSkeleton title="Premium Listings - Loading…" />;
    }

    if (data) {
      return (
        <HomeListings
          title="Premium Listings"
          listings={data.listings.result}
        />
      );
    }

    return null;
  };

  return (
    <Content
      className="home"
      style={{ backgroundImage: `url(${mapBackground})` }}
    >
      <HomeHero onSearch={onSearch} />

      <div className="home__cta-section">
        <Title level={2} className="home__cta-section-title">
          Your guide for all things rental
        </Title>
        <Paragraph>
          Helping you make the best decisions in renting your last minute
          locations.
        </Paragraph>
        <Link
          to="/listings/United%20States"
          className="ant-btn ant-btn-primary ant-btn-lg home__cta-section-button"
        >
          Popular listings in the United States
        </Link>
      </div>

      {renderListingsSection()}

      <div className="home__listings">
        <Title level={4} className="home__listings-title">
          Listings of any kind
        </Title>
        <Row gutter={12}>
          <Col xs={24} md={12}>
            <Link to="/listings/San%20Francisco">
              <div className="home__listings-img-cover">
                <img
                  src={sanFranciscoImage}
                  className="home__listings-img"
                  alt="San Francisco"
                />
              </div>
            </Link>
          </Col>
          <Col xs={24} md={12}>
            <Link to="/listings/Cancún">
              <div className="home__listings-img-cover">
                <img
                  src={cancunImage}
                  className="home__listings-img"
                  alt="Cancún"
                />
              </div>
            </Link>
          </Col>
        </Row>
      </div>
    </Content>
  );
};
