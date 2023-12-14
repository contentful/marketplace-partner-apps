import React from 'react';
import PropTypes from 'prop-types';

export function InfoBlock(props) {
  const { children, className } = props;
  const classes = `f36-font-size--m f36-padding-bottom--xs ${className}`;

  return <div className={classes}>{children}</div>;
}

InfoBlock.propTypes = {
  children: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  className: PropTypes.string
};
