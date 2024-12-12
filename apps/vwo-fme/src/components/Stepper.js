import React from 'react';
import { Flex, Text } from '@contentful/f36-components';
import { css } from 'emotion';
import tokens from '@contentful/f36-tokens';

const styles = {
  stepperContainer: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '20px',
    position: 'relative',
    width: '100%'
  }),
  step: css({
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'column',
    position: 'relative',
    width: '120px',
  }),
  circle: css({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: '50%',
    width: '32px',
    height: '32px',
    backgroundColor: tokens.colorWhite,
    border: `2px solid ${tokens.gray400}`,
    color: tokens.gray400,
    fontSize: tokens.fontSizeM,
    fontWeight: tokens.fontWeightDemiBold,
  }),
  circleCompleted: css({
   backgroundColor: tokens.blue600,
   color: tokens.colorWhite,
   border: `2px solid ${tokens.blue600}`,
  }),
  circleActive: css({
   color: tokens.blue600,
   border: `2px solid ${tokens.blue600}`,
  }),
  circleInactive: css({
    backgroundColor: tokens.colorWhite,
    border: `2px solid ${tokens.gray400}`,
    color: tokens.gray400,
  }),
  line: css({
    position: 'absolute',
    top: '18px', // Aligns with the middle of the circle
    left: '44.5%',
    height: '2px',
    backgroundColor: tokens.blue600,
  }),
  text: css({
    marginTop: tokens.spacingXs,
    fontSize: tokens.fontSizeM,
  }),
};

const Stepper = ({currentStep}) => {

   const getClassNameForStep1 = () => {
      if(currentStep === 1){
         return `${styles.circle} ${styles.circleActive}`;
      }
      return `${styles.circle} ${styles.circleCompleted}`;
   }

   const getClassNameForStep2 = () => {
      if(currentStep === 1){
         return `${styles.circle} ${styles.circleInactive}`;
      }
      else if(currentStep === 2){
         return `${styles.circle} ${styles.circleActive}`;
      }
      return `${styles.circle} ${styles.circleCompleted}`;
   }

  return (
    <Flex className={styles.stepperContainer}>
      {/* Step 1: Configuration */}
      <div className={styles.step}>
        <div className={getClassNameForStep1()}>1</div>
        <Text className={styles.text}>Configuration</Text>
      </div>

      {/* Connecting Line */}
      <div className={styles.line} style={{ width: '100px' }}></div>

      {/* Step 2: Installation */}
      <div className={styles.step}>
        <div className={getClassNameForStep2()}>2</div>
        <Text className={styles.text}>Installation</Text>
      </div>
    </Flex>
  );
};

export default Stepper;
