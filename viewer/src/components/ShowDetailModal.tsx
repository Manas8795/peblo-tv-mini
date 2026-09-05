import React, { useState } from 'react';
import { X, Play, Clock, Globe, Film, Sparkles } from 'lucide-react';
import { CatalogueShow, CatalogueSeason, CatalogueEpisode } from '../types';

interface Props {
  show: CatalogueShow | null;
  onClose: () => void;
}

export const ShowDetailModal: React.FC<Props> = ({ show, onClose }) => {
  if (!show) return null;

  const [selectedSeasonNum, setSelectedSeasonNum] = useState<number>(
    show.seasons[0]?.season_number || 1
  );
  const [activePlayingEpisode, setActivePlayingEpisode] = useState<CatalogueEpisode | null>(null);

  const currentSeason = show.seasons.find(s => s.season_number === selectedSeasonNum);
  const episodes = currentSeason?.episodes || [];
  const trailers = show.trailers || [];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="relative bg-zinc-950 border border-zinc-800 rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-white flex items-center justify-center transition-colors border border-zinc-700"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Banner Header */}
        <div className="relative aspect-[16/8] max-h-[360px] w-full bg-zinc-900 overflow-hidden">
          {show.banner_url ? (
            <img src={show.banner_url} alt={show.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-600">No Banner Image</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-transparent" />

          <div className="absolute bottom-6 left-6 right-6 space-y-2">
            <span className="text-xs uppercase font-extrabold tracking-wider px-2.5 py-1 rounded bg-red-600 text-white shadow-md">
              {show.section}
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">{show.title}</h2>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Metadata & Synopsis */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-zinc-400 font-medium">{show.seasons.length} Seasons</span>
              <span className="text-zinc-600">•</span>
              {show.categories.map((c) => (
                <span key={c} className="capitalize text-zinc-300 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                  {c}
                </span>
              ))}
            </div>

            <p className="text-sm text-zinc-300 leading-relaxed max-w-3xl">
              {show.synopsis || 'No detailed synopsis available.'}
            </p>
          </div>

          {/* Season Selector */}
          {show.seasons.length > 0 && (
            <div className="border-t border-zinc-850 pt-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white">Episodes</h3>

                {/* Season Dropdown */}
                {show.seasons.length > 1 && (
                  <select
                    value={selectedSeasonNum}
                    onChange={(e) => setSelectedSeasonNum(parseInt(e.target.value))}
                    className="bg-zinc-900 border border-zinc-700 text-xs text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-red-500"
                  >
                    {show.seasons.map((s) => (
                      <option key={s.season_number} value={s.season_number}>
                        Season {s.season_number} ({s.episodes.length} episodes)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Episodes List */}
              <div className="divide-y divide-zinc-900">
                {episodes.map((ep) => (
                  <div
                    key={ep.id}
                    onClick={() => setActivePlayingEpisode(ep)}
                    className="group py-3.5 px-3 rounded-xl hover:bg-zinc-900/60 cursor-pointer flex items-center justify-between gap-4 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-bold text-zinc-500 font-mono w-6 text-center">
                        {ep.episode_number}
                      </span>

                      {/* Thumbnail with hover play icon */}
                      <div className="relative w-28 sm:w-36 aspect-[16/9] rounded-lg bg-zinc-900 border border-zinc-800 overflow-hidden shrink-0">
                        {ep.thumbnail_url ? (
                          <img src={ep.thumbnail_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-zinc-600">
                            Thumbnail
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Play className="w-6 h-6 fill-white text-white" />
                        </div>
                      </div>

                      {/* Episode Info */}
                      <div className="space-y-1">
                        <h4 className="text-sm font-semibold text-white group-hover:text-red-400 transition-colors">
                          {ep.title}
                        </h4>
                        <p className="text-xs text-zinc-400 line-clamp-1">
                          {ep.synopsis || 'Watch this fun episode with your child.'}
                        </p>

                        {/* Collapsed Language Variant Pills */}
                        <div className="flex items-center gap-2 pt-0.5">
                          <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {Math.round(ep.duration_seconds / 60)}m
                          </span>

                          {ep.languages && ep.languages.length > 0 && (
                            <div className="flex items-center gap-1">
                              <Globe className="w-3 h-3 text-zinc-500" />
                              {ep.languages.map((l) => (
                                <span
                                  key={l}
                                  className="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300"
                                >
                                  {l}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setActivePlayingEpisode(ep)}
                      className="shrink-0 p-2 rounded-full bg-zinc-800 group-hover:bg-red-600 text-white transition-colors"
                      title="Play episode"
                    >
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trailers & Extras (Season 0 isolated) */}
          {trailers.length > 0 && (
            <div className="border-t border-zinc-850 pt-5 space-y-3">
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white">Trailers & Extras (Season 0)</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Trailer Convention
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {trailers.map((t) => (
                  <div
                    key={t.id}
                    className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl flex items-center gap-3"
                  >
                    <div className="w-24 aspect-[16/9] rounded bg-zinc-800 overflow-hidden shrink-0">
                      {t.thumbnail_url ? (
                        <img src={t.thumbnail_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[9px] text-zinc-600">Trailer</div>
                      )}
                    </div>
                    <div className="space-y-1 truncate">
                      <p className="text-xs font-semibold text-white truncate">{t.title}</p>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {t.duration_seconds ? `${t.duration_seconds}s` : 'Trailer'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mini Video Player Simulator */}
      {activePlayingEpisode && (
        <div className="fixed inset-0 z-60 bg-black/95 flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="max-w-md space-y-3">
            <div className="w-16 h-16 mx-auto rounded-full bg-red-600 flex items-center justify-center shadow-2xl">
              <Play className="w-8 h-8 fill-white ml-1 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white">{activePlayingEpisode.title}</h3>
            <p className="text-xs text-zinc-400">
              Playing in <span className="uppercase text-red-400 font-bold">{activePlayingEpisode.languages.join(' & ')}</span>
            </p>
            <p className="text-xs text-zinc-500">
              Duration: {Math.round(activePlayingEpisode.duration_seconds / 60)} minutes ({activePlayingEpisode.duration_seconds} seconds)
            </p>
            <button
              onClick={() => setActivePlayingEpisode(null)}
              className="mt-4 px-6 py-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold"
            >
              Back to Show
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
