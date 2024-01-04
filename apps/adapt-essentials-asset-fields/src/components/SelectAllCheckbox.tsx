import { Checkbox } from '@contentful/f36-components';
import useEntriesSelection from './hooks/useEntriesSelection';
import useAssetEntries from './hooks/useAssetEntries';

const SelectAllCheckbox = () => {
  const { assetEntries } = useAssetEntries();
  const { selectedEntries, setSelectedEntries } = useEntriesSelection();
  const selectedAll = selectedEntries.length === assetEntries.length;
  return (
    <Checkbox
      isChecked={selectedAll}
      onChange={() => (!selectedAll ? setSelectedEntries(assetEntries.map((asset) => asset.sys.id)) : setSelectedEntries([]))}
    />
  );
};

export default SelectAllCheckbox;
