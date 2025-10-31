import { Pagination } from "@contentful/f36-components";

type Props = {
  page: number;
  itemsPerPage: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onViewPerPageChange: (count: number) => void;
};

const PaginationControl = ({
  page,
  itemsPerPage,
  totalItems,
  onPageChange,
  onViewPerPageChange,
}: Props) => (
  <Pagination
    className="mt-4"
    activePage={page}
    onPageChange={onPageChange}
    totalItems={totalItems}
    showViewPerPage
    viewPerPageOptions={[1, 2, 10, 20, 50, 100]}
    itemsPerPage={itemsPerPage}
    onViewPerPageChange={onViewPerPageChange}
  />
);

export default PaginationControl;
