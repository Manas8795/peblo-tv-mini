import { CatalogueData, SearchResultItem } from '../types';

export const API_BASE = '';

/**
 * Public Viewer API Client
 * Strictly restricted to public GET /catalog and GET /catalog/search.
 * NEVER makes requests to /admin, /shows, /episodes or write endpoints.
 */
export const catalogClient = {
  /**
   * Fetch the static pre-compiled published catalogue.json
   */
  getCatalogue: async (): Promise<CatalogueData> => {
    const res = await fetch(`${API_BASE}/catalog`, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (res.status === 404) {
      throw new Error('Catalogue not published yet. Please publish the catalogue in the CMS first.');
    }

    if (!res.ok) {
      throw new Error(`Failed to load catalogue (HTTP ${res.status})`);
    }

    return res.json();
  },

  /**
   * Search published catalogue with composing filters (q, category, language, section)
   */
  searchCatalogue: async (params: {
    q?: string;
    category?: string;
    language?: string;
    section?: string;
  }): Promise<SearchResultItem[]> => {
    const q = new URLSearchParams();
    if (params.q?.trim()) q.set('q', params.q.trim());
    if (params.category?.trim()) q.set('category', params.category.trim());
    if (params.language?.trim()) q.set('language', params.language.trim());
    if (params.section?.trim()) q.set('section', params.section.trim());

    const res = await fetch(`${API_BASE}/catalog/search?${q.toString()}`, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!res.ok) {
      throw new Error(`Search failed (HTTP ${res.status})`);
    }

    return res.json();
  }
};
