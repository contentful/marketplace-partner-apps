import { Flex, Heading, Paragraph } from "@contentful/f36-components";
import ConvoxLogo from "./ConvoxLogo";
import { css } from "@emotion/css";
import tokens from "@contentful/f36-tokens";

const styles = {
    splitter: css({
        marginTop: tokens.spacingM,
        marginBottom: tokens.spacingL,
        border: 0,
        height: '1px',
        backgroundColor: tokens.gray300,
        width: '100%',
    }),
}

export default function ConvoxBranding() {
    return (
        <>
            <Flex flexDirection="row" alignItems="center" alignContent="center">
                <ConvoxLogo data-testid="convox-logo" /> <Heading marginLeft="spacingM" marginBottom="none" marginTop="none">Connect Convox</Heading>
            </Flex>
            <Paragraph marginTop="spacingS">
                Connect your Convox account to trigger builds directly from the Contentful Web App.
            </Paragraph>
            <hr className={styles.splitter} />
        </>
    );
}