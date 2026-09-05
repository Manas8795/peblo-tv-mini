import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Plus, Film, AlertCircle, Trash2, CheckCircle2, ChevronDown, ChevronRight, Video } from 'lucide-react';
import { api } from '../api/client';
import { Show, Episode, Season, Artwork } from '../types';
import { ArtworkUploadSlot } from '../components/ArtworkUploadSlot';

interface Props {
  showId: string | null; // null means create new
  onBack: () => void;
}

export const ShowEditor: React.FC<Props> = ({ showId, onBack }) => {
  const queryClient = useQueryClient();
  const isEditing = Boolean(showId);

  // Form State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [section, setSection] = useState('featured');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');

  // Active Episode Modal / Edit
  const [editingEpisode, setEditingEpisode] = useState<{
    episode: Partial<Episode>;
    seasonId: string;
    isNew: boolean;
  } | null>(null);

  // New Season Number State
  const [newSeasonNumber, setNewSeasonNumber] = useState<number>(1);
  const [showAddSeason, setShowAddSeason] = useState(false);

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const { data: show, isLoading, refetch } = useQuery({
    queryKey: ['show', showId],
    queryFn: () => api.getShow(showId!),
    enabled: isEditing
  });

  useEffect(() => {
    if (show) {
      setTitle(show.title || '');
      setSlug(show.slug || '');
      setSynopsis(show.synopsis || '');
      setSection(show.section || 'featured');
      setStatus(show.status || 'draft');
    }
  }, [show]);

  const handleSaveShow = async () => {
    setNotification(null);
    try {
      if (isEditing) {
        await api.updateShow(showId!, {
          title,
          slug,
          synopsis,
          section,
          status
        });
        setNotification({ type: 'success', message: 'Show updated successfully!' });
      } else {
        const created = await api.createShow({
          title,
          slug,
          synopsis,
          section,
          status
        });
        setNotification({ type: 'success', message: 'Show created successfully!' });
        onBack();
      }
      queryClient.invalidateQueries({ queryKey: ['shows'] });
      if (isEditing) refetch();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to save show' });
    }
  };

  const handleCreateSeason = async () => {
    if (!showId) return;
    try {
      await api.createSeason({
        show_id: showId,
        season_number: newSeasonNumber
      });
      setShowAddSeason(false);
      refetch();
    } catch (err: any) {
      alert(err.message || 'Failed to create season');
    }
  };

  const handleDeleteSeason = async (seasonId: string, seasonNum: number) => {
    if (window.confirm(`Delete Season ${seasonNum} and all its episodes?`)) {
      try {
        await api.deleteSeason(seasonId);
        refetch();
      } catch (err: any) {
        alert(err.message || 'Failed to delete season');
      }
    }
  };

  const handleSaveEpisode = async () => {
    if (!editingEpisode) return;
    try {
      if (editingEpisode.isNew) {
        await api.createEpisode({
          ...editingEpisode.episode,
          season_id: editingEpisode.seasonId
        } as any);
      } else {
        await api.updateEpisode(editingEpisode.episode.id!, editingEpisode.episode);
      }
      setEditingEpisode(null);
      refetch();
    } catch (err: any) {
      alert(err.message || 'Failed to save episode');
    }
  };

  const handleDeleteEpisode = async (episodeId: string) => {
    if (window.confirm('Delete this episode?')) {
      try {
        await api.deleteEpisode(episodeId);
        refetch();
      } catch (err: any) {
        alert(err.message || 'Failed to delete episode');
      }
    }
  };

  const posterArtwork = show?.artwork?.find(a => a.artwork_type === 'poster');
  const bannerArtwork = show?.artwork?.find(a => a.artwork_type === 'banner');

  if (isEditing && isLoading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-16 text-center text-slate-400">
        <div className="inline-block animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mb-3" />
        <p className="text-sm">Loading show details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Shows</span>
        </button>

        <button
          onClick={handleSaveShow}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all"
        >
          <Save className="w-4 h-4" />
          <span>{isEditing ? 'Save Changes' : 'Create Show'}</span>
        </button>
      </div>

      {notification && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center gap-2 border ${
            notification.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-900/50 text-emerald-300'
              : 'bg-red-950/40 border-red-900/50 text-red-300'
          }`}
        >
          {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Grid: Left Column Settings, Right Column Show Artwork Slots */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Basic Details Form */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h2 className="font-bold text-slate-100 text-sm border-b border-slate-800 pb-3">Show Metadata</h2>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Show Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Moti's Many Lives"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Slug</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g. motis-many-lives"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Section (Catalogue Row) *</label>
                <select
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="featured">Featured</option>
                  <option value="series">Series</option>
                  <option value="minisodes">Minisodes</option>
                  <option value="songs">Songs</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Synopsis</label>
              <textarea
                rows={3}
                value={synopsis}
                onChange={(e) => setSynopsis(e.target.value)}
                placeholder="Write a child-friendly synopsis..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Publishing Status</label>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value="draft"
                    checked={status === 'draft'}
                    onChange={() => setStatus('draft')}
                    className="accent-indigo-500"
                  />
                  <span>Draft (Hidden from public catalog)</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value="published"
                    checked={status === 'published'}
                    onChange={() => setStatus('published')}
                    className="accent-indigo-500"
                  />
                  <span className="text-emerald-400 font-medium">Published (Included in catalog release)</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Show Artwork Slots (Poster + Banner) */}
        <div className="space-y-4">
          <h2 className="font-bold text-slate-100 text-sm">Show Artwork Assets</h2>

          <ArtworkUploadSlot
            label="Poster Artwork"
            type="poster"
            aspect="2:3"
            dimensions="600x900 px"
            maxKb={200}
            showId={showId || undefined}
            currentArtwork={posterArtwork}
            onUploaded={() => refetch()}
          />

          <ArtworkUploadSlot
            label="Banner (Hero) Artwork"
            type="banner"
            aspect="16:9"
            dimensions="1280x720 px"
            maxKb={200}
            showId={showId || undefined}
            currentArtwork={bannerArtwork}
            onUploaded={() => refetch()}
          />
        </div>
      </div>

      {/* Seasons and Episodes Section */}
      {isEditing && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="font-bold text-slate-100 text-sm">Seasons & Episodes Hierarchy</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Season 0 is reserved for Trailers. Episodes with matching content_group collapse into language variants.
              </p>
            </div>

            <button
              onClick={() => setShowAddSeason(!showAddSeason)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-semibold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Season</span>
            </button>
          </div>

          {/* Add Season Row */}
          {showAddSeason && (
            <div className="bg-slate-950/80 border border-indigo-500/30 rounded-xl p-3 flex items-center gap-3">
              <label className="text-xs text-slate-300 font-medium">Season Number:</label>
              <input
                type="number"
                min="0"
                value={newSeasonNumber}
                onChange={(e) => setNewSeasonNumber(parseInt(e.target.value) || 0)}
                className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
              />
              <span className="text-xs text-slate-400">
                {newSeasonNumber === 0 ? '(Trailers Only)' : '(Normal Season)'}
              </span>
              <button
                onClick={handleCreateSeason}
                className="ml-auto px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
              >
                Create Season
              </button>
            </div>
          )}

          {/* Seasons List */}
          <div className="space-y-4">
            {show?.seasons?.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No seasons added yet. Click "Add Season" above.</p>
            ) : (
              show?.seasons?.map((season) => {
                const isTrailer = season.season_number === 0;

                return (
                  <div key={season.id} className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
                    {/* Season Header */}
                    <div className="bg-slate-950/80 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-200 text-xs">
                          {isTrailer ? 'Season 0 — Trailers' : `Season ${season.season_number}`}
                        </span>
                        {isTrailer && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            Trailers Convention
                          </span>
                        )}
                        <span className="text-xs text-slate-500 font-mono">({season.episodes.length} episodes)</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingEpisode({
                            episode: {
                              episode_number: season.episodes.length + 1,
                              language: 'en',
                              status: 'draft',
                              duration_seconds: 300
                            },
                            seasonId: season.id,
                            isNew: true
                          })}
                          className="flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 text-[11px] font-semibold transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Episode</span>
                        </button>

                        <button
                          onClick={() => handleDeleteSeason(season.id, season.season_number)}
                          className="p-1 rounded hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors"
                          title="Delete Season"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Episodes Table */}
                    <div className="divide-y divide-slate-800/40">
                      {season.episodes.length === 0 ? (
                        <p className="text-xs text-slate-600 p-4 text-center">No episodes in this season.</p>
                      ) : (
                        season.episodes.map((ep) => {
                          const thumb = ep.artwork?.find(a => a.artwork_type === 'thumbnail');
                          const isEpPublished = ep.status === 'published';

                          return (
                            <div
                              key={ep.id}
                              className="p-3 hover:bg-slate-800/20 flex items-center justify-between gap-4 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                {/* Thumbnail */}
                                <div className="w-16 aspect-[16/9] rounded bg-slate-900 border border-slate-800 overflow-hidden shrink-0">
                                  {thumb ? (
                                    <img src={thumb.url} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-700 text-[9px]">
                                      No thumb
                                    </div>
                                  )}
                                </div>

                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-slate-500 text-xs">E{ep.episode_number}</span>
                                    <span className="font-semibold text-slate-200 text-xs">{ep.title}</span>
                                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                                      {ep.language.toUpperCase()}
                                    </span>
                                    {ep.content_group && (
                                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                                        cg: {ep.content_group}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                                    <span>{ep.duration_seconds ? `${Math.round(ep.duration_seconds / 60)}m (${ep.duration_seconds}s)` : 'No duration'}</span>
                                    {ep.category && <span>• {ep.category}</span>}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                    isEpPublished
                                      ? 'bg-emerald-500/10 text-emerald-400'
                                      : 'bg-amber-500/10 text-amber-400'
                                  }`}
                                >
                                  {ep.status}
                                </span>

                                <button
                                  onClick={() => setEditingEpisode({ episode: { ...ep }, seasonId: season.id, isNew: false })}
                                  className="text-xs text-indigo-300 hover:text-indigo-200 px-2 py-1 rounded hover:bg-slate-800 font-medium"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteEpisode(ep.id)}
                                  className="p-1 text-slate-500 hover:text-red-400"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Episode Edit Modal */}
      {editingEpisode && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-slate-100 text-base">
              {editingEpisode.isNew ? 'Create Episode' : 'Edit Episode'}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Episode Title *</label>
                <input
                  type="text"
                  value={editingEpisode.episode.title || ''}
                  onChange={(e) => setEditingEpisode({
                    ...editingEpisode,
                    episode: { ...editingEpisode.episode, title: e.target.value }
                  })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Episode #</label>
                  <input
                    type="number"
                    min="1"
                    value={editingEpisode.episode.episode_number || 1}
                    onChange={(e) => setEditingEpisode({
                      ...editingEpisode,
                      episode: { ...editingEpisode.episode, episode_number: parseInt(e.target.value) || 1 }
                    })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Duration (sec) *</label>
                  <input
                    type="number"
                    min="0"
                    value={editingEpisode.episode.duration_seconds || 0}
                    onChange={(e) => setEditingEpisode({
                      ...editingEpisode,
                      episode: { ...editingEpisode.episode, duration_seconds: parseInt(e.target.value) || 0 }
                    })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Language *</label>
                  <select
                    value={editingEpisode.episode.language || 'en'}
                    onChange={(e) => setEditingEpisode({
                      ...editingEpisode,
                      episode: { ...editingEpisode.episode, language: e.target.value }
                    })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200"
                  >
                    <option value="en">English (en)</option>
                    <option value="hi">Hindi (hi)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Content Group (Collapse Key)</label>
                  <input
                    type="text"
                    value={editingEpisode.episode.content_group || ''}
                    placeholder="e.g. motis-many-lives-s01e01"
                    onChange={(e) => setEditingEpisode({
                      ...editingEpisode,
                      episode: { ...editingEpisode.episode, content_group: e.target.value }
                    })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Status</label>
                  <select
                    value={editingEpisode.episode.status || 'draft'}
                    onChange={(e) => setEditingEpisode({
                      ...editingEpisode,
                      episode: { ...editingEpisode.episode, status: e.target.value as any }
                    })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>

              {/* Episode Thumbnail Upload Slot */}
              {!editingEpisode.isNew && editingEpisode.episode.id && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Episode Thumbnail</label>
                  <ArtworkUploadSlot
                    label="Episode Thumbnail"
                    type="thumbnail"
                    aspect="16:9"
                    dimensions="640x360 px"
                    maxKb={200}
                    episodeId={editingEpisode.episode.id}
                    currentArtwork={editingEpisode.episode.artwork?.find(a => a.artwork_type === 'thumbnail')}
                    onUploaded={(art) => {
                      setEditingEpisode({
                        ...editingEpisode,
                        episode: {
                          ...editingEpisode.episode,
                          artwork: [art]
                        }
                      });
                    }}
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setEditingEpisode(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEpisode}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
              >
                Save Episode
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
