export interface Checkbox {
  boldText?: boolean;
  checked: boolean;
  parentChecked?: boolean;
  id: string;
  text: string;
  childboxes: Array<Checkbox>;
}
