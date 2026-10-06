/** The installation parameters this app declares. One list, read by sync-parameters and show-definition. */

export interface DefinitionParameter {
  id: string;
  name: string;
  type: string;
  description?: string;
}

// There is no List or Object parameter type, so the two structured values are Symbols holding JSON.
export const PARAMETERS: DefinitionParameter[] = [
  {
    id: 'enabledTagGroups',
    name: 'Enabled tag groups',
    type: 'Symbol',
    description: 'JSON array of tag group names ("Group" in "Group: value") whose tags may be applied.',
  },
  {
    id: 'roleTagMapping',
    name: 'Role to tag mapping',
    type: 'Symbol',
    description: 'JSON object mapping a role ID in this space to the tag IDs applied to entries its members create.',
  },
  {
    id: 'cmaToken',
    name: 'CMA token',
    type: 'Secret',
    description: 'Personal access token used only to read space members and roles, which an app identity cannot.',
  },
];
