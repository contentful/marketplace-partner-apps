import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Heading, Stack, IconButton } from '@contentful/f36-components';
import { CloseTrimmedIcon } from '@contentful/f36-icons';

import LanguageSelector from './language-selector';
import { NestedEntries } from './nested-entries';

/**
 * @typedef {object} Props
 * @prop {import('contentful-ui-extensions-sdk').KnownSDK} sdk
 * @extends {React.Component<Props>}
 */
class SubmissionDialog extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  handleClose = () => {
    this.props.sdk.close();
  };

  render() {
    const { sdk, isMultiple, entryId } = this.props;
    const header = `Send ${isMultiple ? 'Multiple Entries ' : ''}for Localization`;

    return (
      <Stack flexDirection="column" alignItems="flex-start" padding="spacingL">
        <Stack justifyContent="space-between" fullWidth>
          <Heading margin="none">{header}</Heading>
          <IconButton
            onClick={this.handleClose}
            variant="transparent"
            label="Close"
            icon={<CloseTrimmedIcon />}
          />
        </Stack>
        <NestedEntries sdk={sdk} entryId={entryId} />
        <LanguageSelector sdk={sdk} isMultiple={isMultiple} />
      </Stack>
    );
  }
}

SubmissionDialog.propTypes = {
  sdk: PropTypes.object.isRequired,
  isMultiple: PropTypes.bool,
  entryId: PropTypes.string.isRequired
};

export default SubmissionDialog;
