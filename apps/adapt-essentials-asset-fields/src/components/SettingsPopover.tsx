import { Box, Flex, IconButton, Popover, Stack, Switch, TextInput } from '@contentful/f36-components';
import FocusLock from 'react-focus-lock';
import { SettingsTrimmedIcon } from '@contentful/f36-icons';
import { useState } from 'react';
import useLocales from './hooks/useLocales';
import useColumns from './hooks/useColumns';
import useLimit from './hooks/useLimit';

export const SettingsPopover = () => {
  const [showSettingsPopup, setShowSettingsPopup] = useState(false);
  const { locales, localeNames, defaultLocale, enabledLocales, changeLocaleVisibility } = useLocales();
  const { columns, columnDetails, visibleColumns, changeColumnVisibility } = useColumns();
  const { limit, setLimit } = useLimit();

  const handlePageSizeChange = (event) => {
    setLimit(Number(event.target.value));
  };

  return (
    <Popover isOpen={showSettingsPopup} onClose={() => setShowSettingsPopup(false)}>
      <Popover.Trigger>
        <IconButton
          onClick={() => setShowSettingsPopup(!showSettingsPopup)}
          variant="transparent"
          size="small"
          aria-label="Select columns to show"
          icon={<SettingsTrimmedIcon size="tiny" />}
        />
      </Popover.Trigger>
      <Popover.Content>
        <FocusLock>
          <Stack padding="spacingM" margin="none" spacing="spacingS" flexDirection="column" paddingBottom="none">
            <Box style={{ alignSelf: 'flex-start', fontWeight: '600' }}>Columns</Box>
            {columns.map((column) => {
              const { label, isVisible } = columnDetails[column];
              return (
                <Flex key={column} fullWidth>
                  <Switch
                    size="small"
                    isChecked={isVisible}
                    isDisabled={visibleColumns.length === 1 && isVisible}
                    onChange={(event) => changeColumnVisibility(column, !!event.target?.checked)}>
                    {label}
                  </Switch>
                </Flex>
              );
            })}
          </Stack>
          <Stack padding="spacingM" margin="none" spacing="spacingS" flexDirection="column">
            <Box style={{ alignSelf: 'flex-start', fontWeight: '600' }}>Locales</Box>
            {locales.map((locale) => (
              <Flex
                key={locale}
                fullWidth
                style={{
                  display: 'flex',
                  justifyContent: 'flex-start',
                }}>
                <Switch
                  size="small"
                  isChecked={enabledLocales.includes(locale)}
                  isDisabled={locale === defaultLocale}
                  onChange={(event) => changeLocaleVisibility(locale, !!event.target?.checked)}>
                  {localeNames[locale]} ({locale})
                </Switch>
              </Flex>
            ))}
          </Stack>
          <Box padding="spacingM" margin="none" flexDirection="column">
            <Box marginBottom="spacingS">Page size</Box>
            <TextInput type="number" min={5} max={100} style={{ maxWidth: 'fit-content' }} value={String(limit)} onChange={handlePageSizeChange} />
          </Box>
        </FocusLock>
      </Popover.Content>
    </Popover>
  );
};
