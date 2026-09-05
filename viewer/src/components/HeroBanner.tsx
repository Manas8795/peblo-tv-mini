import React from 'react';
import { Play, Info, Volume2 } from 'lucide-react';
import { CatalogueShow } from '../types';

interface Props {
  show: CatalogueShow | null;
  onMoreInfo: (show: CatalogueShow) => void;
}

export const HeroBanner: React.FC<Props> = ({ show, onMoreInfo }) => {
  if (!show) return null;

  const bannerUrl = show.banner_url || show.poster_url;

  return (
    <div className="relative w-full h-[65vh] min-h-[480px] max-h-[720px] bg-zinc-950 overflow-hidden">
      {/* Background Banner Image */}
      {bannerUrl && (
        <img
          src={bannerUrl}
          alt={show.title}
          className="absolute inset-0 w-full h-full object-cover object-center scale-105"
        />
      )}

      {/* Cinematic Vignette Gradients */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent w-full md:w-3/5" />

      {/* Content Container */}
      <div className="relative h-full max-w-7xl mx-auto px-6 sm:px-12 flex flex-col justify-end pb-16 z-10">
        <div className="max-w-xl space-y-3.5">
          {/* Section & Category Tags */}
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-extrabold tracking-wider px-2 py-0.5 rounded bg-red-600 text-white shadow-md">
              {show.section}
            </span>
            {show.categories?.slice(0, 3).map((cat) => (
              <span key={cat} className="text-xs capitalize text-zinc-300 bg-zinc-900/80 px-2 py-0.5 rounded backdrop-blur-sm border border-zinc-800">
                {cat}
              </span>
            ))}
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-none">
            {show.title}
          </h1>

          {/* Synopsis */}
          <p className="text-xs sm:text-sm text-zinc-300 line-clamp-3 leading-relaxed">
            {show.synopsis || 'Explore episodes and adventures in this series.'}
          </p>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => onMoreInfo(show)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-white hover:bg-zinc-200 text-black font-bold text-xs sm:text-sm transition-all hover:scale-105 active:scale-95 shadow-lg"
            >
              <Play className="w-4 h-4 fill-black" />
              <span>Watch Now</span>
            </button>

            <button
              onClick={() => onMoreInfo(show)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700/80 text-white font-semibold text-xs sm:text-sm backdrop-blur-md transition-all hover:scale-105 border border-zinc-700"
            >
              <Info className="w-4 h-4" />
              <span>More Info</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
