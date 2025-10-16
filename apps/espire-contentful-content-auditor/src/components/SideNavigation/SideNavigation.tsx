"use client";

import React from "react";
import { Button, Flex } from "@contentful/f36-components";
import { PageIcon, AssetIcon, FolderOpenIcon } from "@contentful/f36-icons";

type ReportType = "entries" | "media" | "types";

type Props = {
  activeReport: ReportType;
  loadingState: ReportType | null;
  accessToken: string | null;
  setActiveReport: React.Dispatch<React.SetStateAction<ReportType>>;
  setShowContentTypeDropdown: (val: boolean) => void;
  resetReports: () => void;
  handleGenerateMediaReport: () => void;
  handleGenerateUnusedContentTypeReport: () => void;
};

const SideNavigation = ({
  activeReport,
  loadingState,
  accessToken,
  setActiveReport,
  setShowContentTypeDropdown,
  resetReports,
  handleGenerateMediaReport,
  handleGenerateUnusedContentTypeReport,
}: Props) => {
  return (
    <Flex
      gap="spacing2Xs"
      className="flex-design flex-direction left-side-menu flex-item-left border-right"
    >
      <Button
        variant={activeReport === "entries" ? "primary" : "secondary"}
        onClick={() => {
          setActiveReport("entries");
          setShowContentTypeDropdown(true);
          resetReports();
        }}
        isDisabled={!accessToken || loadingState !== null}
      >
        <span className="flex-design align-item-center">
          <PageIcon size="small" /> Unlinked Content Entries Report
        </span>
      </Button>

      <Button
        variant={activeReport === "media" ? "primary" : "secondary"}
        onClick={handleGenerateMediaReport}
        isLoading={loadingState === "media"}
        isDisabled={!accessToken || loadingState !== null}
      >
        <span className="flex-design align-item-center">
          <AssetIcon size="small" /> Media Report
        </span>
      </Button>

      <Button
        variant={activeReport === "types" ? "primary" : "secondary"}
        onClick={handleGenerateUnusedContentTypeReport}
        isLoading={loadingState === "types"}
        isDisabled={!accessToken || loadingState !== null}
      >
        <span className="flex-design align-item-center">
          <FolderOpenIcon size="small" /> Unused Content Types Report
        </span>
      </Button>
    </Flex>
  );
};

export default SideNavigation;
