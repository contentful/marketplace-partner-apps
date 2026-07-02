import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import { useCMA } from '@contentful/react-apps-toolkit';

import { PageRouter } from './Page';

jest.mock('@contentful/react-apps-toolkit', () => ({
  useCMA: jest.fn(),
}));

jest.mock('../components/Page/PageLayout', () => {
  const { Outlet } = jest.requireActual('react-router-dom');

  return {
    PageLayout: () => (
      <div>
        <div data-testid="page-layout" />
        <Outlet />
      </div>
    ),
  };
});

jest.mock('../components/Page/ProjectCreation', () => ({
  __esModule: true,
  default: ({ contentTypes }: { contentTypes: unknown[] }) => (
    <div data-testid="project-creation">Content types: {contentTypes.length}</div>
  ),
}));

jest.mock('../components/Page/ProjectsList', () => ({
  __esModule: true,
  default: ({ contentTypes }: { contentTypes: unknown[] }) => (
    <div data-testid="projects-list">Projects content types: {contentTypes.length}</div>
  ),
}));

const mockedUseCMA = useCMA as jest.MockedFunction<() => unknown>;

const contentTypes = [
  {
    sys: { id: 'blogPost' },
    name: 'Blog Post',
  },
];

describe('PageRouter', () => {
  const getMany = jest.fn();

  beforeEach(() => {
    getMany.mockResolvedValue({ items: contentTypes });
    mockedUseCMA.mockReturnValue({
      contentType: {
        getMany,
      },
    });
    window.history.pushState({}, '', '/');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('redirects the root route to content creation and loads content types', async () => {
    render(<PageRouter />);

    expect(await screen.findByTestId('project-creation')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Content types: 1')).toBeInTheDocument();
    });
    expect(getMany).toHaveBeenCalledWith({});
  });

  it('renders the projects route with loaded content types', async () => {
    window.history.pushState({}, '', '/projects');

    render(<PageRouter />);

    expect(await screen.findByTestId('projects-list')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Projects content types: 1')).toBeInTheDocument();
    });
    expect(getMany).toHaveBeenCalledWith({});
  });

  it('renders the not found route for unsupported paths', async () => {
    window.history.pushState({}, '', '/missing');

    render(<PageRouter />);

    expect(await screen.findByText('404')).toBeInTheDocument();
    expect(screen.getByTestId('page-layout')).toBeInTheDocument();
  });
});
