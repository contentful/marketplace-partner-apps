import React, { useState, useEffect, useMemo } from 'react';
import { FormControl, Grid } from '@contentful/f36-components';
import { Multiselect } from '@contentful/f36-multiselect';
import { useCMA, useSDK } from '@contentful/react-apps-toolkit';

interface BwxMultiselectReferencesProps {
  entryId: string;
  selectedReferences: string[];
  onInput: (data: string[]) => void;
}

const BwxMultiselectReferences = ({ entryId, selectedReferences = [], onInput }: BwxMultiselectReferencesProps) => {
  const sdk = useSDK();
  const cma = useCMA();
  const defaultLocale = sdk.locales.default;

  const [references, setReferences] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [selectedTitles, setSelectedTitles] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const areAllSelected = useMemo(() => {
    return references.length > 0 && references.every((ref) => selected.includes(ref.sys.id));
  }, [selected, references]);

  useEffect(() => {
    setSelected(selectedReferences);
  }, [selectedReferences]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
  
      try {
        const contentTypesResponse = await cma.contentType.getMany({
          spaceId: sdk.ids.space,
          environmentId: sdk.ids.environment,
        });
  
        const referencesResponse = await cma.entry.references({
          spaceId: sdk.ids.space,
          environmentId: sdk.ids.environment,
          entryId,
          include: 1,
        }); 
  
        const refs = referencesResponse.includes?.Entry?.filter((entry) => entry.fields) || [];
        const formattedRefs = refs.map((ref) => {
          const contentType = contentTypesResponse.items.find((ct) => ct.sys.id === ref.sys.contentType.sys.id);
          const displayField = contentType?.displayField || 'title';
          const title = truncateText(ref.fields[displayField]?.[defaultLocale] || 'Untitled', 19);
          return { ...ref, title };
        });
  
        setReferences(formattedRefs);

        const uniqueReferenceIds = Array.from(new Set([entryId, ...formattedRefs.map((ref) => ref.sys.id)]));

        setSelected(uniqueReferenceIds); 
        setSelectedTitles(formattedRefs.map((ref) => ref.title)); 
        onInput(uniqueReferenceIds);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
  
    if (entryId) {
      fetchData();
    }
  }, [entryId, cma, sdk, onInput, defaultLocale]);  

  const handleSelectItem = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { checked, value } = event.target;

    setSelected((prev) => {
      const updated = checked
        ? Array.from(new Set([...prev, value])) 
        : prev.filter((id) => id !== value); 

      onInput(updated); 
      return updated;
    });

    const refTitle = references.find((ref) => ref.sys.id === value)?.title || 'Untitled';
    setSelectedTitles((prev) =>
      checked
        ? Array.from(new Set([...prev, refTitle])) 
        : prev.filter((title) => title !== refTitle) 
    );
  };

  const toggleSelectAll = () => {
    const allReferenceIds = references.map((ref) => ref.sys.id);
    const isEverythingSelected = allReferenceIds.every((id) => selected.includes(id));
  
    if (isEverythingSelected) {
      setSelected([entryId]); 
      setSelectedTitles([]);
      onInput([entryId]); 
    } else {
      const updatedSelection = Array.from(new Set([entryId, ...allReferenceIds]));
      setSelected(updatedSelection);
      setSelectedTitles(references.map((ref) => ref.title));
      onInput(updatedSelection);
    }
  };

  const truncateText = (text: string, maxLength: number): string => {
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  if (loading) {
    return <p>Loading references...</p>;
  }

  return (
    <Grid>
      <FormControl>
        <FormControl.Label>References</FormControl.Label>
        <Multiselect
          currentSelection={selectedTitles}
          placeholder="Show References"
          popoverProps={{ isFullWidth: true }}
        >
          <Multiselect.SelectAll
            itemId="select-all-references"
            onSelectItem={toggleSelectAll}
            isChecked={areAllSelected}
          />

          {references.map((ref) => (
            <Multiselect.Option
              key={ref.sys.id}
              itemId={ref.sys.id}
              value={ref.sys.id}
              label={ref.title}
              isChecked={selected.includes(ref.sys.id)}
              onSelectItem={handleSelectItem}
            />
          ))}
        </Multiselect>
      </FormControl>
    </Grid>
  );
};

export default BwxMultiselectReferences;
