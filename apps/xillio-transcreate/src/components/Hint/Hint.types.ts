import { IconProps, TooltipProps } from "@contentful/f36-components";
import { ComponentType } from "react";

export type HintProps = TooltipProps & {
    color?: string;
    Icon?: ComponentType<IconProps>;
};
