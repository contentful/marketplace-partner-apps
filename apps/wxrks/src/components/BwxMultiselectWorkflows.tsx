import React from 'react';
import { FormControl, Grid, Badge } from '@contentful/f36-components';
import { SectionHeading } from '@contentful/f36-typography';
import { Multiselect } from '@contentful/f36-multiselect';
import { Workflow, WorkflowType } from '../interfaces';

const workflowsState: Workflow[] = [
  { key: WorkflowType.TRANSLATION, description: "TRANSLATION" },
  { key: WorkflowType.PROOFREADING, description: "PROOFREADING" },
  { key: WorkflowType.REVIEW, description: "REVIEW" },
  { key: WorkflowType.REVIEW_2, description: "REVIEW 2" },
  { key: WorkflowType.REVIEW_3, description: "REVIEW 3" },
  { key: WorkflowType.ICR, description: "ICR" },
  { key: WorkflowType.REGIONAL_APPROVAL, description: "REGIONAL APPROVAL" },
  { key: WorkflowType.ICR_2, description: "ICR 2" },
  { key: WorkflowType.WEB_QA, description: "WEB QA" },
  { key: WorkflowType.FEEDBACK_IMPLEMENTATION, description: "FEEDBACK IMPLEMENTATION" }
];

interface Props {
  workflowsValue: string[];
  hideTip: boolean;
  onInput: (data: string[]) => void;
}

function WorkflowMultiselect({ onInput, workflowsValue, hideTip } : Props) {
  const workflows = React.useMemo(() => workflowsState, []);
  
  const wValues = workflowsValue ? workflowsValue.map(w => w.replace("_", " ").toUpperCase()) : [];
  const [selected, setSelected] = React.useState<string[]>(wValues ?? []);
  const [hide] = React.useState<boolean>(hideTip ?? false);

  React.useEffect(() => {
    const selectedWorkflows = selected.map(w => w.replace(" ", "_").toUpperCase());
    onInput(selectedWorkflows);
  }, [selected, onInput]); 
  
  const handleSelectItem = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { checked, value } = event.target;
    if (checked) {
      setSelected((prevState) => [...prevState, value]);
    } else {
      setSelected((prevState) =>
      prevState.filter((space) => space !== value),
      );
    }
  };

  const toggleAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { checked } = event.target;
    if (checked) {
      setSelected(workflows.map(v => v.key));
    } else {
      setSelected([]);
    }
  };

  const areAllSelected = React.useMemo(() => {
    return workflows.every((element) => selected.includes(element.key));
  }, [selected, workflows]);

  return (
    <Grid>
      <FormControl style={{marginBottom: "0"}}>
        <FormControl.Label isRequired>Workflows</FormControl.Label>
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
          {workflows.map((workflow, index) => {
            const val = workflow.description
            return (
              <Multiselect.Option
                key={`${index}-${val}`}
                itemId={`${index}-workflow-${val}`}
                value={workflow.key}
                label={workflow.description}
                onSelectItem={handleSelectItem}
                isChecked={selected.includes(workflow.key)}
              />
            );
          })}
        </Multiselect>
        { !hide && (
          <Grid>
            <FormControl.HelpText>
              Please select at least one workflow to define the workflow in your projects on wxrks.
            </FormControl.HelpText>
            <FormControl.Counter />
          </Grid>)
        }
      </FormControl>
      
      {!hide && selected.length > 0 && (<SectionHeading marginBottom="none" marginTop="spacingS">Selected workflows</SectionHeading>)}
      
      {!hide && (
        <Grid
          columns="1fr 1fr 1fr"
          columnGap="spacingS"
          rowGap="spacingS"
          marginTop="spacingS">
          {selected.map((item) => (
            <Grid.Item key={item}>
              <Badge variant="primary-filled"><span style={{textTransform: "uppercase"}}>{item}</span></Badge>
            </Grid.Item>
          ))}
        </Grid>
      )}
    </Grid>
  );
}

export default WorkflowMultiselect;
