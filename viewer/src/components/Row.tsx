import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CatalogueShow } from '../types';
import { PosterCard } from './PosterCard';

interface Props {
  title: string;
  sectionKey: string;
  shows: CatalogueShow[];
  onSelectShow: (show: CatalogueShow) => void;
}

export const Row: React.FC<Props> = ({ title, sectionKey, shows, onSelectShow }) => {
  const rowRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const scrollAmount = direction === 'left' ? -500 : 500;
      rowRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (shows.length === 0) return null;

  return (
    <div className="relative group/row space-y-3 px-6 sm:px-12 my-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white capitalize">
            {title}
          </h2>
          <span className="text-xs text-zinc-500 font-mono">({shows.length})</span>
        </div>
      </div>

      {/* Horizontal Carousel */}
      <div className="relative">
        {/* Left Arrow */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-30 h-full w-10 bg-black/60 hover:bg-black/85 text-white opacity-0 group-hover/row:opacity-100 transition-all flex items-center justify-center backdrop-blur-xs rounded-r-lg"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div
          ref={rowRef}
          className="row-scroll flex gap-3.5 py-2 px-1"
        >
          {shows.map((show) => (
            <PosterCard
              key={show.id}
              show={show}
              onSelect={onSelectShow}
            />
          ))}
        </div>

        {/* Right Arrow */}
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-30 h-full w-10 bg-black/60 hover:bg-black/85 text-white opacity-0 group-hover/row:opacity-100 transition-all flex items-center justify-center backdrop-blur-xs rounded-l-lg"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
