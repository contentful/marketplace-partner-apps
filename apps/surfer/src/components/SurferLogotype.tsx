import { css } from '@emotion/css';
import { Flex } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import SurferLogotypeSvg from '../assets/surfer_logotype.svg';

const styles = css({
  height: tokens.spacing4Xl,
});

export const SurferLogotype = () => (
  <Flex justifyContent="center" alignItems="center" margin="spacing4Xl">
    <img className={styles} src={SurferLogotypeSvg} alt={'Surfer logotype'} />
  </Flex>
);
