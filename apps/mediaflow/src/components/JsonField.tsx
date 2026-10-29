import { useEffect, useState } from "react";
import { ModalConfirm } from "@contentful/f36-components";
import { MediaflowAssetCard } from "./MediaflowAssetCard";
import type { AssetCardViewModel } from "./MediaflowAssetCard";
import { getMediaflowFileUrl } from "../utils/MediaflowUrl";
import {
    buildMetadataSections,
    formatFileSummary,
    formatValue,
    getAssetIconType,
    getKeywords,
    getMetadataStatus,
    getPreviewUrl,
    getVideoPlayerMaxWidth,
    isAltTextMissing,
} from "../utils/MetadataView";
import type { MetadataStatus } from "../utils/MetadataView";
import type { MediaflowFileData, MetadataCheck } from "../types";

interface JsonFieldProps {
    data: MediaflowFileData | null;
    showMediaflowLinks: boolean;
    isBusy: boolean;
    openFileSelector: () => void;
    updateField: (data: MediaflowFileData | null) => Promise<void>;
    /** Must keep its identity between renders (useCallback): the check runs again whenever it changes */
    checkMetadata: () => Promise<MetadataCheck | undefined>;
    refreshMetadata: () => Promise<void>;
}

/**
 * Prepares everything the asset card displays, so the card itself only renders
 *
 * @param data - The JSON data as it would be returned by the mediaflow file selector
 * @param status - The result of getMetadataStatus
 * @param showMediaflowLinks - Whether links to the file in Mediaflow are shown
 * @returns The view model for MediaflowAssetCard
 */
const createAssetCardViewModel = (data: MediaflowFileData, status: MetadataStatus, showMediaflowLinks: boolean): AssetCardViewModel => ({
    title: formatValue(data.name) || formatValue(data.filename) || "No name",
    summary: formatFileSummary(data),
    previewUrl: getPreviewUrl(data),
    iconType: getAssetIconType(data),
    altText: formatValue(data.altText),
    isAltTextMissing: isAltTextMissing(data),
    keywords: getKeywords(data),
    mediaflowUrl: showMediaflowLinks ? getMediaflowFileUrl(data.id, data.folderId) : null,
    video: data.basetype === "video" ? { embedCode: data.embedCode, embedMethod: data.embedMethod, maxWidth: getVideoPlayerMaxWidth(data.width, data.height) } : null,
    sections: buildMetadataSections(data),
    status,
});

/**
 *
 * @param data - The JSON data as it would be returned by the mediaflow file selector
 * @param showMediaflowLinks - Whether links to the file in Mediaflow are shown, see the app's installation parameter showMediaflowLinks
 * @param isBusy - true while the file selector is open or the field is being updated
 * @param openFileSelector - Opens the file selector to replace the file
 * @param updateField - The function to update the field value. This will be called when the image is removed
 * @param checkMetadata - A function that checks if the metadata is up to date. This will be called on data updates.
 * @param refreshMetadata - A function that refreshes the metadata. This will be called when the user clicks the sync button.
 *
 * @returns the JsonField component
 */
const JsonField = ({ data, showMediaflowLinks, isBusy, openFileSelector, updateField, checkMetadata, refreshMetadata }: JsonFieldProps) => {
    const [showRemovePrompt, setRemovePromptIsShown] = useState(false);
    const [metadataStatus, setMetadaStatus] = useState<MetadataCheck | undefined>(undefined);
    const [isMetadataLoading, setIsMetadataLoading] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        // Runs right after a bulk metadata update too. A 429 from Mediaflow is retried in mediaflowRequest (MediaflowApi.ts)
        setIsMetadataLoading(true);
        checkMetadata().then(setMetadaStatus).finally(() => setIsMetadataLoading(false));
    }, [data, checkMetadata]); // checkMetadata must keep its identity between renders (useCallback), or the check runs on every render

    const syncMetadata = async () => {
        setIsSyncing(true);
        try {
            await refreshMetadata();
        } finally {
            setIsSyncing(false);
        }
    };

    const status = getMetadataStatus(metadataStatus, isSyncing, isMetadataLoading);

    return (data &&
        <>
            <MediaflowAssetCard
                viewModel={ createAssetCardViewModel(data, status, showMediaflowLinks) }
                isBusy={ isBusy }
                isSyncing={ isSyncing }
                onReplace={ openFileSelector }
                onRemove={ () => setRemovePromptIsShown(true) }
                onSync={ syncMetadata }
            />
            <ModalConfirm
                intent="negative"
                isShown={showRemovePrompt}
                onConfirm={() => { updateField(null); setRemovePromptIsShown(false); }}
                onCancel={() => setRemovePromptIsShown(false)}
            >
                The file will be removed from this field.
            </ModalConfirm>
        </>
    );
}

export default JsonField;
