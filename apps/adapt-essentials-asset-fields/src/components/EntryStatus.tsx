import { EntityStatusBadge } from '@contentful/f36-components';
import { getEntryStatus } from './utils/entries.ts';

export const EntryStatus = ({ sys }) => <EntityStatusBadge entityStatus={getEntryStatus(sys)} />;
