import React, { useEffect, useState } from "react";
import { FieldAppSDK } from "@contentful/app-sdk";
import { Paragraph } from "@contentful/f36-components";
import { useSDK } from "@contentful/react-apps-toolkit";
import { JsonEditor } from "@contentful/field-editor-json";
import Lottie from "react-lottie-player";
import { Flex, Button, Collapse } from "@contentful/f36-components";

const Field = () => {
  const [lottieJson, setLottieJson] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  const sdk = useSDK();

  useEffect(() => {
    // This ensures our app has enough space to render
    sdk.window.startAutoResizer();

    // Get current value of the field so we can display it
    setLottieJson(sdk.field.getValue());
  }, [sdk.field, sdk.window]);

  useEffect(() => {
    sdk.window.startAutoResizer();

    sdk.field.onValueChanged((value) => {
      setLottieJson(value ? value : "");
    });
  }, [sdk.field, sdk.window]);

  return (
    <>
      <Flex justifyContent="flex-end">
        <Button variant="primary" onClick={() => setIsExpanded(!isExpanded)}>
          {isExpanded ? "Hide" : "Show"} JSON
        </Button>
      </Flex>
      <Flex flexDirection="row">
        <Lottie
          loop
          animationData={lottieJson}
          play
          style={{ width: 250, height: 250 }}
        />
        <Collapse isExpanded={isExpanded}>
          <JsonEditor field={sdk.field}></JsonEditor>
        </Collapse>
      </Flex>
    </>
  );
};

export default Field;
