import { Card, Col, Input, Row, Typography } from 'antd';
import { Link } from 'react-router-dom';
import dubaiImage from '../../assets/dubai.jpg';
import londonImage from '../../assets/london.jpg';
import losAngelesImage from '../../assets/los-angeles.jpg';
import torontoImage from '../../assets/toronto.jpg';

const { Title } = Typography;
const { Search } = Input;

interface Props {
  onSearch: (value: string) => void;
}

export const HomeHero = ({ onSearch }: Props) => {
  return (
    <div className="home-hero">
      <div className="home-hero__search">
        <Title className="home-hero__title">
          Find a place you'll love to stay at
        </Title>
        <Search
          placeholder="Search 'San Francisco'"
          size="large"
          enterButton
          className="home-hero__search-input"
          onSearch={onSearch}
        />
      </div>
      <Row gutter={12} className="home-hero__cards">
        <Col xs={12} md={6}>
          <Link to="/listings/Toronto">
            <Card cover={<img alt="Toronto" src={torontoImage} />}>
              Toronto
            </Card>
          </Link>
        </Col>
        <Col xs={12} md={6}>
          <Link to="/listings/Dubai">
            <Card cover={<img alt="Dubai" src={dubaiImage} />}>Dubai</Card>
          </Link>
        </Col>
        <Col xs={0} md={6}>
          <Link to="/listings/Los%20Ángeles">
            <Card cover={<img alt="Los Ángeles" src={losAngelesImage} />}>
              Los Ángeles
            </Card>
          </Link>
        </Col>
        <Col xs={0} md={6}>
          <Link to="/listings/London">
            <Card cover={<img alt="London" src={londonImage} />}>London</Card>
          </Link>
        </Col>
      </Row>
    </div>
  );
};
