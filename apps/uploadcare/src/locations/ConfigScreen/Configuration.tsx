import { Checkbox, Form, FormControl, TextInput, TextLink } from '@contentful/f36-components';
import { ReactElement, useId } from 'react';
import { objectKeys } from 'ts-extras';
import { UPLOAD_SOURCES } from '../../constants';
import { InstallParams, InstallParamsValidationErrors } from '../../types';

type Props = {
  params: InstallParams;
  paramsValidationErrors: InstallParamsValidationErrors;
  onParamsChange: (params: InstallParams) => void;
};

export function Configuration({ params, paramsValidationErrors, onParamsChange }: Props): ReactElement {
  function handleApiKeyChange(value: string) {
    onParamsChange({
      ...params,
      apiKey: value.trim(),
    });
  }

  function handleMaxFilesChange(value: string) {
    onParamsChange({
      ...params,
      maxFiles: +value.trim(),
    });
  }

  function handleImgOnlyChange() {
    onParamsChange({
      ...params,
      imgOnly: !params.imgOnly,
    });
  }

  function handleUploadSourceChange(uploadSource: keyof InstallParams['uploadSources']) {
    onParamsChange({
      ...params,
      uploadSources: {
        ...params.uploadSources,
        [uploadSource]: !params.uploadSources[uploadSource],
      },
    });
  }

  function handleCustomCnameChange(value: string) {
    onParamsChange({
      ...params,
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
          value={params.apiKey}
          onChange={e => handleApiKeyChange(e.target.value)}
          isInvalid={!!paramsValidationErrors.apiKey}
        />

        {!!paramsValidationErrors.apiKey && (
          <FormControl.ValidationMessage>{paramsValidationErrors.apiKey}</FormControl.ValidationMessage>
        )}

        <FormControl.HelpText>
          The Uploadcare public API key that can be found in your Uploadcare dashboard.
        </FormControl.HelpText>
      </FormControl>

      <FormControl>
        <Checkbox name={useId()} isChecked={params.imgOnly} onChange={handleImgOnlyChange}>
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
          value={params.maxFiles.toString()}
          isInvalid={!!paramsValidationErrors.maxFiles}
          onChange={e => handleMaxFilesChange(e.target.value)}
        />

        {!!paramsValidationErrors.maxFiles && (
          <FormControl.ValidationMessage>{paramsValidationErrors.maxFiles}</FormControl.ValidationMessage>
        )}

        <FormControl.HelpText>
          The max number of files that can be added to a single field. 0 means no limit.
        </FormControl.HelpText>
      </FormControl>

      <FormControl as="fieldset" isInvalid={!!paramsValidationErrors.uploadSources}>
        <FormControl.Label as="legend">Upload sources</FormControl.Label>

        <Checkbox.Group
          name="upload-sources"
          value={objectKeys(params.uploadSources).filter(k => params.uploadSources[k])}
          onChange={e => handleUploadSourceChange(e.target.value as keyof InstallParams['uploadSources'])}
        >
          {UPLOAD_SOURCES.map(({ value, title }) => (
            <Checkbox key={value} value={value}>
              {title}
            </Checkbox>
          ))}
        </Checkbox.Group>

        {!!paramsValidationErrors.uploadSources && (
          <FormControl.ValidationMessage>{paramsValidationErrors.uploadSources}</FormControl.ValidationMessage>
        )}
      </FormControl>

      <FormControl>
        <FormControl.Label>Custom CNAME</FormControl.Label>

        <TextInput
          name={useId()}
          width="large"
          type="text"
          maxLength={255}
          value={params.customCname}
          isInvalid={!!paramsValidationErrors.customCname}
          onChange={e => handleCustomCnameChange(e.target.value)}
        />

        {!!paramsValidationErrors.customCname && (
          <FormControl.ValidationMessage>{paramsValidationErrors.customCname}</FormControl.ValidationMessage>
        )}

        <FormControl.HelpText>
          Your own domain for CDN links to your files stored with Uploadcare. Set it here if you have one, or leave it
          empty if you do not. See{' '}
          <TextLink
            href="https://uploadcare.com/docs/delivery/cdn/#custom-cdn-cname"
            target="_blank"
            rel="noopener noreferrer"
          >
            docs
          </TextLink>{' '}
          for details.
        </FormControl.HelpText>
      </FormControl>
    </Form>
  );
}
