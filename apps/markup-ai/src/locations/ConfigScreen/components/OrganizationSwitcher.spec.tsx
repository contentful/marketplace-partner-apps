import { describe, it, expect, vi, beforeEach } from "vitest";
import { render as rtlRender, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { LocalizationProvider } from "../../../contexts/LocalizationContext";
import { OrganizationSwitcher } from "./OrganizationSwitcher";

// OrganizationSwitcher reads user-facing labels via useTranslation(), which
// requires a LocalizationProvider; wrap every render with one (sync init so
// t() resolves to the English strings immediately).
const render = (ui: React.ReactElement) =>
  rtlRender(ui, {
    wrapper: ({ children }) => (
      <LocalizationProvider initializeSync>{children}</LocalizationProvider>
    ),
  });

const mockUseAuth = vi.fn();
vi.mock("../../../contexts/AuthContext", () => ({
  useAuth: (): unknown => mockUseAuth() as unknown,
}));

const mockUseAccount = vi.fn();
vi.mock("../../../hooks/useAccount", () => ({
  useAccount: (): unknown => mockUseAccount() as unknown,
}));

const mockUseOrganizations = vi.fn();
vi.mock("../../../hooks/useOrganizations", () => ({
  useOrganizations: (): unknown => mockUseOrganizations() as unknown,
}));

const switchOrganization = vi.fn().mockResolvedValue(undefined);

function org(id: string, name: string, displayName: string, picture = "") {
  return { id, name, display_name: displayName, picture };
}

function setAuth(overrides: Record<string, unknown> = {}) {
  mockUseAuth.mockReturnValue({
    isAuthenticated: true,
    currentOrgId: null,
    currentOrgName: null,
    isSwitchingOrg: false,
    switchOrganization,
    ...overrides,
  });
}

describe("OrganizationSwitcher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setAuth();
    mockUseAccount.mockReturnValue({ account: null, organization: null });
    mockUseOrganizations.mockReturnValue({ organizations: [] });
  });

  it("renders nothing when unauthenticated", () => {
    setAuth({ isAuthenticated: false });
    const { container } = render(<OrganizationSwitcher />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when there is no org info from any source", () => {
    const { container } = render(<OrganizationSwitcher />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the current org display_name from /account", () => {
    mockUseAccount.mockReturnValue({
      account: null,
      organization: { id: "uuid-1", name: "acme", display_name: "Acme Inc" },
    });
    render(<OrganizationSwitcher />);
    expect(screen.getByText("Organization")).toBeInTheDocument();
    expect(screen.getByText("Acme Inc")).toBeInTheDocument();
  });

  it("falls back to the JWT org name when /account has no org", () => {
    setAuth({ currentOrgName: "acme" });
    render(<OrganizationSwitcher />);
    expect(screen.getByText("acme")).toBeInTheDocument();
  });

  it("does not show a switch list when the user belongs to a single org", () => {
    mockUseAccount.mockReturnValue({
      account: null,
      organization: { id: "uuid-1", name: "acme", display_name: "Acme Inc" },
    });
    mockUseOrganizations.mockReturnValue({ organizations: [org("org_a", "acme", "Acme Inc")] });
    render(<OrganizationSwitcher />);
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("expands and lists organizations when the user belongs to more than one", () => {
    setAuth({ currentOrgId: "org_a", currentOrgName: "acme" });
    mockUseOrganizations.mockReturnValue({
      organizations: [org("org_a", "acme", "Acme Inc"), org("org_b", "beta", "Beta LLC")],
    });
    render(<OrganizationSwitcher />);
    fireEvent.click(screen.getByRole("button", { name: /acme/i }));
    const menu = screen.getByRole("menu");
    expect(menu).toBeInTheDocument();
    expect(screen.getByText("Beta LLC")).toBeInTheDocument();
  });

  it("calls switchOrganization with the chosen org id", async () => {
    setAuth({ currentOrgId: "org_a", currentOrgName: "acme" });
    mockUseOrganizations.mockReturnValue({
      organizations: [org("org_a", "acme", "Acme Inc"), org("org_b", "beta", "Beta LLC")],
    });
    render(<OrganizationSwitcher />);
    fireEvent.click(screen.getByRole("button", { name: /acme/i }));
    fireEvent.click(screen.getByRole("menuitem", { name: /beta llc/i }));
    await waitFor(() => {
      expect(switchOrganization).toHaveBeenCalledWith("org_b");
    });
  });

  it("does not re-auth when the current org is reselected", () => {
    setAuth({ currentOrgId: "org_a", currentOrgName: "acme" });
    mockUseOrganizations.mockReturnValue({
      organizations: [org("org_a", "acme", "Acme Inc"), org("org_b", "beta", "Beta LLC")],
    });
    render(<OrganizationSwitcher />);
    fireEvent.click(screen.getByRole("button", { name: /acme/i }));
    fireEvent.click(screen.getByRole("menuitem", { name: /acme inc/i }));
    expect(switchOrganization).not.toHaveBeenCalled();
  });
});
