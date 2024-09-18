import { Flex, Paragraph, Button } from "@contentful/f36-components";
import tokens from "@contentful/f36-tokens";
import { css } from "@emotion/react";

export type ConfirmDialogProps = {
    message: string;
    onClose: (data?: any) => void;
};

export const ConfirmDialog = ({ message, onClose }: ConfirmDialogProps) => {
    return (
        <Flex flexDirection="column">
            <Paragraph
                css={css({
                    padding: tokens.spacingM,
                    paddingLeft: tokens.spacingL,
                })}
                marginBottom="none"
            >
                {message}
            </Paragraph>

            <Flex
                justifyContent="flex-end"
                css={css({
                    gap: tokens.spacingS,
                    padding: `${tokens.spacingS} ${tokens.spacingM}`,
                })}
            >
                <Button size="small" onClick={() => onClose()}>
                    Cancel
                </Button>
                <Button variant="primary" size="small" onClick={() => onClose(true)}>
                    Submit
                </Button>
            </Flex>
        </Flex>
    );
};
