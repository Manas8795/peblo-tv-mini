import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Navbar } from './components/Navbar';
import { ShowList } from './pages/ShowList';
import { ShowEditor } from './pages/ShowEditor';
import { PublishPage } from './pages/Publish';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5000,
      retry: 1,
    },
  },
});

export const AppContent: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<'shows' | 'publish'>('shows');
  const [editingShowId, setEditingShowId] = useState<string | null | 'new'>(null);

  const handleEditShow = (showId: string) => {
    setEditingShowId(showId);
  };

  const handleCreateShow = () => {
    setEditingShowId('new');
  };

  const handleBackToList = () => {
    setEditingShowId(null);
  };

  const handleNavigateToShowFromPublish = (showId: string) => {
    setCurrentTab('shows');
    setEditingShowId(showId);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          setEditingShowId(null);
        }}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 sm:p-8">
        {currentTab === 'shows' && (
          <>
            {editingShowId === null ? (
              <ShowList
                onEditShow={handleEditShow}
                onCreateShow={handleCreateShow}
              />
            ) : (
              <ShowEditor
                showId={editingShowId === 'new' ? null : editingShowId}
                onBack={handleBackToList}
              />
            )}
          </>
        )}

        {currentTab === 'publish' && (
          <PublishPage onNavigateToShow={handleNavigateToShowFromPublish} />
        )}
      </main>

      <footer className="border-t border-slate-900 bg-slate-950/80 px-6 py-4 text-center text-xs text-slate-500">
        Peblo TV Mini Internal Studio • Full-Stack Platform Engineer Challenge
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
