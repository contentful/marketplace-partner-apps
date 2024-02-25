import {Table, TextLink, Skeleton, Text, Box} from '@contentful/f36-components';
import {ExternalLinkIcon} from '@contentful/f36-icons';
import {useCallback, useEffect, useState} from 'react';
import {ConnectedSite, getConnectedBusinesses, removeConnectedBusiness} from "../services/app-installation.srv";

export type ConnectedSitesListProps = {
  environmentId: string;
  spaceId: string;
  contentfulAppId: string;
  updatesModifier: number;
};

export const ConnectedSitesList = ({environmentId, spaceId, contentfulAppId, updatesModifier}: ConnectedSitesListProps) => {
  const [connectedSites, setConnectedSites] = useState<ConnectedSite[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fetchInstallationParams = useCallback(async () => {
      setIsLoading(true);
      getConnectedBusinesses({
        environmentId,
        spaceId,
        contentfulAppId,
      }).then(installationParams => {
        setConnectedSites(installationParams?.connectedBusinesses ?? []);
      }).finally(() => setIsLoading(false));

  }, [ environmentId, spaceId, contentfulAppId, updatesModifier ]);

  useEffect(() => {
    void fetchInstallationParams();
  }, [fetchInstallationParams]);

  const removeConnection = useCallback((wixInstanceId: string) => {
    setIsLoading(true);
    removeConnectedBusiness({
      environmentId,
      spaceId,
      contentfulAppId,
      wixInstanceId,
    }).finally(() => {
      void fetchInstallationParams();
    });
  }, [fetchInstallationParams]);

  return (
    <Table>
      <Table.Head>
        <Table.Row>
          <Table.Cell>Site Name</Table.Cell>
          <Table.Cell>Manage</Table.Cell>
          <Table.Cell>Remove</Table.Cell>
          <Table.Cell></Table.Cell>
        </Table.Row>
      </Table.Head>
      <Table.Body>
        {isLoading ?
          <Skeleton.Row rowCount={3} columnCount={3} /> :
          connectedSites?.length ?
            connectedSites.map((site) => (
              <Table.Row key={site.wixInstanceId}>
                <Table.Cell>{site.siteDisplayName}</Table.Cell>
                <Table.Cell>
                  <TextLink
                    icon={<ExternalLinkIcon/>}
                    alignIcon="end"
                    href={site.wixManageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    >
                    Open Wix Dashboard
                  </TextLink>
                </Table.Cell>
                <Table.Cell>
                  <TextLink
                    as="button"
                    variant="negative"
                    alignIcon="end"
                    rel="noopener noreferrer"
                    onClick={() => removeConnection(site.wixInstanceId)}
                  >
                    Remove Connection
                  </TextLink>
                </Table.Cell>
              </Table.Row>)) :
              <Box padding="spacingXl">
                <Text fontSize="fontSizeM" lineHeight="lineHeightXl">
                  No connected sites
                </Text>
              </Box>
        }
      </Table.Body>
    </Table>
  );
};
