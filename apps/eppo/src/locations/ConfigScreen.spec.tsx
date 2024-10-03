/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import { mockCma, mockSdk } from '../../test/mocks';
import * as apiHelpers from '../helpers/api-request';
import ConfigScreen, { ConfigOptionsDto } from './ConfigScreen';

jest.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

const FAKE_API_KEY = 'FAKE_API_KEY';

describe('Config Screen component', () => {
  const getDropdownByLabel = (label: string): HTMLElement => {
    const group = screen
      .getAllByRole('group')
      .find((group) => within(group).queryAllByText(label).length === 1);
    if (!group) {
      throw new Error(`Form group not found with label "${label}"`);
    }
    return within(group).getByRole('combobox');
  };

  describe('for a fresh install', () => {
    it('should load config options when an api key is supplied', async () => {
      const fakeEntities: ConfigOptionsDto['entities'] = [
        {
          id: 1,
          name: 'First Entity',
        },
        {
          id: 2,
          name: 'Second Entity',
        },
      ];

      const fakeAssignmentSourcesByEntityId: ConfigOptionsDto['assignmentSourcesByEntityId'] = {
        1: [
          {
            id: 11,
            name: 'First Assignment Source - Entity 1',
          },
          {
            id: 12,
            name: 'Second Assignment Source - Entity 1',
          },
        ],
        2: [
          {
            id: 21,
            name: 'First Assignment Source - Entity 2',
          },
          {
            id: 22,
            name: 'Second Assignment Source - Entity 2',
          },
        ],
      };

      jest.spyOn(apiHelpers, 'unsignedApiRequest').mockImplementation((apiKey: string) => {
        if (apiKey === FAKE_API_KEY) {
          return Promise.resolve<ConfigOptionsDto>({
            entities: fakeEntities,
            assignmentSourcesByEntityId: fakeAssignmentSourcesByEntityId,
          });
        } else {
          return Promise.reject('Unauthorized');
        }
      });

      act(() => {
        render(<ConfigScreen />);
      });

      const apiKeyInput = screen.getByTestId('api-key');
      await userEvent.click(apiKeyInput);
      await userEvent.type(apiKeyInput, FAKE_API_KEY);
      await userEvent.click(getDropdownByLabel('Default randomization entity'));
      expect(await screen.findByText('First Entity')).toBeInTheDocument();
      expect(await screen.findByText('Second Entity')).toBeInTheDocument();
    });
  });
});
