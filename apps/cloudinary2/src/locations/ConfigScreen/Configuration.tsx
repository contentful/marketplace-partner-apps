import { Form, FormControl, Select, Option, TextLink, Flex, TextInput, TextInputProps } from '@contentful/f36-components';
import { PropsWithChildren, ReactNode, useCallback, useId } from 'react';
import { AppInstallationParameters } from '../../types';
import { DEFAULT_APP_INSTALLATION_PARAMETERS } from '../../constants';

const MAX_FILES_UPPER_LIMIT = 1000;

interface Props {
  parameters: AppInstallationParameters;
  onParametersChange: (parameters: AppInstallationParameters) => void;
}

export function Configuration({ parameters, onParametersChange }: Props) {
  const onParameterChange = useCallback(
    <Key extends keyof AppInstallationParameters>(key: Key, value: AppInstallationParameters[Key]) => {
      const newParameters = {
        ...parameters,
        [key]: value,
      };
      onParametersChange(newParameters);
    },
    [parameters, onParametersChange]
  );

  return (
    <Form>
      <TextField
        name="Cloud name"
        description="The Cloudinary cloud name that the app will connect to."
        value={parameters.cloudName}
        onChange={(value) => onParameterChange('cloudName', value)}
        isRequired
        type="text"
      />
      <TextField
        name="API key"
        description="The Cloudinary API Key that can be found in your Cloudinary console."
        value={parameters.apiKey}
        onChange={(value) => onParameterChange('apiKey', value)}
        isRequired
        type="text"
      />
      <TextField
        name="Max number of files"
        description={`The max number of files that can be added to a single field. Must be between 1 and ${MAX_FILES_UPPER_LIMIT}`}
        value={String(parameters.maxFiles)}
        onChange={(value) =>
          isNaN(parseInt(value, 10))
            ? onParameterChange('maxFiles', DEFAULT_APP_INSTALLATION_PARAMETERS.maxFiles)
            : onParameterChange('maxFiles', parseInt(value, 10))
        }
        isRequired
        type="number"
        inputProps={{ min: 1, max: MAX_FILES_UPPER_LIMIT }}
      />
      <TextField
        name="Starting folder"
        description="A path to a folder which the Cloudinary Media Library will automatically browse to on load."
        value={parameters.startFolder}
        onChange={(value) => onParameterChange('startFolder', value)}
        isRequired
        type="text"
      />
      <SelectField
        name="Media Quality"
        description="The quality level of your assets. This can be a fixed number ranging from 1-100, or you can get Cloudinary to decide the most optimized level by setting it to 'auto'. More options are available such as: auto:low/auto:eco/auto:good/auto:best. If you wish to use the original level, set it to 'none'."
        isRequired
        options={['auto', 'none', 'auto:low', 'auto:eco', 'auto:good', 'auto:best', '10', '20', '30', '40', '50', '60', '70', '80', '90', '100']}
        value={parameters.quality}
        onChange={(value) => onParameterChange('quality', value)}
      />
      <SelectField
        name="Format"
        description={
          <>
            The format of the assets. This can be set manually to a specific format - &lsquo;jpg&rsquo; as an example (all supported formats can be found{' '}
            <TextLink href="https://cloudinary.com/documentation/image_transformations#supported_image_formats" target="_blank" rel="noopener noreferrer">
              here
            </TextLink>
            ). By setting it to &lsquo;auto&rsquo;, Cloudinary will decide on the most optimized format for your users. If you wish to keep the original format,
            set it to &lsquo;none&rsquo;.
          </>
        }
        isRequired
        options={[
          'auto',
          'none',
          'gif',
          'webp',
          'bmp',
          'flif',
          'heif',
          'heic',
          'ico',
          'jpg',
          'jpe',
          'jpeg',
          'jp2',
          'wdp',
          'jxr',
          'hdp',
          'png',
          'psd',
          'arw',
          'cr2',
          'svg',
          'tga',
          'tif',
          'tiff',
        ]}
        value={parameters.format}
        onChange={(value) => onParameterChange('format', value)}
      />
    </Form>
  );
}

interface TextFieldProps {
  name: string;
  description: ReactNode;

  value: string;
  onChange: (value: string) => void;

  isRequired?: boolean;
  type: 'text' | 'number';

  inputProps?: Pick<TextInputProps, 'max' | 'min'>;
}

function TextField({ name, description, value, onChange, isRequired = false, type, inputProps }: TextFieldProps) {
  return (
    <FieldWrapper name={name} description={description} counter>
      <TextInput
        name={useId()}
        width={type === 'text' ? 'large' : 'medium'}
        type={type}
        maxLength={255}
        isRequired={isRequired}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        {...inputProps}
      />
    </FieldWrapper>
  );
}

interface SelectFieldProps {
  name: string;
  description: ReactNode;

  value: string;
  onChange: (value: string) => void;

  isRequired: boolean;
  options: string[];
}

function SelectField({ name, description, value, onChange, isRequired, options }: SelectFieldProps) {
  return (
    <FieldWrapper name={name} description={description}>
      <Select name={useId()} isRequired={isRequired} onChange={(e) => onChange(e.target.value)} value={value}>
        {options.map((currValue: string) => (
          <Option value={currValue} key={currValue}>
            {currValue}
          </Option>
        ))}
      </Select>
    </FieldWrapper>
  );
}

interface FieldWrapperProps {
  name: string;
  description: ReactNode;
  counter?: boolean;
}

function FieldWrapper({ name, description, counter = false, children }: PropsWithChildren<FieldWrapperProps>) {
  return (
    <FormControl id={useId()}>
      <FormControl.Label>{name}</FormControl.Label>
      {children}

      <Flex justifyContent="space-between">
        <FormControl.HelpText>{description}</FormControl.HelpText>
        {counter && <FormControl.Counter />}
      </Flex>
    </FormControl>
  );
}
