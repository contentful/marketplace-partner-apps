import React from "react";
import { Flex, Tooltip, Box, TextInput } from "@contentful/f36-components";
import { SearchIcon } from "@contentful/f36-icons";
import { css } from "emotion";
import tokens from "@contentful/f36-tokens";

interface Props {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
}

const ContentTypeSearchBar = ({ searchTerm, setSearchTerm }: Props) => {
  return (
    <Flex alignItems="center" gap="spacingS" marginBottom="spacingL">
      <Tooltip content="Search content types">
        <Box
          as="span"
          className={css({
            width: 32,
            height: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            background: tokens.gray100,
          })}
        >
          <SearchIcon variant="primary" size="small" />
        </Box>
      </Tooltip>
      <TextInput
        id="ctSearch"
        name="ctSearch"
        placeholder="Search content types…"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        size="medium"
        className={css({ flex: "1 1 0", maxWidth: "100%" })}
      />
    </Flex>
  );
};

export default ContentTypeSearchBar;
