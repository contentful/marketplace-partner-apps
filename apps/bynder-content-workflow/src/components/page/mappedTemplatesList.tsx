import { PageAppSDK } from "@contentful/app-sdk";
import {
  Button,
  Flex,
  Heading,
  Skeleton,
  Text,
  Grid,
  SectionHeading, GridItem,
} from "@contentful/f36-components";
import { useSDK } from "@contentful/react-apps-toolkit";
import { useEffect, useState } from "react";
import { AppScreens, ExtendedGCTemplate } from "@/type/types";
import useMappingService from "@/hooks/useMappingService";
import { RefreshButton } from "../common/RefreshButton";

interface MappedTemplatesListProps {
  select: (template: ExtendedGCTemplate) => void;
  importEntriesForTemplate: (
    template: ExtendedGCTemplate,
    currentScreen: AppScreens
  ) => void;
  setTemplatesBack: (screen: AppScreens) => void;
}

export default function MappedTemplatesList({
  select,
  importEntriesForTemplate,
  setTemplatesBack,
}: MappedTemplatesListProps) {
  const sdk = useSDK<PageAppSDK>();
  const [mappedTemplates, setMappedTemplates] = useState<
    ExtendedGCTemplate[] | null
  >(null);
  const [cfModelNames, setCfModelNames] = useState<Map<string, string>>(
    new Map()
  );
  const [loadingData, setLoadingData] = useState(true);
  const { getAllMappedTemplates } = useMappingService();

  async function loadModelNames(templates: ExtendedGCTemplate[]) {
    const modelNames = new Map<string, string>();
    for (const template of templates) {
      if (!template.mappedCFModel) continue;
      const model = await sdk.cma.contentType.get({
        contentTypeId: template.mappedCFModel,
        spaceId: sdk.ids.space,
        environmentId: sdk.ids.environment,
      });
      modelNames.set(template.id, model.name);
    }
    setCfModelNames(modelNames);
  }

  function onSelectTemplate(templateId: string) {
    setTemplatesBack(AppScreens.ViewAllMappings);
    const template = mappedTemplates?.find((t) => t.id === templateId);
    if (template) {
      select(template);
    }
  }

  function refreshTemplates() {
    setLoadingData(true);
    setMappedTemplates(null);
    setCfModelNames(new Map());
    loadTemplates();
  }

  async function loadTemplates() {
    const templates = await getAllMappedTemplates();
    setMappedTemplates(templates);
    if (templates) {
      loadModelNames(templates);
    }
    setLoadingData(false);
  }

  useEffect(() => {
    if (mappedTemplates) {
      loadModelNames(mappedTemplates);
    }
  }, [mappedTemplates]);

  useEffect(() => {
    loadTemplates();
  }, []);

  return (
    <>
      <Flex gap="spacingS" justifyContent="space-between" alignItems="center">
        <Heading marginTop="spacingL" marginBottom="spacingL">
          Existing template mappings:{" "}
        </Heading>
        <RefreshButton
          disabled={loadingData}
          description="Refresh template data"
          onClick={refreshTemplates}
        />
      </Flex>
      <Grid paddingLeft="spacingS" columns="2fr 2fr 2fr 2fr 3fr">
        <SectionHeading>Template name</SectionHeading>
        <SectionHeading>Contentful model name</SectionHeading>
        <SectionHeading>Project</SectionHeading>
        <SectionHeading>Account</SectionHeading>
        <SectionHeading>Actions</SectionHeading>
      </Grid>
      {mappedTemplates?.length ? (
        mappedTemplates.map((template) => {
          return (
            <Grid
              key={template.id}
              paddingLeft="spacingS"
              columns="2fr 2fr 2fr 2fr 3fr"
            >
              <GridItem paddingTop="spacingS">
                <Text fontWeight="fontWeightMedium">{template.name}</Text>
              </GridItem>
              <GridItem paddingTop="spacingS">
                <Text fontWeight="fontWeightMedium">
                  {cfModelNames.get(template.id)}
                </Text>
              </GridItem>
              <GridItem paddingTop="spacingS">
                <Text>{template.project_name}</Text>
              </GridItem>
              <GridItem paddingTop="spacingS">
                <Text>{template.account_slug}</Text>
              </GridItem>
              <Flex padding="spacingXs" gap="spacingXs">
                <Button
                  variant={"primary"}
                  onClick={() => onSelectTemplate(template.id)}
                >
                  Edit Mapping
                </Button>
                <Button
                  variant={"positive"}
                  onClick={() =>
                    importEntriesForTemplate(
                      template,
                      AppScreens.ViewAllMappings
                    )
                  }
                >
                  Import Entries
                </Button>
              </Flex>
            </Grid>
          );
        })
      ) : (
        <Skeleton.Container>
          <Skeleton.BodyText numberOfLines={4} />
        </Skeleton.Container>
      )}
    </>
  );
}
