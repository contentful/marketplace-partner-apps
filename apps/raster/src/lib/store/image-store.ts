import { create } from 'zustand';
import type { Image } from '@/lib/types';

interface ImageStore {
  selected?: Image[] | null;
  setSelected: (images: Image[] | null) => void;
}

export const useImageStore = create<ImageStore>()((set) => ({
  selected: null,
  setSelected: (images) => set({ selected: images }),
}));
