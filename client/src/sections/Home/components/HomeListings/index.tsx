import { List, Typography } from 'antd';
import { ListingCard } from '../../../../lib/components';
import { Listings } from '../../../../lib/graphql/queries/Listings/__generated__/Listings';

interface Props {
  title: string;
  listings: Listings['listings']['result'];
}

const { Title } = Typography;

export const HomeListings = ({ title, listings }: Props) => {
  return (
    <div className="home-listings">
      <Title level={4} className="home-listings__title">
        {title}
      </Title>
      <List
        grid={{
          gutter: 8,
          column: 3,
          xs: 1,
          sm: 2,
          md: 3,
        }}
        dataSource={listings}
        renderItem={(listing) => (
          <List.Item>
            <ListingCard listing={listing} />
          </List.Item>
        )}
      />
    </div>
  );
};
