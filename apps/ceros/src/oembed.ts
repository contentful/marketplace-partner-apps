import { extract, setProviderList } from '@extractus/oembed-extractor';

export interface OembedMetadata {
  type: string;
  url: string;
  title: string;
  html: string;
  width: number;
  height: number;
  provider_name: 'Ceros';
  provider_url: 'https://ceros.com';
  version: '1.0';
  embedType: 'full-height' | 'scrollable';
}

export async function getExperienceMetadata(experienceUrl: string): Promise<OembedMetadata | null> {
  // Set up the oembed provider list
  const providers = [
    {
      provider_name: 'Ceros',
      provider_url: 'https://www.ceros.com/',
      endpoints: [
        {
          schemes: ['https://view.ceros.com/*'],
          url: 'https://view.ceros.com/oembed',
          discovery: true,
        },
      ],
    },
  ];
  setProviderList(providers);

  // Parse URL
  // Regular expression to remove the /p/1 from the end of a URL like https://view.ceros.com/account/experience/p/1
  const regex = /(https:\/\/view\.ceros\.com\/[a-zA-Z0-9-_]+\/[a-zA-Z0-9-_]+)(?:.*)$/;
  let result = regex.exec(experienceUrl);

  if (!result) {
    console.trace(`Experience URL '${experienceUrl}' isn't valid. Make sure it looks like
        'https://view.ceros.com/account/experience'`);
    return null;
  }

  // Fetch the oembed data
  try {
    const oembed = await extract(result[1]);
    return oembed as OembedMetadata;
  } catch (err) {
    console.trace(err);
    return null;
  }
}
