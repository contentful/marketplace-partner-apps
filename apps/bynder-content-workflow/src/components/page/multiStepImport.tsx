import {
  Heading,
  Note,
  Tabs,
  Box,
  FormControl,
  Skeleton,
  Spinner,
  Select,
  Flex,
} from "@contentful/f36-components";
import { useContext, useState } from "react";
import { Templates } from "./templates";
import { TemplatesContext } from "@/context/templatesProvider";
import { RefreshButton } from "../common/RefreshButton";
import { AppScreens, ExtendedGCTemplate } from "@/type/types";

interface GCProject {
  account_id: string;
  id: string;
  active: boolean;
  name: string;
  type: string;
}

function findSelectedProjectName(projectId: string, projects: GCProject[]) {
  const project = projects.find((project) => project.id === projectId);
  return project?.name ?? "Unknown";
}

export function MultiStepImport({
  select,
  setTemplatesBack,
}: {
  select: (template: ExtendedGCTemplate) => void;
  setTemplatesBack: (screen: AppScreens) => void;
}) {
  const { accounts, projects, templates, error, refreshAllData, loadProjectTemplates } =
    useContext(TemplatesContext);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );
  const [loadingData, setLoadingData] = useState(false);

  async function selectProject(e: React.ChangeEvent<HTMLSelectElement>) {
    const projectId = e.target.value;
    setSelectedProjectId(projectId);
    if (projectId) {
      await loadProjectTemplates(projectId);
    }
  }

  function onTabChange() {
    setSelectedProjectId(null);
  }

  function onSelectTemplate(template: ExtendedGCTemplate) {
    setTemplatesBack(AppScreens.SelectTemplate);
    select(template);
  }

  async function refreshData() {
    setSelectedProjectId(null);
    setLoadingData(true);
    await refreshAllData();
    setLoadingData(false);
  }

  return (
    <>
      <Flex gap="spacingS" justifyContent="space-between" alignItems="center">
        <Heading marginTop="spacingL">Available accounts & projects: </Heading>
        <RefreshButton
          disabled={loadingData}
          description="Refresh all data"
          onClick={refreshData}
        ></RefreshButton>
      </Flex>
      {error && <Note variant="negative">{error}</Note>}
      {accounts ? (
        <Tabs defaultTab={accounts[0].id} onTabChange={onTabChange}>
          <Tabs.List>
            {accounts.map((account) => (
              <Tabs.Tab key={account.id} panelId={account.id}>
                {account.name}
              </Tabs.Tab>
            ))}
          </Tabs.List>
          {accounts && projects ? (
            accounts.map((account) => (
              <Tabs.Panel key={`${account.id}-panel`} id={account.id}>
                <Box
                  paddingTop="spacingL"
                  paddingBottom="spacingXs"
                  paddingLeft="spacingXs"
                  paddingRight="spacingXs"
                  style={{ backgroundColor: "#f4f2f2" }}
                >
                  <FormControl as="fieldset">
                    <FormControl.Label>Select a project</FormControl.Label>
                    <Select
                      value={selectedProjectId || ""}
                      onChange={selectProject}
                      id="project-select"
                      name="project-select"
                    >
                      <Select.Option value="" isDisabled>
                        Please select an option...
                      </Select.Option>
                      {projects
                        .filter((elt) => elt.account_id === account.id)
                        .map((project) => (
                          <Select.Option key={project.id} value={project.id}>
                            {project.name}
                          </Select.Option>
                        ))}
                    </Select>
                  </FormControl>
                </Box>
              </Tabs.Panel>
            ))
          ) : (
            <Spinner></Spinner>
          )}
        </Tabs>
      ) : (
        <Skeleton.Container>
          <Skeleton.BodyText numberOfLines={3} />
        </Skeleton.Container>
      )}
      {selectedProjectId && (
        <Templates
          projectName={findSelectedProjectName(
            selectedProjectId,
            projects || []
          )}
          templates={
            templates?.filter(
              (template) => template.project_id === selectedProjectId
            ) || []
          }
          select={onSelectTemplate}
        />
      )}
    </>
  );
}
