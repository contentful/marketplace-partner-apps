import { AssetIcon, Box, Button, Card, Flex, IconButton, Note, Pill, Text, TextLink, Tooltip } from "@contentful/f36-components";
import type { AssetType } from "@contentful/f36-components";
import * as icons from "@contentful/f36-icons";
import { MetadataDetails } from "./MetadataDetails";
import { VideoEmbed } from "./VideoEmbed";
import { statusDotTones, styles } from "./MediaflowAssetCard.styles";
import type { MetadataSection, MetadataStatus as MetadataStatusData } from "../utils/MetadataView";

/**
 * Everything the asset card displays, prepared by createAssetCardViewModel in JsonField.tsx
 */
export interface AssetCardViewModel {
    title: string;
    summary: string;
    previewUrl: string | null;
    iconType: AssetType;
    altText: string;
    isAltTextMissing: boolean;
    keywords: string[];
    mediaflowUrl: string | null;
    video: { embedCode?: string; embedMethod?: string; maxWidth: number } | null;
    sections: MetadataSection[];
    status: MetadataStatusData;
}

interface MediaflowAssetCardProps {
    viewModel: AssetCardViewModel;
    isBusy: boolean;
    isSyncing: boolean;
    onReplace: () => void;
    onRemove: () => void;
    onSync: () => void;
}

/**
 * The card which shows the selected Mediaflow file and all its metadata on one surface
 *
 * @param viewModel - The display values, see createAssetCardViewModel in JsonField.tsx
 * @param isBusy - true while the file selector is open or the field is being updated
 * @param isSyncing - true while metadata is synced from Mediaflow
 * @param onReplace - Opens the file selector
 * @param onRemove - Asks to remove the file from the field
 * @param onSync - Syncs the metadata from Mediaflow
 */
export const MediaflowAssetCard = ({ viewModel, isBusy, isSyncing, onReplace, onRemove, onSync }: MediaflowAssetCardProps) => {
    return (
        <Card className={ styles.card }>
            <Flex gap="spacingM" padding="spacingM" alignItems="flex-start">
                <Thumbnail previewUrl={ viewModel.previewUrl } altText={ viewModel.altText } iconType={ viewModel.iconType } />
                <Flex flexDirection="column" gap="spacingS" flexGrow={ 1 } className={ styles.shrinkable }>
                    <Flex justifyContent="space-between" alignItems="flex-start" gap="spacingS">
                        <Box className={ styles.shrinkable }>
                            <Text as="p" className={ styles.title }>{ viewModel.title }</Text>
                            <Text as="p" className={ styles.summary }>{ viewModel.summary }</Text>
                        </Box>
                        <Flex gap="spacing2Xs" flexShrink={ 0 }>
                            <Tooltip
                                placement="top"
                                content="Your file is being postprocessed in the background. This button will be enabled again once it's finished"
                                isDisabled={ !isBusy }
                            >
                                <Button size="small" variant="secondary" isDisabled={ isBusy } isLoading={ isBusy } onClick={ onReplace }>Replace</Button>
                            </Tooltip>
                            <IconButton size="small" variant="secondary" aria-label="Remove asset" icon={ <icons.TrashSimpleIcon /> } isDisabled={ isBusy } onClick={ onRemove } />
                        </Flex>
                    </Flex>
                    <AltText viewModel={ viewModel } />
                    { viewModel.keywords.length > 0 && (
                        <Flex gap="spacing2Xs" flexWrap="wrap" aria-label="Keywords">
                            { viewModel.keywords.map(keyword => <Pill key={ keyword } label={ keyword } />) }
                        </Flex>
                    )}
                    <Flex justifyContent="space-between" alignItems="center" gap="spacingS" flexWrap="wrap">
                        <MetadataStatus status={ viewModel.status } isSyncing={ isSyncing } onSync={ onSync } />
                        { viewModel.mediaflowUrl && (
                            <TextLink href={ viewModel.mediaflowUrl } target="_blank" rel="noopener noreferrer" icon={ <icons.ArrowSquareOutIcon /> } alignIcon="end">
                                Edit in Mediaflow
                            </TextLink>
                        )}
                    </Flex>
                </Flex>
            </Flex>
            { viewModel.video && (
                <Box paddingLeft="spacingM" paddingRight="spacingM" paddingBottom="spacingM">
                    <VideoEmbed embedCode={ viewModel.video.embedCode } embedMethod={ viewModel.video.embedMethod } maxWidth={ viewModel.video.maxWidth } />
                </Box>
            )}
            <MetadataDetails sections={ viewModel.sections } />
        </Card>
    );
};

const Thumbnail = ({ previewUrl, altText, iconType }: { previewUrl: string | null; altText: string; iconType: AssetType }) => {
    return (
        <div className={ styles.thumbnail }>
            { previewUrl ? (
                <img className={ styles.thumbnailImage } src={ previewUrl } alt={ altText } />
            ) : (
                <AssetIcon type={ iconType } size="medium" aria-hidden="true" />
            )}
        </div>
    );
};

const AltText = ({ viewModel }: { viewModel: AssetCardViewModel }) => {
    if(viewModel.isAltTextMissing) {
        return (
            <Note variant="warning">
                Alt text missing – add it in { viewModel.mediaflowUrl ? (
                    <TextLink href={ viewModel.mediaflowUrl } target="_blank" rel="noopener noreferrer">Mediaflow</TextLink>
                ) : "Mediaflow" }.
            </Note>
        );
    }

    if(!viewModel.altText) {
        return null;
    }

    return (
        <Text as="p">
            <span className={ styles.muted }>Alt text: </span>{ viewModel.altText }
        </Text>
    );
};

const MetadataStatus = ({ status, isSyncing, onSync }: { status: MetadataStatusData; isSyncing: boolean; onSync: () => void }) => {
    return (
        <Flex alignItems="center" gap="spacingXs">
            <span className={ `${styles.statusDot} ${statusDotTones[status.tone]}` } aria-hidden="true" />
            <Text role="status">{ status.label }</Text>
            <Tooltip placement="top" content="Sync metadata from Mediaflow">
                <IconButton
                    size="small"
                    variant="transparent"
                    aria-label="Sync metadata from Mediaflow"
                    icon={ <icons.ArrowsClockwiseIcon /> }
                    isDisabled={ isSyncing }
                    onClick={ onSync }
                />
            </Tooltip>
        </Flex>
    );
};
