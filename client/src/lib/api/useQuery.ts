import { useEffect, useReducer, useCallback } from 'react';
import { server } from './server';

interface State<TData> {
  data: TData | null;
  loading: boolean;
  error: boolean;
}

type Action<TData> =
  | { type: 'FETCH' }
  | { type: 'FETCH_SUCCESS'; payload: TData }
  | { type: 'FETCH_ERROR' };

type QueryResult<TData> = State<TData> & {
  refetch: () => void;
};

const reducer = <TData>() => (
  state: State<TData>,
  action: Action<TData>
): State<TData> => {
  switch (action.type) {
    case 'FETCH':
      return { ...state, loading: true };

    case 'FETCH_SUCCESS':
      return { data: action.payload, loading: false, error: false };

    case 'FETCH_ERROR':
      return { ...state, loading: false, error: true };

    default:
      throw new Error();
  }
};

export const useQuery = <TData = any>(query: string): QueryResult<TData> => {
  const fetchReducer = reducer<TData>();
  const [state, dispatch] = useReducer(fetchReducer, {
    data: null,
    loading: false,
    error: false,
  });

  const fetch = useCallback(() => {
    (async function fetchApi() {
      try {
        dispatch({ type: 'FETCH' });

        const { data, errors } = await server.fetch<TData>({ query });

        dispatch({ type: 'FETCH_SUCCESS', payload: data });

        if (errors?.length) {
          throw new Error(errors[0].message);
        }
      } catch (err) {
        dispatch({ type: 'FETCH_ERROR' });
        console.error(err);
      }
    })();
  }, [query]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { ...state, refetch: fetch };
};
