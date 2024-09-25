import { CalendarFilterName } from './BulkEditor.types';
import { CalendarFilterValue } from './SearchBar';

export const makeCalendarFilterQuery = (name: CalendarFilterName, { date, condition }: CalendarFilterValue) => {
  if (!date) return;
  const today = date.toISOString();
  const tomorrow = new Date(date.getTime() + 86399999).toISOString();

  switch (condition) {
    case 'is':
      return {
        [`sys.${name}[gte]`]: today,
        [`sys.${name}[lte]`]: tomorrow,
      };
    case 'is greater than':
      return {
        [`sys.${name}[gt]`]: tomorrow,
      };
    case 'is greater than or equal to':
      return {
        [`sys.${name}[gte]`]: today,
      };
    case 'is less than':
      return {
        [`sys.${name}[lt]`]: today,
      };
    case 'is less than or equal to':
      return {
        [`sys.${name}[lte]`]: tomorrow,
      };
    default:
      return {};
  }
};
