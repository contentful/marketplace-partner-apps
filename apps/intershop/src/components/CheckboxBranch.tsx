import React, { useCallback, useState, useEffect } from "react";
import { Checkbox as CheckboxType } from "../types/Checkbox";
import {
  Checkbox,
  Collapse,
  Flex,
  Stack,
  Text,
} from "@contentful/f36-components";
import { ChevronDownIcon, ChevronRightIcon } from "@contentful/f36-icons";

interface Props extends CheckboxType {
  parentHasExpanded?: boolean;
  depth?: number;
  onCheckboxClick: (id: string, selected: boolean) => void;
  onLabelClick: (id: string) => void;
}

const CheckboxBranch = ({
  boldText,
  parentHasExpanded = true,
  checked,
  depth = 0,
  id,
  text,
  childboxes,
  parentChecked = false,
  onCheckboxClick,
  onLabelClick,
}: Props) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasBeenExpanded, setHasBeenExpanded] = useState(false);
  const [isChecked, setIsChecked] = useState(checked);
  const [descendantBoxesChecked, setDescendantBoxesChecked] = useState<
    Array<boolean>
  >([]);

  const handleCheckboxOnClick = useCallback(() => {
    onCheckboxClick(id, isChecked);
  }, [id, isChecked, onCheckboxClick]);

  const handleLabelOnClick = useCallback(() => {
    onLabelClick(id);
    setIsExpanded((prevIsExpanded) => !prevIsExpanded);
  }, [id, onLabelClick]);

  const getDescendantBoxesChecked = useCallback(
    (descendantBoxes: Array<CheckboxType>) =>
      descendantBoxes.reduce<Array<boolean>>((acc, { checked, childboxes }) => {
        acc.push(checked);
        acc.push(...getDescendantBoxesChecked(childboxes));
        return acc;
      }, []),
    []
  );

  useEffect(() => {
    setDescendantBoxesChecked(getDescendantBoxesChecked(childboxes));
  }, [childboxes, getDescendantBoxesChecked]);

  useEffect(() => {
    if (descendantBoxesChecked.length) {
      if (
        !hasBeenExpanded &&
        parentHasExpanded &&
        descendantBoxesChecked.some((checked) => checked)
      ) {
        setIsExpanded(true);
        setHasBeenExpanded(true);
      }
    }
  }, [descendantBoxesChecked, hasBeenExpanded, id, parentHasExpanded]);

  useEffect(() => {
    setIsChecked(checked);
  }, [checked]);

  return (
    <>
      <Flex alignItems="center">
        <Checkbox
          isChecked={isChecked}
          onChange={handleCheckboxOnClick}
          isIndeterminate={
            descendantBoxesChecked.length
              ? descendantBoxesChecked.some((checked) => checked) &&
                !descendantBoxesChecked.every((checked) => checked)
              : false
          }
        />
        <Flex
          onClick={handleLabelOnClick}
          style={{ cursor: "pointer", display: "inline-flex" }}
          alignItems="center"
        >
          <Text
            fontWeight={boldText ? "fontWeightDemiBold" : "fontWeightNormal"}
          >
            {text}
          </Text>
          {childboxes.length ? (
            isExpanded ? (
              <ChevronDownIcon size="tiny" variant="secondary" />
            ) : (
              <ChevronRightIcon size="tiny" variant="secondary" />
            )
          ) : (
            ""
          )}
        </Flex>
      </Flex>

      {childboxes.length ? (
        <Collapse isExpanded={isExpanded}>
          <Stack
            flexDirection="column"
            alignItems="baseline"
            spacing="spacingXs"
            marginLeft="spacingXs"
          >
            {childboxes.map((box, i) => (
              <CheckboxBranch
                {...box}
                key={i}
                depth={depth + 1}
                parentChecked={isChecked}
                onCheckboxClick={onCheckboxClick}
                onLabelClick={onLabelClick}
                parentHasExpanded={isExpanded}
              />
            ))}
          </Stack>
        </Collapse>
      ) : (
        <></>
      )}
    </>
  );
};

export default CheckboxBranch;
