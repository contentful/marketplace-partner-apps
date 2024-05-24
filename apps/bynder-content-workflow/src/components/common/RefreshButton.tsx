import { Tooltip, Button } from "@contentful/f36-components";
import { CycleTrimmedIcon } from "@contentful/f36-icons";

export function RefreshButton({
  onClick,
  description,
  disabled,
}: {
  onClick: () => void;
  description: string;
  disabled?: boolean;
}) {
  return (
    <Tooltip content={description}>
      <Button isDisabled={disabled} style={{ paddingBottom: "4px"}} onClick={onClick} variant="secondary">
        <CycleTrimmedIcon />
      </Button>
    </Tooltip>
  );
}
