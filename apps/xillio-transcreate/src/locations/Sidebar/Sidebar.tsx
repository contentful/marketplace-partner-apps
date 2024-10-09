import { SidebarAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { SelectOption, Task, TaskStatusTable, ActionsButton, ButtonAction, TaskStatus, DocsLink, ControlledSelect } from '../../components';
import { appConfig } from '../../appConfig';
import { TranslationDto } from '../../types';
import { Flex, Note } from '@contentful/f36-components';
import { AppInstallationParameters } from '../ConfigScreen/ConfigScreen';
import { TranslationJobFormData, UpdateTranslationFormData } from '../Dialog';
import { useApi, useDialog } from '../../hooks';
import { css } from '@emotion/react';
import tokens from '@contentful/f36-tokens';
import { useForm, useWatch } from 'react-hook-form';

type SidebarFormData = {
  sourceLanguage: string;
};

type SelectedLocales = {
  selectedLocales: string[];
};

type RunningTaskActions = 'Translate' | 'Update' | 'Pause' | 'Resume' | 'Cancel';

export type SidebarComponentProps = {
  projectOptions?: SelectOption[];
  defaultLocale: string;
  tasks: Task[];
  isLoading: boolean;
  onTranslate: (data: TranslationJobFormData & SidebarFormData) => Promise<void>;
  onUpdate: (data: UpdateTranslationFormData & SelectedLocales) => Promise<void>;
  onCancel: (data: SelectedLocales) => Promise<void>;
  onPause: (data: SelectedLocales) => Promise<void>;
  onResume: (data: SelectedLocales) => Promise<void>;
};

const menuOpenClass = css({
  minHeight: 275,
});

export const SidebarComponent = ({
  projectOptions,
  defaultLocale,
  tasks: _tasks,
  isLoading,
  onTranslate,
  onUpdate,
  onCancel,
  onPause,
  onResume,
}: SidebarComponentProps) => {
  const { open } = useDialog();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isSelectable, setIsSelectable] = useState<(task: Task) => boolean>(() => () => true);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const { control, handleSubmit } = useForm<SidebarFormData>({ defaultValues: { sourceLanguage: defaultLocale } });

  const sourceLanguage = useWatch({ control, name: 'sourceLanguage' });
  const sourceLanguageOptions = useMemo(() => _tasks.map((task) => ({ label: task.displayName, value: task.targetLanguage })), [_tasks]);
  const tasks = useMemo(() => _tasks.filter((task) => task.targetLanguage !== sourceLanguage), [_tasks, sourceLanguage]);

  const handleTranslate = async (sidebarFormData: SidebarFormData) => {
    if (!projectOptions) return;
    const translationJobFormData: TranslationJobFormData | undefined = await open({
      type: 'translate',
      projectOptions: projectOptions,
      selectedLocales: [...selected],
    });
    if (!translationJobFormData) return;
    setSelected(new Set());
    await onTranslate({ ...translationJobFormData, ...sidebarFormData });
  };

  const handleUpdate = async () => {
    const dueTimes = [...selected]
      .map((locale) => {
        const dueDate = tasks.find((task) => task.targetLanguage === locale)?.dueDate;
        if (dueDate) return new Date(dueDate).getTime();
      })
      .filter((dueTime) => dueTime !== undefined && dueTime > Date.now() + 86400000) as number[];
    let earliestDueTime: number | undefined;
    if (dueTimes.length) earliestDueTime = dueTimes.reduce((prevTime, nextTime) => Math.min(prevTime, nextTime));
    const data: UpdateTranslationFormData | undefined = await open({
      type: 'update',
      dueDate: new Date(earliestDueTime ?? Date.now() + 86400000).toISOString(),
    });
    if (!data) return;
    setSelected(new Set());
    await onUpdate({ ...data, selectedLocales: [...selected] });
  };

  const handleCancel = async () => {
    const confirmed: boolean | undefined = await open({
      type: 'confirm',
      title: 'Cancel',
      message: 'Are you sure that you want to cancel the selected translation tasks?',
    });
    if (!confirmed) return;
    setSelected(new Set());
    await onCancel({
      selectedLocales: [...selected],
    });
  };

  const handlePause = async () => {
    const confirmed: boolean | undefined = await open({
      type: 'confirm',
      title: 'Pause',
      message: 'Are you sure that you want to pause the selected translation tasks?',
    });
    if (!confirmed) return;
    setSelected(new Set());
    await onPause({
      selectedLocales: [...selected],
    });
  };

  const handleResume = async () => {
    const confirmed: boolean | undefined = await open({
      type: 'confirm',
      title: 'Resume',
      message: 'Are you sure that you want to resume the selected translation tasks?',
    });
    if (!confirmed) return;
    setSelected(new Set());
    await onResume({
      selectedLocales: [...selected],
    });
  };

  const actions: ButtonAction<RunningTaskActions>[] = [
    {
      variant: 'primary',
      label: 'Translate',
      onClick: handleSubmit(handleTranslate),
    },
    {
      variant: 'secondary',
      label: 'Update',
      onClick: handleUpdate,
    },
    {
      variant: 'secondary',
      label: 'Pause',
      onClick: handlePause,
    },
    {
      variant: 'secondary',
      label: 'Resume',
      onClick: handleResume,
    },
    {
      variant: 'negative',
      label: 'Cancel',
      onClick: handleCancel,
    },
  ];

  const handleSelectAction = (action: ButtonAction<RunningTaskActions>) => {
    setSelected(new Set());

    let validStatuses: TaskStatus[];
    if (action.label === 'Translate') validStatuses = ['cancelled', 'rejected', 'completed', 'completed-with-warnings', 'failed', 'not-translated'];
    if (action.label === 'Update') validStatuses = ['pending', 'confirmed', 'in-progress', 'paused'];
    if (action.label === 'Pause') validStatuses = ['confirmed', 'in-progress'];
    if (action.label === 'Resume') validStatuses = ['paused'];
    if (action.label === 'Cancel') validStatuses = ['confirmed', 'paused'];
    setIsSelectable(() => (task: Task) => validStatuses.includes(task.status));
  };

  if (!isLoading && tasks.length === 0)
    return <Note variant="negative">No locales found. Please configure at least one additional locale in your environment settings.</Note>;

  return (
    <>
      <Flex flexDirection="column" gap="spacingM" justifyContent="space-between" css={[isActionMenuOpen && menuOpenClass]}>
        <ControlledSelect
          options={sourceLanguageOptions}
          label="Source locale"
          helpText="Select the locale to translate from"
          name="sourceLanguage"
          control={control}
        />

        <div
          css={css({
            maxWidth: '100%',
            padding: 1,
            paddingBottom: 4,
            overflowY: 'auto',
            '&::-webkit-scrollbar': {
              height: 4,
            },

            '&::-webkit-scrollbar-track': {
              borderRadius: 2,
              backgroundColor: tokens.gray200,
            },
            '&::-webkit-scrollbar-thumb': {
              borderRadius: 2,
              backgroundColor: tokens.gray300,
            },
            '&::-webkit-scrollbar-thumb:hover': {
              backgroundColor: tokens.gray400,
            },
          })}>
          <TaskStatusTable tasks={tasks} isLoading={isLoading} selected={selected} onSelect={setSelected} isSelectable={isSelectable} />
        </div>
        <ActionsButton
          isFullWidth
          isDisabled={selected.size === 0}
          onSelect={handleSelectAction}
          onToggleOpen={setIsActionMenuOpen}
          actions={actions}
          placement="top-end"
          offset={[-1, 4]}
          delayOpen={100}
        />
      </Flex>
      <DocsLink path="/sidebar" style={{ marginTop: tokens.spacingM }}>
        Learn how to use the sidebar widget
      </DocsLink>
    </>
  );
};

export const Sidebar = () => {
  const sdk = useSDK<SidebarAppSDK<AppInstallationParameters>>();
  const { token, backendUrl } = sdk.parameters.installation;
  const api = useApi(backendUrl);
  const [projectOptions, setProjectOptions] = useState<SelectOption[]>();
  const [tasksByLocale, setTasksByLocale] = useState<Record<string, Task>>({});
  const [isLoading, setIsLoading] = useState(true);

  const setJob = useCallback(
    (job?: TranslationDto) => {
      const tasksByLocale = sdk.locales.available.reduce((acc: Record<string, Task>, locale) => {
        const lochubTask = job?.tasks.find((task) => task.targetLanguage === locale);
        let task: Task;
        if (lochubTask) task = { ...lochubTask, displayName: sdk.locales.names[locale] };
        else
          task = {
            status: 'not-translated',
            targetLanguage: locale,
            displayName: sdk.locales.names[locale],
          };
        return { ...acc, [locale]: task };
      }, {});
      setTasksByLocale(tasksByLocale);
    },
    [sdk],
  );

  useEffect(() => {
    sdk.window.startAutoResizer();
  }, [sdk]);

  useEffect(() => {
    const fetchProjects = async () => {
      const response = await api.projects.read({ generatedToken: token });
      return response.map((project) => ({ label: project.name, value: project.id }));
    };

    const fetchTranslationStatus = async () => {
      const response = await api.translations.read({
        generatedToken: token,
        spaceId: sdk.ids.space,
        environmentId: sdk.ids.environment,
        entryIds: [sdk.ids.entry],
      });
      const job = response.find((job) => job.entryId === sdk.ids.entry);
      return job;
    };

    let intervalId: NodeJS.Timeout;

    Promise.all([fetchProjects(), fetchTranslationStatus()])
      .then(([projectOptions, job]) => {
        setProjectOptions(projectOptions);
        setJob(job);
        setIsLoading(false);
        intervalId = setInterval(() => {
          fetchTranslationStatus()
            .then(setJob)
            .catch(() => {
              /* do nothing */
            });
        }, 5000);
      })
      .catch(() => {
        sdk.notifier.error(`Failed to connect to your ${appConfig.name} account. Please check the app configuration.`);
      });

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [setJob]);

  const sendAction = async ({ name, send, selectedLocales }: { name: string; send: () => Promise<TranslationDto[]>; selectedLocales: string[] }) => {
    try {
      const response = await send();
      sdk.notifier.success(`Successfully sent the ${name} action to your ${appConfig.name} account.`);

      const job = response.find((job) => job.entryId === sdk.ids.entry);
      if (!job) return;

      // only overwrite selected locales
      const newTasksByLocale = { ...tasksByLocale };
      for (const locale of selectedLocales) {
        const newTask = job?.tasks.find((task) => task.targetLanguage === locale);
        if (!newTask) continue;
        newTasksByLocale[locale] = {
          ...newTask,
          displayName: sdk.locales.names[locale],
        };
      }
      setTasksByLocale(newTasksByLocale);
    } catch {
      sdk.notifier.error(`Failed to send the ${name} action to your ${appConfig.name} account. Please check the app configuration.`);
    }
  };

  const handleTranslate = async (data: TranslationJobFormData & SidebarFormData) => {
    const send = () =>
      api.translations.create({
        generatedToken: token,
        recursive: data.sendRecursively,
        dueDate: data.dueDate.toISOString(),
        sourceLanguage: data.sourceLanguage,
        projectId: data.projectName,
        jobName: data.translationJobName,
        jobDescription: data.description,
        jobSubmitter: data.submitter,
        spaceId: sdk.ids.space,
        environmentId: sdk.ids.environment,
        entries: data.locales.map((locale) => ({
          entryId: sdk.ids.entry,
          targetLanguage: locale,
        })),
      });
    await sendAction({ name: 'translate', send, selectedLocales: data.locales });
  };

  const handleUpdate = async ({ selectedLocales, dueDate }: UpdateTranslationFormData & SelectedLocales) => {
    const send = () =>
      api.translations.update({
        generatedToken: token,
        spaceId: sdk.ids.space,
        environmentId: sdk.ids.environment,
        entries: selectedLocales.map((selectedLocale) => ({
          entryId: sdk.ids.entry,
          targetLanguage: selectedLocale,
        })),
        dueDate: dueDate.toISOString(),
      });
    await sendAction({ name: 'update', send, selectedLocales });
  };

  const handleCancel = async ({ selectedLocales }: SelectedLocales) => {
    const send = () =>
      api.translations.cancel({
        generatedToken: token,
        spaceId: sdk.ids.space,
        environmentId: sdk.ids.environment,
        entries: selectedLocales.map((selectedLocale) => ({
          entryId: sdk.ids.entry,
          targetLanguage: selectedLocale,
        })),
      });
    await sendAction({ name: 'cancel', send, selectedLocales });
  };

  const handlePause = async ({ selectedLocales }: SelectedLocales) => {
    const send = () =>
      api.translations.pause({
        generatedToken: token,
        spaceId: sdk.ids.space,
        environmentId: sdk.ids.environment,
        entries: selectedLocales.map((selectedLocale) => ({
          entryId: sdk.ids.entry,
          targetLanguage: selectedLocale,
        })),
      });
    await sendAction({ name: 'pause', send, selectedLocales });
  };

  const handleResume = async ({ selectedLocales }: SelectedLocales) => {
    const send = () =>
      api.translations.resume({
        generatedToken: token,
        spaceId: sdk.ids.space,
        environmentId: sdk.ids.environment,
        entries: selectedLocales.map((selectedLocale) => ({
          entryId: sdk.ids.entry,
          targetLanguage: selectedLocale,
        })),
      });
    await sendAction({ name: 'resume', send, selectedLocales });
  };

  return (
    <SidebarComponent
      projectOptions={projectOptions}
      defaultLocale={sdk.locales.default}
      tasks={Object.values(tasksByLocale)}
      isLoading={isLoading}
      onTranslate={handleTranslate}
      onUpdate={handleUpdate}
      onCancel={handleCancel}
      onPause={handlePause}
      onResume={handleResume}
    />
  );
};
