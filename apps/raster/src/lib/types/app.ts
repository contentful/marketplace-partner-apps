export type AppState = {
  currentTab?: string;
  selectedLibrary?: Library;
};

export type Library = {
  id: string | null;
  name: string | null;
  imagesCount: number;
  photosCount: number;
};
