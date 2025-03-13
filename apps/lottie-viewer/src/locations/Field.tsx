import React, { useEffect, useState } from 'react';
import { FieldAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { JsonEditor } from '@contentful/field-editor-json';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { Flex, Button, Collapse, Paragraph } from '@contentful/f36-components';

const Field = () => {
  const [lottieJson, setLottieJson] = useState<any>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  const sdk = useSDK<FieldAppSDK>();

  useEffect(() => {
    // This ensures our app has enough space to render
    sdk.window.startAutoResizer();

    // Get current value of the field so we can display it
    const value = sdk.field.getValue();
    setLottieJson(value);

    // Subscribe to field value changes
    sdk.field.onValueChanged((newValue) => {
      console.log('Seting new lottie value to ==>', newValue);
      setLottieJson(newValue);
    });
  }, [sdk.field, sdk.window]);

  return (
    <Flex flexDirection="column">
      <Flex>
        <Button variant="primary" onClick={() => setIsExpanded(!isExpanded)}>
          {isExpanded ? 'Hide' : 'Show/Edit'} JSON
        </Button>
      </Flex>
      <Flex flexDirection="column" alignItems="center">
        <DotLottieReact data={lottieJson} loop autoplay></DotLottieReact>
        <Collapse isExpanded={isExpanded}>
          <JsonEditor field={sdk.field} isInitiallyDisabled={false}></JsonEditor>
        </Collapse>
      </Flex>
    </Flex>
  );
};

export default Field;
