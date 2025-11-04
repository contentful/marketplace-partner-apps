import { useCallback } from 'react';
import { Project, Environment } from '../types';
import { useSDK } from '@contentful/react-apps-toolkit';
import { callAppAction } from '../../../utils/appAction';

/**
 * Custom hook for LaunchDarkly API interactions
 * Uses Contentful signed requests - NO API KEY sent from client
 */
export const useLaunchDarkly = (apiKey: string | undefined, devMode = false) => {
  const sdk = useSDK();

  /**
   * Fetch all projects from LaunchDarkly
   * During validation (when apiKey is provided), calls LaunchDarkly directly
   * After registration, uses signed headers through backend
   */
  const fetchProjects = useCallback(async (): Promise<Project[] | null> => {
    if (devMode) {
      return null;
    }

    try {
      // VALIDATION MODE: Use direct LaunchDarkly API call with provided API key
      // This is used during initial setup before the installation is registered
      if (apiKey) {
        const response = await fetch('https://app.launchdarkly.com/api/v2/projects?limit=100', {
          headers: {
            Authorization: apiKey,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Invalid API key. Please check your LaunchDarkly API key.');
          }
          throw new Error(`Failed to fetch projects: ${response.statusText}`);
        }

        const data = await response.json();
        const fetchedProjects = data.items || [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mappedProjects: Project[] = fetchedProjects.map((project: any) => ({
          key: project.key,
          name: project.name,
          environments: [],
        }));

        return mappedProjects;
      }

      // NORMAL MODE: Use signed headers through backend (after registration)
      const result = await callAppAction<{ items: Project[]; totalCount: number }>(sdk, 'getProjects', {});

      const fetchedProjects = result.items || [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mappedProjects: Project[] = fetchedProjects.map((project: any) => ({
        key: project.key,
        name: project.name,
        environments: [],
      }));

      return mappedProjects;
    } catch (error) {
      console.error('[useLaunchDarkly] Failed to fetch projects:', error);
      throw error;
    }
  }, [sdk, devMode, apiKey]);

  /**
   * Fetch environments for a specific project
   * During validation (when apiKey is provided), calls LaunchDarkly directly
   * After registration, uses signed headers through backend
   */
  const fetchEnvironments = useCallback(async (projectKey: string): Promise<Environment[] | null> => {
    if (devMode) {
      return null;
    }
    
    if (!projectKey || projectKey.trim() === '') {
      return null;
    }
    
    try {
      // VALIDATION MODE: Use direct LaunchDarkly API call with provided API key
      if (apiKey) {
        const response = await fetch(`https://app.launchdarkly.com/api/v2/projects/${projectKey}/environments?limit=100`, {
          headers: {
            Authorization: apiKey,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Invalid API key. Please check your LaunchDarkly API key.');
          }
          throw new Error(`Failed to fetch environments: ${response.statusText}`);
        }

        const data = await response.json();
        const environmentsList = data?.items || [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mappedEnvironments: Environment[] = environmentsList.map((env: any) => ({
          key: env.key,
          name: env.name,
        }));

        return mappedEnvironments;
      }

      // NORMAL MODE: Use signed headers through backend (after registration)
      const data = await callAppAction<{ items: any[] }>(
        sdk,
        'getEnvironments',
        { projectKey }
      );
      
      const environmentsList = data?.items || [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mappedEnvironments: Environment[] = environmentsList.map((env: any) => ({
        key: env.key,
        name: env.name,
      }));
      
      return mappedEnvironments;
    } catch (error) {
      console.error('[useLaunchDarkly] Failed to fetch environments:', error);
      return null;
    }
  }, [sdk, devMode, apiKey]);

  return { fetchProjects, fetchEnvironments };
}; 