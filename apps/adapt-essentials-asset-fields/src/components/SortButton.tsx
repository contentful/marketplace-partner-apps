import { Icon } from '@contentful/f36-components';
import { ButtonHTMLAttributes, DetailedHTMLProps, MouseEventHandler, useState } from 'react';

type SortType = 'asc' | 'desc' | 'none';

export const SortButton = ({
  sort = 'none',
  sortClickHeader,
  children,
  ...rest
}: {
  sort?: SortType;
  sortClickHeader?: (sort: SortType) => MouseEventHandler<HTMLButtonElement>;
} & DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>) => {
  const [sortDirection, setSortDirection] = useState<SortType>(sort);

  const handleClick = () => {
    setSortDirection((current) => {
      if (current === 'none') {
        return 'asc';
      }
      if (current === 'asc') {
        return 'desc';
      }
      return 'none';
    });
  };

  return (
    <button
      aria-label="Sort ascending by Updated"
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        color: 'currentcolor',
      }}
      onClick={sortClickHeader ? sortClickHeader(sortDirection) : handleClick}
      {...rest}>
      {children}
      <Icon>
        <path
          fillOpacity={sortDirection === 'desc' ? 1 : 0.2} // deepscan-disable-line
          d="M16.5 14.25h-9a.75.75 0 0 0-.53 1.28l4.5 4.5a.747.747 0 0 0 1.06 0l4.5-4.5a.75.75 0 0 0-.53-1.28Z"></path>
        <path
          fillOpacity={sortDirection === 'asc' ? 1 : 0.2} // deepscan-disable-line
          d="M6.764 8.854a.75.75 0 0 0 .736.896h9a.75.75 0 0 0 .53-1.28l-4.5-4.5a.751.751 0 0 0-1.061 0l-4.5 4.5a.75.75 0 0 0-.205.384Z"></path>
      </Icon>
    </button>
  );
};
