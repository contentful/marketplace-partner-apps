import React from 'react';

import { SidebarAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';

import { FormControl, Grid, Note } from '@contentful/f36-components';
import { Multiselect } from '@contentful/f36-multiselect';

import { Locale } from '../interfaces';

interface Props {
  localesValue: string[];
  initialLocales: string[];
  hideTip: boolean;
  onInput: (data: string[]) => void;
}

function LocalesMultiselect({ onInput, localesValue, initialLocales, hideTip } : Props) {
  const sdk = useSDK<SidebarAppSDK>();
  
  const [selected, setSelected] = React.useState<string[]>(localesValue);
  const [localeWarning, setLocaleWarning] = React.useState<boolean>(false);
  const [hide] = React.useState<boolean>(hideTip ?? false);

  const locales = React.useMemo(() => {
    const localesState: Locale[] = [];
    Object.keys(sdk.locales.names).forEach(code => {
      if (sdk.locales.default !== code) {
        localesState.push({
          code: code.replaceAll("-", "_").toLowerCase(),
          title: sdk.locales.names[code]
        })
      }
    });

    const localesFromClient: Locale[] = [];
    initialLocales.forEach(code => {
      localesFromClient.push({
        code: code,
        title: code
      })
    });

    const finalLocales: Locale[] = [...localesState];
    
    for (const loc of localesFromClient) {
      if (!finalLocales.find(l => l.code === loc.code)) {
        finalLocales.push(loc);
        setLocaleWarning(true);
      }
    }

    setSelected(localesValue)
    return finalLocales;
  }, [sdk, setSelected, setLocaleWarning, localesValue, initialLocales]);

  React.useEffect(() => {
    onInput(selected);
  }, [selected, onInput]); 
  
  const handleSelectItem = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { checked, value } = event.target;
    if (checked) {
      setSelected((prevState) => [...prevState, value]);
    } else {
      setSelected((prevState) =>
      prevState.filter((loc) => loc !== value),
      );
    }
  };

  const toggleAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { checked } = event.target;
    if (checked) {
      setSelected(locales.map(v => v.code));
    } else {
      setSelected([]);
    }
  };

  const areAllSelected = React.useMemo(() => {
    return locales.every((element) => selected.includes(element.code));
  }, [selected, locales]);

  return (
    <Grid>
      <FormControl style={{marginBottom: "0"}}>
        <FormControl.Label isRequired>Target Locales</FormControl.Label>
        <Multiselect
          key="multiselect-locales"
          currentSelection={selected}
          popoverProps={{ isFullWidth: true }}
        >
          <Multiselect.SelectAll
            itemId="multiselect-locales"
            onSelectItem={toggleAll}
            isChecked={areAllSelected}
          />
          {locales.map((locale, index) => {
            const val = locale.code
            const checked = selected.includes(locale.code)
            return (
              <Multiselect.Option
                key={`code-${val}-${index}`}
                itemId={`locale-${val}-${index}`}
                value={locale.code}
                label={locale.title}
                onSelectItem={handleSelectItem}
                isChecked={checked}
              />
            );
          })}
        </Multiselect>
        { !hide && (
          <Grid>
            <FormControl.HelpText>
              Please select at least one locale to create project on Bureau Works.
            </FormControl.HelpText>
            <FormControl.Counter />
          </Grid>)
        }
      </FormControl>

      {localeWarning && (
        <Note style={{marginTop: "10px"}} variant="warning">Some target locales from Bureau Works are not configured within your Contentful space.</Note>
      )}
      <br></br>
    </Grid>
  );
}

export default LocalesMultiselect;