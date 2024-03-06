export interface Category {
  selected?: boolean;
  totalProducts?: number;
  id: string;
  image?: string;
  title: string;
  categoryPath: Array<string>;
  subCategories: Array<Category>;
}
