import React, { ReactNode, useEffect, useRef, useState } from "react";
import { PageAppSDK } from "@contentful/app-sdk";
import { useSDK } from "@contentful/react-apps-toolkit";
import {
  APICredentials,
  getAccounts,
  getProjectTemplates,
  getProjects,
  parseCredentials,
} from "@/services/api";
import {
  ExtendedGCTemplate,
  GCAccount,
  GCProject,
  GCTemplate,
} from "@/type/types";
import { findMappedModelConfig } from "@/utils/fieldMapping";
import { ContentTypeProps } from "contentful-management";
import { filterTemplatesById } from "@/utils/common";

interface TemplatesContextValue {
  error: string | null;
  accounts: GCAccount[] | null;
  projects: GCProject[] | null;
  templates: ExtendedGCTemplate[] | null;
  updateSingleTemplate: (
    template: ExtendedGCTemplate
  ) => ExtendedGCTemplate | null;
  refreshAllData: () => Promise<void>;
  loadProjectTemplates: (projectId: string) => Promise<void>;
  syncTemplates: (
    template: ExtendedGCTemplate | null
  ) => ExtendedGCTemplate | null;
}

export const TemplatesContext = React.createContext<TemplatesContextValue>({
  error: null,
  accounts: null,
  projects: null,
  templates: null,
  updateSingleTemplate: () => null,
  refreshAllData: async () => {},
  loadProjectTemplates: async () => {},
  syncTemplates: () => null,
});

type TemplatesProviderProps = {
  children: ReactNode;
};

export default function TemplatesProvider({
  children,
}: TemplatesProviderProps) {
  const sdk = useSDK<PageAppSDK>();
  const credentials = useRef(parseCredentials(sdk.parameters.installation));
  const [error, setError] = useState<null | string>(null);
  const [accounts, setAccounts] = useState<GCAccount[] | null>(null);
  const [projects, setProjects] = useState<GCProject[] | null>(null);
  const [templates, setTemplates] = useState<ExtendedGCTemplate[] | null>(null);

  function isAppConfigured() {
    if (!credentials.current) {
      sdk.notifier.error("Please configure the app first");
      setError("Missing configuration");
      return false;
    }
    return true;
  }

  function syncTemplates(template: ExtendedGCTemplate | null) {
    if (!template) return null;
    if (!templates) {
      setTemplates([template]);
    } else {
      const templateIndex = templates.findIndex(
        (item) => item.id === template.id
      );
      if (templateIndex < 0) {
        setTemplates([...templates, template]);
      } else {
        return templates[templateIndex];
      }
    }
    return template;
  }

  async function loadAccounts() {
    if (!isAppConfigured()) {
      return;
    }

    try {
      const res = await getAccounts(credentials.current as APICredentials);
      setAccounts(res.data);
    } catch (e) {
      setError("Could not fetch accounts");
      sdk.notifier.error("Error fetching items");
    }
  }

  function updateSingleTemplate(template: ExtendedGCTemplate) {
    if (!templates) return null;
    const templateIndex = templates.findIndex(
      (item) => item.id === template.id
    );
    if (templateIndex < 0) return null;
    const updatedTemplates = [...templates];
    updatedTemplates[templateIndex] = {
      ...template,
    };
    setTemplates(updatedTemplates);
    return updatedTemplates[templateIndex];
  }

  async function loadProjectTemplates(projectId: string) {
    const projectData = projects?.find((project) => project.id === projectId);
    if (!projectData) return;
    try {
      let cfContentTypes =
        (
          await sdk.cma.contentType.getMany({
            spaceId: sdk.ids.space,
            environmentId: sdk.ids.environment,
          })
        )?.items || [];
      const res = await getProjectTemplates(
        credentials.current as APICredentials,
        projectData.id
      );
      if (res.data && Array.isArray(res.data)) {
        const loadedTemplates = res.data.map((template: GCTemplate) => {
          const mapping = findMappedModelConfig(
            cfContentTypes as ContentTypeProps[],
            template.id.toString()
          );
          return {
            ...template,
            id: template.id.toString(),
            account_id: projectData.account_id,
            project_id: template.project_id.toString(),
            account_slug: projectData.account_slug,
            project_name: projectData.name,
            mappedCFModel: mapping?.modelId,
            mappingConfig: mapping?.config,
          };
        });
        setTemplates((prevTemplates) => {
          if (!prevTemplates) return loadedTemplates;
          return filterTemplatesById([...loadedTemplates, ...prevTemplates]);
        });
      }
    } catch (e) {
      setError("Could not fetch templates for user's projects");
      sdk.notifier.error("Error fetching items");
    }
  }

  async function loadProjects(accounts: GCAccount[]) {
    if (!isAppConfigured()) {
      return;
    }

    try {
      let newProjects: GCProject[] = [];
      for (const account of accounts) {
        const res = await getProjects(
          credentials.current as APICredentials,
          account.id
        );
        if (res.data && Array.isArray(res.data)) {
          newProjects = newProjects.concat(
            res.data.map((project: GCProject) => {
              return {
                ...project,
                account_id: project.account_id.toString(),
                account_slug: account.slug,
                id: project.id.toString(),
              };
            })
          );
        }
      }
      setProjects(newProjects);
    } catch (e) {
      setError("Could not fetch projects for user's accounts");
      sdk.notifier.error("Error fetching items");
    }
  }

  async function refreshAllData() {
    setAccounts(null);
    await loadAccounts();
  }

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    if (!accounts) {
      setProjects(null);
      return;
    }
    loadProjects(accounts);
  }, [accounts]);

  useEffect(() => {
    if (!projects) {
      setTemplates(null);
      return;
    }
  }, [projects]);

  return (
    <TemplatesContext.Provider
      value={{
        error,
        accounts,
        projects,
        templates,
        updateSingleTemplate,
        refreshAllData,
        loadProjectTemplates,
        syncTemplates,
      }}
    >
      {children}
    </TemplatesContext.Provider>
  );
}
