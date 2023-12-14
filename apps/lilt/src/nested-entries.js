import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Subheading, Note } from '@contentful/forma-36-react-components';

import CMClient from './contentful-management-client';

function NestedEntry({ entry, sdk }) {
  const [displayField, setDisplayField] = useState();
  const defaultLocale = sdk.locales.default;

  useEffect(() => {
    (async () => {
      const contentTypeId = entry.sys.contentType.sys.id;
      const { displayField } = await sdk.space.getContentType(contentTypeId);
      setDisplayField(displayField);
    })();
  }, [entry.sys.contentType.sys.id, sdk.space]);

  if (!displayField) {
    return null;
  }

  const entryTitle = entry.fields?.[displayField]?.[defaultLocale] || 'Untitled';

  return <li>{entryTitle}</li>;
}

NestedEntry.propTypes = {
  sdk: PropTypes.object.isRequired,
  entry: PropTypes.object.isRequired
};

export function NestedEntries({ sdk, entryId }) {
  const [nestedEntries, setNestedEntries] = useState([]);
  const readyStatuses = ['', 'Needs Localization', 'Ready to Start'];
  const defaultLocale = sdk.locales.default;

  useEffect(() => {
    (async () => {
      const cmClient = new CMClient(sdk);
      const { includes } = await cmClient.getEntryReferences(entryId);
      if (!includes) return;

      const entryPromises = includes.Entry.map(async entry => {
        const contentTypeId = entry.sys.contentType.sys.id;
        const contentType = await sdk.space.getContentType(contentTypeId);
        entry.contentType = contentType;
        return entry;
      });
      const entries = await Promise.all(entryPromises);
      const filteredEntries = entries.filter(entry => {
        const shouldBeLocalized = entry.contentType.fields.some(field => field.localized);
        const hasLiltStatus = typeof entry.fields['lilt_status'] !== 'undefined';
        const hasLiltMetadata = typeof entry.fields['lilt_metadata'] !== 'undefined';
        if (shouldBeLocalized && hasLiltMetadata && !hasLiltStatus) {
          return true;
        }
        const liltStatus = entry.fields['lilt_status']?.[defaultLocale] || '';
        return shouldBeLocalized && readyStatuses.includes(liltStatus);
      });
      setNestedEntries(filteredEntries);
    })();
  }, []); // eslint-disable-line

  if (nestedEntries.length === 0) {
    return null;
  }

  return (
    <div>
      <Note className="warning-box" noteType="warning">
        The content you’re sending for localization has references that will also be localized. If
        you don’t want that, please remove the references before submitting the content.
      </Note>
      <Subheading>Nested references found:</Subheading>
      <ul>
        {nestedEntries.map(entry => (
          <NestedEntry key={entry.sys.id} entry={entry} sdk={sdk} />
        ))}
      </ul>
    </div>
  );
}

NestedEntries.propTypes = {
  sdk: PropTypes.object.isRequired,
  entryId: PropTypes.string.isRequired
};
