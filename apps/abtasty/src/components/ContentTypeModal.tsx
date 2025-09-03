import {
  Card,
  CardContent,
  CardHeader,
  Modal,
  Stack,
  Typography,
  Skeleton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Divider,
  Checkbox,
  FormGroup,
  FormControlLabel,
} from '@mui/material';
import { useState } from 'react';
import { ConfigAppSDK } from '@contentful/app-sdk';
import { useContentfulContentTypes } from '@/hook/useContentfulContentTypes';
import { CONTENT_TYPE_ID } from '@/constants';
import { CustomButton, CustomButtonSecond } from '@/locations/ConfigScreen';

export type ContentTypeOption = {
  id: string;
  name: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  sdk: ConfigAppSDK;
  value: string | null;
  onChange: (next: string | null) => void;
  onSave: (contentTypeRef: ContentTypeType) => void;
};

type CtArrayField = {
  id: string;
  name: string;
  type: 'Array';
  items?: { type?: string; linkType?: string };
};

type ContentTypeType = {
  id: string;
  referenceField: string[];
}

export const ContentTypeModal = ({ open, onClose, sdk, value, onChange, onSave }: Props) => {
  const { contentTypes, loadingContentTypes } = useContentfulContentTypes(sdk, CONTENT_TYPE_ID);
  const [referenceFields, setReferenceFields] = useState<ContentTypeOption[]>([]);
  const [selectedRefs, setSelectedRefs] = useState<string[]>([]);

  const handleChange = (e: SelectChangeEvent<string>) => {
    const v = e.target.value;

    if (!v) {
      onChange(null);
      setReferenceFields([]);
      setSelectedRefs([]);
      return;
    }

    const contentType = contentTypes.find((ct: any) => ct.id === v);

    const fields = (contentType?.items as unknown as CtArrayField[]) ?? [];
    const refs = fields
      .filter(
        (f) =>
          f.type === 'Array' &&
          f.items?.type === 'Link' &&
          f.items?.linkType === 'Entry'
      )
      .map((f) => ({ id: f.id, name: f.name }));

    setReferenceFields(refs);
    setSelectedRefs([]);
    onChange(v);
  };

  const handleSaveData = async () => {
    if (!value) return;
    onSave({
      id: value,
      referenceField: selectedRefs,
    });
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} aria-labelledby="parent-modal-title" aria-describedby="parent-modal-description">
      <Card variant="outlined" sx={{ maxWidth: 600, m: 'auto', mt: 10 }}>
        <CardHeader title={<Typography fontWeight="bold" variant="h5">Add content type</Typography> } />
        <CardContent>
          <Typography color="text.secondary">
            Select the content type and the reference fields you want to enable for experimentation. You’ll be able to change this later.
          </Typography>


          {loadingContentTypes ? (
            <Stack sx={{ mt: 2 }} spacing={1.5}>
              <Skeleton variant="text" width={180} height={24} />
              <Skeleton variant="rounded" height={40} />
            </Stack>
          ) : (
            <FormControl fullWidth size="small" sx={{ mt: 2 }}>
              <InputLabel id="contentType-label">Content type</InputLabel>
              <Select
                id="contentType"
                labelId="contentType-label"
                label="Content type"
                value={value ?? ''}
                onChange={handleChange}
                disabled={loadingContentTypes}
              >
                <MenuItem value="" disabled={loadingContentTypes}>
                  {loadingContentTypes ? 'Loading content types…' : 'Select a content type'}
                </MenuItem>
                {contentTypes.map((ct: any) => (
                  <MenuItem key={ct.id} value={ct.id}>
                    {ct.name}
                  </MenuItem>
                ))}
              </Select>

              <Divider sx={{ my: 2 }} />

              <FormGroup>
                <Typography fontWeight="bold" fontSize="small">Reference Fields</Typography>

                {referenceFields.length > 0 ? (
                  referenceFields.map((r) => (
                    <FormControlLabel
                      key={r.id}
                      control={
                        <Checkbox
                          checked={selectedRefs.includes(r.id)}
                          onChange={(_, checked) =>
                            setSelectedRefs((prev) =>
                              checked ? [...prev, r.id] : prev.filter((id) => id !== r.id)
                            )
                          }
                          sx={{
                            color: "#3100BF",
                            '&.Mui-checked': {
                              color: "#3100BF"
                            },
                          }}
                        />
                      }
                      label={r.name}
                    />
                  ))
                ) : (
                  <Typography color="text.secondary" fontSize="small" sx={{ mt: 1 }}>
                    No reference fields found for this content type.
                  </Typography>
                )}
              </FormGroup>

            </FormControl>
          )}
        </CardContent>
        <Divider />
        <Stack direction="row" justifyContent="flex-end" sx={{ p: 2 }}>
          <CustomButtonSecond onClick={onClose} variant="outlined" size="small" sx={{ mr: 1 }}>
            Cancel
          </CustomButtonSecond>
          <CustomButton onClick={handleSaveData} variant="contained" size="small" disabled={!value}>
            Save
          </CustomButton>
        </Stack>
      </Card>
    </Modal>
  );
};
