import React from 'react';
import PropTypes from 'prop-types';
import { Tooltip } from '@contentful/forma-36-react-components';
import { RelativeDateTime } from '@contentful/f36-components';

import { InfoBlock } from './spacing';

export function DateLastCompleted({ lastCompleted }) {
  return <DateLast title="Last Localization" date={lastCompleted} />;
}

DateLastCompleted.propTypes = {
  lastCompleted: PropTypes.instanceOf(Date)
};

export function DateLastPublished({ lastPublished }) {
  return <DateLast title="Last Publication" date={lastPublished} />;
}

DateLastPublished.propTypes = {
  lastPublished: PropTypes.instanceOf(Date)
};

export function DateLastSent({ lastSentAt }) {
  return <DateLast title="Last Sent" date={lastSentAt} />;
}

DateLastSent.propTypes = {
  lastSentAt: PropTypes.instanceOf(Date)
};

function DateLast({ title, date }) {
  let content = <span>N/A</span>;

  if (date) {
    const localDate = date.toLocaleString();
    content = (
      <Tooltip place="top" content={localDate}>
        <RelativeDateTime date={date} />
      </Tooltip>
    );
  }

  return (
    <InfoBlock>
      <span>{title}: </span>
      {content}
    </InfoBlock>
  );
}

DateLast.propTypes = {
  title: PropTypes.string.isRequired,
  date: PropTypes.instanceOf(Date)
};
