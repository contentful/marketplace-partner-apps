import { List, Note } from '@contentful/f36-components';
import { InstallParamsValidationErrors, InstanceParamsValidationErrors } from '../../types';

type Props = {
  installParamsValidationErrors: InstallParamsValidationErrors;
  instanceParamsValidationErrors: InstanceParamsValidationErrors;
};

export function ParamsValidationNotes({ installParamsValidationErrors, instanceParamsValidationErrors }: Props) {
  return (
    <>
      <ParamsValidationNote
        errors={installParamsValidationErrors}
        title="Uploadcare app install parameters are not valid"
      />
      <ParamsValidationNote
        errors={instanceParamsValidationErrors}
        title="Uploadcare app instance parameters are not valid"
      />
    </>
  );
}

function ParamsValidationNote({
  errors,
  title,
}: {
  errors: InstallParamsValidationErrors | InstanceParamsValidationErrors;
  title: string;
}) {
  if (Object.values(errors).every(e => !e)) {
    return null;
  }

  return (
    <Note variant="negative" title={title}>
      <List>
        {Object.entries(errors)
          .filter(e => e[1])
          .map(([k, v]) => (
            <List.Item key={k}>{v}</List.Item>
          ))}
      </List>
    </Note>
  );
}
