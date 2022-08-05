import { Pagination } from 'antd';

interface Props {
  total: number;
  page: number;
  limit: number;
  setPage: (page: number) => void;
}

export const ListingsPagination = ({ total, page, limit, setPage }: Props) => {
  return (
    <Pagination
      className="listings-pagination"
      current={page}
      total={total}
      defaultPageSize={limit}
      hideOnSinglePage
      showLessItems
      onChange={(page: number) => setPage(page)}
    />
  );
};
