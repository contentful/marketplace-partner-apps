import { css } from '@emotion/css';

const styles = {
    branding: css({
        display: 'block',
        position: 'absolute',
        zIndex: '-1',
        top: '0',
        width: '100%',
        height: '300px',
        backgroundColor: '#11495A',
      })
  }

export default function ConvoxBranding(){
    return (<div className={styles.branding} data-testid='convox-background-cover'></div>);
}
