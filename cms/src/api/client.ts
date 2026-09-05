import { Show, Episode, Season, Artwork, ValidationReport, PublishRun } from '../types';

export const API_BASE = '';

export const ROLES = {
  ADMIN: {
    key: 'admin-secret-key-peblo',
    label: 'Admin (Can Publish)',
    role: 'admin'
  },
  EDITOR: {
    key: 'editor-secret-key-peblo',
    label: 'Editor (CRUD Only)',
    role: 'editor'
  }
};

export function getCurrentRoleKey(): string {
  return localStorage.getItem('peblo_cms_role_key') || ROLES.ADMIN.key;
}

export function setCurrentRoleKey(key: string) {
  localStorage.setItem('peblo_cms_role_key', key);
  window.dispatchEvent(new Event('peblo-role-changed'));
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('X-API-Key', getCurrentRoleKey());

  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });

  if (response.status === 204) {
    return null as T;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.detail || `HTTP error ${response.status}: ${response.statusText}`;
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // Shows
  getShows: (params?: { search?: string; section?: string; status?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.search) q.set('search', params.search);
    if (params?.section) q.set('section', params.section);
    if (params?.status) q.set('status', params.status);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    return request<{ total: number; items: Show[] }>(`/shows?${q.toString()}`);
  },

  getShow: (id: string) => request<Show>(`/shows/${id}`),
  createShow: (show: Partial<Show>) => request<Show>('/shows', { method: 'POST', body: JSON.stringify(show) }),
  updateShow: (id: string, show: Partial<Show>) => request<Show>(`/shows/${id}`, { method: 'PUT', body: JSON.stringify(show) }),
  deleteShow: (id: string) => request<void>(`/shows/${id}`, { method: 'DELETE' }),

  // Seasons
  createSeason: (payload: { show_id: string; season_number: number }) =>
    request<Season>('/seasons', { method: 'POST', body: JSON.stringify(payload) }),
  deleteSeason: (id: string) => request<void>(`/seasons/${id}`, { method: 'DELETE' }),

  // Episodes
  getEpisodes: (params?: { show_id?: string; season_id?: string; language?: string; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.show_id) q.set('show_id', params.show_id);
    if (params?.season_id) q.set('season_id', params.season_id);
    if (params?.language) q.set('language', params.language);
    if (params?.status) q.set('status', params.status);
    return request<Episode[]>(`/episodes?${q.toString()}`);
  },

  getEpisode: (id: string) => request<Episode>(`/episodes/${id}`),
  createEpisode: (episode: Partial<Episode> & { season_id: string }) =>
    request<Episode>('/episodes', { method: 'POST', body: JSON.stringify(episode) }),
  updateEpisode: (id: string, episode: Partial<Episode>) =>
    request<Episode>(`/episodes/${id}`, { method: 'PUT', body: JSON.stringify(episode) }),
  deleteEpisode: (id: string) => request<void>(`/episodes/${id}`, { method: 'DELETE' }),

  // Artwork upload
  uploadArtwork: async (payload: { file: File; artwork_type: string; show_id?: string; episode_id?: string }) => {
    const formData = new FormData();
    formData.append('file', payload.file);
    formData.append('artwork_type', payload.artwork_type);
    if (payload.show_id) formData.append('show_id', payload.show_id);
    if (payload.episode_id) formData.append('episode_id', payload.episode_id);

    return request<Artwork>('/artwork/upload', {
      method: 'POST',
      body: formData
    });
  },

  // Validation
  getValidationReport: () => request<ValidationReport>('/admin/validation-report'),

  // Publish
  publishCatalog: () => request<{ run_id: string; status: string; message: string; shows_published: number; episodes_published: number }>('/admin/catalog/publish', {
    method: 'POST'
  }),
  getPublishRuns: () => request<PublishRun[]>('/admin/catalog/runs'),
};
