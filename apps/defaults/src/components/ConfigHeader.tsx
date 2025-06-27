import { ConfigAppSDK } from "@contentful/app-sdk";
import {
  Heading,
  Paragraph,
  Flex,
  Note,
  Tooltip,
  Box,
  IconButton,
} from "@contentful/f36-components";
import { ReleaseIcon } from "@contentful/f36-icons";
import tokens from "@contentful/f36-tokens";
import { getFunctionLogsUrl } from "../utils";

interface Props {
  sdk: ConfigAppSDK;
}

const ConfigHeader = ({ sdk }: Props) => {
  return (
    <Box
      style={{
        background: tokens.gray100,
        borderBottom: `1px solid ${tokens.gray200}`,
        width: "100%",
      }}
    >
      <Box padding="spacingL" style={{ maxWidth: "1080px", margin: "0 auto" }}>
        <Flex
          alignItems="center"
          justifyContent="space-between"
          gap="spacingS"
          marginBottom="spacingL"
        >
          <Flex alignItems="center" gap="spacingS">
            <Heading marginBottom="none" style={{ fontSize: 36 }}>
              Get started
            </Heading>
          </Flex>
          <Tooltip content="View function logs">
            <IconButton
              as="a"
              href={getFunctionLogsUrl(sdk)}
              icon={<ReleaseIcon />}
              variant="secondary"
              size="small"
              aria-label="View function logs"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e: any) => e.stopPropagation()}
              style={{
                padding: "0 12px",
                gap: 4,
              }}
            >
              Logs
            </IconButton>
          </Tooltip>
        </Flex>
        <Paragraph marginBottom="spacingS">
          Defaults values app extends native web app functionality to allow you
          set default values for the Reference, JSON, and image field types.
          Additionally, you can assign dynamic values to the date field. This
          will resolve to a current date, including offsetting the current date
          by a desired number of days.
        </Paragraph>
        <Note>
          Note: The app here uses Contentful functions to populate values. The
          app does not support automatic retries or error notifications: if the
          field default values cannot be populated, you will have to revert to a
          manual content creation process.
        </Note>
      </Box>
    </Box>
  );
};

export default ConfigHeader;
