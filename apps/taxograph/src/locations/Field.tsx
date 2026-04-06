import { useEffect, useState } from 'react';

import { FieldAppSDK } from '@contentful/app-sdk';
import { useSDK, useAutoResizer } from '@contentful/react-apps-toolkit';

import { Button, Flex, Text, Paragraph, Stack, TextLink, Tooltip } from '@contentful/f36-components';
import { ExternalLinkIcon } from '@contentful/f36-icons';
import tokens from '@contentful/f36-tokens';

import { createCDAClient } from '../helpers/cdaClient';

import { getConceptsMeta } from '../api';

import { Concept } from '../types';
import { linkTaxonomyContent } from '../helpers';

export const Field = () => {
  const sdk = useSDK<FieldAppSDK>();
  const [concepts, setConcepts] = useState<Concept[]>([]);

  useAutoResizer();

  const client = createCDAClient(sdk.ids.space, sdk.ids.environment, sdk.parameters.installation.cda_key)

  useEffect(() => {
    const getConceptDetails = async () => {
      const metadata = sdk.entry.getMetadata();
      const conceptIds = metadata?.concepts?.map(concept => concept.sys.id) || [];
      const concepts = await getConceptsMeta(client, conceptIds);

      setConcepts(concepts);
    }

    getConceptDetails();
  }, []);

  return <>
    {concepts.length > 0 &&
      <Paragraph>
        <Stack spacing="spacingXs">
          {concepts.map(concept =>
            <Tooltip placement="right" key={concept.id} content="Open assigned content">
              <Button as='a' style={{ backgroundColor: tokens.blue100, border: 'transparent' }} href={linkTaxonomyContent(sdk.ids.space, sdk.ids.environment, concept.id)} target='_blank'>
                {concept.label}
              </Button>
            </Tooltip>
          )}
        </Stack>
      </Paragraph>
    }

    {concepts.length === 0 &&
      <Flex
        justifyContent='center'
        alignItems='center'
        style={{ borderWidth: '1px', borderRadius: tokens.borderRadiusMedium, borderStyle: 'dashed', borderColor: tokens.gray600, padding: '2rem', maxWidth: '99.9%' }}
      />
    }

    <Flex justifyContent="space-between" style={{ width: '100%', marginTop: '5px' }}>
      <Text>
        Tip: you can add, remove and review taxonomy concepts in the Taxonomy tab of this entry
      </Text>
      <TextLink icon={<ExternalLinkIcon size='tiny' />}
        style={{ display: 'block', textAlign: 'left' }}
        alignIcon="end"
        onClick={() => sdk.navigator.openCurrentAppPage()}
        rel="noopener noreferrer">Explore
      </TextLink>
    </Flex>
  </>
};