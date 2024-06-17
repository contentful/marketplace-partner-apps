import {
    Heading,
    SectionHeading,
    Flex,
    Button, Paragraph, TextLink,
} from "@contentful/f36-components";
import { timeOfDay } from "@/consts/timeOfDay";
import { Dispatch, SetStateAction } from "react";
import { ArrowForwardTrimmedIcon } from "@contentful/f36-icons";
import { AppScreens } from "@/type/types";

type WelcomeProps = {
  setAction: Dispatch<SetStateAction<AppScreens | null>>;
};

export function Welcome({ setAction }: WelcomeProps) {
  return (
    <>
      <Heading>Good {timeOfDay()},  </Heading>

      <SectionHeading marginTop="spacingL">
        What would you like to do?
      </SectionHeading>
        <Paragraph>
            <TextLink href={`https://support.bynder.com/hc/en-us/articles/17407625367954-Contentful-Integration-for-Content-Workflow`}>Click here</TextLink> to access our help documentation, or you can create a new template mapping, or view existing mappings.
        </Paragraph>

      <hr />

      <Flex marginTop="spacingM" flexDirection="column" gap="3rem">
        <Button
          variant="primary"
          endIcon={<ArrowForwardTrimmedIcon />}
          onClick={() => setAction(AppScreens.SelectTemplate)}
        >
          New template mapping
        </Button>

        <Button
          variant="secondary"
          endIcon={<ArrowForwardTrimmedIcon />}
          onClick={() => setAction(AppScreens.ViewAllMappings)}
        >
          View existing mappings
        </Button>
      </Flex>
    </>
  );
}
