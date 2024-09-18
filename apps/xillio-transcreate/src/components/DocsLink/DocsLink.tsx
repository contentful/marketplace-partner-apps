import { TextLink, Flex } from "@contentful/f36-components";
import { HelpCircleIcon } from "@contentful/f36-icons";
import { DocsLinkProps } from "./DocsLink.types";
import { appConfig } from "../../appConfig";
import { css } from "@emotion/react";
import tokens from "@contentful/f36-tokens";

export const DocsLink = ({ path, children, ...props }: DocsLinkProps) => {
    return (
        <TextLink href={appConfig.docs.baseUrl + path} target="_blank" {...props}>
            <Flex
                alignItems="center"
                gap="spacing2Xs"
                css={css({
                    "&:hover svg": {
                        fill: tokens.blue700,
                    },
                })}
            >
                {children} <HelpCircleIcon size="tiny" />
            </Flex>
        </TextLink>
    );
};
