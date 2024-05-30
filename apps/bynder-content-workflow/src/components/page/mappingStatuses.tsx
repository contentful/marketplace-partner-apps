import { PageAppSDK } from "@contentful/app-sdk";
import {
  Text,
  Skeleton,
  Tabs,
  Grid,
  Select,
  Box,
  Flex,
  SectionHeading,
  FormControl
} from "@contentful/f36-components";
import { useSDK } from "@contentful/react-apps-toolkit";
import { statusOptions } from "@/consts/status";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { parseCredentials, getProjectStatuses } from "@/services/api";
import {
  CFStatusType,
  ExtendedGCTemplate,
  GCStatus,
  StatusMapping,
} from "@/type/types";
import { parseMapping } from "@/utils/parseMapping";
import {
  assignStatusMappings,
  getStatusMappings,
  getStatusesWorkflowList,
  groupStatusesByWorkflow,
  setCFStatusMapping,
  setDefaultStatusMappings,
  setGCChangeStatus,
} from "@/utils/statusesMapping";

function capitalize(str: string) {
  return `${str.charAt(0).toUpperCase()}${str.substring(1)}`;
}

interface MappingStatusesProps {
  template: ExtendedGCTemplate;
  setStatusMappings: (statuses: StatusMapping[]) => void;
  setError: (error: string | null) => void;
}

export function MappingStatuses({
  template,
  setError,
  setStatusMappings,
}: MappingStatusesProps) {
  const sdk = useSDK<PageAppSDK>();
  const credentials = useRef(parseCredentials(sdk.parameters.installation));
  const [statuses, setStatuses] = useState<GCStatus[]>([]);

  function onSelectCFStatus(
    e: ChangeEvent<HTMLSelectElement>,
    statusId: string
  ) {
    const updatedStatuses = setCFStatusMapping(
      statuses,
      statusId,
      e.target.value as CFStatusType
    );
    setStatuses(updatedStatuses);
    setStatusMappings(getStatusMappings(updatedStatuses));
  }

  function onSelectGCChangeStatus(
    e: ChangeEvent<HTMLSelectElement>,
    statusId: string
  ) {
    const updatedStatuses = setGCChangeStatus(
      statuses,
      statusId,
      e.target.value
    );
    setStatuses(updatedStatuses);
    setStatusMappings(getStatusMappings(updatedStatuses));
  }

  async function loadProjectStatuses() {
    if (!credentials.current) {
      setError("No credentials");
      return;
    }
    try {
      const projectStatuses = await getProjectStatuses(
        credentials.current,
        template.project_id
      );
      if (projectStatuses && projectStatuses?.data) {
        let newStatuses: GCStatus[] = [];
        if (template.mappedCFModel && template.mappingConfig) {
          const config = parseMapping(template.mappingConfig);
          if (!config) {
            throw new Error("Failed to parse template mapping");
          }
          newStatuses = assignStatusMappings(
            projectStatuses.data,
            config.statuses
          );
        } else {
          newStatuses = setDefaultStatusMappings(projectStatuses.data);
        }
        setStatuses(newStatuses);
        setStatusMappings(getStatusMappings(newStatuses));
      }
    } catch (error: any) {
      setError(`Error loading statuses: ${error.message}`);
    }
  }

  useEffect(() => {
    loadProjectStatuses();
  }, [template]);

  return statuses.length > 0 ? (
    <Tabs defaultTab={statuses[0].workflow_uuid}>
      <Tabs.List variant={"horizontal-divider"}>
        {getStatusesWorkflowList(statuses).map((workflow) => (
          <Tabs.Tab panelId={workflow.id} key={`${workflow.id}-tab`}>
            {workflow.name}
          </Tabs.Tab>
        ))}
      </Tabs.List>
      {groupStatusesByWorkflow(statuses).map((group) => (
        <Tabs.Panel
          key={`${group[0].workflow_uuid}-panel`}
          id={group[0].workflow_uuid}
        >
          <Grid
            paddingTop="spacingL"
            paddingBottom="spacingXs"
            columns="1fr 1fr 1fr"
            columnGap="spacingL"
          >
            <SectionHeading marginBottom="spacingM">
              Content Workflow status
            </SectionHeading>
            <SectionHeading marginBottom="spacingM">
              Contentful status mapping
            </SectionHeading>
            <SectionHeading marginBottom="spacingM">
              On import, set Content Workflow Status to:
            </SectionHeading>
          </Grid>
          {group.map((status) => {
            const statusId = status.id;
            return (
              <Grid
                key={status.id}
                columns="1fr 1fr 1fr"
                columnGap="spacingL"
              >
                <Box>
                  <Flex gap="spacingS" alignItems="center">
                    <Box
                      style={{
                        backgroundColor: status.color,
                        padding: ".5rem",
                        borderRadius: "50%",
                      }}
                    ></Box>
                    <Text fontSize="fontSizeL" fontWeight="fontWeightMedium">
                      {status.name}
                    </Text>
                  </Flex>
                </Box>
                <FormControl>
                  {/* labels are not visible but are left for accessibility purposes */}
                  <FormControl.Label
                    style={{
                      visibility: "hidden",
                      height: "0",
                      position: "absolute",
                    }}
                  >
                    Contentful status mapping
                  </FormControl.Label>
                  <Select
                    value={status.cfStatus}
                    onChange={(e) => onSelectCFStatus(e, statusId)}
                  >
                    {statusOptions.map((option) => (
                      <Select.Option key={option} value={option}>
                        {capitalize(option)}
                      </Select.Option>
                    ))}
                  </Select>
                </FormControl>
                <FormControl>
                  {/* labels are not visible but are left for accessibility purposes */}
                  <FormControl.Label
                    style={{
                      visibility: "hidden",
                      height: "0",
                      position: "absolute",
                    }}
                  >
                    On import, set Content Workflow Status to:
                  </FormControl.Label>
                  <Select
                    onChange={(e) => onSelectGCChangeStatus(e, statusId)}
                    value={status.changeStatusInGC ?? ""}
                  >
                    <Select.Option key="no-change" value="">
                      Do not change
                    </Select.Option>
                    {statuses.map((item) => (
                      <Select.Option key={item.id} value={item.id}>
                        {item.display_name}
                      </Select.Option>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            );
          })}
        </Tabs.Panel>
      ))}
    </Tabs>
  ) : (
    <Skeleton.Container>
      <Skeleton.BodyText numberOfLines={3} />
    </Skeleton.Container>
  );
}
