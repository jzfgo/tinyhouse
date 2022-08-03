import { Skeleton } from 'antd';
import Paragraph from 'antd/lib/skeleton/Paragraph';

export const PageSkeleton = () => {
  const skeletonParagraph = (
    <Skeleton
      active
      paragraph={{ rows: 4 }}
      className="page-skeleton__paragraph"
    ></Skeleton>
  );

  return (
    <>
      {skeletonParagraph}
      {skeletonParagraph}
      {skeletonParagraph}
    </>
  );
};
