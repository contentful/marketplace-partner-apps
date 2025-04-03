import React from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import { mockCma, mockSdk } from '../mocks';
import Sidebar from '@/locations/Sidebar';
import { useFieldValue } from '@contentful/react-apps-toolkit';
import { GrowthbookAPIContext } from '@/contexts/GrowthbookAPIContext';

jest.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,

  useFieldValue: jest.fn(),
}));

describe('Sidebar component', () => {
  describe('with the wrong content type', () => {
    beforeEach(() => {
      mockSdk.contentType = { name: 'super hero', sys: { id: 'superHero' } };
      mockSdk.ids.space = 'spaceId';
    });

    it('renders warning', () => {
      const { getByText } = render(<Sidebar />);
      expect(getByText('here')).toHaveAttribute('href', 'https://app.contentful.com/spaces/spaceId/content_types/superHero/sidebar_configuration');
    });
  });

  describe('with no experiment name', () => {
    beforeEach(() => {
      mockSdk.contentType = { name: 'Growthbook Experiment', sys: { id: 'growthbookExperiment' } };
      (useFieldValue as jest.Mock).mockImplementation((fieldId) => {
        if (fieldId === 'experiment') {
          return [];
        }
        if (fieldId === 'variationNames') {
          return [['Control', 'Variation A']];
        }
        if (fieldId === 'variations') {
          return [[{ id: 'control-tshirt' }, { id: 'variation-tshirt' }]];
        }
        if (fieldId === 'experimentName') {
          return ['', jest.fn()];
        }
        return [null, jest.fn()];
      });
    });

    it('disables the create button', () => {
      const { getByRole } = render(<Sidebar />);
      const button = getByRole('button', {
        name: 'Create New Experiment',
      }) as HTMLButtonElement;
      expect(button.disabled).toBe(true);
    });
  });

  describe('with no experiment name', () => {
    beforeEach(() => {
      mockSdk.contentType = { name: 'Growthbook Experiment', sys: { id: 'growthbookExperiment' } };
      (useFieldValue as jest.Mock).mockImplementation((fieldId) => {
        if (fieldId === 'experiment') {
          return [];
        }
        if (fieldId === 'variationNames') {
          return [[]];
        }
        if (fieldId === 'variations') {
          return [[]];
        }
        if (fieldId === 'experimentName') {
          return ['my experiment', jest.fn()];
        }
        return [null, jest.fn()];
      });
    });

    it('disables the create button', () => {
      const { getByRole } = render(<Sidebar />);
      const button = getByRole('button', {
        name: 'Create New Experiment',
      }) as HTMLButtonElement;
      expect(button.disabled).toBe(true);
    });
  });

  describe('with valid fields', () => {
    const setExperimentName = jest.fn();
    const setFormFeatureFlagId = jest.fn();
    const setFormTrackingKey = jest.fn();
    const setFormExperiment = jest.fn();

    beforeEach(() => {
      mockSdk.contentType = { name: 'Growthbook Experiment', sys: { id: 'growthbookExperiment' } };
      (useFieldValue as jest.Mock).mockImplementation((fieldId) => {
        if (fieldId === 'experiment') {
          return [undefined, setFormExperiment];
        }
        if (fieldId === 'variationNames') {
          return [['Control', 'Variation A']];
        }
        if (fieldId === 'variations') {
          return [[{ sys: { id: 'control-tshirt' } }, { sys: { id: 'variation-tshirt' } }]];
        }
        if (fieldId === 'experimentName') {
          return ['  my experiment  ', setExperimentName];
        }
        if (fieldId === 'featureFlagId') {
          return ['my-experiment', setFormFeatureFlagId];
        }
        if (fieldId === 'trackingKey') {
          return ['my-experiment', setFormTrackingKey];
        }
        console.log('test not handling fieldId', fieldId);
        return [null, jest.fn()];
      });
    });

    it('calls growthbook on button click', async () => {
      const mockExperiment = {
        id: 'exp-id',
        variations: [{ id: 'id1' }, { id: 'id2' }],
      };
      const mockCreateExperiment = jest.fn(async () => {
        return Promise.resolve({
          experiment: mockExperiment,
        });
      });
      const mockGrowthbookExperimentApi = {
        getExperiment: jest.fn(),
        createExperiment: mockCreateExperiment,
        updateExperiment: jest.fn(),
        serverUrl: 'http://mock-server-url',
        apiKey: 'mock-api-key',
        fetchWithAuth: jest.fn(),
        createFeatureFlag: jest.fn(),
        updateFeatureFlag: jest.fn(),
        deleteFeatureFlag: jest.fn(),
      };
      const { getByRole } = render(
        <GrowthbookAPIContext.Provider
          // @ts-ignore - a simplified experiment interface is enough to test.
          value={{ growthbookAPI: mockGrowthbookExperimentApi }}>
          <Sidebar />
        </GrowthbookAPIContext.Provider>
      );
      const button = getByRole('button', {
        name: 'Create New Experiment',
      }) as HTMLButtonElement;
      await act(async () => {
        fireEvent.click(button);
      });
      expect(setExperimentName).toHaveBeenCalledWith('my experiment');
      expect(setFormFeatureFlagId).toHaveBeenCalledWith('my-experiment');
      expect(setFormTrackingKey).toHaveBeenCalledWith('my-experiment');
    });
  });
});
