// src/locations/page/components/PageShell.tsx
import React from "react";
import {
  Badge,
  Button,
  Flex,
  FormControl,
  Heading,
  Note,
  SectionHeading,
  Text,
  TextInput,
} from "@contentful/f36-components";

import { styles } from "../styles";

export function PageShell(props: {
  title: string;
  subtitle: string;

  configError?: string | null;

  query: string;
  onQueryChange: (v: string) => void;

  loading: boolean;
  nodeCount: number;

  onExpandAll: () => void;
  onCollapseAll: () => void;
  onRefresh?: () => void;

  children: React.ReactNode;
  topNotices?: React.ReactNode;
}) {
  const {
    title,
    subtitle,
    configError,
    query,
    onQueryChange,
    loading,
    nodeCount,
    onExpandAll,
    onCollapseAll,
    onRefresh,
    children,
    topNotices,
  } = props;

  return (
    <div className={styles.pageWrap}>
      <div className={styles.pageHeader}>
        <Heading as="h1" marginBottom="spacing2Xs">
          {title}
        </Heading>
        <Text fontColor="gray600">{subtitle}</Text>
      </div>

      <div className={styles.panel}>
        {configError && (
          <Note
            variant="negative"
            title="Configuration error"
            style={{ marginBottom: 12 }}
          >
            {configError}
          </Note>
        )}

        {topNotices}

        <FormControl className={styles.searchRow}>
          <FormControl.Label>Search paths</FormControl.Label>
          <FormControl.HelpText>
            Search by path or title (e.g., /news/foo)
          </FormControl.HelpText>
          <TextInput
            name="sitemapSearch"
            value={query}
            placeholder="Search paths… (e.g., /news/foo)"
            onChange={(e) => onQueryChange(e.target.value)}
          />
        </FormControl>

        <div className={styles.sectionRule} />

        <Flex
          alignItems="center"
          justifyContent="space-between"
          marginBottom="spacingM"
        >
          <Text fontColor="gray600">
            Showing <b>{loading ? "…" : nodeCount}</b> node
            {!loading && nodeCount === 1 ? "" : "s"}
          </Text>

          <Flex gap="spacingS">
            {onRefresh && (
              <Button
                size="small"
                variant="secondary"
                onClick={onRefresh}
                isDisabled={loading}
              >
                Refresh
              </Button>
            )}
            <Button
              size="small"
              variant="secondary"
              onClick={onExpandAll}
              isDisabled={loading}
            >
              Expand all
            </Button>
            <Button
              size="small"
              variant="secondary"
              onClick={onCollapseAll}
              isDisabled={loading}
            >
              Collapse all
            </Button>
          </Flex>
        </Flex>

        <Flex
          alignItems="center"
          justifyContent="space-between"
          marginBottom="spacingM"
        >
          <div className={styles.legendRow}>
            <Text fontColor="gray600">Status:</Text>
            <Badge variant="positive" size="small">
              Published
            </Badge>
            <Badge variant="warning" size="small">
              Draft
            </Badge>
            <Badge variant="primary" size="small">
              Changed
            </Badge>
          </div>

          <Text fontColor="gray500" fontSize="fontSizeS">
            Tip: click the info icon to see the full path
          </Text>
        </Flex>

        <div
          className={styles.sectionRule}
          style={{ marginTop: 8, marginBottom: 12 }}
        />

        <SectionHeading marginBottom="spacingS">Sitemap</SectionHeading>

        <div className={styles.listContainer}>
          <div className={styles.treeBody}>{children}</div>
        </div>
      </div>
    </div>
  );
}
