export interface MappedProductJson {
  brand: string;
  image: string;
  sku: string;
  title: string;
  defaultCategory: { id: string; categoryPath: Array<{ id: string }> };
  price: { value: string };
}
