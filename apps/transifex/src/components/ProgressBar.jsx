import React, { useState } from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import PropTypes from 'prop-types';
import { Popover, Box, Paragraph } from '@contentful/f36-components';

function ProgressBar({
  language, translated, reviewed, proofread,
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <span>{language}</span>
      <Popover isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <Popover.Trigger>
          <div
            className="progress-container"
            role="button"
            tabIndex={0}
            onClick={() => setIsOpen(!isOpen)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                setIsOpen(!isOpen);
              }
            }}
            aria-label="Progress Bar"
          >
            <div
              className="progress-bar translated"
              style={{ width: `${translated}%` }}
            />
            <div
              className="progress-bar reviewed"
              style={{ width: `${reviewed}%` }}
            />
            <div
              className="progress-bar proofread"
              style={{ width: `${proofread}%` }}
            />
          </div>
        </Popover.Trigger>
        <Popover.Content>
          <Box padding="spacingS">
            <Paragraph>
              <span className="bullet translated">&#9679;</span>
              Translated&nbsp;
              <b>
                {translated}
                %
              </b>
            </Paragraph>
            <Paragraph>
              <span className="bullet reviewed">&#9679;</span>
              Reviewed&nbsp;
              <b>
                {reviewed}
                %
              </b>
            </Paragraph>
            <Paragraph>
              <span className="bullet proofread">&#9679;</span>
              Proofread&nbsp;
              <b>
                {proofread}
                %
              </b>
            </Paragraph>
          </Box>
        </Popover.Content>
      </Popover>
    </>
  );
}

ProgressBar.propTypes = {
  language: PropTypes.string.isRequired,
  translated: PropTypes.number.isRequired,
  reviewed: PropTypes.number.isRequired,
  proofread: PropTypes.number.isRequired,
};

export default ProgressBar;
