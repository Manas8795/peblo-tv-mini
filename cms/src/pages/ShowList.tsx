import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Plus, Filter, Film, Image as ImageIcon, CheckCircle, Clock, Trash2, Edit } from 'lucide-react';
import { api } from '../api/client';
import { Show } from '../types';

interface Props {
  onEditShow: (showId: string) => void;
  onCreateShow: () => void;
}

export const ShowList: React.FC<Props> = ({ onEditShow, onCreateShow }) => {
  const [search, setSearch] = useState('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['shows', search, selectedSection, selectedStatus],
    queryFn: () => api.getShows({
      search: search || undefined,
      section: selectedSection || undefined,
      status: selectedStatus || undefined,
      limit: 50
    })
  });

  const shows = data?.items || [];

  const handleDelete = async (e: React.MouseEvent, id: string, title: string) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete show "${title}"? This cannot be undone.`)) {
      try {
        await api.deleteShow(id);
        refetch();
      } catch (err: any) {
        alert(err.message || 'Failed to delete show');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight">Shows & Episodes Studio</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage your catalog hierarchy, assign sections, and validate assets.
          </p>
        </div>

        <button
          onClick={onCreateShow}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Show</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search shows by title or synopsis..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Section Filter */}
        <select
          value={selectedSection}
          onChange={(e) => setSelectedSection(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Sections</option>
          <option value="featured">Featured</option>
          <option value="series">Series</option>
          <option value="minisodes">Minisodes</option>
          <option value="songs">Songs</option>
        </select>

        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-16 text-center text-slate-400">
          <div className="inline-block animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mb-3" />
          <p className="text-sm font-medium">Loading catalog shows...</p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-red-950/30 border border-red-900/50 rounded-xl p-6 text-center text-red-300">
          <p className="font-semibold text-sm">Failed to load shows</p>
          <p className="text-xs text-red-400 mt-1">{(error as any).message}</p>
        </div>
      )}

      {/* Shows Grid */}
      {!isLoading && !error && (
        <>
          {shows.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-16 text-center text-slate-500">
              <Film className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-base font-semibold text-slate-300">No shows found</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No shows match your filter criteria or search query. Try clearing filters or create a new show.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {shows.map((show) => {
                const poster = show.artwork?.find(a => a.artwork_type === 'poster');
                const isPublished = show.status === 'published';

                return (
                  <div
                    key={show.id}
                    onClick={() => onEditShow(show.id)}
                    className="group cursor-pointer bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/50 rounded-xl overflow-hidden transition-all shadow-sm hover:shadow-lg hover:shadow-indigo-500/5 flex flex-col"
                  >
                    {/* Poster Header */}
                    <div className="relative aspect-[16/10] bg-slate-950 overflow-hidden">
                      {poster ? (
                        <img
                          src={poster.url}
                          alt={show.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-600">
                          <ImageIcon className="w-8 h-8 mb-1 opacity-50" />
                          <span className="text-[11px]">No Poster Uploaded</span>
                        </div>
                      )}

                      {/* Section Badge */}
                      <span className="absolute top-2.5 left-2.5 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-sm text-indigo-300 border border-indigo-500/30">
                        {show.section || 'Unassigned'}
                      </span>

                      {/* Status Badge */}
                      <span
                        className={`absolute top-2.5 right-2.5 text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-sm flex items-center gap-1 border ${
                          isPublished
                            ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40'
                            : 'bg-amber-950/80 text-amber-400 border-amber-500/40'
                        }`}
                      >
                        {isPublished ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {show.status}
                      </span>
                    </div>

                    {/* Content Body */}
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-slate-100 text-sm group-hover:text-indigo-400 transition-colors line-clamp-1">
                          {show.title}
                        </h3>
                        <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                          {show.synopsis || 'No synopsis provided.'}
                        </p>
                      </div>

                      {/* Footer Info */}
                      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                        <span>
                          {show.seasons?.length || 0} seasons •{' '}
                          {show.seasons?.reduce((acc, s) => acc + (s.episodes?.length || 0), 0) || 0} eps
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditShow(show.id);
                            }}
                            className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-indigo-300 transition-colors"
                            title="Edit Show"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(e, show.id, show.title)}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors"
                            title="Delete Show"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
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
