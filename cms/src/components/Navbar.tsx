import React, { useState, useEffect } from 'react';
import { Tv, Film, Send, Shield, ShieldCheck, UserCheck, ExternalLink } from 'lucide-react';
import { ROLES, getCurrentRoleKey, setCurrentRoleKey } from '../api/client';

interface Props {
  currentTab: 'shows' | 'publish';
  onSelectTab: (tab: 'shows' | 'publish') => void;
}

export const Navbar: React.FC<Props> = ({ currentTab, onSelectTab }) => {
  const [currentKey, setCurrentKey] = useState(getCurrentRoleKey());

  useEffect(() => {
    const handleRoleChange = () => {
      setCurrentKey(getCurrentRoleKey());
    };
    window.addEventListener('peblo-role-changed', handleRoleChange);
    return () => window.removeEventListener('peblo-role-changed', handleRoleChange);
  }, []);

  const isAdmin = currentKey === ROLES.ADMIN.key;

  const handleRoleToggle = (newKey: string) => {
    setCurrentRoleKey(newKey);
    setCurrentKey(newKey);
  };

  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50 px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <Tv className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white tracking-tight text-base">PEBLO TV</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                CMS
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Content Studio & Release Pipeline</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => onSelectTab('shows')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              currentTab === 'shows'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Film className="w-4 h-4" />
            <span>Shows & Episodes</span>
          </button>

          <button
            onClick={() => onSelectTab('publish')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              currentTab === 'publish'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Publish Catalogue</span>
          </button>
        </nav>

        {/* Right Tools: Role Switcher & Viewer Link */}
        <div className="flex items-center gap-3">
          {/* Active Role Selector */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-1">
            <span className="text-[11px] font-medium text-slate-400 px-2 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-slate-500" />
              Role:
            </span>
            <button
              onClick={() => handleRoleToggle(ROLES.ADMIN.key)}
              className={`text-xs px-2.5 py-1 rounded font-semibold transition-all flex items-center gap-1 ${
                isAdmin
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-3 h-3 text-indigo-400" />
              Admin
            </button>
            <button
              onClick={() => handleRoleToggle(ROLES.EDITOR.key)}
              className={`text-xs px-2.5 py-1 rounded font-semibold transition-all flex items-center gap-1 ${
                !isAdmin
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserCheck className="w-3 h-3 text-amber-400" />
              Editor
            </button>
          </div>

          {/* Quick Viewer Link */}
          <a
            href="http://localhost:3001"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            <span>Open Viewer</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </header>
  );
};
