import React from 'react'
import { Modal } from '@contentful/f36-components';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { css } from 'emotion';

type Props = {
  showLottiePreviewModal: boolean;
  onShowLottiePreviewModalChange: (showLottiePreviewModal: boolean) => void;
  lottieJson: any
}

export default function LottiePreviewModal(props: Props) {
  const { showLottiePreviewModal, onShowLottiePreviewModalChange, lottieJson } = props;

  return (
    <>
      <Modal size="fullscreen" onClose={() => onShowLottiePreviewModalChange(false)} isShown={showLottiePreviewModal}>
        {() => (
          <>
            <Modal.Header
              title="Lottie Preview - Animation"
              onClose={() => onShowLottiePreviewModalChange(false)}
              className={css({ display: 'flex', position: 'relative' })}
            />
            <Modal.Content>
              <DotLottieReact
                className={css({ height: '100%', width: '100%' })}
                key={JSON.stringify(lottieJson)}
                data={lottieJson}
                loop
                autoplay
              />
            </Modal.Content>
          </>
        )}
      </Modal>
    </>
  );
}
