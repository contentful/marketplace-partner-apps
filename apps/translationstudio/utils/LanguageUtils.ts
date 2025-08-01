import { ConnectorMap } from '@/components/Types';
import { LanguageMapping } from 'interfaces/translationstudio';

export function getAvailableLanguages(available: string[], sDefault: string) {
  if (available.includes(sDefault)) return [...available];
  else return [...available, sDefault];
}

export function buildValidLanguageMap(input: ConnectorMap, languages: string[]) {
  if (languages.length === 0) return {};

  const result: ConnectorMap = {};
  for (const id in input) {
    const elem = input[id];

    if (!languages.includes(elem.source)) {
      console.warn('Invalid source language found: ' + elem.source);
      continue;
    }

    const temp: LanguageMapping = {
      connector: elem.connector,
      id: elem.id,
      'limit-to-cms-projects': elem['limit-to-cms-projects'],
      machine: elem.machine,
      name: elem.name,
      quota: elem.quota,
      source: elem.source,
      targets: [],
    };

    let hasInvalid = false;
    for (const lang of elem.targets) {
      if (!languages.includes(lang)) {
        hasInvalid = true;
        console.warn('Invalid target language found: ' + lang);
        continue;
      }

      temp.targets.push(lang);
    }

    if (hasInvalid) temp.name += '*';

    result[id] = temp;
  }

  return result;
}
