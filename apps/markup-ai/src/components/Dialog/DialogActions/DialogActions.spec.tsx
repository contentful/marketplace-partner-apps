import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DialogActions } from "./DialogActions";

describe("DialogActions", () => {
  it("renders both action buttons", () => {
    render(<DialogActions onReject={() => {}} onAccept={() => {}} />);

    expect(screen.getByText("Reject & Close")).toBeInTheDocument();
    expect(screen.getByText("Accept & Insert")).toBeInTheDocument();
  });

  it("calls onReject when reject button is clicked", () => {
    const onReject = vi.fn();
    render(<DialogActions onReject={onReject} onAccept={() => {}} />);

    fireEvent.click(screen.getByText("Reject & Close"));
    expect(onReject).toHaveBeenCalledTimes(1);
  });

  it("calls onAccept when accept button is clicked", () => {
    const onAccept = vi.fn();
    render(<DialogActions onReject={() => {}} onAccept={onAccept} />);

    fireEvent.click(screen.getByText("Accept & Insert"));
    expect(onAccept).toHaveBeenCalledTimes(1);
  });

  it("applies correct styling classes", () => {
    const { container } = render(<DialogActions onReject={() => {}} onAccept={() => {}} />);
    expect(container.querySelector('div[data-testid="actions-container"]')).toBeInTheDocument();
    expect(container.querySelector('button[data-testid="reject-button"]')).toBeInTheDocument();
    expect(container.querySelector('button[data-testid="accept-button"]')).toBeInTheDocument();
  });

  it("renders rewrite button when showRewriteAgain is true", () => {
    const onRewriteAgain = vi.fn();
    render(
      <DialogActions
        onReject={() => {}}
        onAccept={() => {}}
        onRewriteAgain={onRewriteAgain}
        showRewriteAgain={true}
      />,
    );

    expect(screen.getByText("Retry")).toBeInTheDocument();
    expect(screen.getByTestId("rewrite-again-button")).toBeInTheDocument();
  });

  it("does not render rewrite button when showRewriteAgain is false", () => {
    render(<DialogActions onReject={() => {}} onAccept={() => {}} showRewriteAgain={false} />);

    expect(screen.queryByText("Retry")).not.toBeInTheDocument();
    expect(screen.queryByTestId("rewrite-again-button")).not.toBeInTheDocument();
  });

  it("calls onRewriteAgain when rewrite button is clicked", () => {
    const onRewriteAgain = vi.fn();
    render(
      <DialogActions
        onReject={() => {}}
        onAccept={() => {}}
        onRewriteAgain={onRewriteAgain}
        showRewriteAgain={true}
      />,
    );

    fireEvent.click(screen.getByText("Retry"));
    expect(onRewriteAgain).toHaveBeenCalledTimes(1);
  });
});
