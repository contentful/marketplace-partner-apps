import React, { ReactElement } from 'react';
import { SortableElement, SortableHandle } from 'react-sortable-hoc';
import { ProductCard } from '@contentful/ecommerce-app-base/lib/ProductCard';
import { LegacyProductCard } from '@contentful/ecommerce-app-base/lib/ProductCard';
import { useIntegration } from '@contentful/ecommerce-app-base/lib/Editor/IntegrationContext';
import { Product } from '@contentful/ecommerce-app-base/lib/types';
import { RenderDragFn } from '@contentful/ecommerce-app-base/lib/ProductCard/types';

export interface Props {
  product: Product;
  disabled: boolean;
  onDelete: () => void;
  isSortable: boolean;
  skuType?: string;
  index: number;
}

const CardDragHandle = SortableHandle(({ drag }: { drag: ReactElement }) => <>{drag}</>);

export const SortableListItem = SortableElement<Props>((props: Props) => {
  const { productCardVersion, name } = useIntegration();
  const dragHandleRender: RenderDragFn | undefined = props.isSortable
    ? ({ drag }) => <CardDragHandle drag={drag} />
    : undefined;

  if (productCardVersion === 'v2') {
    return (
      <>
        <ProductCard
          handleRemove={props.onDelete}
          dragHandleRender={dragHandleRender}
          productCardType={'field'}
          resource={props.product}
          title={`SAP - ${props.skuType!}`}
        />
      </>
    );
  }
  console.log("🚀 ~ file: SortableListItem.tsx:40 ~ SortableListItem ~ props:", props)
  return <LegacyProductCard {...props} />;
});
