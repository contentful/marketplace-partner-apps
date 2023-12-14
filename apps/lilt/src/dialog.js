import React from 'react';
import PropTypes from 'prop-types';

import SubmissionDialog from './submission-dialog';
import EntriesDialog from './entries-dialog';
import EMCDialog from './emc-dialog';
import { DIALOG_TYPES } from './constants';

/**
 * @typedef {object} Props
 * @prop {import('contentful-ui-extensions-sdk').KnownSDK} sdk
 * @extends {React.Component<Props>}
 */
export class DialogExtension extends React.Component {
  constructor(props) {
    super(props);

    const { type, entryId } = this.props.sdk.parameters.invocation;

    this.state = { type, entryId };
  }

  render() {
    const { sdk } = this.props;
    const { entryId } = this.state;

    switch (this.state.type) {
      case DIALOG_TYPES.ENTRY_SELECTOR:
        return <EntriesDialog sdk={sdk} />;
      case DIALOG_TYPES.SEND_MULTIPLE_FOR_LOCALIZATION:
        return <SubmissionDialog sdk={sdk} isMultiple entryId={entryId} />;
      case DIALOG_TYPES.LILT_CREATE:
        return <EMCDialog sdk={sdk} activeComponent="liltCreate" entryId={entryId} />;
      default:
        return <SubmissionDialog sdk={sdk} entryId={entryId} />;
    }
  }
}

DialogExtension.propTypes = {
  sdk: PropTypes.object.isRequired
};
