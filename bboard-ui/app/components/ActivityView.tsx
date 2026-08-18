'use client';

import React from 'react';
import {
  Activity,
  FileCheck,
  ExternalLink,
  Shield,
  Layers,
  Database,
  CheckCircle2,
  Lock,
  Globe,
} from 'lucide-react';
import { useDeployedBoardContext } from '../../src/hooks/useDeployedBoardContext';

export function ActivityView() {
  const { state } = useDeployedBoardContext();

  const PREPROD_CONTRACT = 'e603362546ca047cb7c596389c20fde9bdf1b27489f14137d68fd9cd4a939d97';
  const DEPLOYER_ADDR = 'mn_addr_preprod1efmkmrfgcdxhxyx2f7kfmchgrfme6prmvmyx3y23aae2t9zmnuzsqnh8xv';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-olive-950 flex items-center gap-2.5">
          <Activity className="w-6 h-6 text-olive-700" />
          <span>Cryptographic Activity & Contract Telemetry</span>
        </h2>
        <p className="text-xs text-mutedText mt-1">
          Live immutable transaction logs, zero-knowledge verification commitments, and verified Midnight Preprod infrastructure status.
        </p>
      </div>

      {/* Network & Infrastructure Telemetry Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-subtle space-y-3">
          <div className="flex items-center justify-between text-mutedText">
            <span className="text-xs font-semibold uppercase tracking-wider">Network Protocol</span>
            <Globe className="w-4 h-4 text-olive-700" />
          </div>
          <div className="text-lg font-bold text-olive-900">Midnight Preprod</div>
          <div className="text-[11px] text-mutedText space-y-0.5">
            <p>Network ID: <code className="text-olive-900 font-mono">preprod</code></p>
            <p>Status: <span className="text-emerald-700 font-semibold">● Active & Synced</span></p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-subtle space-y-3">
          <div className="flex items-center justify-between text-mutedText">
            <span className="text-xs font-semibold uppercase tracking-wider">Proof Server</span>
            <Lock className="w-4 h-4 text-olive-700" />
          </div>
          <div className="text-lg font-bold text-olive-900">Official Preprod Prover</div>
          <div className="text-[11px] text-mutedText space-y-0.5">
            <p className="truncate">URI: <code className="text-olive-900 font-mono">proof-server.preprod.midnight.network</code></p>
            <p>Prover Modality: <span className="text-emerald-700 font-semibold">Witness Isolated</span></p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-subtle space-y-3">
          <div className="flex items-center justify-between text-mutedText">
            <span className="text-xs font-semibold uppercase tracking-wider">Compact Contract</span>
            <Shield className="w-4 h-4 text-olive-700" />
          </div>
          <div className="text-lg font-bold text-olive-900">v0.23 Categorized + Quota</div>
          <div className="text-[11px] text-mutedText space-y-0.5">
            <p>Status: <span className="text-emerald-700 font-semibold">● Verified Preprod</span></p>
            <p>Circuits: <span className="text-olive-900 font-semibold">6 Impure, 1 Pure</span></p>
          </div>
        </div>
      </div>

      {/* Contract Identifiers */}
      <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-card space-y-4">
        <h3 className="font-bold text-sm text-olive-950 flex items-center gap-2">
          <Layers className="w-4 h-4 text-olive-700" />
          <span>Verified Midnight Preprod Contract Reference</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-surface-bg p-3.5 rounded-xl border border-surface-border space-y-1">
            <span className="text-mutedText font-medium">Contract Address (Bech32 / Hex)</span>
            <p className="font-mono text-[11px] text-olive-900 break-all font-semibold">{PREPROD_CONTRACT}</p>
          </div>

          <div className="bg-surface-bg p-3.5 rounded-xl border border-surface-border space-y-1">
            <span className="text-mutedText font-medium">Contract Deployer Address</span>
            <p className="font-mono text-[11px] text-olive-900 break-all font-semibold">{DEPLOYER_ADDR}</p>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-surface-border shadow-card overflow-hidden">
        <div className="p-6 border-b border-surface-border flex items-center justify-between">
          <h3 className="font-bold text-sm text-olive-950 flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-olive-700" />
            <span>Immutable On-Chain Cryptographic Audit Trail ({state.auditLogs.length})</span>
          </h3>
          <span className="text-xs text-mutedText">Automatic State Sync</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-bg border-b border-surface-border text-mutedText font-semibold">
              <tr>
                <th className="px-6 py-3.5">Timestamp (UTC)</th>
                <th className="px-6 py-3.5">Compact Circuit</th>
                <th className="px-6 py-3.5">Target Dataset</th>
                <th className="px-6 py-3.5">Actor Identity</th>
                <th className="px-6 py-3.5">Transaction Hash</th>
                <th className="px-6 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {state.auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-surface-bg/50 transition-all">
                  <td className="px-6 py-4 text-mutedText whitespace-nowrap">{log.timestamp}</td>
                  <td className="px-6 py-4 font-mono font-semibold text-olive-900">{log.circuit}</td>
                  <td className="px-6 py-4 text-olive-950 font-medium max-w-xs truncate">{log.datasetTitle}</td>
                  <td className="px-6 py-4 font-mono text-mutedText">{log.actor}</td>
                  <td className="px-6 py-4 font-mono text-[10px] text-olive-800 max-w-[140px] truncate">
                    {log.txHash}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
