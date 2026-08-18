'use client';

import React, { useState } from 'react';
import {
  Key,
  Shield,
  CheckCircle2,
  Lock,
  RefreshCw,
  XCircle,
  AlertTriangle,
  FileCheck,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { useDeployedBoardContext } from '../../src/hooks/useDeployedBoardContext';

export function PermissionsView() {
  const {
    state,
    grantPermission,
    submitAccessProof,
    renewAccessQuota,
    revokeAccess,
  } = useDeployedBoardContext();

  const [renewId, setRenewId] = useState<string | null>(null);
  const [extraQuota, setExtraQuota] = useState(15);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'REQUESTED' | 'GRANTED' | 'REVOKED'>('ALL');

  const filteredDatasets = state.datasets.filter((ds) => {
    if (filterStatus === 'ALL') return true;
    return ds.status === filterStatus;
  });

  const tx = state.txProgress;
  const isBusy = tx.phase === 'validating' || tx.phase === 'proving' || tx.phase === 'submitting';

  const handleRenew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renewId || extraQuota <= 0) return;
    const target = renewId;
    setRenewId(null);
    await renewAccessQuota(target, extraQuota);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-olive-950 flex items-center gap-2.5">
            <Key className="w-6 h-6 text-olive-700" />
            <span>Research Permissions & Quota Governance</span>
          </h2>
          <p className="text-xs text-mutedText mt-1">
            Enforce Zero-Knowledge selective access policies, authorize credentialed researchers, and renew query limits via Compact circuits.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-surface-border shadow-subtle shrink-0">
          {(['ALL', 'REQUESTED', 'GRANTED', 'REVOKED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                filterStatus === st
                  ? 'bg-olive-800 text-white shadow-subtle'
                  : 'text-mutedText hover:text-olive-900'
              }`}
            >
              {st === 'ALL'
                ? 'All Statuses'
                : st === 'REQUESTED'
                ? 'Pending'
                : st === 'GRANTED'
                ? 'Active Granted'
                : 'Revoked'}
            </button>
          ))}
        </div>
      </div>

      {/* Permissions Table & Action Panel */}
      <div className="bg-white rounded-2xl border border-surface-border shadow-card overflow-hidden">
        <div className="p-6 border-b border-surface-border flex items-center justify-between">
          <h3 className="font-bold text-sm text-olive-950 flex items-center gap-2">
            <Shield className="w-4 h-4 text-olive-700" />
            <span>Active Access Control Contracts ({filteredDatasets.length})</span>
          </h3>
          <span className="text-xs text-mutedText">Compact Protocol v0.23</span>
        </div>

        <div className="divide-y divide-surface-border">
          {filteredDatasets.map((ds) => {
            const max = Number(ds.maxAccessLimit);
            const used = Number(ds.accessCount);
            const remaining = Math.max(0, max - used);
            const isExhausted = remaining === 0;

            return (
              <div key={ds.id} className="p-6 hover:bg-surface-bg/40 transition-all space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Title & Badge */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <h4 className="font-bold text-sm text-olive-950">{ds.title}</h4>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                          ds.status === 'GRANTED'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : ds.status === 'REQUESTED'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : ds.status === 'REVOKED'
                            ? 'bg-red-50 text-red-800 border-red-200'
                            : 'bg-surface-bg text-mutedText border-surface-border'
                        }`}
                      >
                        {ds.status === 'GRANTED'
                          ? 'Permission Active'
                          : ds.status === 'REQUESTED'
                          ? 'Request Pending Hospital Approval'
                          : ds.status === 'REVOKED'
                          ? 'Revoked'
                          : 'Unrequested'}
                      </span>
                    </div>

                    <p className="text-xs text-mutedText">
                      {ds.institution} • Domain: <strong className="text-olive-900">{ds.category}</strong>
                    </p>
                  </div>

                  {/* Quota Gauge */}
                  <div className="bg-surface-bg p-3 rounded-xl border border-surface-border min-w-[240px] space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-mutedText">Access Quota:</span>
                      <span className={isExhausted ? 'text-red-600 font-bold' : 'text-olive-900'}>
                        {used} / {max} Queries {isExhausted && '(Exhausted)'}
                      </span>
                    </div>

                    <div className="w-full h-1.5 bg-surface-border rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          isExhausted ? 'bg-red-500' : remaining < 5 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.round((used / max) * 100))}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Circuit Actions Row */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="text-[11px] font-mono text-mutedText truncate max-w-md">
                    <span>Last Proof Hash: </span>
                    <span className="text-olive-900">{ds.lastProofHash.slice(0, 24)}...</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {ds.status === 'REQUESTED' && (
                      <button
                        onClick={() => grantPermission(ds.id)}
                        disabled={isBusy}
                        className="inline-flex items-center gap-1 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-subtle transition-all"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Grant Permission (Hospital)</span>
                      </button>
                    )}

                    {ds.status === 'GRANTED' && (
                      <>
                        <button
                          onClick={() => submitAccessProof(ds.id)}
                          disabled={isBusy || isExhausted}
                          className={`inline-flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-semibold shadow-subtle transition-all ${
                            !isExhausted
                              ? 'bg-olive-800 hover:bg-olive-900 text-white'
                              : 'bg-surface-bg text-mutedText border border-surface-border cursor-not-allowed'
                          }`}
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>Submit Access Proof</span>
                        </button>

                        <button
                          onClick={() => setRenewId(ds.id)}
                          disabled={isBusy}
                          className="inline-flex items-center gap-1 px-3.5 py-2 bg-surface-bg hover:bg-olive-100 text-olive-900 rounded-xl text-xs font-semibold border border-surface-border transition-all"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-olive-700" />
                          <span>Renew Quota Limit</span>
                        </button>

                        <button
                          onClick={() => revokeAccess(ds.id)}
                          disabled={isBusy}
                          className="inline-flex items-center gap-1 px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-semibold border border-red-200 transition-all"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Revoke Access</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Renew Quota Modal */}
      {renewId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-olive-950/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-surface-border p-6 max-w-md w-full shadow-card space-y-4">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <h3 className="font-bold text-olive-950 text-base flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-olive-700" />
                <span>Extend Access Quota Limit</span>
              </h3>
              <button onClick={() => setRenewId(null)} className="text-mutedText hover:text-olive-900 font-bold">
                ×
              </button>
            </div>

            <form onSubmit={handleRenew} className="space-y-4 text-xs">
              <p className="text-mutedText">
                Authorize additional zero-knowledge queries for this dataset on Midnight Preprod.
              </p>

              <div>
                <label className="block text-olive-900 font-semibold mb-1">Additional Quota Limit (+)</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={extraQuota}
                  onChange={(e) => setExtraQuota(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-surface-border bg-surface-bg text-olive-900 focus:outline-none focus:border-olive-600"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRenewId(null)}
                  className="px-4 py-2.5 bg-surface-bg hover:bg-olive-100 text-olive-800 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-olive-800 hover:bg-olive-900 text-white rounded-xl font-semibold shadow-subtle"
                >
                  Confirm Renewal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
