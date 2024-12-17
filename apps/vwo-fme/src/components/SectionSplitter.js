import React from 'react';
import { css } from 'emotion';

const styles = {
   splitter: css({
      marginTop: '30px',
      marginBottom: '30px',
      border: 0,
      height: '1px',
      backgroundColor: 'lightgrey'
   })
}

function SectionSplitter() {
  return (
    <hr className={styles.splitter}></hr>
  )
}

export default SectionSplitter;