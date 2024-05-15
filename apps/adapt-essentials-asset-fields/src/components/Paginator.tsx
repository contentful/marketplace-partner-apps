import { Pagination } from '@contentful/f36-components';
import { useEffect } from 'react';
import useEntriesSelection from './hooks/useEntriesSelection';
import useAssetEntries from './hooks/useAssetEntries';
import useEntriesLoading from './hooks/useEntriesLoading';
import useTotal from './hooks/useTotal';
import useActivePage from './hooks/useActivePage';
import useSkip from './hooks/useSkip';
import useOrder from './hooks/useOrder';
import useLimit from './hooks/useLimit';
import { useCMA } from './hooks/useCMA';

const Paginator = () => {
  const cma = useCMA();
  const { setIsLoading } = useEntriesLoading();
  const { total, setTotal } = useTotal();
  const { activePage, setActivePage } = useActivePage();
  const { skip, setSkip } = useSkip();
  const { limit } = useLimit();
  const { by: order } = useOrder();
  const { assetEntries, setAssetEntries } = useAssetEntries();
  const { setSelectedEntries } = useEntriesSelection();
  const { selectedEntries } = useEntriesSelection();

  useEffect(() => {
    setIsLoading(true);
    setSkip(activePage * limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePage]);

  useEffect(() => {
    async function fetchData() {
      // Fetch some entries were last updated by the current user.
      const assetResponse = await cma.asset.getMany({
        query: {
          skip,
          limit,
          order,
        },
      });
      setTotal(assetResponse.total);
      setAssetEntries(assetResponse.items);
      setIsLoading(false);
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cma.asset, setAssetEntries, skip, limit, order]);

  const pageChangeHandler = (activePage) => {
    setActivePage(activePage);
    setSelectedEntries([]);
  };

  return (
    selectedEntries.length < 1 && (
      <Pagination
        activePage={activePage}
        onPageChange={pageChangeHandler}
        isLastPage={total <= activePage * limit}
        pageLength={assetEntries.length}
        itemsPerPage={limit}
        totalItems={total}
      />
    )
  );
};

export default Paginator;
