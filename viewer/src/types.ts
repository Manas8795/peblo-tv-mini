export interface CatalogueEpisode {
  id: string;
  episode_number: number;
  title: string;
  synopsis?: string;
  duration_seconds: number;
  category?: string;
  categories: string[];
  languages: string[]; // Collapsed language variants e.g. ["en", "hi"]
  content_group?: string;
  thumbnail_url?: string;
  banner_url?: string;
}

export interface CatalogueSeason {
  season_number: number;
  episodes: CatalogueEpisode[];
}

export interface CatalogueTrailer {
  id: string;
  title: string;
  duration_seconds?: number;
  languages: string[];
  thumbnail_url?: string;
}

export interface CatalogueShow {
  id: string;
  title: string;
  slug?: string;
  synopsis?: string;
  section: string;
  categories: string[];
  poster_url?: string;
  banner_url?: string;
  seasons: CatalogueSeason[]; // Season 1..N
  trailers: CatalogueTrailer[]; // Season 0 trailers isolated
}

export interface CatalogueData {
  version: string;
  published_at: string;
  run_id: string;
  total_shows: number;
  total_episodes: number;
  sections: Record<string, CatalogueShow[]>;
  all_shows: CatalogueShow[];
}

export interface SearchResultItem {
  show_id: string;
  show_title: string;
  section: string;
  categories: string[];
  poster_url?: string;
  banner_url?: string;
  matched_episodes: CatalogueEpisode[];
}
