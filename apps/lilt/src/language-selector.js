import React from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  Grid,
  Checkbox,
  Subheading,
  Stack,
  TextLink,
  Radio,
  TextInput
} from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';

import { EmptyTargetLocalesWarning, MultipleEntriesChangeWarning } from './warnings';
import SearchBar from './search-bar';

/**
 * @typedef {object} Props
 * @prop {import('contentful-ui-extensions-sdk').KnownSDK} sdk
 * @prop {boolean} isMultiple
 * @extends {React.Component<Props>}
 */
class LanguageSelector extends React.Component {
  constructor(props) {
    super(props);

    const { selected, selectable, useInstant, domain } = this.props.sdk.parameters.invocation;
    const { isMultiple } = props;
    this.state = {
      all: selectable,
      selectable,
      selected,
      useInstant,
      overridingDomain: false,
      overridingTargetLanguages: false,
      // init as undefined if the dialog was opened from multiple entry management
      // so that the currently set domain on selected entries remains as the fallback.
      domain: isMultiple ? undefined : domain
    };
  }

  handleDomainChange = event => {
    const domain = event.currentTarget.value;
    this.setState({ domain });
  };

  handleTargetLanguagesChange = locale => {
    this.setState(({ selected: prevSelected }) => {
      const exists = prevSelected.includes(locale);
      const selected = exists
        ? prevSelected.filter(sL => sL !== locale)
        : prevSelected.concat(locale);
      return { selected };
    });
  };

  handleSelectAll = () => {
    this.setState(({ all }) => {
      const selected = all.map(({ locale }) => locale);
      return { selected };
    });
  };

  handleDeselectAll = () => {
    this.setState({ selected: [] });
  };

  handleSearch = searchQuery => {
    this.setState(({ all }) => {
      const selectable = searchQuery
        ? all.filter(item => this.filterSelectableLocales(item, searchQuery))
        : all;
      return { selectable };
    });
  };

  handleSubmit = () => {
    const { selected, useInstant, domain } = this.state;
    const configuration = {
      targetLocales: selected,
      useInstant,
      domain
    };
    this.props.sdk.close(configuration);
  };

  handleCancel = () => {
    this.props.sdk.close();
  };

  handleClearSearch = () => {
    this.setState(({ all }) => {
      return { selectable: all };
    });
  };

  overrideDomain = () => {
    const { domain } = this.props.sdk.parameters.invocation;
    this.setState({ overridingDomain: true, domain });
  };

  overrideTargetLanguages = () => {
    this.setState({ overridingTargetLanguages: true });
  };

  render() {
    const { isMultiple } = this.props;
    const { overridingDomain, overridingTargetLanguages, selected } = this.state;
    const showOverrideDomainBtn = !overridingDomain && isMultiple;
    const showOverrideTargetLanguagesBtn = !overridingTargetLanguages && isMultiple;
    const unallowedToSubmit = !isMultiple && !selected?.length;

    return (
      <>
        {this.renderTranslationTypeInput()}
        {this.renderDomainInput()}
        {this.renderTargetLanguageInput()}
        {(showOverrideDomainBtn || showOverrideTargetLanguagesBtn) && (
          <MultipleEntriesChangeWarning />
        )}
        <Stack justifyContent="center" fullWidth>
          <Button onClick={this.handleCancel}>Cancel</Button>
          <Button isDisabled={unallowedToSubmit} variant="positive" onClick={this.handleSubmit}>
            Submit
          </Button>
        </Stack>
      </>
    );
  }

  filterSelectableLocales = ({ locale, name }, value) => {
    const lowerCaseLocale = locale.toLowerCase();
    const lowerCaseName = name.toLowerCase();
    const lowerCaseValue = value.toLowerCase();
    return lowerCaseLocale.includes(lowerCaseValue) || lowerCaseName.includes(lowerCaseValue);
  };

  setVerified = () => {
    this.setState({ useInstant: false });
  };

  setInstant = () => {
    this.setState({ useInstant: true });
  };

  renderTranslationTypeInput = () => {
    const { useInstant } = this.state;
    const { showTranslationTypeUI } = this.props.sdk.parameters.installation;

    if (!showTranslationTypeUI) {
      return null;
    }

    return (
      <Stack flexDirection="column" alignItems="flex-start" fullWidth>
        <Subheading className="no-margin">Translation Type</Subheading>
        <Stack flexDirection="row" alignItems="flex-start" fullWidth>
          <Radio
            id="use-verified"
            name="use-verified"
            onChange={() => {
              this.setVerified();
            }}
            isChecked={!useInstant}>
            Verified Translation
          </Radio>
          <Radio
            id="use-instant"
            name="use-instant"
            onChange={() => {
              this.setInstant();
            }}
            isChecked={useInstant}>
            Instant Translation
          </Radio>
        </Stack>
      </Stack>
    );
  };

  renderDomainInput = () => {
    const { domain, overridingDomain } = this.state;
    const { isMultiple } = this.props;
    const showOverrideDomainBtn = !overridingDomain && isMultiple;
    const direction = showOverrideDomainBtn ? 'row' : 'column';

    return (
      <>
        <Stack
          flexDirection={direction}
          justifyContent="space-between"
          alignItems="flex-start"
          fullWidth>
          <Subheading className="no-margin">Domain (optional)</Subheading>
          {showOverrideDomainBtn ? (
            <Button variant="negative" onClick={this.overrideDomain}>
              Change
            </Button>
          ) : (
            <TextInput
              value={domain}
              onChange={this.handleDomainChange}
              type="text"
              placeholder="Enter a memory domain"
            />
          )}
        </Stack>
      </>
    );
  };

  renderTargetLanguageInput = () => {
    const { isMultiple } = this.props;
    const { overridingTargetLanguages, selected } = this.state;
    const showOverrideTargetLanguagesBtn = !overridingTargetLanguages && isMultiple;
    const title = showOverrideTargetLanguagesBtn
      ? 'Target Languages'
      : `Target Languages (${selected?.length})`;
    const isWarningVisible = !isMultiple && !selected?.length;

    return (
      <>
        <Stack justifyContent="space-between" fullWidth>
          <Subheading className="no-margin">{title}</Subheading>
          {showOverrideTargetLanguagesBtn ? (
            <Button variant="negative" onClick={this.overrideTargetLanguages}>
              Change
            </Button>
          ) : (
            <div>
              <TextLink
                style={{ marginInlineEnd: tokens.spacingS }}
                className="underline-text"
                variant="muted"
                as="button"
                onClick={this.handleSelectAll}>
                Select All
              </TextLink>
              <TextLink
                className="underline-text"
                variant="muted"
                as="button"
                onClick={this.handleDeselectAll}>
                Deselect All
              </TextLink>
            </div>
          )}
        </Stack>
        {!showOverrideTargetLanguagesBtn && (
          <Stack flexDirection="column" fullWidth>
            <SearchBar
              onChange={this.handleSearch}
              onClear={this.handleClearSearch}
              placeholder="Enter language name or locale"
            />
            <Grid
              style={{ width: '100%', maxHeight: 300, overflow: 'auto' }}
              columns="1fr 1fr"
              rowGap="spacingM"
              columnGap="spacingM">
              {this.state.selectable.map(({ locale, name }) => {
                const text = `${name} (${locale})`;
                const isSelected = this.state.selected.includes(locale);
                return (
                  <Grid.Item key={locale}>
                    <Checkbox
                      id={locale}
                      onChange={() => this.handleTargetLanguagesChange(locale)}
                      isChecked={isSelected}>
                      {text}
                    </Checkbox>
                  </Grid.Item>
                );
              })}
            </Grid>
            <EmptyTargetLocalesWarning isVisible={isWarningVisible} />
          </Stack>
        )}
      </>
    );
  };
}

LanguageSelector.propTypes = {
  sdk: PropTypes.object.isRequired,
  isMultiple: PropTypes.bool
};

export default LanguageSelector;
