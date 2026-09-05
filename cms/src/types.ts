export interface Artwork {
  id: string;
  show_id?: string;
  episode_id?: string;
  artwork_type: 'poster' | 'banner' | 'thumbnail';
  url: string;
  storage_key: string;
  width: number;
  height: number;
  size_bytes: number;
  checksum?: string;
  created_at: string;
}

export interface Episode {
  id: string;
  season_id: string;
  episode_number: number;
  title: string;
  synopsis?: string;
  duration_seconds?: number;
  category?: string;
  categories?: string[];
  language: string;
  content_group?: string;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
  artwork: Artwork[];
}

export interface Season {
  id: string;
  show_id: string;
  season_number: number;
  episodes: Episode[];
}

export interface Show {
  id: string;
  title: string;
  slug?: string;
  synopsis?: string;
  section?: string;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
  seasons: Season[];
  artwork: Artwork[];
}

export interface ValidationErrorItem {
  entity_type: 'show' | 'episode';
  entity_id: string;
  show_id?: string;
  show_title?: string;
  episode_title?: string;
  season_number?: number;
  episode_number?: number;
  issue: string;
  action_required: string;
}

export interface ValidationReport {
  is_publishable: boolean;
  total_issues: number;
  grouped_by_cause: Record<string, ValidationErrorItem[]>;
  summary: Record<string, number>;
}

export interface PublishRun {
  id: string;
  triggered_by: string;
  started_at: string;
  finished_at?: string;
  status: 'started' | 'success' | 'failed';
  shows_count: number;
  episodes_count: number;
  outcome_message?: string;
  catalogue_key?: string;
}
