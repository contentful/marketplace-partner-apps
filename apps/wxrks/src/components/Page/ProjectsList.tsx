import React, { useCallback, useEffect, useState } from "react";

import { useCMA, useSDK } from "@contentful/react-apps-toolkit";
import { ContentType, ConfigAppSDK } from "@contentful/app-sdk";

import {
  Grid,
  Modal,
  List,
  Flex,
  Table,
  Spinner,
  IconButton,
  Button,
  DateTime,
  Text,
  Badge,
  Notification,
  Pagination,
  Menu,
  Form,
  FormControl,
  TextInput,
  ValidationMessage,
} from "@contentful/f36-components";
import {
  InfoCircleIcon,
  CycleIcon,
  MoreVerticalIcon,
  CloseIcon,
  DoneIcon,
  SearchIcon,
} from "@contentful/f36-icons";

import EntriesList from "./EntriesList";
import BwxFetchTranslations from "../BwxFetchTranslations";

import bwxApi from "../../api/api";

function getStatus(status: string) {
  if ("DELIVERED" === status || "INVOICED" === status || "NOT_INVOICED" === status) {
    return "COMPLETED";
  }

  if ("DRAFT" === status || "PENDING" === status || "APPROVED" === status) {
    return "IN_PROGRESS";
  }

  if ("CANCELLED" === status) {
    return "CANCELLED";
  }

  return "NOT_FOUND";
}

const getVariantStatus = (status: string) => {
  if (status === "IN_PROGRESS") {
    return "featured";
  }

  if (status === "COMPLETED") {
    return "positive";
  }

  return "warning";
};

const getVariantProgress = (value: number) => {
  if (value < 1) {
    return "primary";
  }

  if (value >= 1) {
    return "positive";
  }

  return "secondary";
};

interface CollectionsState {
  total: number | null;
  items: any[] | null;
}

interface ProjectCreationProps {
  contentTypes: ContentType[];
}

export default function Projects({ contentTypes }: ProjectCreationProps) {
  const cma = useCMA();
  const sdkConfig = useSDK<ConfigAppSDK>();

  const [projectList, setProjectList] = useState([]);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [projectName, setProjectName] = useState<string>("");
  const [isShown, setShown] = useState(false);
  const [isShownConfirmation, setShownConfirmation] = useState(false);
  const [projectToCancel, setProjectToCancel] = useState<any | null>(null);
  const [confirmationInput, setConfirmationInput] = useState("");
  const [showError, setShowError] = useState(false);
  const [targetLocalesSelected, setTargetLocalesSelected] = useState([]);
  const [selectedReferences, setSelectedReferences] = useState<string[]>([]);

  const getProjects = useCallback(async () => {
    setLoading(true);
    try {
      const response = await bwxApi.getProjects(
        sdkConfig,
        cma,
        page,
        pageSize,
        undefined,
        projectName
      );
      const projects = await response.json();
      setProjectList(projects.content);
      setTotalElements(projects.totalElements);
    } catch (e) {
      Notification.error("An error occurred while getting projects");
    } finally {
      setLoading(false);
    }
  }, [sdkConfig, cma, page, pageSize, projectName]);

  useEffect(() => {
    getProjects();
  }, [getProjects]);

  useEffect(() => {
    if (projectName === "") {
      getProjects();
    }
  }, [projectName, getProjects]);

  const handleViewPerPageChange = (i: React.SetStateAction<number>) => {
    setPage(0);
    setPageSize(i);
  };

  const openModal = (targets: never[]) => {
    setShown(true);
    setTargetLocalesSelected(targets ? targets.sort() : []);
  };

  const handleCancelProject = (project: any) => {
    setProjectToCancel(project);
    setShownConfirmation(true);
    setConfirmationInput("");
    setShowError(false);
  };

  const confirmCancelProject = async () => {
    if (confirmationInput.trim().length > 0) {
      try {
        await bwxApi.changeProjectStatus(
          projectToCancel.uuid,
          "CANCELLED",
          sdkConfig,
          cma,
          false,
          confirmationInput
        );
        Notification.success("Project has been cancelled successfully.");
        closeConfirmationModal();
        getProjects();
      } catch (e) {
        Notification.error("An error occurred while cancelling the project");
      }
    } else {
      setShowError(true);
    }
  };

  const closeConfirmationModal = () => {
    setShownConfirmation(false);
    setConfirmationInput("");
    setShowError(false);
    setProjectToCancel(null);
  };

  const getLocale = (locale: string) => {
    if (locale === "ar") {
      locale = "ar_ac";
    }

    const loc = Object.entries(sdkConfig.locales.names).find(
      (loc) =>
        locale.replaceAll("_", "-").toLowerCase() === loc[0].toLowerCase()
    );
    return loc ? loc[1] : locale;
  };

  const initEntries: CollectionsState = { total: 0, items: [] };
  const [entriesOfProject, setEntriesOfProject] = useState(initEntries);
  const [isShownContents, setShownContents] = useState(false);
  const [isLoadingEntries, setLoadingEntries] = useState(false);
  const [selectedProject, setSelectedProject] = useState("");

  const getEntriesOfProject = async (projectUuid: string) => {
    setLoadingEntries(true);
    setSelectedProject(projectUuid);
    try {
      const response = await bwxApi.getEntries(projectUuid, sdkConfig, cma);
      const entryIds = await response.json();
      await fetchDataEntries(entryIds);
    } catch (e) {
      Notification.error("An error occurred while getting projects");
    } finally {
      setLoadingEntries(false);
    }
  };

  const fetchDataEntries = async (entryIds: string[]) => {
    const params: any = {
      query: {
        order: "-sys.updatedAt",
        limit: 1000,
        "sys.id[in]": entryIds,
      },
    };

    const resp: any = await cma.entry
      .getMany(params)
      .then((resp) => resp)
      .catch(() => ({ total: 0, items: [] }));

    setEntriesOfProject({ total: resp.total, items: resp.items });
    setShownContents(true);
  };

  const handleSelectedReferences = (referenceIds: string | string[]) => {
    setSelectedReferences((prevSelected) => {
      const updatedSelected = Array.isArray(referenceIds)
        ? referenceIds
        : prevSelected.includes(referenceIds)
        ? prevSelected.filter((id) => id !== referenceIds)
        : [...prevSelected, referenceIds];
      return updatedSelected;
    });
  };

  return (
    <Grid style={{ width: "100%" }} alignContent="end">
      <br />
      <Flex justifyContent="space-between" alignItems="center">
        <Flex alignItems="center">
          <TextInput
            style={{ width: "400px" }}
            icon={<SearchIcon />}
            size="small"
            placeholder="Filter by name"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
          />
          {projectName.trim() && (
            <IconButton
              variant="transparent"
              size="small"
              icon={<CloseIcon />}
              aria-label="Clear"
              onClick={() => setProjectName("")}
              style={{ marginLeft: "10px" }}
            />
          )}
          <Button
            style={{ marginLeft: "10px" }}
            variant="primary"
            size="small"
            onClick={getProjects}
            isDisabled={!projectName.trim()}
          >
            Search
          </Button>
        </Flex>
        <Button
          style={{ marginRight: "10px", width: "120px" }}
          startIcon={<CycleIcon />}
          isLoading={loading}
          isDisabled={loading}
          variant="transparent"
          size="small"
          onClick={() => getProjects()}
        >
          Refresh
        </Button>
      </Flex>
      <br />
      <Table verticalAlign="middle">
        <Table.Head>
          <Table.Row>
            <Table.Cell>Project Name</Table.Cell>
            <Table.Cell>Content</Table.Cell>
            <Table.Cell>Status</Table.Cell>
            <Table.Cell>Progress</Table.Cell>
            <Table.Cell>Source Locale</Table.Cell>
            <Table.Cell>Target Locales</Table.Cell>
            <Table.Cell>Creation Date</Table.Cell>
            <Table.Cell>Actions</Table.Cell>
            <Table.Cell></Table.Cell>
          </Table.Row>
        </Table.Head>
        <Table.Body>
          {loading ? (
            <Table.Row>
              <Table.Cell colSpan={8}>
                <Flex justifyContent="center" padding="spacingXl">
                  <Text marginRight="spacingXs">Loading projects</Text>
                  <Spinner variant="primary" />
                </Flex>
              </Table.Cell>
            </Table.Row>
          ) : projectList.length === 0 ? (
            <Table.Row>
              <Table.Cell colSpan={9}>
                <Flex justifyContent="center" padding="spacingXl">
                  <Text>No projects found</Text>
                </Flex>
              </Table.Cell>
            </Table.Row>
          ) : (
            projectList.map((project: any) => {
              const status = getStatus(project.status);
              const variantStatus = getVariantStatus(status);
              const progress = status === "COMPLETED"
                ? 100
                : project.progress
                ? (project.progress * 100).toFixed(0)
                : 0;
              const variantProgress = getVariantProgress(project.progress);
              const targetLocales = project.targetLocales
                ? project.targetLocales
                    .sort()
                    .map((locale: string) => getLocale(locale))
                    .join(", ")
                : "N/A";
              return (
                <Table.Row key={project.uuid}>
                  <Table.Cell>{project.reference}</Table.Cell>
                  <Table.Cell>
                    <Button
                      size="small"
                      isLoading={
                        isLoadingEntries && selectedProject === project.uuid
                      }
                      isDisabled={isLoadingEntries}
                      variant="secondary"
                      onClick={() => getEntriesOfProject(project.uuid)}
                    >
                      Show contents
                    </Button>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge variant={variantStatus}>
                      <span style={{ textTransform: "uppercase" }}>
                        {status.replaceAll("_", " ")}
                      </span>
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge variant={variantProgress}>{progress}%</Badge>
                  </Table.Cell>
                  <Table.Cell>{getLocale(project.sourceLocale)}</Table.Cell>
                  <Table.Cell>
                    <Grid columns="0.8fr 0.2fr">
                      <Text isTruncated as="div" style={{ maxWidth: "150px" }}>
                        {targetLocales}
                      </Text>
                      <IconButton
                        size="small"
                        variant="transparent"
                        aria-label="Progress info"
                        onClick={() => openModal(project.targetLocales)}
                        icon={<InfoCircleIcon />}
                      />
                    </Grid>
                  </Table.Cell>
                  <Table.Cell>
                    {<DateTime date={project.createDate} />}
                  </Table.Cell>
                  <Table.Cell style={{ maxWidth: "150px" }}>
                    <BwxFetchTranslations project={project} />
                  </Table.Cell>
                  <Table.Cell>
                    <Menu>
                      <Menu.Trigger>
                        <IconButton
                          size="small"
                          variant="transparent"
                          aria-label="More options"
                          icon={<MoreVerticalIcon />}
                        />
                      </Menu.Trigger>
                      <Menu.List>
                        <Menu.Item
                          style={{
                            color: status === "COMPLETED" ? "grey" : "#E63757",
                            fontWeight: "bold",
                          }}
                          icon={
                            <CloseIcon
                              variant={
                                status === "COMPLETED"
                                  ? "secondary"
                                  : "negative"
                              }
                            />
                          }
                          onClick={() => {
                            if (status !== "COMPLETED") {
                              handleCancelProject(project);
                            }
                          }}
                          isDisabled={status === "COMPLETED"}
                        >
                          Cancel Project
                        </Menu.Item>
                      </Menu.List>
                    </Menu>
                  </Table.Cell>
                </Table.Row>
              );
            })
          )}
        </Table.Body>
      </Table>
      <br />
      {totalElements > 0 && (
        <Pagination
          activePage={page}
          onPageChange={setPage}
          totalItems={totalElements}
          showViewPerPage
          viewPerPageOptions={[20, 50, 100]}
          itemsPerPage={pageSize}
          onViewPerPageChange={handleViewPerPageChange}
        />
      )}
      <br></br>

      <Modal onClose={closeConfirmationModal} isShown={isShownConfirmation}>
        {() => (
          <>
            <Modal.Header
              title="Please provide a reason for cancelling this project"
              onClose={() => setShownConfirmation(false)}
            />
            <Modal.Content>
              <Form onSubmit={confirmCancelProject}>
                <FormControl isInvalid={showError}>
                  <FormControl.Label>Reason</FormControl.Label>
                  <TextInput
                    maxLength={250}
                    value={confirmationInput}
                    onChange={(e) => setConfirmationInput(e.target.value)}
                  />
                  {showError && (
                    <ValidationMessage>
                      Reason field is required
                    </ValidationMessage>
                  )}
                </FormControl>
              </Form>
            </Modal.Content>
            <Modal.Controls>
              <Button
                startIcon={<CloseIcon />}
                size="small"
                variant="secondary"
                onClick={() => setShownConfirmation(false)}
              >
                Cancel
              </Button>
              <Button
                startIcon={<DoneIcon />}
                size="small"
                variant="primary"
                onClick={confirmCancelProject}
              >
                Continue
              </Button>
            </Modal.Controls>
          </>
        )}
      </Modal>

      <Modal onClose={() => setShown(false)} isShown={isShown}>
        {() => (
          <>
            <Modal.Header
              title="Target locales"
              onClose={() => setShown(false)}
            />
            <Modal.Content>
              <List>
                {targetLocalesSelected.map((locale: any) => {
                  return <List.Item>{getLocale(locale)}</List.Item>;
                })}
              </List>
            </Modal.Content>
          </>
        )}
      </Modal>

      <Modal
        onClose={() => setShownContents(false)}
        isShown={isShownContents}
        size="large"
      >
        {() => (
          <>
            <Modal.Header
              title="Contents"
              subtitle="Project Entry List"
              onClose={() => setShownContents(false)}
            />
            <Modal.Content>
              {entriesOfProject && entriesOfProject.items ? (
                <>
                  <Badge variant="featured">
                    Total: {entriesOfProject.items.length}
                  </Badge>
                </>
              ) : (
                <></>
              )}
              <EntriesList
                contentTypes={contentTypes}
                entries={entriesOfProject.items}
                onClickItem={(entryId) =>
                  sdkConfig.navigator.openEntry(entryId, { slideIn: true })
                }
                selectedItems={[]}
                onSelected={() => ({})}
                hideCheckbox
                selectedReferences={selectedReferences}
                onSelectedReferences={handleSelectedReferences}
              />
              <br></br>
            </Modal.Content>
          </>
        )}
      </Modal>
    </Grid>
  );
}
