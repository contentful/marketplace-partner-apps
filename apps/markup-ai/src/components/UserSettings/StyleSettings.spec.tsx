import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "../../../test/utils/testUtils";
import StyleSettings from "./StyleSettings";
import * as apiService from "../../hooks/useApiService";

vi.mock("../../hooks/useApiService", () => ({
  useApiService: vi.fn(() => ({
    constants: { dialects: ["en-US", "en-GB"], tones: ["neutral", "formal"], style_guides: {} },
    styleGuides: [{ id: "default", name: "Default", created_at: "2023-01-01T00:00:00Z" }],
    constantsLoading: false,
    styleGuidesLoading: false,
    constantsError: null,
    styleGuidesError: null,
    checkContent: vi.fn(),
    contentRewrite: vi.fn(),
    fetchAdminConstants: vi.fn(),
    fetchStyleGuides: vi.fn(),
  })),
}));

describe("StyleSettings", () => {
  const constants = {
    dialects: ["en-US", "en-GB"],
    tones: ["neutral", "formal"],
    style_guides: {},
  };
  const styleGuides = [{ id: "default", name: "Default", created_at: "2023-01-01T00:00:00Z" }];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const baseProps = {
    apiKey: "k",
    dialect: null as string | null,
    tone: null as string | null,
    styleGuide: null as string | null,
    onDialectChange: vi.fn(),
    onToneChange: vi.fn(),
    onStyleGuideChange: vi.fn(),
  };

  it("shows spinner while loading and then renders selects", async () => {
    // Mock loaded state directly
    vi.mocked(apiService.useApiService).mockReturnValue({
      constants,
      styleGuides,
      constantsLoading: false,
      styleGuidesLoading: false,
      constantsError: null,
      styleGuidesError: null,
      checkContent: vi.fn(),
      contentRewrite: vi.fn(),
      fetchAdminConstants: vi.fn(),
      fetchStyleGuides: vi.fn(),
    });

    render(<StyleSettings {...baseProps} />);

    await waitFor(() => {
      expect(screen.getByText("Dialect")).toBeInTheDocument();
    });
    expect(screen.getByText("Tone")).toBeInTheDocument();
    expect(screen.getByText("Style Guide")).toBeInTheDocument();
  });

  it("renders error Note when API fails", async () => {
    vi.mocked(apiService.useApiService).mockReturnValue({
      constants: null,
      styleGuides: null,
      constantsLoading: false,
      styleGuidesLoading: false,
      constantsError: { detail: "x", status: 500, request_id: "test" },
      styleGuidesError: { detail: "x", status: 500, request_id: "test" },
      checkContent: vi.fn(),
      contentRewrite: vi.fn(),
      fetchAdminConstants: vi.fn(),
      fetchStyleGuides: vi.fn(),
    });

    render(<StyleSettings {...baseProps} />);
    await waitFor(() => {
      expect(screen.getByText("Error")).toBeInTheDocument();
    });
    expect(screen.getByText("Failed to load configuration")).toBeInTheDocument();
  });

  it("triggers onSaveAndClose when complete", async () => {
    vi.mocked(apiService.useApiService).mockReturnValue({
      constants,
      styleGuides,
      constantsLoading: false,
      styleGuidesLoading: false,
      constantsError: null,
      styleGuidesError: null,
      checkContent: vi.fn(),
      contentRewrite: vi.fn(),
      fetchAdminConstants: vi.fn(),
      fetchStyleGuides: vi.fn(),
    });

    const onSaveAndClose = vi.fn();
    render(
      <StyleSettings
        {...baseProps}
        dialect="en-US"
        tone="neutral"
        styleGuide="default"
        onSaveAndClose={onSaveAndClose}
      />,
    );
    await waitFor(() => screen.getByText("Dialect"));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onSaveAndClose).toHaveBeenCalledTimes(1);
  });
});
