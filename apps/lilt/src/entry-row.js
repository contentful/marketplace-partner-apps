import React from 'react';
import PropTypes from 'prop-types';
import { TableRow, TableCell, Tooltip } from '@contentful/forma-36-react-components';
import { Checkbox, Badge, RelativeDateTime } from '@contentful/f36-components';
import { InfoCircleTrimmedIcon } from '@contentful/f36-icons';

/**
 * @link https://www.contentful.com/developers/docs/tutorials/general/determine-entry-asset-state/
 * @returns {Object} release
 * @returns {'published' | 'draft' | 'archived' | 'changed'} release.status
 * @returns {import('@contentful/f36-components').BadgeVariant} release.variant
 */
const getReleaseStatusAndBadgeVariant = entitySys => {
  const { publishedVersion, version, archivedVersion } = entitySys;
  if (!publishedVersion && !archivedVersion) {
    return { status: 'draft', variant: 'warning' };
  } else if (publishedVersion && version >= publishedVersion + 2) {
    return { status: 'changed', variant: 'primary' };
  } else if (publishedVersion && version == publishedVersion + 1) {
    return { status: 'published', variant: 'positive' };
  } else if (archivedVersion) {
    return { status: 'archived', variant: 'negative' };
  }
  return {};
};

const parseAndGetTitle = (entry, defaultLocale) => {
  const {
    fields,
    sys: { id },
    displayField
  } = entry;
  const titleField = fields[displayField];
  if (!titleField) return 'Untitled';

  const title = titleField[defaultLocale];
  if (typeof title === 'string') return title;

  return id;
};

const EntryRow = ({ entry, onChange, defaultLocale, isSelected }) => {
  const { fields, sys } = entry;
  const title = parseAndGetTitle(entry, defaultLocale);
  const { id, archivedVersion } = sys;
  const contentType = sys.contentType.sys.id;
  // fallback to creation date if no update date exists
  const updatedAt = sys.updatedAt || sys.createdAt;
  const { status, variant } = getReleaseStatusAndBadgeVariant(sys);
  const liltStatus = fields.lilt_status ? fields.lilt_status[defaultLocale] : '';
  const metadata = fields.lilt_metadata ? fields.lilt_metadata[defaultLocale] : {};
  const targetLocales = metadata.target_locales ? metadata.target_locales.join(', ') : 'Default';
  const handleChange = () => onChange(id);

  const renderWarningIcon = () => {
    const isArchived = !!archivedVersion;
    if (!entry.isSubmitted && !isArchived) {
      return null;
    }

    const text = isArchived
      ? 'This content is archived and will not be included.'
      : `This content has been submitted for translation before 
      and did not change since. Sending same content multiple times 
      can lead to some translations be overwritten.`;
    const variant = isArchived ? 'muted' : 'warning';

    return (
      <Tooltip place="right" content={text}>
        <InfoCircleTrimmedIcon variant={variant} />
      </Tooltip>
    );
  };

  return (
    <TableRow>
      <TableCell>
        <div className="entry-checkbox-cell">
          <Checkbox onChange={handleChange} isChecked={isSelected} />
          {renderWarningIcon()}
        </div>
      </TableCell>
      <TableCell>{title}</TableCell>
      <TableCell>{targetLocales}</TableCell>
      <TableCell>
        <Badge variant={variant}>{status}</Badge>
      </TableCell>
      <TableCell>{liltStatus}</TableCell>
      <TableCell>{contentType}</TableCell>
      <TableCell>
        <RelativeDateTime date={updatedAt} />
      </TableCell>
    </TableRow>
  );
};

EntryRow.propTypes = {
  entry: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  defaultLocale: PropTypes.string.isRequired,
  isSelected: PropTypes.bool.isRequired
};

export default EntryRow;
