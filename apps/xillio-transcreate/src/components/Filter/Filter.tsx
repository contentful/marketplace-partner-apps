import { Button, Menu, Flex, Text } from '@contentful/f36-components';
import { ChevronDownIcon } from '@contentful/f36-icons';
import tokens from '@contentful/f36-tokens';
import { FilterConditionProps, FilterProps } from './Filter.types';
import { ReactNode } from 'react';
import { css } from '@emotion/react';

const EmptyTrigger = ({ children }: { children: ReactNode }) => <>{children}</>;

export function Filter<ConditionValue extends string = string>({
  name,
  value,
  Trigger = EmptyTrigger,
  onClick,
  conditions,
  isDisabled = false,
}: FilterProps<ConditionValue>) {
  return (
    <Flex css={[css({ position: 'relative' }), isDisabled && css({ opacity: 0.5 })]}>
      <Button
        size="small"
        style={{
          boxShadow: 'none',
          fontWeight: 600,
          color: tokens.gray700,
          borderColor: tokens.gray300,
          borderRightWidth: 0,
          borderTopRightRadius: 0,
          borderBottomRightRadius: 0,
          backgroundColor: tokens.gray200,
          marginRight: -1,
          userSelect: 'none',
        }}
        css={[isDisabled ? css({ cursor: 'not-allowed' }) : css({ cursor: 'default' })]}>
        {name}
      </Button>
      {conditions && <ConditionSelect {...conditions} isDisabled={isDisabled} />}
      <Trigger>
        <Button
          size="small"
          style={{
            boxShadow: 'none',
            color: tokens.colorWhite,
            backgroundColor: tokens.colorPrimary,
            borderColor: tokens.colorPrimary,
            borderLeftWidth: 0,
            borderTopLeftRadius: 0,
            borderBottomLeftRadius: 0,
            marginLeft: -1,
            userSelect: 'none',
          }}
          css={[isDisabled && css({ cursor: 'not-allowed' })]}
          endIcon={<ChevronDownIcon />}
          onClick={() => {
            if (onClick && !isDisabled) onClick();
          }}>
          {value}
        </Button>
      </Trigger>
    </Flex>
  );
}

function ConditionSelect<ConditionValue extends string>({ isDisabled, options, selected, onSelect }: FilterConditionProps<ConditionValue>) {
  return (
    <Menu isOpen={isDisabled ? false : undefined}>
      <Flex alignItems="center" css={[css({ position: 'relative' }), isDisabled && css({ cursor: 'not-allowed' })]}>
        <div
          css={css({
            backgroundColor: tokens.gray200,
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            width: '50%',
            borderTop: `1px solid ${tokens.gray300}`,
            borderBottom: `1px solid ${tokens.gray300}`,
          })}
        />
        <Menu.Trigger>
          <Text
            fontSize="fontSizeS"
            lineHeight="lineHeightS"
            fontWeight="fontWeightMedium"
            css={[
              css({
                backgroundColor: tokens.colorWhite,
                cursor: 'pointer',
                position: 'relative',
                zIndex: 10,
                padding: '3px 10px',
                borderRadius: 11,
                color: tokens.colorPrimary,
                userSelect: 'none',
              }),
              isDisabled && css({ cursor: 'not-allowed' }),
            ]}>
            {selected}
          </Text>
        </Menu.Trigger>
        <div
          css={css({
            backgroundColor: tokens.colorPrimary,
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            width: '50%',
            borderTop: `1px solid ${tokens.colorPrimary}`,
            borderBottom: `1px solid ${tokens.colorPrimary}`,
          })}
        />
      </Flex>
      <Menu.List>
        {options.map((condition) => (
          <Menu.Item key={condition} onClick={() => onSelect(condition)}>
            {condition}
          </Menu.Item>
        ))}
      </Menu.List>
    </Menu>
  );
}
