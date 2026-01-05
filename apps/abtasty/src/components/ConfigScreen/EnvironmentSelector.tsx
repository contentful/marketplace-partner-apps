import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import type { AccountEnvironment, FlagshipAccount } from '@/types';


type Props = {
  account: FlagshipAccount | null;
  selectedEnvironment?: AccountEnvironment;
  onChange: (next?: AccountEnvironment) => void;
};


export const EnvironmentSelector = ({ account, selectedEnvironment, onChange }: Props) => {
  const disabled = !account?.account_environments || account.account_environments.length === 0;


  const handleChange = (e: SelectChangeEvent<string>) => {
    const next = account?.account_environments.find((env) => env.id === e.target.value);
    onChange(next);
  };


  return (
    <FormControl fullWidth size="small">
      <InputLabel id="environment-label">Environment</InputLabel>
      <Select
        labelId="environment-label"
        id="environment"
        name="environment"
        label="Environment"
        value={selectedEnvironment?.id ?? ''}
        onChange={handleChange}
        disabled={disabled}
      >
        <MenuItem value="" disabled>
          Select an environment
        </MenuItem>
        {(account?.account_environments ?? []).map((env) => (
          <MenuItem key={env.id} value={env.id}>
            {env.environment}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};