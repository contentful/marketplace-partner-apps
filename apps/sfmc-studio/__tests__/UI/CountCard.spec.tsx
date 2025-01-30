import { Provider } from 'react-redux';
import CountCard from '@/components/UI/CountCard';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import configureStore from 'redux-mock-store';
import { formatInput } from '@/lib/utils/common';
import svgIcons from '@/lib/utils/icons';
import style from '@/components/UI/countCard.module.scss'; // Adjust path as necessary

const mockStore = configureStore([]);

const initialState = {
  themeSlice: {
    theme: 'light',
  },
};

// Mock external modules
jest.mock('antd', () => ({
  Tooltip: ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div data-testid="tooltip" title={title}>
      {children}
    </div>
  ),
}));

jest.mock('../../src/app/lib/utils/icons', () => ({
  TooltipIcon: '<svg>Tooltip Icon</svg>',
  RoiIcon: '<svg>ROI Icon</svg>',
  RoiDescIcon: '<svg>ROI Desc Icon</svg>',
}));

jest.mock('../../src/app/lib/utils/common', () => ({
  formatInput: jest.fn((value: number, currencySign?: string) => `${currencySign || ''}${value.toLocaleString()}`),
}));

describe('CountCard', () => {
  const store = mockStore(initialState);

  const defaultProps = {
    cardText: 'Total Sales',
    countData: { count: 3000, change: 200 },
    currencySign: '$',
    icon: '<svg>Icon</svg>',
    toolTipText: 'This is a tooltip',
  };

  it('renders CountCard with correct props', () => {
    const { container } = render(
      <Provider store={store}>
        <CountCard {...defaultProps} />
      </Provider>,
    );

    expect(screen.getByText('Total Sales')).toBeInTheDocument();
    expect(screen.getByText('$3,000')).toBeInTheDocument();
    expect(screen.getByText('+200%')).toBeInTheDocument();
  });

  it('renders icons correctly', () => {
    render(
      <Provider store={store}>
        <CountCard {...defaultProps} />
      </Provider>,
    );

    expect(screen.getByText('Icon')).toBeInTheDocument();
    expect(screen.getByText('Tooltip Icon')).toBeInTheDocument();
    expect(screen.getByText('ROI Icon')).toBeInTheDocument();
  });

  it('formats count and change values correctly', () => {
    render(
      <Provider store={store}>
        <CountCard {...defaultProps} />
      </Provider>,
    );

    expect(formatInput).toHaveBeenCalledWith(3000, '$');
    expect(formatInput).toHaveBeenCalledWith(200);
  });

  it('handles positive and negative changes correctly', () => {
    const positiveProps = { ...defaultProps, countData: { count: 3000, change: 200 } };
    const negativeProps = { ...defaultProps, countData: { count: 3000, change: -200 } };

    const { container: positiveContainer } = render(
      <Provider store={store}>
        <CountCard {...positiveProps} />
      </Provider>,
    );

    expect(positiveContainer.querySelector(`.${style.Positive}`)).toBeInTheDocument();

    const { container: negativeContainer } = render(
      <Provider store={store}>
        <CountCard {...negativeProps} />
      </Provider>,
    );

    expect(negativeContainer.querySelector(`.${style.Negative}`)).toBeInTheDocument();
  });
});
