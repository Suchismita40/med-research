'use client';

import React from 'react';
import { BarChart2, Activity, PieChart, Clock, ShieldCheck } from 'lucide-react';

interface AnalyticsProps {
  boardState: any;
}

export function AnalyticsView({ boardState }: AnalyticsProps) {
  const maxQuota = Number(boardState?.maxAccessLimit || 5n);
  const usedQuota = Number(boardState?.accessCount || 0n);
  const auditLogs = Number(boardState?.auditLogCount || 0n);

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-2xl border border-surface-border shadow-subtle">
        <h2 className="text-2xl font-extrabold text-olive-900 flex items-center gap-2">
          <BarChart2 className="w-6 h-6 text-olive-700" />
          Research Network Telemetry & Quota Analytics
        </h2>
        <p className="text-xs text-mutedText mt-1">
          Real-time metrics calculated from active Midnight smart contract ledger state.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-surface-border shadow-subtle space-y-2">
          <span className="text-xs text-mutedText font-medium">Registered Datasets</span>
          <p className="text-3xl font-extrabold text-olive-900">{boardState?.datasetCount?.toString() || '1'}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-surface-border shadow-subtle space-y-2">
          <span className="text-xs text-mutedText font-medium">Access Proofs Verified</span>
          <p className="text-3xl font-extrabold text-olive-900">{usedQuota}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-surface-border shadow-subtle space-y-2">
          <span className="text-xs text-mutedText font-medium">Maximum Access Quota</span>
          <p className="text-3xl font-extrabold text-olive-900">{maxQuota}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-surface-border shadow-subtle space-y-2">
          <span className="text-xs text-mutedText font-medium">Cryptographic Audit Logs</span>
          <p className="text-3xl font-extrabold text-olive-900">{auditLogs}</p>
        </div>
      </div>
    </div>
  );
}
