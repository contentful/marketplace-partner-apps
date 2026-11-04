// @vitest-environment jsdom
import { test, expect, afterEach } from 'vitest';
import { render, screen, cleanup, act } from '@testing-library/react';

/**
 * Tests the links to Mediaflow in the asset card
 */
import JsonField from '../src/components/JsonField';
import type { MediaflowFileData } from '../src/types';

afterEach(cleanup);

const imageWithoutAltText: MediaflowFileData = {
    id: 5555191,
    basetype: "image",
    name: "DSCF8170",
    filename: "DSCF8170.JPG",
    filetype: "jpg",
    url: "https://eu1.cdn.mediaflow.com/1/abc/DSCF8170.JPG",
    width: 800,
    height: 533,
    folderId: 4242,
};

const renderField = async (showMediaflowLinks: boolean) => {
    await act(async () => {
        render(
            <JsonField
                data={ imageWithoutAltText }
                showMediaflowLinks={ showMediaflowLinks }
                isBusy={ false }
                openFileSelector={ () => {} }
                updateField={ async () => {} }
                checkMetadata={ () => Promise.resolve({ type: "positive", value: "Metadata is up to date" }) }
                refreshMetadata={ () => Promise.resolve() }
            />
        );
    });
};

const mediaflowLinks = () => screen.queryAllByRole("link").map(link => link.getAttribute("href"));

test('Links to the file in Mediaflow when the setting is on', async () => {
    await renderField(true);
    expect(mediaflowLinks()).toEqual([
        "https://app.mediaflow.com/media/folder/4242/file/5555191",
        "https://app.mediaflow.com/media/folder/4242/file/5555191",
    ]);
});

test('Shows no links to Mediaflow when the setting is off, but keeps the alt text warning', async () => {
    await renderField(false);
    expect([mediaflowLinks(), screen.getByText(/Alt text missing/).textContent]).toEqual([[], "Alt text missing – add it in Mediaflow."]);
});
