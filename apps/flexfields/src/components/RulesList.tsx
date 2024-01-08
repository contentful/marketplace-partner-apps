import React, { useEffect, useState } from "react";
import { Flex, SectionHeading, Text } from "@contentful/f36-components";
import { css } from "emotion";
import { useCMA } from "@contentful/react-apps-toolkit";

import {
  DeleteIcon,
  EditIcon,
  ListBulletedIcon,
  ReferencesIcon,
} from "@contentful/f36-icons";
import { type Rule } from "../types/Rule";
import { getContentTypeName, getFieldName } from "../utils";

const RulesList = (props: any) => {
  const [allContentTypes, setAllContentTypes] = useState<any[]>([]);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const handleWindowResize = () => {
    setWindowWidth(window.innerWidth);
  };

  const cma = useCMA();

  useEffect(() => {
    cma.contentType
      .getMany({})
      .then((response) => {
        setAllContentTypes(response.items);
      })
      .catch((error) => {
        console.log(error);
      });
  }, [cma]);

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
            fontSize: 14,
            margin: 0,
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
                ...(
                  index === props.ruleToEditIndex ? {
                    backgroundColor: "#eee"
                  } : {}
                )
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
                    className={css({
                      color: "#444",
                      borderBottom: "1px dashed #333",
                      fontWeight: "bold",
                    })}
                  >
                    {getFieldName(
                      [rule.contentTypeField],
                      rule.contentType,
                      allContentTypes
                    ).join(", ") ?? rule.contentTypeField}
                  </span>{" "}
                  which{" "}
                  <span
                    className={css({
                      color: "#444",
                      borderBottom: "1px dashed #333",
                      fontWeight: "bold",
                    })}
                  >
                    {rule.condition}
                  </span>{" "}
                  {rule.condition !== "is not empty" &&
                  rule.condition !== "is empty" ? (
                    <>
                      {rule.condition !== "contains" && "to"}{" "}
                      <span
                        className={css({
                          color: "#444",
                          borderBottom: "1px dashed #333",
                          fontWeight: "bold",
                        })}
                      >
                        "{rule.conditionValue}"
                      </span>
                    </>
                  ) : null}{" "}
                  then in entity{" "}
                  <span
                    className={css({
                      color: "#444",
                      borderBottom: "1px dashed #333",
                      fontWeight: "bold",
                    })}
                  >
                    {/* {rule.targetEntity} */}
                    {getContentTypeName(rule.targetEntity, allContentTypes) ??
                      rule.contentType}
                    {rule.isForSameEntity ? " (Same Entry)" : ""}
                  </span>{" "}
                  hide the{" "}
                  <span
                    className={css({
                      color: "#444",
                      borderBottom: "1px dashed #333",
                      fontWeight: "bold",
                    })}
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
                      ...(index === props.ruleToEditIndex ? {
                        fill: "grey",
                      } : {
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
                      ...(index === props.ruleToEditIndex ? {
                        fill: "grey",
                      } : {
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
