export type Image = {
  id: string;
  parentId?: string;
  width: string;
  height: string;
  name: string;
  libraryId: string;
  blurhash: string;
  url: string;
  thumbUrl: string;
  thumbUrlBlurred: string;
  views?: [Image];
  type: string;
  description: string;
};
