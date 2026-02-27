import { describe, it, expect, vi, Mock, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "../../../test/utils/testUtils";
import ConfigScreen from "./ConfigScreen";
import { useSDK } from "@contentful/react-apps-toolkit";

// Mock contentful-management
const mockContentTypeGetMany = vi.fn();
vi.mock("contentful-management", () => ({
  createClient: vi.fn(() => ({
    contentType: {
      getMany: mockContentTypeGetMany,
    },
  })),
}));

vi.mock("@contentful/react-apps-toolkit", () => ({
  useSDK: vi.fn(),
}));

// Mock the AuthContext
vi.mock("../../contexts/AuthContext", () => ({
  useAuth: vi.fn(() => ({
    isLoading: false,
    isAuthenticated: false,
    user: null,
    token: null,
    error: null,
    loginWithPopup: vi.fn(),
    logout: vi.fn(),
    getAccessToken: vi.fn(),
  })),
}));

// Mock the ConfigDataContext
vi.mock("../../contexts/ConfigDataContext", () => ({
  useConfigData: vi.fn(() => ({
    constants: { dialects: ["american_english", "british_english"], tones: ["formal", "casual"] },
    styleGuides: [{ id: "microsoft", name: "Microsoft" }],
    isLoading: false,
    error: null,
  })),
}));

const createMockConfigSdk = () => ({
  app: {
    onConfigure: vi.fn(),
    getParameters: vi.fn().mockResolvedValue({}),
    setReady: vi.fn(),
    getCurrentState: vi.fn().mockResolvedValue(null),
  },
  ids: {
    space: "test-space",
    environment: "master",
    environmentAlias: undefined,
  },
  cmaAdapter: {
    makeRequest: vi.fn(),
  },
});

describe("ConfigScreen", () => {
  let mockConfigSdk: ReturnType<typeof createMockConfigSdk>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockConfigSdk = createMockConfigSdk();
    (useSDK as unknown as Mock).mockReturnValue(mockConfigSdk);

    // Default mock for contentType.getMany
    mockContentTypeGetMany.mockResolvedValue({
      items: [
        {
          sys: { id: "blogPost" },
          name: "Blog Post",
          fields: [
            { id: "title", name: "Title", type: "Symbol" },
            { id: "body", name: "Body", type: "RichText" },
            { id: "slug", name: "Slug", type: "Symbol" },
            { id: "publishedDate", name: "Published Date", type: "Date" },
          ],
        },
        {
          sys: { id: "page" },
          name: "Page",
          fields: [
            { id: "heading", name: "Heading", type: "Symbol" },
            { id: "content", name: "Content", type: "Text" },
          ],
        },
      ],
    });
  });

  it("initializes and displays content types in accordion", async () => {
    render(<ConfigScreen />);

    await waitFor(() => {
      expect(mockConfigSdk.app.setReady).toHaveBeenCalled();
    });

    // Check that the app title is displayed
    expect(screen.getByText("Markup AI App")).toBeInTheDocument();

    // Check that content types are displayed in accordion headers
    expect(screen.getByText("Blog Post")).toBeInTheDocument();
    expect(screen.getByText("Page")).toBeInTheDocument();

    // Check field counts are shown
    // Blog Post has 3 fields (Title, Body/RichText, Slug), Page has 2 fields
    expect(screen.getByText("0 of 3 selected")).toBeInTheDocument();
    expect(screen.getByText("0 of 2 selected")).toBeInTheDocument();
  });

  it("shows description for field selection", async () => {
    render(<ConfigScreen />);

    await waitFor(() => {
      expect(mockConfigSdk.app.setReady).toHaveBeenCalled();
    });

    // Check intro description
    expect(screen.getByText(/Scan, score, and rewrite content at scale/)).toBeInTheDocument();

    // Check section title and description
    expect(screen.getByText("Assign to Content Types")).toBeInTheDocument();
    expect(
      screen.getByText(/Choose which content types and fields to use with Markup AI/),
    ).toBeInTheDocument();
  });

  it("registers onConfigure and returns correct EditorInterface config", async () => {
    render(<ConfigScreen />);

    await waitFor(() => {
      expect(mockConfigSdk.app.onConfigure).toHaveBeenCalled();
    });

    // Get the onConfigure handler
    const calls = mockConfigSdk.app.onConfigure.mock.calls;
    const handler = calls.at(-1)?.[0] as () => Promise<unknown>;
    expect(handler).toBeDefined();

    // Call the handler and check the result
    const result = await handler();
    expect(result).toEqual({
      parameters: {
        contentTypeSettings: {},
      },
      targetState: {
        EditorInterface: {},
      },
    });
  });

  it("returns selected fields in EditorInterface config", async () => {
    render(<ConfigScreen />);

    await waitFor(() => {
      expect(mockConfigSdk.app.setReady).toHaveBeenCalled();
    });

    // Blog Post accordion is expanded by default (first content type)
    // Check a checkbox
    const titleCheckbox = screen.getByRole("checkbox", { name: /Title/i });
    fireEvent.click(titleCheckbox);

    // Get the latest onConfigure handler
    const calls = mockConfigSdk.app.onConfigure.mock.calls;
    const handler = calls.at(-1)?.[0] as () => Promise<unknown>;

    const result = await handler();
    expect(result).toEqual({
      parameters: {
        contentTypeSettings: {},
      },
      targetState: {
        EditorInterface: {
          blogPost: {
            controls: [{ fieldId: "title" }],
          },
        },
      },
    });
  });

  it("loads previously selected fields and shows active badge", async () => {
    mockConfigSdk.app.getCurrentState.mockResolvedValue({
      EditorInterface: {
        blogPost: {
          controls: [{ fieldId: "title" }],
        },
      },
    });

    render(<ConfigScreen />);

    await waitFor(() => {
      expect(mockConfigSdk.app.setReady).toHaveBeenCalled();
    });

    // Check that the selection count is shown
    expect(screen.getByText("1 of 3 selected")).toBeInTheDocument();

    // Blog Post accordion is expanded by default (first content type)
    // Check that the title checkbox is checked
    const titleCheckbox = screen.getByRole("checkbox", { name: /Title/i });
    expect(titleCheckbox).toBeChecked();
  });

  it("supports check all functionality", async () => {
    render(<ConfigScreen />);

    await waitFor(() => {
      expect(mockConfigSdk.app.setReady).toHaveBeenCalled();
    });

    // Blog Post accordion is expanded by default (first content type)
    // Click "Select all fields"
    const selectAllCheckbox = screen.getByRole("checkbox", { name: /Select all fields/i });
    fireEvent.click(selectAllCheckbox);

    // Get the latest onConfigure handler
    const calls = mockConfigSdk.app.onConfigure.mock.calls;
    const handler = calls.at(-1)?.[0] as () => Promise<unknown>;

    const result = await handler();
    // Should have all text/rich text fields from Blog Post (Title, Body, and Slug)
    expect(result).toEqual({
      parameters: {
        contentTypeSettings: {},
      },
      targetState: {
        EditorInterface: {
          blogPost: {
            controls: [{ fieldId: "title" }, { fieldId: "body" }, { fieldId: "slug" }],
          },
        },
      },
    });
  });
});
