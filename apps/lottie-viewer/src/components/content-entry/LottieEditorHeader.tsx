import React, { ReactNode } from 'react'
import { Flex } from '@contentful/f36-components'
import tokens from '@contentful/f36-tokens'
import { css } from 'emotion'

interface LottieEditorHeaderProps {
  children?: ReactNode
  additionalStyles?: any
}

export default function LottieEditorHeader({ children, additionalStyles }: LottieEditorHeaderProps) {
  return (
    <Flex
      justifyContent="space-between"
      alignItems="center"
      gap="spacingS"
      className={
        css({
          width: '100%',
          backgroundColor: tokens.gray400,
          padding: '8px',
          minHeight: '56px',
          maxHeight: '56px',
          ...additionalStyles
        })}
    >
      {children}
    </Flex>
  )
}