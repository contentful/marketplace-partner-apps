import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import type { FlagshipAccount } from '@/types';


type Props = {
  accounts?: FlagshipAccount[];
  selectedAccount: FlagshipAccount | null;
  onChange: (next: FlagshipAccount | null) => void;
};


export const AccountSelector = ({ accounts, selectedAccount, onChange }: Props) => {
  const handleChange = (e: SelectChangeEvent<string>) => {
    const next = (accounts ?? []).find((a) => a.account_id === e.target.value) ?? null;
    onChange(next);
  };


  return (
    <FormControl fullWidth size="small">
      <InputLabel id="accounts-label">Account</InputLabel>
      <Select
        labelId="accounts-label"
        id="accounts"
        name="accounts"
        label="Account"
        value={selectedAccount?.account_id ?? ''}
        onChange={handleChange}
      >
        <MenuItem value="" disabled>
          Select an account
        </MenuItem>
        {(accounts ?? []).map((account) => (
          <MenuItem key={account.account_id} value={account.account_id}>
            {account.account_name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};