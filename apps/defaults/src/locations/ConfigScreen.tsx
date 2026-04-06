import { useCallback, useEffect, useMemo } from "react";
import { ConfigAppSDK } from "@contentful/app-sdk";
import { Form, Flex, Spinner, Note, Box } from "@contentful/f36-components";
import { useSDK } from "@contentful/react-apps-toolkit";
import { createClient, PlainClientAPI } from "contentful-management";

import ContentTypeCard from "../components/ContentTypeCard";
import ConfigHeader from "../components/ConfigHeader";
import ContentTypeSearchBar from "../components/ContentTypeSearchBar";

import { useAppStore } from "../store/useAppStore";

import { isSupportedFieldType } from "../utils/";

const ConfigScreen = () => {
  const sdk = useSDK<ConfigAppSDK>();

  const bootstrap = useAppStore((s: any) => s.bootstrap);
  const getExternalParams = useAppStore((s: any) => s.getExternalParams);

  const contentTypes = useAppStore((s: any) => s.contentTypes);
  const isLoadingCTs = useAppStore((s: any) => s.isLoadingCTs);

  const searchTerm = useAppStore((s: any) => s.searchTerm);
  const setSearchTerm = useAppStore((s: any) => s.setSearchTerm);

  const cma = useMemo<PlainClientAPI>(
    () =>
      createClient(
        { apiAdapter: (sdk as any).cmaAdapter },
        {
          type: "plain",
          defaults: {
            environmentId: sdk.ids.environmentAlias ?? sdk.ids.environment,
            spaceId: sdk.ids.space,
          },
        }
      ),
    [sdk]
  );

  useEffect(() => {
    bootstrap(sdk, cma);
  }, [sdk, cma, bootstrap]);

  const onConfigure = useCallback(async () => {
    return {
      parameters: getExternalParams(),
      targetState: await sdk.app.getCurrentState(),
    };
  }, [getExternalParams, sdk]);

  useEffect(() => {
    sdk.app.onConfigure(() => onConfigure());
  }, [sdk, onConfigure]);

  const visibleContentTypes = contentTypes.filter((ct: any) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.trim().toLowerCase();
    return (
      ct.name.toLowerCase().includes(term) ||
      ct.sys.id.toLowerCase().includes(term)
    );
  });

  return (
    <Flex flexDirection="column" style={{ width: "100%" }}>
      <ConfigHeader sdk={sdk} />

      <Box
        padding="spacingL"
        style={{ width: "100%", maxWidth: "1080px", margin: "0 auto" }}
      >
        <ContentTypeSearchBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />

        {isLoadingCTs ? (
          <Spinner size="large" />
        ) : (
          <Form>
            {contentTypes.length === 0 ? (
              <Note title="No content types found" variant="negative">
                No content types are available in the current environment.
              </Note>
            ) : (
              <Flex flexDirection="column" gap="spacingS">
                {visibleContentTypes.map((ct: any) => {
                  if (!ct.fields.some((f: any) => isSupportedFieldType(f)))
                    return null;

                  const ctId = ct.sys.id;

                  return <ContentTypeCard key={ctId} ct={ct} />;
                })}
              </Flex>
            )}
          </Form>
        )}
      </Box>
    </Flex>
  );
};

export default ConfigScreen;
