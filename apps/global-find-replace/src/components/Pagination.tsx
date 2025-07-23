import React from 'react';
import { Flex, Paragraph, IconButton } from '@contentful/f36-components';
import { ChevronLeftIcon, ChevronRightIcon } from '@contentful/f36-icons';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  const handlePrevious = () => {
    onPageChange(Math.max(0, currentPage - 1));
  };

  const handleNext = () => {
    onPageChange(Math.min(totalPages - 1, currentPage + 1));
  };

  return (
    <Flex justifyContent="center" alignItems="center" gap="spacingS">
      <IconButton icon={<ChevronLeftIcon />} aria-label="Previous Page" onClick={handlePrevious} isDisabled={currentPage === 0} />
      <Flex alignItems="center">
        <Paragraph marginBottom="none">{`Page ${currentPage + 1} of ${totalPages}`}</Paragraph>
      </Flex>
      <IconButton icon={<ChevronRightIcon />} aria-label="Next Page" onClick={handleNext} isDisabled={currentPage >= totalPages - 1} />
    </Flex>
  );
};
