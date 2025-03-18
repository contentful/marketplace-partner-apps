import { css } from "emotion"

export default function ConvoxLogo() {
    return <img src="https://img.convox.com/content/logos/png/logo-light-blue-on-ocean.png" className={styles.logo} data-testid="convox-logo"/>
}

const styles = {
    logo: css({
        width: '4rem',
        height: '4rem',
    })
}