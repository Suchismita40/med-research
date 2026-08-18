'use client';

import React from 'react';
import { Shield, Lock, Database, FileCheck, Layers, ArrowRight, CheckCircle2, Key, Users, Activity } from 'lucide-react';
import { useDeployedBoardContext } from '../../src/hooks/useDeployedBoardContext';

interface OverviewProps {
  setActiveTab: (tab: string) => void;
}

export function Overview({ setActiveTab }: OverviewProps) {
  const { state } = useDeployedBoardContext();
  const totalDatasets = state.datasets.length;
  const activeGranted = state.datasets.filter((d) => d.status === 'GRANTED').length;
  const pendingRequests = state.datasets.filter((d) => d.status === 'REQUESTED').length;
  const totalAccessCount = state.datasets.reduce((acc, d) => acc + Number(d.accessCount), 0);
  const totalAuditLogs = state.auditLogs.length;

  return (
    <div className="space-y-10">
      {/* Hero Banner */}
      <div className="bg-white rounded-3xl border border-surface-border p-8 sm:p-10 shadow-card relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-olive-50 rounded-full blur-3xl -z-10 translate-x-1/3 -translate-y-1/3"></div>

        <div className="max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-olive-50 border border-olive-200 rounded-full text-xs font-semibold text-olive-800">
            <Shield className="w-3.5 h-3.5" />
            <span>Midnight Dual-State Architecture & Zero-Knowledge Circuits</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-olive-950 tracking-tight leading-tight">
            Confidential Medical Research Data Exchange
          </h1>

          <p className="text-base text-mutedText leading-relaxed">
            Enable accredited healthcare institutions and researchers to prove clinical data access eligibility, 
            verify study cohorts, and execute zero-knowledge queries — without disclosing patient PII, medical 
            credentials, or private decryption keys on-chain.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={() => setActiveTab('datasets')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-olive-800 hover:bg-olive-900 text-white font-semibold rounded-xl text-sm transition-all shadow-subtle hover:shadow-hover"
            >
              <Database className="w-4 h-4" />
              <span>Explore Datasets ({totalDatasets})</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActiveTab('permissions')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-surface-bg hover:bg-olive-50 border border-surface-border text-olive-900 font-semibold rounded-xl text-sm transition-all"
            >
              <Key className="w-4 h-4 text-olive-700" />
              <span>Permissions & Quotas ({pendingRequests} pending)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Real-time Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-subtle space-y-2">
          <div className="flex items-center justify-between text-mutedText">
            <span className="text-xs font-semibold uppercase tracking-wider">Registered Datasets</span>
            <Database className="w-4 h-4 text-olive-700" />
          </div>
          <div className="text-3xl font-extrabold text-olive-900">{totalDatasets}</div>
          <p className="text-xs text-mutedText">Verified on Midnight Preprod</p>
        </div>

        <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-subtle space-y-2">
          <div className="flex items-center justify-between text-mutedText">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Permissions</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-800">{activeGranted}</div>
          <p className="text-xs text-mutedText">Granted via Compact circuits</p>
        </div>

        <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-subtle space-y-2">
          <div className="flex items-center justify-between text-mutedText">
            <span className="text-xs font-semibold uppercase tracking-wider">ZK Proof Queries</span>
            <Activity className="w-4 h-4 text-olive-700" />
          </div>
          <div className="text-3xl font-extrabold text-olive-900">{totalAccessCount}</div>
          <p className="text-xs text-mutedText">Disclosed proof commitments</p>
        </div>

        <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-subtle space-y-2">
          <div className="flex items-center justify-between text-mutedText">
            <span className="text-xs font-semibold uppercase tracking-wider">Cryptographic Logs</span>
            <FileCheck className="w-4 h-4 text-olive-700" />
          </div>
          <div className="text-3xl font-extrabold text-olive-900">{totalAuditLogs}</div>
          <p className="text-xs text-mutedText">Immutable audit trace</p>
        </div>
      </div>

      {/* Privacy Architecture Model */}
      <div className="bg-white rounded-3xl border border-surface-border p-8 shadow-card space-y-6">
        <div>
          <h2 className="text-xl font-bold text-olive-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-olive-700" />
            Midnight Zero-Knowledge Privacy Architecture
          </h2>
          <p className="text-xs text-mutedText mt-1">
            Detailed separation between transparent on-chain public ledger state and off-chain secret prover witness state.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Public Ledger State */}
          <div className="bg-surface-bg/70 rounded-2xl border border-surface-border p-6 space-y-4">
            <div className="flex items-center gap-2 font-bold text-sm text-olive-900 border-b border-surface-border pb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-olive-600"></span>
              <span>Public Ledger State (Transparent On-Chain)</span>
            </div>

            <div className="space-y-3 text-xs text-mutedText">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-olive-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-olive-900">Dataset Metadata & Categories:</span>
                  <p>Dataset title, category, and sample counts for global research cohort discovery.</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-olive-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-olive-900">Access Quota Counters:</span>
                  <p>Enforces maximum query limit (<code className="font-mono text-olive-800">maxAccessLimit</code>) and current count (<code className="font-mono text-olive-800">accessCount</code>).</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-olive-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-olive-900">Disclosed Proof Hashes:</span>
                  <p>Cryptographic hash commitment (<code className="font-mono text-olive-800">lastProofHash</code>) verifying valid query execution without revealing input data.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Private Witness State */}
          <div className="bg-olive-900 text-white rounded-2xl border border-olive-950 p-6 space-y-4">
            <div className="flex items-center gap-2 font-bold text-sm text-emerald-300 border-b border-olive-800 pb-3">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>Private Witness State (Secret Off-Chain in Prover)</span>
            </div>

            <div className="space-y-3 text-xs text-olive-200">
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5"></span>
                <div>
                  <span className="font-semibold text-white">Local Wallet Secret Key (<code className="font-mono text-emerald-300">localSecretKey</code>):</span>
                  <p>Never leaves the user's browser; used for deterministic zero-knowledge public key derivation.</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5"></span>
                <div>
                  <span className="font-semibold text-white">Medical License Credential (<code className="font-mono text-emerald-300">medicalCredentialSecret</code>):</span>
                  <p>Doctor/researcher credentials verified locally inside ZK circuits without revealing identity.</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5"></span>
                <div>
                  <span className="font-semibold text-white">Patient Record Key (<code className="font-mono text-emerald-300">patientRecordKey</code>):</span>
                  <p>Symmetric decryption key for patient data. Remains 100% confidential and is never sent over the network.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
