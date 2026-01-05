import { useState } from 'react';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { LinkedEntryCard } from '@/components/EntryEditor/LinkedEntryCard';
import { CustomButton, CustomButtonSecond } from '@/components/ui/CustomButton';

type EntryType = { id: string; name: string };
type Variation = { id: string | number; name: string; allocation: number };

type Props = {
  loadingVariations: boolean;
  variations: Variation[];
  entries: EntryType[];
  metaMap: Record<string, string>;
  entrySummaries: Record<string, { id: string; contentTypeId?: string; contentTypeName?: string; entryName?: string }>;
  onCreateAndLink: (contentTypeId: string, variationKey: string) => void | Promise<void>;
  onLinkExisting: (variationKey: string) => void | Promise<void>;
  onViewLinked: (entryId: string) => void | Promise<void>;
  onRemoveLink: (variationKey: string) => void | Promise<void>;
};

export const VariationsList = ({
  loadingVariations,
  variations,
  entries,
  metaMap,
  entrySummaries,
  onCreateAndLink,
  onLinkExisting,
  onViewLinked,
  onRemoveLink,
}: Props) => {
  const [menuAnchors, setMenuAnchors] = useState<Record<string, HTMLElement | null>>({});

  const openMenuFor = (variationKey: string) => (e: React.MouseEvent<HTMLButtonElement>) => {
    setMenuAnchors((prev) => ({ ...prev, [variationKey]: e.currentTarget }));
  };
  const closeMenuFor = (variationKey: string) => () => {
    setMenuAnchors((prev) => ({ ...prev, [variationKey]: null }));
  };

  if (loadingVariations) {
    return <Typography variant="body1">Loading of variations...</Typography>;
  }

  if ((variations?.length ?? 0) === 0) {
    return <Typography variant="body1">No variations found for this campaign.</Typography>;
  }

  return (
    <>
      <Typography variant="subtitle1" fontWeight={600} sx={{ marginTop: '12px' }}>Variations</Typography>
      <Typography variant="body2">Content created with this experiment is only available for this experiment</Typography>

      {variations.map((variation) => {
        const variationKey = String(variation.id);
        return (
          <div key={variationKey} style={{ marginBottom: 10 }}>
            <Typography variant="subtitle1" fontWeight={600}>
              {variation.name} / {variation.allocation}% of trafic
            </Typography>

            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <CustomButtonSecond
                variant="outlined"
                size="small"
                onClick={openMenuFor(variationKey)}
              >
                Create entry and link
              </CustomButtonSecond>
              <Menu
                anchorEl={menuAnchors[variationKey] || null}
                open={Boolean(menuAnchors[variationKey])}
                onClose={closeMenuFor(variationKey)}
              >
                {entries.map((ct) => (
                  <MenuItem
                    style={{ minWidth: 120 }}
                    key={ct.id}
                    onClick={() => {
                      void onCreateAndLink(ct.id, variationKey);
                      closeMenuFor(variationKey)();
                    }}
                  >
                    {ct.name}
                  </MenuItem>
                ))}
              </Menu>

              <CustomButton variant="contained" size="small" onClick={() => onLinkExisting(variationKey)}>
                Link an existing entry
              </CustomButton>
            </div>

            {metaMap?.[variationKey] && (
              <LinkedEntryCard
                entryId={metaMap[variationKey]}
                entryName={entrySummaries[metaMap[variationKey]]?.entryName}
                contentTypeName={entrySummaries[metaMap[variationKey]]?.contentTypeName}
                contentTypeId={entrySummaries[metaMap[variationKey]]?.contentTypeId}
                onView={() => onViewLinked(metaMap[variationKey])}
                onRemove={() => onRemoveLink(variationKey)}
              />
            )}
          </div>
        );
      })}
    </>
  );
};