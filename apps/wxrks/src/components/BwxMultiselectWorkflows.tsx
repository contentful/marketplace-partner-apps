import React from 'react';
import { Badge, Flex, FormControl, Grid, Note, Spinner, Text } from '@contentful/f36-components';
import { Multiselect } from '@contentful/f36-multiselect';
import { Workflow } from '../interfaces';

interface Props {
  workflowsValue: string[];
  hideTip: boolean;
  onInput: (data: string[]) => void;
  workflowOptions?: Workflow[];
  workflowsLoading?: boolean;
  workflowsError?: boolean;
}

interface WorkflowOption extends Workflow {
  unavailable?: boolean;
}

const normalizeWorkflowCode = (value: string) => {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
};

const normalizeWorkflowValues = (values?: string[]) => {
  return Array.from(new Set((values ?? []).map(normalizeWorkflowCode).filter(Boolean)));
};

const workflowTitle = (workflow: WorkflowOption) => {
  const title = workflow.title || workflow.description || workflow.code.replace(/_/g, ' ');
  return workflow.unavailable ? `${title} (not available)` : title;
};

const sameValues = (left: string[], right: string[]) => {
  return left.length === right.length && left.every((value, index) => value === right[index]);
};

function WorkflowMultiselect({
  onInput,
  workflowsValue,
  hideTip,
  workflowOptions = [],
  workflowsLoading = false,
  workflowsError = false
}: Props) {
  const normalizedWorkflowValues = React.useMemo(
    () => normalizeWorkflowValues(workflowsValue),
    [workflowsValue]
  );

  const [selected, setSelected] = React.useState<string[]>(normalizedWorkflowValues);
  const [hide] = React.useState<boolean>(hideTip ?? false);

  React.useEffect(() => {
    setSelected((current) => sameValues(current, normalizedWorkflowValues) ? current : normalizedWorkflowValues);
  }, [normalizedWorkflowValues]);

  const workflows = React.useMemo(() => {
    return workflowOptions
      .map((workflow) => ({
        ...workflow,
        code: normalizeWorkflowCode(workflow.code)
      }))
      .filter((workflow) => workflow.code)
      .sort((left, right) => {
        const leftSequence = left.sequence ?? Number.MAX_SAFE_INTEGER;
        const rightSequence = right.sequence ?? Number.MAX_SAFE_INTEGER;

        if (leftSequence !== rightSequence) {
          return leftSequence - rightSequence;
        }

        return workflowTitle(left).localeCompare(workflowTitle(right));
      });
  }, [workflowOptions]);

  const workflowsByCode = React.useMemo(() => {
    return workflows.reduce((acc, workflow) => {
      acc.set(workflow.code, workflow);
      return acc;
    }, new Map<string, Workflow>());
  }, [workflows]);

  const unmatchedSelected = React.useMemo(() => {
    if (workflowsLoading) {
      return [];
    }

    return selected.filter((code) => !workflowsByCode.has(code));
  }, [selected, workflowsByCode, workflowsLoading]);

  const renderedWorkflows = React.useMemo(() => {
    return [
      ...workflows,
      ...unmatchedSelected.map((code) => ({
        code,
        title: code,
        unavailable: true
      }))
    ];
  }, [workflows, unmatchedSelected]);

  React.useEffect(() => {
    onInput(selected);
  }, [selected, onInput]);

  const handleSelectItem = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { checked, value } = event.target;
    if (checked) {
      setSelected((prevState) => Array.from(new Set([...prevState, value])));
    } else {
      setSelected((prevState) => prevState.filter((workflow) => workflow !== value));
    }
  };

  const toggleAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { checked } = event.target;
    if (checked) {
      setSelected(workflows.map((workflow) => workflow.code));
    } else {
      setSelected([]);
    }
  };

  const areAllSelected = React.useMemo(() => {
    return workflows.length > 0 && workflows.every((workflow) => selected.includes(workflow.code));
  }, [selected, workflows]);

  const selectedWorkflows = React.useMemo(() => {
    return selected.map((code) => {
      const workflow = workflowsByCode.get(code);
      return {
        code,
        label: workflow ? workflowTitle(workflow) : code,
        unavailable: !workflow
      };
    });
  }, [selected, workflowsByCode]);

  return (
    <Grid>
      <FormControl style={{ marginBottom: "0" }}>
        <FormControl.Label isRequired>Workflows</FormControl.Label>
        {workflowsLoading && (
          <Flex alignItems="center" gap="spacingXs" marginBottom="spacingXs">
            <Text fontColor="blue500" fontWeight="fontWeightDemiBold">Loading workflows</Text>
            <Spinner variant="primary" />
          </Flex>
        )}
        <Multiselect
          key="multiselect-workflows"
          currentSelection={selected}
          popoverProps={{ isFullWidth: true }}
        >
          <Multiselect.SelectAll
            itemId="multiselect-workflows"
            onSelectItem={toggleAll}
            isChecked={areAllSelected}
          />
          {renderedWorkflows.map((workflow, index) => {
            const label = workflowTitle(workflow);
            return (
              <Multiselect.Option
                key={`${workflow.code}-${index}`}
                itemId={`${index}-workflow-${workflow.code}`}
                value={workflow.code}
                label={label}
                onSelectItem={handleSelectItem}
                isChecked={selected.includes(workflow.code)}
              />
            );
          })}
        </Multiselect>
        {!hide && (
          <Grid>
            <FormControl.HelpText>
              Please select at least one workflow to define the workflow in your projects on wxrks.
            </FormControl.HelpText>
            <FormControl.Counter />
          </Grid>)
        }
      </FormControl>

      {workflowsError && (
        <Note style={{ marginTop: "10px" }} variant="warning">
          Could not load workflows from wxrks. Test the connection again before changing this configuration.
        </Note>
      )}

      {!workflowsLoading && workflows.length === 0 && !workflowsError && (
        <Note style={{ marginTop: "10px" }} variant="warning">
          No active workflows were found for this wxrks account.
        </Note>
      )}

      {unmatchedSelected.length > 0 && (
        <Note style={{ marginTop: "10px" }} variant="warning">
          Some saved workflows are not available in this wxrks account: {unmatchedSelected.join(', ')}.
        </Note>
      )}

      {!hide && selectedWorkflows.length > 0 && (
        <Flex flexDirection="column" gap="spacingXs" marginTop="spacingS">
          <Flex alignItems="center" gap="spacingXs">
            <Text fontWeight="fontWeightDemiBold">Selected workflows</Text>
            <Badge variant="primary">{selectedWorkflows.length}</Badge>
          </Flex>
          <Flex flexWrap="wrap" gap="spacingXs">
            {selectedWorkflows.map((workflow) => (
              <Badge
                key={workflow.code}
                variant={workflow.unavailable ? 'warning' : 'primary-filled'}
              >
                {workflow.label}
              </Badge>
            ))}
          </Flex>
        </Flex>
      )}
    </Grid>
  );
}

export default WorkflowMultiselect;
