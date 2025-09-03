export type User = {
  id: string;
  first_name: string;
  email: string;
  last_name: string;
};

export type AccountEnvironment = {
  id: string;
  is_main: boolean;
  environment: string;
  role: string;
};

export type FlagshipAccount = {
  account_id: string;
  account_name: string;
  account_environments: AccountEnvironment[];
};

export type Project = {
  id: string;
  name: string;
};

export type Campaign = {
  id: string;
  name: string;
  status: string;
  state: string;
  type: string;
  variation_id: string;
};

export type FlagEntry = {
  type: 'boolean';
  value: boolean;
};

export type Modifications = {
  type: 'FLAG' | 'JSON';
  value: Record<string, FlagEntry>;
};

export type Variation = {
  id: string;
  allocation: number;
  name: string;
  modifications: Modifications;
};
