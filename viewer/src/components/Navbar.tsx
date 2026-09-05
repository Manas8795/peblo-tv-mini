import React, { useState, useEffect } from 'react';
import { Search, Tv, ExternalLink } from 'lucide-react';

interface Props {
  currentView: 'home' | 'search';
  onNavigate: (view: 'home' | 'search') => void;
  onSelectSection?: (section: string) => void;
}

export const Navbar: React.FC<Props> = ({ currentView, onNavigate, onSelectSection }) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 px-6 sm:px-12 py-3.5 transition-all duration-300 ${
        isScrolled ? 'bg-black/95 backdrop-blur-md shadow-xl border-b border-zinc-900' : 'bg-gradient-to-b from-black/80 to-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-8">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 cursor-pointer focus:outline-none"
          >
            <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-red-600/30">
              P
            </div>
            <span className="font-heading font-black tracking-tighter text-xl text-red-600">
              PEBLO <span className="text-white">TV</span>
            </span>
          </button>

          {/* Navigation Items */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-zinc-300">
            <button
              onClick={() => onNavigate('home')}
              className={`hover:text-white transition-colors ${currentView === 'home' ? 'text-white font-bold' : ''}`}
            >
              Home
            </button>
            <button
              onClick={() => onNavigate('search')}
              className={`hover:text-white transition-colors ${currentView === 'search' ? 'text-white font-bold' : ''}`}
            >
              Search & Filters
            </button>
          </nav>
        </div>

        {/* Right Tools */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('search')}
            className={`p-2 rounded-full hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors ${
              currentView === 'search' ? 'bg-zinc-800 text-white' : ''
            }`}
            title="Search Catalogue"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* CMS Link */}
          <a
            href="http://localhost:3000"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors"
          >
            <span>CMS Admin</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </header>
  );
};
