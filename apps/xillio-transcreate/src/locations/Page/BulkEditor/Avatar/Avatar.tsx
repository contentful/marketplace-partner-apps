import { Flex } from "@contentful/f36-components";
import { AvatarProps } from "./Avatar.types";
import tokens from "@contentful/f36-tokens";
import { css } from "@emotion/react";

export const Avatar = ({ name, src }: AvatarProps) => {
    return (
        <Flex gap="spacingXs">
            <img
                src={src}
                alt="avatar"
                css={css({
                    boxShadow: tokens.boxShadowPositive,
                    height: 20,
                    width: 20,
                    borderRadius: 10,
                })}
            />

            {name}
        </Flex>
    );
};
