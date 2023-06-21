import tokens from '@contentful/f36-tokens'
import { css } from 'emotion'

const styles = {
    body: css({
        height: 'auto',
        minHeight: '65vh',
        margin: '0 auto',
        marginTop: tokens.spacingXl,
        padding: `${tokens.spacingXl} ${tokens.spacing2Xl}`,
        maxWidth: tokens.contentWidthText,
        backgroundColor: tokens.colorWhite,
        zIndex: 2,
        boxShadow: '0px 0px 20px rgba(0, 0, 0, 0.1)',
        borderRadius: '2px',
    }),

    logo: css({
        display: 'flex',
        justifyContent: 'center',
        marginBottom: tokens.spacing2Xl,
    }),

    experienceEmbed: css({
        marginTop: tokens.spacing2Xl,
    }),
}

export default styles
