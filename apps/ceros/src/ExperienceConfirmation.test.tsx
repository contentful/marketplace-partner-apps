import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { ExperienceConfirmation, ConfirmationModel } from './ExperienceConfirmation'

const base: ConfirmationModel = {
    name: 'Fifth Brass Storm',
    url: 'https://myaccount.ceros.site/flex-experience',
    isFlex: true,
    embedCodes: {},
}

describe('ExperienceConfirmation', () => {
    it('renders one radio per available variant', () => {
        render(
            <ExperienceConfirmation
                model={{ ...base, embedCodes: { fullHeight: '<iframe></iframe>', scrollable: '<iframe></iframe>', inline: '<div data-flex-inline></div>' } }}
                onInsert={vi.fn()}
                onBack={vi.fn()}
            />
        )
        expect(screen.getAllByRole('radio')).toHaveLength(3)
    })

    it('offers no inline option when the model has no inline embed code', () => {
        render(
            <ExperienceConfirmation
                model={{ ...base, isFlex: false, embedCodes: { fullHeight: '<iframe></iframe>', scrollable: '<iframe></iframe>' } }}
                onInsert={vi.fn()}
                onBack={vi.fn()}
            />
        )
        expect(screen.getAllByRole('radio')).toHaveLength(2)
        expect(screen.queryByText(/embed script/i)).not.toBeInTheDocument()
    })

    it('offers inline even when isFlex is false, if an inline code is present', () => {
        // Availability derives from the data, never from the isFlex flag, so the
        // two can never disagree about what is insertable.
        render(
            <ExperienceConfirmation
                model={{ ...base, isFlex: false, embedCodes: { fullHeight: '<iframe></iframe>', inline: '<div data-flex-inline></div>' } }}
                onInsert={vi.fn()}
                onBack={vi.fn()}
            />
        )
        expect(screen.getAllByRole('radio')).toHaveLength(2)
    })

    it('renders confirm-only with no radio group when exactly one variant exists', () => {
        render(
            <ExperienceConfirmation
                model={{ ...base, isFlex: false, embedCodes: { fullHeight: '<iframe></iframe>' } }}
                onInsert={vi.fn()}
                onBack={vi.fn()}
            />
        )
        expect(screen.queryAllByRole('radio')).toHaveLength(0)
        expect(screen.getByRole('button', { name: /insert/i })).toBeInTheDocument()
    })

    it('drops the thumbnail entirely when absent rather than rendering a placeholder', () => {
        const { container } = render(
            <ExperienceConfirmation
                model={{ ...base, embedCodes: { fullHeight: '<iframe></iframe>' } }}
                onInsert={vi.fn()}
                onBack={vi.fn()}
            />
        )
        expect(container.querySelector('[data-test-id="confirmation-thumbnail"]')).toBeNull()
    })

    it('renders the thumbnail when present', () => {
        render(
            <ExperienceConfirmation
                model={{ ...base, thumbnailUrl: 'https://example.test/thumb.jpg', embedCodes: { fullHeight: '<iframe></iframe>' } }}
                onInsert={vi.fn()}
                onBack={vi.fn()}
            />
        )
        expect(screen.getByTestId('confirmation-thumbnail')).toBeInTheDocument()
    })

    it('emits the embed code for the selected variant', () => {
        const onInsert = vi.fn()
        render(
            <ExperienceConfirmation
                model={{ ...base, embedCodes: { fullHeight: '<iframe></iframe>', inline: '<div data-flex-inline></div>' } }}
                onInsert={onInsert}
                onBack={vi.fn()}
            />
        )
        fireEvent.click(screen.getByLabelText(/embed script/i))
        fireEvent.click(screen.getByRole('button', { name: /insert/i }))
        expect(onInsert).toHaveBeenCalledWith('<div data-flex-inline></div>')
    })

    it('preselects initialVariant when given', () => {
        render(
            <ExperienceConfirmation
                model={{ ...base, embedCodes: { fullHeight: '<iframe></iframe>', inline: '<div data-flex-inline></div>' } }}
                initialVariant="inline"
                onInsert={vi.fn()}
                onBack={vi.fn()}
            />
        )
        expect(screen.getByLabelText(/embed script/i)).toBeChecked()
    })

    it('explains when inline could not be offered', () => {
        render(
            <ExperienceConfirmation
                model={{ ...base, inlineUnavailable: true, embedCodes: { fullHeight: '<iframe></iframe>' } }}
                onInsert={vi.fn()}
                onBack={vi.fn()}
            />
        )
        expect(screen.getByText(/inline option/i)).toBeInTheDocument()
    })

    it('resyncs the selection when the model swaps and the current selection has no code in the new model', () => {
        const { rerender } = render(
            <ExperienceConfirmation
                model={{ ...base, embedCodes: { fullHeight: '<iframe></iframe>', inline: '<div data-flex-inline></div>' } }}
                onInsert={vi.fn()}
                onBack={vi.fn()}
            />
        )
        fireEvent.click(screen.getByLabelText(/embed script/i))
        expect(screen.getByLabelText(/embed script/i)).toBeChecked()

        rerender(
            <ExperienceConfirmation
                model={{ ...base, name: 'A Different Experience', embedCodes: { fullHeight: '<iframe></iframe>', scrollable: '<iframe></iframe>' } }}
                onInsert={vi.fn()}
                onBack={vi.fn()}
            />
        )

        expect(screen.getByLabelText(/full height/i)).toBeChecked()
        expect(screen.getByRole('button', { name: /insert/i })).not.toBeDisabled()
    })

    it('keeps the selection when the model swaps but still has a code for it', () => {
        const { rerender } = render(
            <ExperienceConfirmation
                model={{ ...base, embedCodes: { fullHeight: '<iframe></iframe>', inline: '<div data-flex-inline></div>' } }}
                onInsert={vi.fn()}
                onBack={vi.fn()}
            />
        )
        fireEvent.click(screen.getByLabelText(/embed script/i))
        expect(screen.getByLabelText(/embed script/i)).toBeChecked()

        rerender(
            <ExperienceConfirmation
                model={{
                    ...base,
                    name: 'A Different Experience',
                    embedCodes: { fullHeight: '<iframe></iframe>', scrollable: '<iframe></iframe>', inline: '<div data-flex-inline></div>' },
                }}
                onInsert={vi.fn()}
                onBack={vi.fn()}
            />
        )

        expect(screen.getByLabelText(/embed script/i)).toBeChecked()
    })

    it('keeps the clicked selection across an unrelated re-render of the same model', () => {
        const model: ConfirmationModel = {
            ...base,
            embedCodes: { fullHeight: '<iframe></iframe>', inline: '<div data-flex-inline></div>' },
        }
        const { rerender } = render(<ExperienceConfirmation model={model} onInsert={vi.fn()} onBack={vi.fn()} />)
        fireEvent.click(screen.getByLabelText(/embed script/i))
        expect(screen.getByLabelText(/embed script/i)).toBeChecked()

        // Unrelated re-render: same model, but a different prop changes (e.g. isBusy).
        rerender(<ExperienceConfirmation model={model} onInsert={vi.fn()} onBack={vi.fn()} isBusy={true} />)

        expect(screen.getByLabelText(/embed script/i)).toBeChecked()
    })
})
