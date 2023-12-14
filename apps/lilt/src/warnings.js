import React from 'react';
import PropTypes from 'prop-types';
import { Note } from '@contentful/forma-36-react-components';
import { Button } from '@contentful/f36-components';

export const MultipleEntriesChangeWarning = () => {
  const bodyText = `The currently saved domains and target languages on each entry are set. 
    Click "Change" to set and save the domain or the new target languages on all
    selected entries.`;

  return <Warning title={bodyText} />;
};

export const EmptyTargetLocalesWarning = ({ isVisible }) => {
  if (!isVisible) {
    return null;
  }

  const bodyText = 'One or more target language(s) must be selected to continue';

  return <Warning title={bodyText} />;
};

EmptyTargetLocalesWarning.propTypes = {
  isVisible: PropTypes.bool.isRequired
};

export function ContentChangedWarning({ isVisible, onDismiss }) {
  if (!isVisible) {
    return null;
  }

  const bodyText = `Changes have been detected in the source text of a previously 
    localized entry, or of an entry currently in progress. 
    Please send for localization again to capture source changes in your locales.`;

  return (
    <Warning title="Warning" body={bodyText}>
      <Button size="small" onClick={onDismiss}>
        Dismiss
      </Button>
    </Warning>
  );
}

ContentChangedWarning.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  onDismiss: PropTypes.func.isRequired
};

export function SubmittedContentWarning({ isVisible, onAction }) {
  if (!isVisible) {
    return null;
  }

  const bodyText = `Looks like you’ve selected some content that has
  been submitted for translation before. Sending same content multiple 
  times can lead to unexpected outcomes, e.g. content being overwritten.`;

  return (
    <Warning title="Warning" body={bodyText}>
      <Button size="small" onClick={onAction}>
        Unselect Submitted Content
      </Button>
    </Warning>
  );
}

SubmittedContentWarning.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  onAction: PropTypes.func
};

export function Warning({ title, body, children }) {
  return (
    <Note className="warning-box" title={title} noteType="warning">
      {body && <p>{body}</p>}
      {children}
    </Note>
  );
}

Warning.propTypes = {
  title: PropTypes.string.isRequired,
  body: PropTypes.string,
  children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node])
};

export function UnsearchableTitle({ isVisible, onDismiss }) {
  if (!isVisible) {
    return null;
  }

  const bodyText = `There are some entries that are not searchable by title.
  They will not be included in the pool of entries from which you can filter.`;

  return (
    <Warning title="Warning" body={bodyText}>
      <Button size="small" onClick={onDismiss}>
        Dismiss
      </Button>
    </Warning>
  );
}

UnsearchableTitle.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  onDismiss: PropTypes.func.isRequired
};
