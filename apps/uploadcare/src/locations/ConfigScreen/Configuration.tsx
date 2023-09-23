import { Checkbox, Form, FormControl, TextInput, TextLink } from '@contentful/f36-components';
import { ReactElement, useId } from 'react';
import { objectKeys } from 'ts-extras';
import { UPLOAD_SOURCES } from '../../constants';
import { AppInstallationParameters } from '../../types';
import { AppInstallationParametersValidationErrors } from './fields';

type Props = {
  parameters: AppInstallationParameters;
  parametersValidationErrors: AppInstallationParametersValidationErrors;
  onParametersChange: (params: AppInstallationParameters) => void;
};

export function Configuration({ parameters, parametersValidationErrors, onParametersChange }: Props): ReactElement {
  function handleApiKeyChange(value: string) {
    onParametersChange({
      ...parameters,
      apiKey: value.trim(),
    });
  }

  function handleMaxFilesChange(value: string) {
    onParametersChange({
      ...parameters,
      maxFiles: +value.trim(),
    });
  }

  function handleImgOnlyChange() {
    onParametersChange({
      ...parameters,
      imgOnly: !parameters.imgOnly,
    });
  }

  function handleUploadSourceChange(uploadSource: keyof AppInstallationParameters['uploadSources']) {
    onParametersChange({
      ...parameters,
      uploadSources: {
        ...parameters.uploadSources,
        [uploadSource]: !parameters.uploadSources[uploadSource],
      },
    });
  }

  function handleCustomCnameChange(value: string) {
    onParametersChange({
      ...parameters,
      customCname: value.trim(),
    });
  }

  return (
    <Form>
      <FormControl>
        <FormControl.Label>Public API key</FormControl.Label>

        <TextInput
          name={useId()}
          width="large"
          type="text"
          maxLength={255}
          value={parameters.apiKey}
          onChange={e => handleApiKeyChange(e.target.value)}
          isInvalid={!!parametersValidationErrors.apiKey}
        />

        {!!parametersValidationErrors.apiKey && (
          <FormControl.ValidationMessage>{parametersValidationErrors.apiKey}</FormControl.ValidationMessage>
        )}

        <FormControl.HelpText>
          The Uploadcare public API key that can be found in your Uploadcare dashboard.
        </FormControl.HelpText>
      </FormControl>

      <FormControl>
        <Checkbox
          name={useId()}
          isChecked={parameters.imgOnly}
          onChange={handleImgOnlyChange}
        >
          Allow to upload images only
        </Checkbox>

        <FormControl.HelpText>
          If checked then editors won't be able to upload anything but images.
        </FormControl.HelpText>
      </FormControl>

      <FormControl>
        <FormControl.Label>Max number of files</FormControl.Label>

        <TextInput
          name={useId()}
          width="large"
          type="number"
          maxLength={255}
          value={parameters.maxFiles.toString()}
          isInvalid={!!parametersValidationErrors.maxFiles}
          onChange={e => handleMaxFilesChange(e.target.value)}
        />

        {!!parametersValidationErrors.maxFiles && (
          <FormControl.ValidationMessage>{parametersValidationErrors.maxFiles}</FormControl.ValidationMessage>
        )}

        <FormControl.HelpText>
          The max number of files that can be added to a single field. 0 means no limit.
        </FormControl.HelpText>
      </FormControl>

      <FormControl as="fieldset" isInvalid={!!parametersValidationErrors.uploadSources}>
        <FormControl.Label as="legend">Upload sources</FormControl.Label>

        <Checkbox.Group
          name="upload-sources"
          value={objectKeys(parameters.uploadSources).filter(k => parameters.uploadSources[k])}
          onChange={e => handleUploadSourceChange(e.target.value as keyof AppInstallationParameters['uploadSources'])}
        >
          {UPLOAD_SOURCES.map(({ value, title }) => (
            <Checkbox key={value} value={value}>
              {title}
            </Checkbox>
          ))}
        </Checkbox.Group>

        {!!parametersValidationErrors.uploadSources && (
          <FormControl.ValidationMessage>{parametersValidationErrors.uploadSources}</FormControl.ValidationMessage>
        )}
      </FormControl>

      <FormControl>
        <FormControl.Label>Custom CNAME</FormControl.Label>

        <TextInput
          name={useId()}
          width="large"
          type="text"
          maxLength={255}
          value={parameters.customCname}
          isInvalid={!!parametersValidationErrors.customCname}
          onChange={e => handleCustomCnameChange(e.target.value)}
        />

        {!!parametersValidationErrors.customCname && (
          <FormControl.ValidationMessage>{parametersValidationErrors.customCname}</FormControl.ValidationMessage>
        )}

        <FormControl.HelpText>
          Your own domain for CDN links to your files stored with Uploadcare.
          Set it here if you have one, or leave it empty if you do not.
          See
          {' '}
          <TextLink
            href="https://uploadcare.com/docs/delivery/cdn/#custom-cdn-cname"
            target="_blank"
            rel="noopener noreferrer"
          >
            docs
          </TextLink>
          {' '}
          for details.
        </FormControl.HelpText>
      </FormControl>
    </Form>
  );
}
