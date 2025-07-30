import { render, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContentTypeProps } from 'contentful-management';
import { noop } from 'lodash';
import { describe, expect, it, vi } from 'vitest';
import { FieldSelector } from './FieldSelector';

const contentTypes = [
  {
    sys: { id: 'ct1' },
    name: 'CT1',
    fields: [
      { id: 'x', name: 'X', type: 'Symbol' },
      { id: 'y', name: 'Y', type: 'Object' },
    ],
  },
  {
    sys: { id: 'ct2' },
    name: 'CT2',
    fields: [{ id: 'foo', name: 'FOO', type: 'Text' }],
  },
  {
    sys: { id: 'ct3' },
    name: 'CT3',
    fields: [
      { id: 'bar', name: 'BAR', type: 'Object' },
      { id: 'baz', name: 'BAZ', type: 'Object' },
    ],
  },
] as ContentTypeProps[];

describe('FieldSelector', () => {
  it('shows no-content-types message for empty environment', () => {
    const { getByText } = render(<FieldSelector contentTypes={[]} selectedFields={{}} onSelectedFieldChanged={noop} space="space-1" environment="env-1" />);

    expect(getByText('no content types with JSON object')).toBeDefined();
  });

  it('shows no-content-types message for only incompatible content-types', () => {
    const { getByText } = render(
      <FieldSelector contentTypes={[contentTypes[1]]} selectedFields={{}} onSelectedFieldChanged={noop} space="space-1" environment="env-1" />,
    );

    expect(getByText('no content types with JSON object')).toBeDefined();
  });

  it('renders checkboxes in correct state', () => {
    const { getByTestId } = render(
      <FieldSelector
        contentTypes={contentTypes}
        selectedFields={{
          ct1: ['y'],
          ct3: ['baz'],
        }}
        onSelectedFieldChanged={noop}
        space="space-1"
        environment="env-1"
      />,
    );

    expect((within(getByTestId(`field-ct1-y`)).getByRole('checkbox') as HTMLInputElement).checked).toBeTruthy();
    expect((within(getByTestId(`field-ct3-bar`)).getByRole('checkbox') as HTMLInputElement).checked).toBeFalsy();
    expect((within(getByTestId(`field-ct3-baz`)).getByRole('checkbox') as HTMLInputElement).checked).toBeTruthy();
  });

  it('unchecking checkbox `onSelectedFieldChanged` correctly', async () => {
    const onSelectedFieldChanged = vi.fn();
    const { getByTestId } = render(
      <FieldSelector
        contentTypes={contentTypes}
        selectedFields={{
          ct1: ['y'],
          ct3: ['baz'],
        }}
        onSelectedFieldChanged={onSelectedFieldChanged}
        space="space-1"
        environment="env-1"
      />,
    );

    await userEvent.click(getByTestId(`field-ct1-y`));

    expect(onSelectedFieldChanged).toBeCalledWith({
      ct1: [],
      ct3: ['baz'],
    });
  });

  it('checking checkbox `onSelectedFieldChanged` correctly', async () => {
    const onSelectedFieldChanged = vi.fn();
    const { getByTestId } = render(
      <FieldSelector
        contentTypes={contentTypes}
        selectedFields={{
          ct1: ['y'],
          ct3: ['baz'],
        }}
        onSelectedFieldChanged={onSelectedFieldChanged}
        space="space-1"
        environment="env-1"
      />,
    );

    await userEvent.click(getByTestId(`field-ct3-bar`));

    expect(onSelectedFieldChanged).toBeCalledWith({
      ct1: ['y'],
      ct3: ['baz', 'bar'],
    });
  });
});
