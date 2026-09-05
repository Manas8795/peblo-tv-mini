import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, Filter, X, Film, Globe } from 'lucide-react';
import { catalogClient } from '../api/catalogClient';
import { SearchResultItem, CatalogueShow } from '../types';

interface Props {
  onSelectShow: (show: CatalogueShow) => void;
}

const CATEGORIES = [
  'adventure', 'folk', 'friendship', 'india', 'language',
  'learning', 'maths', 'music', 'nature', 'reading',
  'science', 'singalong', 'stories', 'travel', 'values'
];

const SECTIONS = ['featured', 'series', 'minisodes', 'songs'];

export const SearchPage: React.FC<Props> = ({ onSelectShow }) => {
  const [q, setQ] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [selectedSection, setSelectedSection] = useState('');

  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const fetchResults = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await catalogClient.searchCatalogue({
          q: q || undefined,
          category: selectedCategory || undefined,
          language: selectedLanguage || undefined,
          section: selectedSection || undefined,
        });
        if (active) setResults(data);
      } catch (err: any) {
        if (active) setError(err.message || 'Search failed');
      } finally {
        if (active) setIsLoading(false);
      }
    };

    const timer = setTimeout(fetchResults, 200);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [q, selectedCategory, selectedLanguage, selectedSection]);

  const clearFilters = () => {
    setQ('');
    setSelectedCategory('');
    setSelectedLanguage('');
    setSelectedSection('');
  };

  const hasActiveFilters = Boolean(q || selectedCategory || selectedLanguage || selectedSection);

  return (
    <div className="pt-24 pb-16 px-6 sm:px-12 max-w-7xl mx-auto space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <SearchIcon className="w-5 h-5 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search by show title, episode title, character, or topic..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-12 pr-10 py-3.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-colors shadow-xl"
        />
        {q && (
          <button
            onClick={() => setQ('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Composing Filter Chips */}
      <div className="space-y-3 bg-zinc-950 border border-zinc-900 rounded-xl p-4">
        {/* Section Row */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-zinc-500 font-semibold text-[11px] uppercase mr-2">Section:</span>
          <button
            onClick={() => setSelectedSection('')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              selectedSection === '' ? 'bg-red-600 text-white' : 'bg-zinc-900 text-zinc-400 hover:text-white'
            }`}
          >
            All Sections
          </button>
          {SECTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setSelectedSection(selectedSection === s ? '' : s)}
              className={`capitalize px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                selectedSection === s ? 'bg-red-600 text-white' : 'bg-zinc-900 text-zinc-400 hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Language Row */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-zinc-500 font-semibold text-[11px] uppercase mr-2">Language:</span>
          <button
            onClick={() => setSelectedLanguage('')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              selectedLanguage === '' ? 'bg-red-600 text-white' : 'bg-zinc-900 text-zinc-400 hover:text-white'
            }`}
          >
            All Languages
          </button>
          <button
            onClick={() => setSelectedLanguage(selectedLanguage === 'en' ? '' : 'en')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              selectedLanguage === 'en' ? 'bg-red-600 text-white' : 'bg-zinc-900 text-zinc-400 hover:text-white'
            }`}
          >
            English (en)
          </button>
          <button
            onClick={() => setSelectedLanguage(selectedLanguage === 'hi' ? '' : 'hi')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              selectedLanguage === 'hi' ? 'bg-red-600 text-white' : 'bg-zinc-900 text-zinc-400 hover:text-white'
            }`}
          >
            Hindi (hi)
          </button>
        </div>

        {/* Categories Chips */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs pt-1 border-t border-zinc-900">
          <span className="text-zinc-500 font-semibold text-[11px] uppercase mr-2">Category:</span>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCategory(selectedCategory === c ? '' : c)}
              className={`capitalize px-2.5 py-0.5 rounded-md text-[11px] font-medium transition-all ${
                selectedCategory === c
                  ? 'bg-zinc-200 text-black font-bold'
                  : 'bg-zinc-900/80 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {hasActiveFilters && (
          <div className="pt-2 flex justify-end">
            <button
              onClick={clearFilters}
              className="text-xs text-red-400 hover:text-red-300 font-medium"
            >
              Clear all active filters
            </button>
          </div>
        )}
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-zinc-400">
        <span>
          Showing <strong className="text-white">{results.length}</strong> matching shows
        </span>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="p-16 text-center text-zinc-400">
          <div className="inline-block animate-spin w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full mb-3" />
          <p className="text-sm font-medium">Filtering published catalogue...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-950/40 border border-red-900/50 rounded-xl p-6 text-center text-red-300 text-xs">
          {error}
        </div>
      )}

      {/* Results Grid */}
      {!isLoading && !error && (
        <>
          {results.length === 0 ? (
            <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-16 text-center space-y-3">
              <Film className="w-12 h-12 mx-auto text-zinc-700" />
              <h3 className="text-base font-bold text-zinc-300">No matching shows or episodes found</h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                No published titles matched your composed query and filter combination. Try clearing filters or searching for terms like "Moti" or "Songs".
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-white font-semibold"
                >
                  Reset All Filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {results.map((item) => {
                // Adapt SearchResultItem to CatalogueShow
                const mockShow: CatalogueShow = {
                  id: item.show_id,
                  title: item.show_title,
                  section: item.section,
                  categories: item.categories,
                  poster_url: item.poster_url,
                  banner_url: item.banner_url,
                  seasons: [],
                  trailers: []
                };

                return (
                  <div
                    key={item.show_id}
                    onClick={() => onSelectShow(mockShow)}
                    className="group cursor-pointer bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden transition-all hover:scale-105 hover:shadow-xl"
                  >
                    <div className="aspect-[2/3] bg-zinc-950 relative overflow-hidden">
                      {item.poster_url ? (
                        <img
                          src={item.poster_url}
                          alt={item.show_title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">
                          {item.show_title}
                        </div>
                      )}

                      <span className="absolute top-2 left-2 text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-black/80 text-zinc-200">
                        {item.section}
                      </span>
                    </div>

                    <div className="p-3 space-y-1">
                      <h4 className="font-bold text-xs text-white truncate">{item.show_title}</h4>
                      <p className="text-[11px] text-zinc-400">
                        {item.matched_episodes.length} matching eps
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};
