import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { mockContentTypes } from "../../test/mocks/mockContentTypes";
import ConvoxContentTypes from "./ConvoxContentTypes";
import { IConvoxContentTypesProps } from "../customTypes/IConvoxContentTypesProps";

const props: IConvoxContentTypesProps = {
    contentTypes: [],
    isAuthenticated: false,
    selectedContentTypes: [],
    onContentTypesChange: vi.fn(),
};

describe("ConvoxContentTypes Component", () => {
    it("renders heading correctly", () => {
        const { unmount } = render(<ConvoxContentTypes {...props} />);
        expect(screen.getByRole("heading", { name: /assign to sidebars/i })).toBeTruthy();
        unmount();
    });

    it("shows a warning when there are no content types", () => {
        const { unmount } = render(<ConvoxContentTypes {...props} />);
        expect(screen.getByText(/no content types/i)).toBeTruthy();
        unmount();
    });

    it("does not show a warning when there are content types", () => {
        const { unmount } = render(<ConvoxContentTypes {...props} contentTypes={mockContentTypes} />);
        expect(screen.queryByText(/no content types/i)).toBeFalsy();
        unmount();
    });

    it("shows placeholder text when no content types are selected", () => {
        const { unmount } = render(
            <ConvoxContentTypes
                {...props}
                contentTypes={mockContentTypes}
                selectedContentTypes={[]}
            />
        );

        expect(screen.getByText(/select content types.../i)).toBeTruthy();
        unmount();
    });

    it("shows count of selected content types when some are selected", () => {
        const selectedContentTypes = ["blogArticles", "page"];
        const { unmount } = render(
            <ConvoxContentTypes
                {...props}
                contentTypes={mockContentTypes}
                selectedContentTypes={selectedContentTypes}
            />
        );

        expect(screen.getByText("Content types selected")).toBeTruthy();
        expect(screen.getByText("2")).toBeTruthy();
        unmount();
    });

    it("displays selected content types as badges", () => {
        const selectedContentTypes = ["blogArticles"];
        const { unmount } = render(
            <ConvoxContentTypes
                {...props}
                contentTypes={mockContentTypes}
                selectedContentTypes={selectedContentTypes}
            />
        );

        const badges = screen.getAllByText(/blog articles/i);
        expect(badges.length).toBeGreaterThan(0);
        unmount();
    });

    it("does not open dropdown when clicking trigger while unauthenticated", () => {
        const { unmount } = render(
            <ConvoxContentTypes
                {...props}
                contentTypes={mockContentTypes}
                isAuthenticated={false}
            />
        );

        const dropdownTrigger = screen.getByText(/select content types/i).closest('div');
        fireEvent.click(dropdownTrigger!);

        expect(screen.queryByText(/select all content types/i)).toBeFalsy();
        unmount();
    });

    it("opens dropdown when clicking trigger while authenticated", () => {
        const { unmount } = render(
            <ConvoxContentTypes
                {...props}
                contentTypes={mockContentTypes}
                isAuthenticated={true}
            />
        );

        const dropdownTrigger = screen.getByText(/select content types/i).closest('div');
        fireEvent.click(dropdownTrigger!);

        expect(screen.getByText(/select all content types/i)).toBeTruthy();
        unmount();
    });

    it("shows dropdown content with search field when opened", () => {
        const { unmount } = render(
            <ConvoxContentTypes
                {...props}
                contentTypes={mockContentTypes}
                isAuthenticated={true}
            />
        );

        const dropdownTrigger = screen.getByText(/select content types/i).closest('div');
        fireEvent.click(dropdownTrigger!);

        expect(screen.getByPlaceholderText(/search content types/i)).toBeTruthy();
        expect(screen.getByText(/select all content types/i)).toBeTruthy();
        unmount();
    });

    it("calls onContentTypesChange with all content type IDs when 'select all' is clicked", () => {
        const onContentTypesChange = vi.fn();
        const { unmount } = render(
            <ConvoxContentTypes
                {...props}
                contentTypes={mockContentTypes}
                isAuthenticated={true}
                onContentTypesChange={onContentTypesChange}
            />
        );

        const dropdownTrigger = screen.getByText(/select content types/i).closest('div');
        fireEvent.click(dropdownTrigger!);

        const selectAllCheckbox = screen.getByText(/select all content types/i)
            .closest('label')
            ?.querySelector('input');
        fireEvent.click(selectAllCheckbox!);

        expect(onContentTypesChange).toHaveBeenCalledWith(
            mockContentTypes.map(contentType => contentType.sys.id)
        );
        unmount();
    });

    it("calls onContentTypesChange with empty array when 'select all' is unchecked", () => {
        const onContentTypesChange = vi.fn();
        const selectedContentTypes = mockContentTypes.map(ct => ct.sys.id);

        const { unmount } = render(
            <ConvoxContentTypes
                {...props}
                contentTypes={mockContentTypes}
                selectedContentTypes={selectedContentTypes}
                isAuthenticated={true}
                onContentTypesChange={onContentTypesChange}
            />
        );

        const dropdownTrigger = screen.getByText(/content types selected/i).closest('div');
        fireEvent.click(dropdownTrigger!);

        const selectAllCheckbox = screen.getByText(/select all content types/i)
            .closest('label')
            ?.querySelector('input');
        fireEvent.click(selectAllCheckbox!);

        expect(onContentTypesChange).toHaveBeenCalledWith([]);
        unmount();
    });

    it("calls onContentTypesChange with updated array when a content type is checked", () => {
        const onContentTypesChange = vi.fn();
        const { unmount } = render(
            <ConvoxContentTypes
                {...props}
                contentTypes={mockContentTypes}
                isAuthenticated={true}
                onContentTypesChange={onContentTypesChange}
            />
        );

        const dropdownTrigger = screen.getByText(/select content types/i).closest('div');
        fireEvent.click(dropdownTrigger!);

        const contentTypeCheckbox = screen.getByText(/blog articles/i)
            .closest('label')
            ?.querySelector('input');
        fireEvent.click(contentTypeCheckbox!);

        expect(onContentTypesChange).toHaveBeenCalledWith(["blogArticles"]);
        unmount();
    });

    it("calls onContentTypesChange when a badge's close button is clicked", () => {
        const onContentTypesChange = vi.fn();
        const selectedContentTypes = ["blogArticles", "page"];
        const { unmount } = render(
            <ConvoxContentTypes
                {...props}
                contentTypes={mockContentTypes}
                selectedContentTypes={selectedContentTypes}
                isAuthenticated={true}
                onContentTypesChange={onContentTypesChange}
            />
        );

        const closeButton = screen.getByLabelText(/remove blog articles/i);
        fireEvent.click(closeButton);

        expect(onContentTypesChange).toHaveBeenCalledWith(["page"]);
        unmount();
    });

    it("filters content types based on search term", () => {
        const { unmount } = render(
            <ConvoxContentTypes
                {...props}
                contentTypes={mockContentTypes}
                isAuthenticated={true}
            />
        );

        const dropdownTrigger = screen.getByText(/select content types/i).closest('div');
        fireEvent.click(dropdownTrigger!);

        const searchInput = screen.getByPlaceholderText(/search content types/i);
        fireEvent.change(searchInput, { target: { value: 'blog' } });

        expect(screen.getByText(/blog articles/i)).toBeTruthy();
        expect(screen.queryByText(/page/i)).toBeFalsy();
        unmount();
    });

    it("shows 'no matching content types' when search has no results", () => {
        const { unmount } = render(
            <ConvoxContentTypes
                {...props}
                contentTypes={mockContentTypes}
                isAuthenticated={true}
            />
        );

        const dropdownTrigger = screen.getByText(/select content types/i).closest('div');
        fireEvent.click(dropdownTrigger!);

        const searchInput = screen.getByPlaceholderText(/search content types/i);
        fireEvent.change(searchInput, { target: { value: 'xyz123' } });

        expect(screen.getByText(/no matching content types found/i)).toBeTruthy();
        unmount();
    });
});
