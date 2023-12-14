import React from 'react';
import PropTypes from 'prop-types';
import { Form, FieldGroup } from '@contentful/forma-36-react-components';
import { Dropdown, DropdownList, DropdownListItem } from '@contentful/forma-36-react-components';
import { Button } from '@contentful/f36-components';
import { ChevronDownIcon } from '@contentful/f36-icons';

import { ConfigName, ContentTypeFields, LocaleFields } from './config-form';
import { NEW_CONFIG_FORM_ID } from './constants';

export class ConfigEditor extends React.Component {
  render() {
    const {
      sdk,
      isDropdownOpen,
      connectors,
      memories,
      contentTypes,
      isActive,
      formItem,
      onDropdownClick,
      onSelect,
      onSubmit,
      onDelete
    } = this.props;
    const { args } = formItem;
    const formId = formItem.id || NEW_CONFIG_FORM_ID;

    let formClass = 'config-form';
    if (!isActive) {
      formClass = `${formClass} hidden`;
    }

    let buttonText = 'Choose or Create a Configuration';
    if (args && args.project_prefix) {
      buttonText = args.project_prefix;
    }

    const configButton = (
      <Button size="small" onClick={onDropdownClick} endIcon={<ChevronDownIcon />}>
        {buttonText}
      </Button>
    );

    const connectorItems = connectors.map(item => (
      <DropdownListItem key={item.id} onClick={() => onSelect(item)}>
        {item.args.project_prefix || ''}
      </DropdownListItem>
    ));

    return (
      <section>
        <div className="config-editor-header">
          <Dropdown isOpen={isDropdownOpen} toggleElement={configButton}>
            <DropdownList>
              <DropdownListItem onClick={() => onSelect()}>New Configuration...</DropdownListItem>
              {connectorItems}
            </DropdownList>
          </Dropdown>
          {isActive && (
            <Button onClick={onSubmit} variant="positive" className="save">
              Save Configuration
            </Button>
          )}
        </div>
        <Form id={formId} className={formClass} onSubmit={onSubmit}>
          <ConfigName args={args} />
          <ContentTypeFields contentTypes={contentTypes} args={args} />
          <LocaleFields args={args} memories={memories} sdk={sdk} />
          <FieldGroup row={true}>
            <Button variant="negative" onClick={() => onDelete(formItem.id)}>
              Delete Configuration
            </Button>
          </FieldGroup>
        </Form>
      </section>
    );
  }
}

ConfigEditor.propTypes = {
  sdk: PropTypes.object,
  isDropdownOpen: PropTypes.bool,
  isActive: PropTypes.bool,
  formItem: PropTypes.object,
  connectors: PropTypes.array,
  memories: PropTypes.array,
  contentTypes: PropTypes.array,
  onDropdownClick: PropTypes.func,
  onSelect: PropTypes.func,
  onSubmit: PropTypes.func,
  onDelete: PropTypes.func
};
