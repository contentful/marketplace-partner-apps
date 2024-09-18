import { css } from "@emotion/react";
import tokens from "@contentful/f36-tokens";

export const Divider = () => {
    return (
        <hr
            css={css({
                width: "100%",
                margin: "auto",
                border: "none",
                borderTop: `1px solid ${tokens.gray300}`,
            })}
        />
    );
};
