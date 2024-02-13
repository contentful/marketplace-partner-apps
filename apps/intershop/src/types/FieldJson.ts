import { CategoryJson } from "./CategoryJson";

export interface FieldJson {
  channel: string;
  application: string;
  type: string;
  products: Array<string>;
  categories: Array<CategoryJson>;
}
