import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, CheckCircle2, AlertTriangle, ShieldAlert, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { api, getCurrentRoleKey, ROLES } from '../api/client';
import { ValidationReportPanel } from '../components/ValidationReportPanel';
import { RunHistoryTable } from '../components/RunHistoryTable';

interface Props {
  onNavigateToShow: (showId: string) => void;
}

export const PublishPage: React.FC<Props> = ({ onNavigateToShow }) => {
  const queryClient = useQueryClient();
  const currentKey = getCurrentRoleKey();
  const isAdmin = currentKey === ROLES.ADMIN.key;

  const [publishResult, setPublishResult] = useState<{
    run_id: string;
    shows_published: number;
    episodes_published: number;
    message: string;
  } | null>(null);

  const [publishError, setPublishError] = useState<string | null>(null);

  // Fetch Validation Report
  const { data: report, isLoading: loadingReport, refetch: refetchReport } = useQuery({
    queryKey: ['validation-report'],
    queryFn: api.getValidationReport,
    refetchInterval: 10000 // auto poll every 10s
  });

  // Fetch Runs History
  const { data: runs = [], isLoading: loadingRuns, refetch: refetchRuns } = useQuery({
    queryKey: ['publish-runs'],
    queryFn: api.getPublishRuns
  });

  // Publish Mutation
  const publishMutation = useMutation({
    mutationFn: api.publishCatalog,
    onSuccess: (data) => {
      setPublishResult(data);
      setPublishError(null);
      queryClient.invalidateQueries({ queryKey: ['publish-runs'] });
      queryClient.invalidateQueries({ queryKey: ['validation-report'] });
    },
    onError: (err: any) => {
      setPublishError(err.message || 'Failed to publish catalogue.');
      queryClient.invalidateQueries({ queryKey: ['publish-runs'] });
    }
  });

  const handlePublish = () => {
    setPublishResult(null);
    setPublishError(null);
    publishMutation.mutate();
  };

  const isPublishable = report?.is_publishable ?? false;

  return (
    <div className="space-y-8">
      {/* Top Banner & Trigger */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Release Pipeline
            </span>
            <span className="text-xs text-slate-400">Atomic Catalogue Compiler</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Publish Catalogue to Viewer
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            Assembles all published shows, collapses <code className="text-indigo-400 font-mono">content_group</code> language variants into single entries, isolates Season 0 trailers, and writes atomically to storage without downtime.
          </p>

          {/* Current Role Notice */}
          <div className="flex items-center gap-2 pt-1 text-xs">
            <span className="text-slate-500">Executing as:</span>
            <span className={`font-semibold px-2 py-0.5 rounded border ${isAdmin ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30' : 'bg-amber-500/10 text-amber-300 border-amber-500/30'}`}>
              {isAdmin ? 'Admin (Authorized to publish)' : 'Editor (Publish restricted - 403 expected)'}
            </span>
          </div>
        </div>

        {/* Publish Action Button */}
        <div className="flex flex-col items-end gap-2 w-full md:w-auto">
          <button
            onClick={handlePublish}
            disabled={publishMutation.isPending || !isPublishable}
            className={`w-full md:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-extrabold text-sm transition-all shadow-lg ${
              !isPublishable
                ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            {publishMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Compiling Catalogue...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>Publish Catalogue Now</span>
              </>
            )}
          </button>

          {!isPublishable && (
            <p className="text-[11px] text-red-400 flex items-center gap-1 font-medium">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Fix critical validation blockers below before publishing</span>
            </p>
          )}
        </div>
      </div>

      {/* Publish Success Toast */}
      {publishResult && (
        <div className="bg-emerald-950/40 border border-emerald-900/60 rounded-xl p-5 flex items-start gap-4">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-emerald-200 text-sm">Catalogue Published Successfully!</h3>
            <p className="text-xs text-emerald-300/80 mt-1">
              Run ID: <span className="font-mono text-white">{publishResult.run_id}</span> •{' '}
              {publishResult.shows_published} shows • {publishResult.episodes_published} collapsed episodes.
            </p>
            <p className="text-xs text-slate-400 mt-2">
              Public Viewer can now browse updated rows at{' '}
              <a href="http://localhost:3001" target="_blank" rel="noreferrer" className="text-indigo-400 underline font-medium">
                http://localhost:3001
              </a>
            </p>
          </div>
        </div>
      )}

      {/* Publish Error / 403 Toast */}
      {publishError && (
        <div className="bg-red-950/40 border border-red-900/60 rounded-xl p-5 flex items-start gap-4">
          <div className="w-9 h-9 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-red-200 text-sm">Publish Failed</h3>
            <p className="text-xs text-red-300/90 mt-1">{publishError}</p>
            {!isAdmin && (
              <p className="text-xs text-slate-400 mt-2">
                Note: Switch to <strong className="text-slate-200">Admin</strong> in the top-right header role selector to publish.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Section 1: Validation Report */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-extrabold text-slate-100 text-base">Real-time Validation Audit</h2>
          <button
            onClick={() => refetchReport()}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
          >
            Re-run Audit
          </button>
        </div>

        <ValidationReportPanel
          report={report || null}
          isLoading={loadingReport}
          onNavigateToShow={onNavigateToShow}
        />
      </div>

      {/* Section 2: Run History */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-extrabold text-slate-100 text-base">Publish Run History</h2>
          <button
            onClick={() => refetchRuns()}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
          >
            Refresh Logs
          </button>
        </div>

        <RunHistoryTable
          runs={runs}
          isLoading={loadingRuns}
        />
      </div>
    </div>
  );
};
