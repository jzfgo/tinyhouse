import { server, useQuery } from '../../lib/api';
import {
  DeleteListingData,
  DeleteListingVariables,
  ListingsData,
} from './types';

const LISTINGS = `
  query Listings {
    listings {
      id
      title
      image
      address
      price
      numOfGuests
      numOfBeds
      numOfBaths
      rating
    }
  }
`;

const DELETE_LISTING = `
  mutation DeleteListing($id: ID!) {
    deleteListing(id: $id) {
      id
    }
  }
`;

interface Props {
  title: string;
}

export const Listings = ({ title }: Props) => {
  const { data, refetch } = useQuery<ListingsData>(LISTINGS);

  const deleteListing = async (id: string) => {
    await server.fetch<DeleteListingData, DeleteListingVariables>({
      query: DELETE_LISTING,
      variables: { id },
    });
    refetch();
  };

  return (
    <div>
      <h2>{title}</h2>
      <ul>
        {data?.listings.map(({ id, title }) => (
          <li key={id}>
            {title}
            <button onClick={() => deleteListing(id)}>Delete a listing!</button>
          </li>
        ))}
      </ul>
    </div>
  );
};
