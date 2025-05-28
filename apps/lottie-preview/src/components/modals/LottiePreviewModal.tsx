import React from 'react';
import { Box, Button, Modal } from '@contentful/f36-components';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { css } from 'emotion';
import tokens from '@contentful/f36-tokens';
import { styles } from '@src/components/modals/LottiePreviewModal.styles';

type Props = {
  showLottiePreviewModal: boolean;
  onShowLottiePreviewModalChange: (showLottiePreviewModal: boolean) => void;
  lottieJson: any;
};

export default function LottiePreviewModal(props: Props) {
  const { showLottiePreviewModal, onShowLottiePreviewModalChange, lottieJson } = props;

  return (
    <Modal
      size="fullscreen"
      onClose={() => onShowLottiePreviewModalChange(false)}
      isShown={showLottiePreviewModal}
    >
      {() => (
        <>
          <Modal.Header
            title="Lottie Preview - Animation"
            onClose={() => onShowLottiePreviewModalChange(false)}
            className={css({ display: 'flex', position: 'relative' })}
          />
          <Modal.Content className={styles.modalContentContainer}>
            <Box className={styles.lottieAnimatorContainer}>
              <Box className={styles.greyBar} />
              <Box className={styles.lottieReactContainer}>
                <DotLottieReact
                  className={styles.dotLottieReact}
                  key={JSON.stringify(lottieJson)}
                  data={lottieJson}
                  loop
                  autoplay
                />
              </Box>
            </Box>
            <Box className={styles.buttonContainer}>
              <Button
                className={css({ maxHeight: '36px', minHeight: '36px' })}
                variant='primary'
                onClick={() => onShowLottiePreviewModalChange(false)}
              >
                Close
              </Button>
            </Box>
          </Modal.Content>
        </>
      )}
    </Modal>
  );
}
