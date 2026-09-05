import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, AlertCircle, HelpCircle, ChevronDown, ChevronRight, ArrowRight } from 'lucide-react';
import { ValidationReport } from '../types';

interface Props {
  report: ValidationReport | null;
  isLoading: boolean;
  onNavigateToShow?: (showId: string) => void;
}

export const ValidationReportPanel: React.FC<Props> = ({ report, isLoading, onNavigateToShow }) => {
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (key: string) => {
    setCollapsedGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (isLoading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
        <div className="inline-block animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mb-3" />
        <p className="text-sm">Running catalogue validation audit...</p>
      </div>
    );
  }

  if (!report) {
    return null;
  }

  const groupLabels: Record<string, { label: string; severity: 'blocker' | 'warning' | 'info'; desc: string }> = {
    missing_section: {
      label: 'Shows Missing Section',
      severity: 'blocker',
      desc: 'Shows without a designated section cannot be categorized into homepage rows.'
    },
    missing_duration: {
      label: 'Episodes Missing Duration',
      severity: 'blocker',
      desc: 'Catalogue requires positive duration in seconds for video playback.'
    },
    duplicate_content_group_language: {
      label: 'Duplicate (Content Group, Language)',
      severity: 'blocker',
      desc: 'An episode cannot have two variants of the exact same language in a single content group.'
    },
    missing_artwork: {
      label: 'Missing Artwork Assets',
      severity: 'warning',
      desc: 'Required posters (2:3), banners (16:9), or thumbnails (16:9) are not yet uploaded.'
    },
    draft_status: {
      label: 'Draft Content Notice',
      severity: 'info',
      desc: 'Content in Draft status will be omitted from the published Viewer catalogue.'
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      {/* Header Banner */}
      <div className={`p-5 flex items-center justify-between border-b ${report.is_publishable ? 'bg-emerald-950/20 border-emerald-900/30' : 'bg-red-950/20 border-red-900/30'}`}>
        <div className="flex items-center gap-3">
          {report.is_publishable ? (
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle className="w-5 h-5" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
              <AlertCircle className="w-5 h-5" />
            </div>
          )}
          <div>
            <h3 className="font-bold text-slate-100 text-base">
              {report.is_publishable ? 'Ready to Publish' : 'Publishing Blocked by Validation Errors'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {report.total_issues === 0
                ? 'All validation checks passed with zero errors.'
                : `${report.total_issues} total findings detected across shows and episodes.`}
            </p>
          </div>
        </div>

        {/* Summary Pills */}
        <div className="flex items-center gap-2">
          {Object.entries(report.summary).map(([key, count]) => {
            const meta = groupLabels[key];
            const isBlocker = meta?.severity === 'blocker';
            return (
              <span
                key={key}
                className={`text-xs px-2.5 py-1 rounded-full font-medium border ${
                  isBlocker
                    ? 'bg-red-500/10 text-red-300 border-red-500/30'
                    : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                }`}
              >
                {count} {meta ? meta.label.split(' ')[0] : key}
              </span>
            );
          })}
        </div>
      </div>

      {/* Grouped Issues List */}
      <div className="divide-y divide-slate-800/80">
        {Object.entries(report.grouped_by_cause).map(([causeKey, items]) => {
          const meta = groupLabels[causeKey] || {
            label: causeKey.replace(/_/g, ' '),
            severity: 'warning',
            desc: ''
          };
          const isCollapsed = collapsedGroups[causeKey] ?? false;

          return (
            <div key={causeKey} className="p-4">
              <button
                onClick={() => toggleGroup(causeKey)}
                className="w-full flex items-center justify-between text-left hover:opacity-80 transition-opacity"
              >
                <div className="flex items-center gap-2.5">
                  {meta.severity === 'blocker' ? (
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  ) : meta.severity === 'warning' ? (
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  ) : (
                    <HelpCircle className="w-4 h-4 text-blue-400 shrink-0" />
                  )}
                  <div>
                    <span className="font-semibold text-sm text-slate-200">{meta.label}</span>
                    <span className="ml-2 text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                      {items.length}
                    </span>
                  </div>
                </div>
                {isCollapsed ? <ChevronRight className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
              </button>

              {!isCollapsed && (
                <div className="mt-3 pl-6 space-y-2">
                  <p className="text-xs text-slate-400 mb-2">{meta.desc}</p>
                  <div className="space-y-2">
                    {items.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-950/60 border border-slate-800 rounded-lg p-3 flex items-center justify-between text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-200">
                              {item.show_title || 'Show'}
                            </span>
                            {item.episode_title && (
                              <span className="text-slate-400">
                                › S{item.season_number}E{item.episode_number}: {item.episode_title}
                              </span>
                            )}
                          </div>
                          <p className="text-red-300/90">{item.issue}</p>
                          <p className="text-slate-400">
                            <span className="text-indigo-400 font-semibold">Fix:</span> {item.action_required}
                          </p>
                        </div>

                        {item.show_id && onNavigateToShow && (
                          <button
                            onClick={() => onNavigateToShow(item.show_id!)}
                            className="ml-3 shrink-0 flex items-center gap-1 text-xs px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 font-medium transition-colors"
                          >
                            <span>Edit Show</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
