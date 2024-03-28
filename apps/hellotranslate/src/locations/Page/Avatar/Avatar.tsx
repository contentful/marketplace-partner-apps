import { Flex } from "@contentful/f36-components";
import { AvatarProps } from "./Avatar.types";

export const Avatar = ({ name, src }: AvatarProps) => {
    return (
        <Flex gap="spacingXs">
            <img src={src} alt="avatar" style={{ height: 20, width: 20, borderRadius: 10 }} />

            {name}
        </Flex>
    );
};
