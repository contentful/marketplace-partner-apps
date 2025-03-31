import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
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
        const {unmount} = render(<ConvoxContentTypes {...props} />);
        expect(screen.getByRole("heading", { name: /assign to sidebars/i })).toBeTruthy();
        unmount()
    });
    it("shows a waring when there are no content types", () => {
        const {unmount} = render(<ConvoxContentTypes {...props} />)
        expect(screen.getByText(/no content types/i)).toBeTruthy()
        unmount()
    });

    it("does not show a waring when there are content types", () => {
        const {unmount} = render(<ConvoxContentTypes {...props} contentTypes={mockContentTypes} />);
        expect(screen.queryByText(/no content types/i)).toBeFalsy();
        unmount()
    });

    it("should check by default when there is already selected content types", () => {
        const selectedContentTypes = ["blogArticles"];
        const {unmount} = render(
            <ConvoxContentTypes
                {...props}
                contentTypes={mockContentTypes}
                selectedContentTypes={selectedContentTypes}
            />
        );

        const blogArticleCheckbox = screen.getByRole("checkbox", {
            name: /blog articles/i,
        }) as HTMLInputElement;
        expect(blogArticleCheckbox).toBeDefined();
        expect(blogArticleCheckbox.checked).toBe(true);
        unmount()
    });

    it("should disable checkboxes when not authenticated", () => {
        const {unmount} = render(<ConvoxContentTypes {...props} contentTypes={mockContentTypes} isAuthenticated={false} />);

        const selectAllCheckbox = screen.getByRole("checkbox", { name: /select all/i }) as HTMLInputElement; 
        const blogArticleCheckbox = screen.getByRole("checkbox", { name: /blog articles/i }) as HTMLInputElement;

        expect(selectAllCheckbox.disabled).toBe(true);
        expect(blogArticleCheckbox.disabled).toBe(true);
        unmount()
    });
})
