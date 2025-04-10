import React, { ReactNode } from 'react'
import { Flex } from '@contentful/f36-components'
import tokens from '@contentful/f36-tokens'

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
      style={{ width: '100%', backgroundColor: tokens.gray400, padding: '8px', height: '56px', ...additionalStyles }}
    >
      {children}
    </Flex>
  )
}