export default interface CategoryCard {
  aria?: string;
  contentType?: string;
  description?: string;
  thumbnailSrc: string;
  title: string;
  onClose?: () => void;
}
