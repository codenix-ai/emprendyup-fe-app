// Normalized photo shape used by the picker (compatible with backend response)
export interface PickerPhoto {
  id: string;
  url: string; // regular/full URL to use in hero
  thumbUrl?: string; // thumbnail URL for grid
  author?: string | null;
  alt?: string | null;
  // keep optional raw unsplash shape for compatibility
  _raw?: any;
}

export interface UnsplashSearchResult {
  total: number;
  totalPages?: number;
  // backend returns `totalPages` while Unsplash API returns `total_pages`
  results: PickerPhoto[] | any[];
}
