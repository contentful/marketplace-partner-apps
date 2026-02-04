// src/components/Reports/GenerateUnusedContentTypesView.tsx
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Checkbox,
  Button,
  Heading,
  Flex,
  Spinner,
  Subheading,
  ModalConfirm,
} from "@contentful/f36-components";
import { useState } from "react";
import PaginationControl from "../../locations/PaginationWithTotal";
import { formatDistanceToNow } from "date-fns";
type Props = {
  unusedContentTypes: any[];
  isLoading: boolean;
  selectedTypes: string[];
  toggleTypeSelection: (id: string) => void;
  handleDeleteTypes: () => void;
};

const GenerateUnusedContentTypesReport = ({
  unusedContentTypes,
  isLoading,
  selectedTypes,
  toggleTypeSelection,
  handleDeleteTypes,
}: Props) => {
  const [page, setPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [showConfirm, setShowConfirm] = useState(false);
  if (isLoading) {
    return (
      <Flex justifyContent="center" alignItems="center" padding="spacingL">
        <Spinner size="large" />
      </Flex>
    );
  }

  if (!unusedContentTypes || unusedContentTypes.length === 0) {
    return null;
  }

  const paginatedTypes = unusedContentTypes.slice(
    page * itemsPerPage,
    (page + 1) * itemsPerPage
  );
  const paginatedIds = paginatedTypes.map((e) => e.sys.id);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const toAdd = paginatedIds.filter((id) => !selectedTypes.includes(id));
      toAdd.forEach((id) => toggleTypeSelection(id));
    } else {
      paginatedIds.forEach((id) => {
        if (selectedTypes.includes(id)) toggleTypeSelection(id);
      });
    }
  };

  return (
    <>
      <Heading className="h1" marginBottom="spacingM">
        Unused Content Types        
      </Heading>
      <Subheading>
          Identify content types with no associated entries and delete one or
          multiple types to keep your content model clean.
        </Subheading>

      <Flex justifyContent="space-between" marginBottom="spacingM">
         <ModalConfirm
          isShown={showConfirm}
          onConfirm={() => {
            handleDeleteTypes();
            setShowConfirm(false);
          }}
          onCancel={() => setShowConfirm(false)}
          title="Confirm Delete"
          intent="negative"
          confirmLabel="Yes, Delete"
          cancelLabel="No"
        >
          Are you sure you want to delete the selected <strong>Content Type</strong>? This action cannot be undone.
        </ModalConfirm>
        <Button
          variant="negative"
          isDisabled={selectedTypes.length === 0}
          onClick={() => setShowConfirm(true)}
        >
          <span className="flex-design align-item-center">Delete Selected</span>
        </Button>
      </Flex>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>
              <Checkbox
                isChecked={paginatedIds.every((id) =>
                  selectedTypes.includes(id)
                )}
                onChange={(e) => handleSelectAll(e.target.checked)}
                aria-label="Select All"
              />
            </TableCell>
            <TableCell>Name</TableCell>
            <TableCell>Fields</TableCell>
            <TableCell>Updated</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {paginatedTypes.map((type) => (
            <TableRow
              key={type?.sys?.id}
              onClick={() => {
                const urn = type?.sys?.urn;
                if (urn && urn.includes("content:")) {
                  const url = `https://app.contentful.com/${
                    urn.split("content:")[1]
                  }`;
                  window.open(url, "_blank");
                }
              }}
              style={{ cursor: "pointer" }}
            >
              <TableCell>
                <Checkbox
                  isChecked={selectedTypes.includes(type?.sys?.id)}
                  onChange={() => toggleTypeSelection(type?.sys?.id)}
                  onClick={(e) => e.stopPropagation()}
                  aria-label={`Select ${type?.sys?.id}`}
                />
              </TableCell>
              <TableCell>{type?.name || type?.sys?.id}</TableCell>
              <TableCell>{type?.fields?.length}</TableCell>
              <TableCell>
                {type?.sys?.updatedAt
                  ? formatDistanceToNow(new Date(type?.sys?.updatedAt), {
                      addSuffix: true,
                    })
                  : ""}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <PaginationControl
        page={page}
        itemsPerPage={itemsPerPage}
        totalItems={unusedContentTypes?.length}
        onPageChange={setPage}
        onViewPerPageChange={(count) => {
          setPage(Math.floor((itemsPerPage * page + 1) / count));
          setItemsPerPage(count);
        }}
      />
    </>
  );
};

export default GenerateUnusedContentTypesReport;
