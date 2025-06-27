import { useDebounce } from '@uidotdev/usehooks';
import { useState, useEffect } from 'react';
import { useSDK, useCMA } from '@contentful/react-apps-toolkit';
import { PageAppSDK } from '@contentful/app-sdk';
import { TextInput, Textarea, FormControl, Caption } from '@contentful/f36-components';
import { AssetProps } from 'contentful-management/dist/typings/entities/asset';
import { extractContentfulFieldError } from './utils/entries.ts';
import useLocales from './hooks/useLocales.tsx';
import useAssetEntries from './hooks/useAssetEntries.tsx';
import styles from './styles.module.css';

interface AssetInputFieldTextComponentProps {
  asset: AssetProps;
  field: string;
  locale: string;
  rows?: number;
  as?: 'TextInput' | 'Textarea';
  showLocaleLabel?: boolean;
  isDisabled?: boolean;
}

const AssetInputFieldTextComponent = ({
  asset,
  field,
  locale,
  as = 'TextInput',
  rows = 1,
  showLocaleLabel = false,
  isDisabled = false,
}: AssetInputFieldTextComponentProps) => {
  const fieldValueProp = asset.fields[field]?.[locale] ?? asset.fields.file?.[locale]?.[field] ?? '';
  const assetId = asset.sys.id;
  const { updateAssetEntry } = useAssetEntries();
  const [newFieldValue, setNewFieldValue] = useState(fieldValueProp);
  const [error, setError] = useState<string | null>(null);
  const debouncedFieldValue = useDebounce(newFieldValue, 300);
  const cma = useCMA();
  useEffect(() => {
    if (fieldValueProp !== debouncedFieldValue) {
      setNewFieldValue(fieldValueProp);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fieldValueProp]);

  useEffect(() => {
    if (fieldValueProp === debouncedFieldValue) {
      return;
    }

    async function update() {
      const fileNameEntry = {
        ...asset,
        fields: {
          ...asset.fields,
          file: {
            [locale]: {
              ...asset.fields.file[locale],
              [field]: newFieldValue,
            },
          },
        },
      };
      const fieldEntry = {
        ...asset,
        fields: {
          ...asset.fields,
          [field]: {
            ...asset.fields[field],
            [locale]: newFieldValue,
          },
        },
      };
      const rawData = field === 'fileName' ? fileNameEntry : fieldEntry;
      try {
        setError(null);
        const result = await cma.asset.update({ assetId }, rawData);
        updateAssetEntry(result);
      } catch (error) {
        if (error.code === 'VersionMismatch') {
          const updatedAsset = await cma.asset.get({ assetId });
          updateAssetEntry(updatedAsset);
          setError('Still updating. Try again in a few seconds.');
          return;
        }

        setError(extractContentfulFieldError(error));
      }
    }
    update();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedFieldValue]);

  const { localeNames } = useLocales();
  const isTextarea = as === 'Textarea';
  const InputComponent = isTextarea ? Textarea : TextInput;
  const inputChangeHandler = (event) => {
    setNewFieldValue(event.target.value);
  };

  return (
    <>
      {showLocaleLabel && <Caption>{localeNames[locale]}</Caption>}
      <InputComponent
        key={`${assetId}-${locale}`}
        value={newFieldValue}
        onChange={inputChangeHandler}
        rows={rows}
        isDisabled={isDisabled}
        className={isTextarea ? styles.textarea : styles.textInput}
      />
      {error && <FormControl.ValidationMessage>{error}</FormControl.ValidationMessage>}
    </>
  );
};

type AssetFieldTextProps = Omit<AssetInputFieldTextComponentProps, 'locale'> & {
  locales?: string[];
};

export const AssetInputFieldText = ({ asset, field, locales: localesProp, ...rest }: AssetFieldTextProps) => {
  const sdk = useSDK<PageAppSDK>();
  const locales = localesProp ?? [sdk.locales.default];
  return locales.map((locale) => {
    return (
      <FormControl key={`${asset.sys.id}-${locale}`} marginBottom="none">
        <AssetInputFieldTextComponent field={field} asset={asset} {...rest} locale={locale} showLocaleLabel={locales.length > 1} />
      </FormControl>
    );
  });
};
