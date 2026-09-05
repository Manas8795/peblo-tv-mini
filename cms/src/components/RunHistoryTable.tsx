import React from 'react';
import { CheckCircle, XCircle, Clock, User, Film, Layers } from 'lucide-react';
import { PublishRun } from '../types';

interface Props {
  runs: PublishRun[];
  isLoading: boolean;
}

export const RunHistoryTable: React.FC<Props> = ({ runs, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
        <div className="inline-block animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full mb-2" />
        <p className="text-xs">Loading publish run history...</p>
      </div>
    );
  }

  if (runs.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-500">
        <Layers className="w-8 h-8 mx-auto mb-2 opacity-40" />
        <p className="text-sm font-medium">No publish runs recorded yet.</p>
        <p className="text-xs text-slate-600 mt-1">Publish the catalogue above to create your first deployment run.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
        <h3 className="font-bold text-slate-100 text-sm">Publish Run Audit Log</h3>
        <span className="text-xs font-mono text-slate-400">{runs.length} runs recorded</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
            <tr>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Run ID</th>
              <th className="px-4 py-3">Triggered By</th>
              <th className="px-4 py-3">Shows / Episodes</th>
              <th className="px-4 py-3">Date & Time</th>
              <th className="px-4 py-3">Outcome Message</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {runs.map(run => {
              const isSuccess = run.status === 'success';
              const startDate = new Date(run.started_at);

              return (
                <tr key={run.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold text-[11px] border ${
                        isSuccess
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-red-500/10 text-red-400 border-red-500/30'
                      }`}
                    >
                      {isSuccess ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {run.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-400">
                    {run.id.slice(0, 8)}...
                  </td>
                  <td className="px-4 py-3 flex items-center gap-1.5 text-slate-300">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span>{run.triggered_by}</span>
                  </td>
                  <td className="px-4 py-3 font-mono">
                    <span className="text-indigo-400 font-semibold">{run.shows_count}</span> shows •{' '}
                    <span className="text-slate-300">{run.episodes_count}</span> episodes
                  </td>
                  <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                    {startDate.toLocaleDateString()} {startDate.toLocaleTimeString()}
                  </td>
                  <td className="px-4 py-3 text-slate-300 max-w-md truncate">
                    {run.outcome_message || '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
