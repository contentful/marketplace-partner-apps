import { ReactNode } from 'react';

export type SearchBarProps = {
  filters: ReactNode[];
  filterMenuItems: ReactNode[];
  search: string;
  onSearch: (search: string) => void;
  onBackSpace: () => void;
  isDisabled?: boolean;
};
