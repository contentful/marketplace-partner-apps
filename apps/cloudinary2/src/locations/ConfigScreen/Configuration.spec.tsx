import { fireEvent, render } from '@testing-library/react';
import { noop } from 'lodash';
import { describe, expect, it, vi } from 'vitest';
import { Configuration } from './Configuration';
import { AppInstallationParameters } from '../../types';
import userEvent from '@testing-library/user-event';

const installationParameters: AppInstallationParameters = {
  apiKey: 'key',
  cloudName: 'cloud',
  format: 'webp',
  maxFiles: 11,
  quality: 'auto:good',
  startFolder: 'start folder',
};

describe('Configuration', () => {
  it('renders fields correctly', () => {
    const { getByTestId } = render(<Configuration parameters={installationParameters} onParametersChange={noop} />);

    expect((getByTestId('config-cloudName') as HTMLInputElement).value).toBe('cloud');
    expect((getByTestId('config-apiKey') as HTMLInputElement).value).toBe('key');
    expect((getByTestId('config-maxFiles') as HTMLInputElement).value).toBe('11');
    expect((getByTestId('config-startFolder') as HTMLInputElement).value).toBe('start folder');
    expect((getByTestId('config-quality') as HTMLInputElement).value).toBe('auto:good');
    expect((getByTestId('config-format') as HTMLInputElement).value).toBe('webp');
  });

  it('max files number is parsed correctly', async () => {
    const onParametersChange = vi.fn();
    const { getByTestId } = render(<Configuration parameters={installationParameters} onParametersChange={onParametersChange} />);

    const input = getByTestId('config-maxFiles') as HTMLInputElement;
    await userEvent.type(input, '5'); // appending a 5

    expect(onParametersChange).toBeCalledWith({
      ...installationParameters,
      maxFiles: 115,
    });
  });

  it('max files default to 10', async () => {
    const onParametersChange = vi.fn();
    const { getByTestId } = render(<Configuration parameters={installationParameters} onParametersChange={onParametersChange} />);

    const input = getByTestId('config-maxFiles') as HTMLInputElement;
    await userEvent.clear(input);

    expect(onParametersChange).toBeCalledWith({
      ...installationParameters,
      maxFiles: 10,
    });
  });

  it('cloud name can be changed', async () => {
    const onParametersChange = vi.fn();
    const { getByTestId } = render(<Configuration parameters={installationParameters} onParametersChange={onParametersChange} />);

    const input = getByTestId('config-cloudName') as HTMLInputElement;
    await userEvent.type(input, 'y');

    expect(onParametersChange).toBeCalledWith({
      ...installationParameters,
      cloudName: 'cloudy',
    });
  });

  it('quality can be changed', async () => {
    const onParametersChange = vi.fn();
    const { getByTestId } = render(<Configuration parameters={installationParameters} onParametersChange={onParametersChange} />);

    const input = getByTestId('config-quality') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'auto:eco' } });

    expect(onParametersChange).toBeCalledWith({
      ...installationParameters,
      quality: 'auto:eco',
    });
  });
});
