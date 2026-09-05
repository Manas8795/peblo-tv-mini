import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { Row } from './components/Row';
import { ShowDetailModal } from './components/ShowDetailModal';
import { SearchPage } from './pages/SearchPage';
import { catalogClient } from './api/catalogClient';
import { CatalogueData, CatalogueShow } from './types';
import { AlertCircle, RefreshCw, Sparkles, ExternalLink } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'search'>('home');
  const [catalogue, setCatalogue] = useState<CatalogueData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedShow, setSelectedShow] = useState<CatalogueShow | null>(null);

  const loadCatalogue = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await catalogClient.getCatalogue();
      setCatalogue(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load catalogue');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCatalogue();
  }, []);

  // Featured show for hero banner
  const featuredShow = catalogue?.all_shows?.[0] || null;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans selection:bg-red-600 selection:text-white">
      <Navbar
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view)}
      />

      <main className="flex-1 pb-20">
        {currentView === 'home' && (
          <>
            {/* Loading Skeleton */}
            {isLoading && (
              <div className="space-y-6 pt-24 px-6 sm:px-12 max-w-7xl mx-auto">
                <div className="w-full h-[50vh] rounded-2xl skeleton" />
                <div className="h-6 w-48 rounded skeleton" />
                <div className="flex gap-4">
                  {[1, 2, 3, 4, 5].map(n => (
                    <div key={n} className="w-[180px] aspect-[2/3] rounded-xl skeleton" />
                  ))}
                </div>
              </div>
            )}

            {/* Error or Not Published state */}
            {error && !isLoading && (
              <div className="pt-32 px-6 max-w-lg mx-auto text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-white">Catalogue Not Ready</h2>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {error}
                </p>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={loadCatalogue}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retry</span>
                  </button>
                  <a
                    href="http://localhost:3000"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-xs font-semibold text-white shadow-lg shadow-red-600/20"
                  >
                    <span>Open CMS Studio</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            )}

            {/* Catalogue Content */}
            {!isLoading && !error && catalogue && (
              <>
                {/* Hero Banner */}
                <HeroBanner
                  show={featuredShow}
                  onMoreInfo={(show) => setSelectedShow(show)}
                />

                {/* Section Rows */}
                <div className="relative -mt-16 z-20 space-y-4">
                  {Object.entries(catalogue.sections).map(([sectionKey, shows]) => (
                    <Row
                      key={sectionKey}
                      title={`${sectionKey} Shows`}
                      sectionKey={sectionKey}
                      shows={shows}
                      onSelectShow={(show) => setSelectedShow(show)}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {currentView === 'search' && (
          <SearchPage
            onSelectShow={(show) => {
              // If show has detailed seasons in full catalogue, match it
              const fullShow = catalogue?.all_shows?.find(s => s.id === show.id) || show;
              setSelectedShow(fullShow);
            }}
          />
        )}
      </main>

      {/* Show Detail Modal */}
      {selectedShow && (
        <ShowDetailModal
          show={selectedShow}
          onClose={() => setSelectedShow(null)}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-black/90 px-6 py-6 text-center text-xs text-zinc-600">
        <p>Peblo TV — Watch Shows, Songs and Minisodes • Built for Kids & Family</p>
        <p className="mt-1 text-[11px] text-zinc-700">Reads strictly from static published catalogue.json</p>
      </footer>
    </div>
  );
}
