import {
  Table,
  TextLink,
  Skeleton,
  Text,
  Box,
} from '@contentful/f36-components';
import { ExternalLinkIcon } from '@contentful/f36-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  ConnectedSite,
  getConnectedBusinesses,
  removeConnectedBusiness,
} from '../services/app-installation.srv';

export enum TestIds {
  // from the
  WRAPPER = 'connected-sites-list',
  LOADING_SKELETON = 'cf-ui-skeleton-form',
  OPEN_WIX_DASHBOARD = 'open-wix-dashboard',
  CONNECTED_SITE_WRAPPER = 'connected-site-wrapper',
  REMOVE_CONNECTION = 'remove-connection',
  NO_SITES_CONNECTED = 'no-sites-connected',
}

export type ConnectedSitesListProps = {
  environmentId: string;
  spaceId: string;
  contentfulAppId: string;
  testId?: string;
  updatesModifier: number;
};

export const ConnectedSitesList = ({
  environmentId,
  spaceId,
  contentfulAppId,
  updatesModifier,
  testId = TestIds.WRAPPER,
}: ConnectedSitesListProps) => {
  const [connectedSites, setConnectedSites] = useState<ConnectedSite[] | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const fetchInstallationParams = useCallback(async () => {
    setIsLoading(true);
    getConnectedBusinesses({
      environmentId,
      spaceId,
      contentfulAppId,
    })
      .then((installationParams) => {
        setConnectedSites(installationParams?.connectedBusinesses ?? []);
      })
      .finally(() => setIsLoading(false));
  }, [environmentId, spaceId, contentfulAppId, updatesModifier]);

  useEffect(() => {
    void fetchInstallationParams();
  }, [fetchInstallationParams]);

  const removeConnection = useCallback(
    (wixInstanceId: string) => {
      setIsLoading(true);
      removeConnectedBusiness({
        environmentId,
        spaceId,
        contentfulAppId,
        wixInstanceId,
      }).finally(() => {
        void fetchInstallationParams();
      });
    },
    [fetchInstallationParams],
  );

  return (
    <Table testId={testId}>
      <Table.Head>
        <Table.Row>
          <Table.Cell>Site Name</Table.Cell>
          <Table.Cell>Manage</Table.Cell>
          <Table.Cell>Remove</Table.Cell>
          <Table.Cell></Table.Cell>
        </Table.Row>
      </Table.Head>
      <Table.Body>
        {isLoading ? (
          <Skeleton.Row rowCount={3} columnCount={3} />
        ) : connectedSites?.length ? (
          connectedSites.map((site) => (
            <Table.Row
              key={site.wixInstanceId}
              testId={TestIds.CONNECTED_SITE_WRAPPER}
            >
              <Table.Cell>{site.siteDisplayName}</Table.Cell>
              <Table.Cell>
                <TextLink
                  testId={TestIds.OPEN_WIX_DASHBOARD}
                  icon={<ExternalLinkIcon />}
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
                  testId={TestIds.REMOVE_CONNECTION}
                  as="button"
                  variant="negative"
                  alignIcon="end"
                  rel="noopener noreferrer"
                  onClick={() => removeConnection(site.wixInstanceId)}
                >
                  Remove Connection
                </TextLink>
              </Table.Cell>
            </Table.Row>
          ))
        ) : (
          <Box padding="spacingXl">
            <Text
              fontSize="fontSizeM"
              lineHeight="lineHeightXl"
              testId={TestIds.NO_SITES_CONNECTED}
            >
              No connected sites
            </Text>
          </Box>
        )}
      </Table.Body>
    </Table>
  );
};
