import { describe, expect, it, vi } from "vitest";
import { screen, render } from "@testing-library/react";
import SiteConfigModal from "./SiteConfigModal";
import { ISiteConfigModalProps } from "../customTypes/ISiteConfigModalProps";
import { mockWorkflows } from "../../test/mocks";
import { IWorkflow } from "../customTypes/IWorkflow";


const props: ISiteConfigModalProps = {
    isShown: false,
    selectedWorkflowConfig: null,
    workflowConfigs: [],
    workflows: [],
    onConfirm: vi.fn(),
    onClose: vi.fn(),
};

describe("SiteConfigModal Component", () => {

    it("renders correct header", () => {
        const {unmount} = render(<SiteConfigModal {...props} isShown={true} />);
        expect(screen.getByRole("heading", { name: /Configure Workflows/i })).toBeTruthy();
        unmount();
    });
    it("renders correct fields", () => {
        const {unmount} = render(<SiteConfigModal {...props} isShown={true} />);
        expect(screen.getByLabelText("Display Name")).toBeTruthy();
        expect(screen.getByLabelText("Workflow")).toBeTruthy();
        unmount();
    });
    it("renders correct fields", () => {
        const {unmount} = render(<SiteConfigModal {...props} isShown={true} />);
        expect(screen.getByLabelText("Display Name")).toBeTruthy();
        expect(screen.getByLabelText("Workflow")).toBeTruthy();
        unmount();
    });

    it("renders correct fields", () => {
        const {unmount} = render(<SiteConfigModal {...props} isShown={true} />);
        expect(screen.getByLabelText("Display Name")).toBeTruthy();
        expect(screen.getByLabelText("Workflow")).toBeTruthy();
        unmount();
    });

    it("renders correct workflow options", () => {
        const workflows: IWorkflow[] = mockWorkflows;
        const {unmount} = render(<SiteConfigModal {...props} isShown={true} workflows={workflows} />);
        const selectElement = screen.getByRole("combobox");
        expect(selectElement).toBeTruthy();
        const optionElements = screen.getAllByRole("option");

        // Ensure the total number of options is workflows.length + 1 (for the default option)
        expect(optionElements.length).toBe(workflows.length + 1);

        workflows.forEach((workflow) => {
            // Find the option with the expected value
            const option = optionElements.find(
                (opt) => (opt as HTMLOptionElement).value === workflow.id
            ) as HTMLOptionElement;

            expect(option).toBeDefined();
            expect(option.value).toBe(workflow.id);
            expect(option.textContent).toBe(workflow.name);
        });
        unmount();
    });
});
