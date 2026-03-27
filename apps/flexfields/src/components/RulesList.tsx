import React, { useEffect, useState } from "react";
import { Flex, SectionHeading, Text } from "@contentful/f36-components";
import { css } from "@emotion/css";
import { useCMA } from "@contentful/react-apps-toolkit";
import { KeyValueMap } from "contentful-management";

import {
  DeleteIcon,
  EditIcon,
  ListBulletedIcon,
  ReferencesIcon,
} from "@contentful/f36-icons";
import { type Rule } from "../types/Rule";
import { getContentTypeName, getFieldName } from "../utils";

// CSS constants for repeated styles
const HIGHLIGHTED_TEXT_STYLE = css({
  color: "#444",
  borderBottom: "1px dashed #333",
  fontWeight: "bold",
});

/**
 * Parse a Contentful URN to extract space, environment, and entity IDs
 * Format: crn:contentful:::content:spaces/<space-id>/environments/<env-id>/entries/<entry-id>
 */
function parseUrn(urn: string): {
  spaceId: string;
  environmentId: string;
  entityId: string;
  entityType: 'entries' | 'assets';
} | null {
  const match = urn.match(
    /crn:contentful:::content:spaces\/([^/]+)\/environments\/([^/]+)\/(entries|assets)\/([^/]+)/
  );
  
  if (!match) {
    return null;
  }
  
  return {
    spaceId: match[1],
    environmentId: match[2],
    entityType: match[3] as 'entries' | 'assets',
    entityId: match[4],
  };
}

const RulesList = (props: any) => {
  const [allContentTypes, setAllContentTypes] = useState<any[]>([]);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [entryNames, setEntryNames] = useState<Record<string, string>>({});

  const handleWindowResize = () => {
    setWindowWidth(window.innerWidth);
  };

  const cma = useCMA();

  useEffect(() => {
    cma.contentType
      .getMany({})
      .then((response) => {
        setAllContentTypes(response.items);
      });
  }, [cma]);

  // Fetch entry names for all linkedEntryIds in rules
  useEffect(() => {
    const fetchEntryNames = async () => {
      // Collect all entry/asset IDs from rules with their type
      const itemsToFetch: Record<string, {
        type: 'entry' | 'asset' | 'resource',
        spaceId?: string,
        environmentId?: string
      }> = {};
      
      props.rules?.forEach((rule: Rule) => {
        const itemIds = rule.linkedEntryIds || (rule.linkedEntryId ? [rule.linkedEntryId] : []);
        const isAsset = rule.condition === "includes asset";
        
        itemIds.forEach(id => {
          // Check if this is a URN (cross-space reference)
          if (typeof id === 'string' && id.startsWith('crn:contentful')) {
            const urnInfo = parseUrn(id);
            if (urnInfo) {
              itemsToFetch[id] = {
                type: 'resource',
                spaceId: urnInfo.spaceId,
                environmentId: urnInfo.environmentId
              };
            }
          } else {
            // Regular entry/asset in current space
            itemsToFetch[id] = {
              type: isAsset ? 'asset' : 'entry'
            };
          }
        });
      });

      // Fetch entries/assets
      const names: Record<string, string> = {};
      
      for (const [id, info] of Object.entries(itemsToFetch)) {
        if (info.type === 'resource') {
          // Handle cross-space resource references
          try {
            const urnInfo = parseUrn(id);
            if (!urnInfo) {
              names[id] = id;
              continue;
            }
            
            const entityType = urnInfo.entityType === 'entries' ? 'Entry' : 'Asset';
            const truncatedId = urnInfo.entityId.substring(0, 8);
            names[id] = `External ${entityType} (${truncatedId}...)`;
            
          } catch (error) {
            names[id] = id;
          }
        } else if (info.type === 'asset') {
          // Fetch asset from current space
          try {
            const asset = await cma.asset.get({ assetId: id });
            const fields: KeyValueMap = asset.fields || {};
            
            let name = undefined;
            // For assets, try title first
            if (fields.title && typeof fields.title === 'object') {
              const locales = Object.keys(fields.title);
              if (locales.length > 0) {
                name = fields.title[locales[0]];
              }
            }
            
            // If no title, try fileName from file object
            if (!name && fields.file && typeof fields.file === 'object') {
              const locales = Object.keys(fields.file);
              if (locales.length > 0 && fields.file[locales[0]]?.fileName) {
                name = fields.file[locales[0]].fileName;
              }
            }
            
            names[id] = name || id;
          } catch (error) {
            names[id] = id;
          }
        } else {
          // Fetch entry from current space
          try {
            const entry = await cma.entry.get({ entryId: id });
            const fields = entry.fields || {};
            
            // Get the content type to find the displayField
            const entryContentTypeId = entry.sys.contentType.sys.id;
            const entryContentType = await cma.contentType.get({ contentTypeId: entryContentTypeId });
            const displayFieldId = entryContentType.displayField;
            
            let name = undefined;
            if (displayFieldId && fields[displayFieldId]) {
              const displayFieldValue = fields[displayFieldId];
              if (typeof displayFieldValue === 'object') {
                const locales = Object.keys(displayFieldValue);
                if (locales.length > 0) {
                  name = displayFieldValue[locales[0]];
                }
              }
            }
            
            names[id] = name || id;
          } catch (error) {
            names[id] = id;
          }
        }
      }
      
      setEntryNames(names);
    };

    if (props.rules?.length > 0) {
      fetchEntryNames();
    }
  }, [props.rules, cma]);

  useEffect(() => {
    // Add event listener for window resize
    window.addEventListener("resize", handleWindowResize);

    // Cleanup: remove event listener when component unmounts
    return () => {
      window.removeEventListener("resize", handleWindowResize);
    };
  }, []);

  return (
    <div>
      <Flex
        alignItems="center"
        gap="8px"
        className={css({ margin: "1rem 0 0" })}
      >
        <ListBulletedIcon />
        <SectionHeading
          className={css({
            fontSize: "14px !important",
            margin: "0 !important",
          })}
        >
          Current Rules
          <span
            className={css({
              fontSize: "0.8rem",
              color: "rgb(1, 71, 81);",
              marginLeft: "0.5rem",
            })}
          >
            ({props.rules.length} rule
            {props.rules.length !== 1 && "s"})
          </span>
        </SectionHeading>
      </Flex>

      {props.rules.length === 0 && (
        <p className={css({ marginTop: "1rem" })}>
          No rules yet. Add your first!
        </p>
      )}

      <Flex flexDirection="column" className={css({ maxWidth: "100vw" })}>
        <ul className={css({ paddingLeft: "0" })}>
          {props.rules.map((rule: Rule, index: React.Key) => (
            <li
              key={index}
              className={css({
                margin: "0.5rem 0",
                listStyle: "none",
                padding: "0.75rem 1rem",
                border: "1px solid #eee",
                borderRadius: "0.5rem",
                boxShadow: "rgba(0, 0, 0, 0.05) 0px 3px 8px;",
                maxWidth: `${windowWidth > 1550 ? "65vw" : "100vw"}`,
                transition: "all 0.2s ease-in-out",
                ":hover": {
                  boxShadow: "rgba(0, 0, 0, 0.1) 0px 3px 8px;",
                  transition: "all 0.2s ease-in-out",
                },
                ...(index === props.ruleToEditIndex
                  ? {
                      backgroundColor: "#eee",
                    }
                  : {}),
              })}
            >
              <Flex alignItems="center" justifyContent="space-between">
                <Text fontSize="fontSizeM" lineHeight="lineHeightL">
                  <ReferencesIcon /> If content type{" "}
                  <span
                    className={css({
                      fontWeight: "bold",
                      borderBottom: "1px dashed #333",
                    })}
                  >
                    "
                    {getContentTypeName(rule.contentType, allContentTypes) ??
                      rule.contentType}
                    "
                  </span>{" "}
                  has{" "}
                  <span
                    className={HIGHLIGHTED_TEXT_STYLE}
                  >
                    {getFieldName(
                      [rule.contentTypeField],
                      rule.contentType,
                      allContentTypes
                    ).join(", ") ?? rule.contentTypeField}
                  </span>{" "}
                  which{" "}
                  <span
                    className={HIGHLIGHTED_TEXT_STYLE}
                  >
                    {rule.condition}
                  </span>{" "}
                  {/* Display condition values based on condition type */}
                  {rule.condition !== "is not empty" &&
                  rule.condition !== "is empty" &&
                  rule.condition !== "is true" &&
                  rule.condition !== "is false" ? (
                    <>
                      {/* Between conditions show two values */}
                      {(rule.condition === "between" ||
                        rule.condition === "reference count between") && (
                        <>
                          between{" "}
                          <span
                            className={HIGHLIGHTED_TEXT_STYLE}
                          >
                            {rule.conditionValueMin}
                          </span>{" "}
                          and{" "}
                          <span
                            className={HIGHLIGHTED_TEXT_STYLE}
                          >
                            {rule.conditionValueMax}
                          </span>
                        </>
                      )}
                      {/* Includes entry shows entry ID(s) */}
                      {(rule.condition === "includes entry" || rule.condition === "includes asset") && (
                        <>
                          {(() => {
                            // Support both old (linkedEntryId) and new (linkedEntryIds) format
                            const entryIds = rule.linkedEntryIds || 
                              (rule.linkedEntryId ? [rule.linkedEntryId] : []);
                            const itemType = rule.condition === "includes asset" ? "asset" : "entry";
                            const itemTypePlural = rule.condition === "includes asset" ? "assets" : "entries";
                            return entryIds.length === 1 ? itemType : itemTypePlural;
                          })()}{" "}
                          <span
                            className={HIGHLIGHTED_TEXT_STYLE}
                          >
                            "
                            {(() => {
                              const entryIds = rule.linkedEntryIds || 
                                (rule.linkedEntryId ? [rule.linkedEntryId] : []);
                              // Map IDs to names (handles both regular and URN-based IDs)
                              const names = entryIds.map(id => entryNames[id] || id);
                              return names.join('", "');
                            })()}
                            "
                          </span>
                        </>
                      )}
                      {/* All other conditions with single value */}
                      {rule.condition !== "between" &&
                        rule.condition !== "reference count between" &&
                        rule.condition !== "includes entry" &&
                        rule.condition !== "includes asset" && (
                          <>
                            {rule.condition !== "contains" &&
                              rule.condition !== "includes" &&
                              "to"}{" "}
                            <span
                              className={HIGHLIGHTED_TEXT_STYLE}
                            >
                              "{rule.conditionValue}"
                            </span>
                          </>
                        )}
                    </>
                  ) : null}{" "}
                  then in entity{" "}
                  <span
                    className={HIGHLIGHTED_TEXT_STYLE}
                  >
                    {/* {rule.targetEntity} */}
                    {getContentTypeName(rule.targetEntity, allContentTypes) ??
                      rule.contentType}
                    {rule.isForSameEntity ? " (Same Entry)" : ""}
                  </span>{" "}
                  hide the{" "}
                  <span
                    className={HIGHLIGHTED_TEXT_STYLE}
                  >
                    "
                    {getFieldName(
                      rule.targetEntityField,
                      rule.targetEntity,
                      allContentTypes
                    ).join(", ") ?? rule.targetEntityField}
                    "
                  </span>{" "}
                  field(s)
                </Text>

                <span
                  className={css({
                    minWidth: "3.4rem",
                  })}
                >
                  <EditIcon
                    onClick={() => {
                      if (index !== props.ruleToEditIndex) {
                        props.setRuleToEditIndex(index);
                      }
                    }}
                    className={css({
                      marginLeft: "0.5rem",
                      width: "1.2rem",
                      height: "1.2rem",
                      ...(index === props.ruleToEditIndex
                        ? {
                            fill: "grey",
                          }
                        : {
                            cursor: "pointer",
                            transition: "all 0.2s ease-in-out",
                            ":hover": {
                              transform: "scale(1.1)",
                            },
                          }),
                    })}
                    alt="Edit Rule"
                    aria-label="Edit Rule"
                    title="Edit Rule"
                    role="img"
                  />
                  <DeleteIcon
                    onClick={() => {
                      if (index !== props.ruleToEditIndex) {
                        props.deleteRule(rule);
                      }
                    }}
                    className={css({
                      ...(index === props.ruleToEditIndex
                        ? {
                            fill: "grey",
                          }
                        : {
                            cursor: "pointer",
                            transition: "all 0.2s ease-in-out",
                            ":hover": {
                              fill: "red",
                              transform: "scale(1.1)",
                            },
                          }),
                      marginLeft: "0.5rem",
                      width: "1.2rem",
                      height: "1.2rem",
                    })}
                    alt="Delete Rule"
                    aria-label="Delete Rule"
                    title="Delete Rule"
                    role="img"
                  />
                </span>
              </Flex>
            </li>
          ))}
        </ul>
      </Flex>
    </div>
  );
};

export default RulesList;