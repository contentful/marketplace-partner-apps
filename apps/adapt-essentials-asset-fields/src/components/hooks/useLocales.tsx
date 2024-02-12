import { useMemo } from 'react';
import { PageAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useLocalStorage } from 'use-local-storage-extended';

const useLocales = () => {
  const sdk = useSDK<PageAppSDK>();

  const [_enabledLocales, setEnabledLocales] = useLocalStorage({
    key: `enabledLocales-${sdk.ids.space}`,
    defaultValue: [sdk.locales.default],
  });
  const enabledLocales = useMemo(() => {
    const enabledLocalesParam = _enabledLocales.filter((enabledLocale) => sdk.locales.available.includes(enabledLocale)) ??
      sdk.parameters?.instance?.enabledLocales ?? [sdk.locales.default];
    if (enabledLocalesParam.length < 1) {
      setEnabledLocales([sdk.locales.default]);
    }
    if (!enabledLocalesParam.includes(sdk.locales.default)) {
      setEnabledLocales([sdk.locales.default, ...enabledLocalesParam]);
    }
    return enabledLocalesParam;
  }, [_enabledLocales, sdk.locales?.default, sdk.parameters?.instance?.enabledLocales, setEnabledLocales]);

  const changeLocaleVisibility = (locale, isVisible) => {
    if (isVisible) {
      setEnabledLocales([...enabledLocales, locale]);
    } else {
      setEnabledLocales(enabledLocales.filter((enabledLocale) => enabledLocale !== locale));
    }
  };

  return {
    localeNames: sdk.locales.names,
    defaultLocale: sdk.locales.default,
    locales: sdk.locales.available,
    enabledLocales,
    changeLocaleVisibility,
  };
};

export default useLocales;
