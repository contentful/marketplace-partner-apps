import React from "react";
import { Checkbox as CheckboxType } from "../types/Checkbox";
import CheckboxBranch from "./CheckboxBranch";
import { Stack } from "@contentful/f36-components";

interface Props {
  placeholder: string;
  checkboxes: Array<CheckboxType>;
  onCheckboxClick: (id: string, selected: boolean) => void;
  onLabelClick: (id: string) => void;
}

const CheckboxTree = ({
  placeholder,
  checkboxes,
  onCheckboxClick,
  onLabelClick,
}: Props) => (
  <Stack
    flexDirection="column"
    alignItems={checkboxes.length ? "baseline" : "center"}
    spacing="spacingXs"
  >
    {checkboxes.length ? (
      checkboxes.map((box, i) => (
        <CheckboxBranch
          {...box}
          key={i}
          onCheckboxClick={onCheckboxClick}
          onLabelClick={onLabelClick}
        />
      ))
    ) : (
      <p>{placeholder}</p>
    )}
  </Stack>
);

export default CheckboxTree;
