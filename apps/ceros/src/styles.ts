import tokens from '@contentful/f36-tokens'
import { css } from '@emotion/css'

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

    folderRow: css({
        display: 'flex',
        alignItems: 'center',
        padding: `${tokens.spacingS} ${tokens.spacingM}`,
        cursor: 'pointer',
        borderBottom: `1px solid ${tokens.gray200}`,
        fontSize: tokens.fontSizeM,
        '&:last-child': {
            borderBottom: 'none',
        },
        '&:hover': {
            backgroundColor: tokens.gray100,
        },
    }),

    experienceGrid: css({
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: tokens.spacingM,
        marginTop: tokens.spacingS,
    }),

    experienceCard: css({
        border: `1px solid ${tokens.gray300}`,
        borderRadius: '4px',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
        '&:hover': {
            borderColor: tokens.colorPrimary,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
        },
    }),

    experienceThumbnail: css({
        width: '100%',
        height: '120px',
        objectFit: 'cover',
        display: 'block',
    }),

    experienceThumbnailPlaceholder: css({
        width: '100%',
        height: '120px',
        backgroundColor: tokens.gray200,
        display: 'block',
    }),

    experienceCardLabel: css({
        padding: `${tokens.spacingXs} ${tokens.spacingS}`,
        fontSize: tokens.fontSizeM,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    }),
}

export default styles
