export interface CategoryJson {
  category_id: string;
  excluded_products?: Array<string>;
  subcategories: Array<CategoryJson>;
}
