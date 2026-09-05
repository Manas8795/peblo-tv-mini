import React, { useState } from 'react';
import { Play, Info, Image as ImageIcon } from 'lucide-react';
import { CatalogueShow } from '../types';

interface Props {
  show: CatalogueShow;
  onSelect: (show: CatalogueShow) => void;
}

export const PosterCard: React.FC<Props> = ({ show, onSelect }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const posterUrl = show.poster_url;

  return (
    <div
      onClick={() => onSelect(show)}
      className="group relative flex-none w-[160px] sm:w-[200px] md:w-[220px] aspect-[2/3] rounded-xl overflow-hidden cursor-pointer bg-zinc-900 border border-zinc-800/80 transition-all duration-300 hover:scale-105 hover:z-20 hover:shadow-2xl hover:shadow-red-950/20"
    >
      {/* Skeleton Shimmer while loading */}
      {!imageLoaded && !imageError && (
        <div className="absolute inset-0 skeleton" />
      )}

      {/* Image */}
      {posterUrl && !imageError ? (
        <img
          src={posterUrl}
          alt={show.title}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center text-zinc-600">
          <ImageIcon className="w-8 h-8 mb-1 opacity-40" />
          <span className="text-[10px]">{show.title}</span>
        </div>
      )}

      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-3.5 flex flex-col justify-end">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white shadow-md">
            <Play className="w-4 h-4 fill-white ml-0.5" />
          </div>
          <div className="w-8 h-8 rounded-full bg-zinc-800/80 border border-zinc-700 flex items-center justify-center text-zinc-300">
            <Info className="w-4 h-4" />
          </div>
        </div>

        <h4 className="font-bold text-white text-xs line-clamp-1">{show.title}</h4>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
            {show.section}
          </span>
          {show.categories?.[0] && (
            <span className="text-[9px] text-zinc-400 capitalize truncate">
              {show.categories[0]}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
