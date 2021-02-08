import { useParams } from 'react-router-dom';

interface MatchParams {
  id: string;
}

export const Listing = () => {
  const { id } = useParams<MatchParams>();

  return <h2>Listing {id}</h2>;
};
