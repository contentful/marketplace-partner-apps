import React, { useState } from 'react'
import { Button, Modal, Heading, Paragraph, Box, Flex } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';

type Props = {
  showLottiePreviewModal: boolean;
  onShowLottiePreviewModalChange: (showLottiePreviewModal: boolean) => void;
}

export default function LottiePreviewModal(props: Props) {
  const { showLottiePreviewModal: showLottiePreviewModal, onShowLottiePreviewModalChange } = props;

  return (
    <>
      <Modal onClose={() => onShowLottiePreviewModalChange(false)} isShown={showLottiePreviewModal}>
        {() => (
          <>
            <Modal.Header
              title="Modal title"
              subtitle="subtitle"
              onClose={() => onShowLottiePreviewModalChange(false)}
            >
              <Box>LOTTIE ANIMOATION</Box>
            </Modal.Header>
            <Modal.Content>
              <Heading>
                First entry published! It can now be fetched via the APIs
              </Heading>
              <Paragraph>
                To discover more about how to consume content from the APIs, go
                to Space Home.
              </Paragraph>
            </Modal.Content>
          </>
        )}
      </Modal>
    </>
  );
}
