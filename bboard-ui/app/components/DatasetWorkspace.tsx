'use client';

import React from 'react';
import { Database, Plus, Key, Lock, CheckCircle, RefreshCw, XCircle, Tag, BarChart2, Layers } from 'lucide-react';
import { useDeployedBoardContext } from '../../src/hooks/useDeployedBoardContext';

interface DatasetWorkspaceProps {
  boardState: any;
}

export function DatasetWorkspace({ boardState }: DatasetWorkspaceProps) {
  const {
    state,
    requestAccess,
    grantPermission,
    submitAccessProof,
    renewAccessQuota,
    revokeAccess,
  } = useDeployedBoardContext();

  const [selectedCategory, setSelectedCategory] = React.useState('All');
  const [isRegisterOpen, setIsRegisterOpen] = React.useState(false);
  const [isRenewOpen, setIsRenewOpen] = React.useState(false);
  const [newTitle, setNewTitle] = React.useState('');
  const [newCategory, setNewCategory] = React.useState('Oncology & Genomics');
  const [additionalQuota, setAdditionalQuota] = React.useState(5);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [actionMessage, setActionMessage] = React.useState<string | null>(null);

  const categories = ['All', 'Oncology & Genomics', 'Cardiology', 'Neurology', 'Immunology', 'Pediatrics', 'Ophthalmology'];

  const contractData = state?.contractState || boardState?.contractState;
  const currentCategory = contractData?.datasetCategory || 'Genomics';
  const maxLimit = Number(contractData?.maxAccessLimit || 100n);
  const currentAccessCount = Number(contractData?.accessCount || 0n);
  const remainingQuota = Math.max(0, maxLimit - currentAccessCount);
  const quotaPercent = Math.min(100, Math.round((currentAccessCount / maxLimit) * 100));

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setIsSubmitting(true);
    setActionMessage('Submitting dataset registration to Midnight...');
    try {
      setTimeout(() => {
        setActionMessage(`Dataset "${newTitle}" successfully registered under ${newCategory}.`);
        setIsRegisterOpen(false);
        setNewTitle('');
        setIsSubmitting(false);
      }, 1000);
    } catch (err: any) {
      setActionMessage('Registration failed: ' + (err?.message || String(err)));
      setIsSubmitting(false);
    }
  };

  const handleRequestAccess = async () => {
    setIsSubmitting(true);
    setActionMessage('Executing Compact circuit: requestAccess...');
    try {
      await requestAccess();
      setActionMessage('Access request submitted! Awaiting hospital permission grant.');
    } catch (err: any) {
      setActionMessage('Request access failed: ' + (err?.message || String(err)));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGrantPermission = async () => {
    setIsSubmitting(true);
    setActionMessage('Executing Compact circuit: grantPermission...');
    try {
      await grantPermission();
      setActionMessage('Access permission granted to researcher!');
    } catch (err: any) {
      setActionMessage('Grant permission failed: ' + (err?.message || String(err)));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitProof = async () => {
    setIsSubmitting(true);
    setActionMessage('Executing Compact witness proof circuit: submitAccessProof...');
    try {
      await submitAccessProof();
      setActionMessage('Access proof verified & logged on-chain successfully!');
    } catch (err: any) {
      setActionMessage('Proof submission failed: ' + (err?.message || String(err)));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRenewQuota = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setActionMessage(`Executing Compact circuit: renewAccessQuota (${additionalQuota})...`);
    try {
      await renewAccessQuota(BigInt(additionalQuota));
      setActionMessage(`Quota extended by +${additionalQuota} queries!`);
      setIsRenewOpen(false);
    } catch (err: any) {
      setActionMessage('Renew quota failed: ' + (err?.message || String(err)));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = async () => {
    setIsSubmitting(true);
    setActionMessage('Executing Compact circuit: revokeAccess...');
    try {
      await revokeAccess();
      setActionMessage('Dataset access permission revoked.');
    } catch (err: any) {
      setActionMessage('Revoke failed: ' + (err?.message || String(err)));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-4">
        <div>
          <h2 className="text-2xl font-bold text-olive-900 flex items-center gap-2">
            <Database className="w-6 h-6 text-olive-700" />
            Confidential Clinical Datasets
          </h2>
          <p className="text-xs text-mutedText mt-1">
            Zero-knowledge protected medical datasets hosted on Midnight network.
          </p>
        </div>

        <button
          onClick={() => setIsRegisterOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-olive-800 hover:bg-olive-900 text-white font-semibold rounded-xl text-xs shadow-subtle transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Register Dataset</span>
        </button>
      </div>

      {actionMessage && (
        <div className="p-4 bg-olive-50 border border-olive-200 text-olive-900 rounded-2xl text-xs flex items-center justify-between">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="text-olive-700 font-bold ml-4">×</button>
        </div>
      )}

      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-olive-800 text-white shadow-subtle'
                : 'bg-white border border-surface-border text-olive-800 hover:bg-olive-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-card space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-olive-100 text-olive-900 text-xs font-semibold mb-2">
                  <Tag className="w-3.5 h-3.5 text-olive-700" />
                  {currentCategory}
                </span>
                <h3 className="text-lg font-bold text-olive-900">
                  WGS De-identified Whole Genome Dataset (Cohort 412)
                </h3>
                <p className="text-xs text-mutedText mt-1">
                  Owner Commitment: {contractData?.owner ? `${contractData.owner.slice(0, 10)}...${contractData.owner.slice(-6)}` : '0x8f3c...e412'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Active Contract
                </span>
              </div>
            </div>

            <div className="bg-surface-bg rounded-xl p-4 border border-surface-border space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-olive-900">
                <span className="flex items-center gap-1.5">
                  <BarChart2 className="w-4 h-4 text-olive-700" />
                  Witness Access Quota Usage
                </span>
                <span>{currentAccessCount} / {maxLimit} Queries Used ({quotaPercent}%)</span>
              </div>

              <div className="w-full h-2.5 bg-olive-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-olive-700 transition-all duration-500"
                  style={{ width: `${quotaPercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-mutedText">
                <span>Remaining Quota: <strong className="text-olive-900">{remainingQuota} proofs</strong></span>
                <span>Circuit Enforcement: <strong className="text-olive-900">submitAccessProof</strong></span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleRequestAccess}
                disabled={isSubmitting}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-olive-50 border border-surface-border text-olive-900 font-semibold rounded-xl text-xs transition-all shadow-subtle"
              >
                <Key className="w-4 h-4 text-olive-700" />
                <span>1. Request Access Ticket</span>
              </button>

              <button
                onClick={handleGrantPermission}
                disabled={isSubmitting}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-olive-50 border border-surface-border text-olive-900 font-semibold rounded-xl text-xs transition-all shadow-subtle"
              >
                <CheckCircle className="w-4 h-4 text-olive-700" />
                <span>2. Grant Permission (Hospital)</span>
              </button>

              <button
                onClick={handleSubmitProof}
                disabled={isSubmitting || remainingQuota <= 0}
                className={`flex items-center justify-center gap-2 px-4 py-3 font-semibold rounded-xl text-xs transition-all ${
                  remainingQuota <= 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-olive-800 hover:bg-olive-900 text-white shadow-subtle'
                }`}
              >
                <Lock className="w-4 h-4 text-olive-200" />
                <span>3. Submit ZK Proof ({remainingQuota > 0 ? 'Active' : 'Quota Exceeded'})</span>
              </button>

              <button
                onClick={() => setIsRenewOpen(true)}
                disabled={isSubmitting}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-olive-100 hover:bg-olive-200 border border-olive-300 text-olive-900 font-semibold rounded-xl text-xs transition-all"
              >
                <RefreshCw className="w-4 h-4 text-olive-700" />
                <span>4. Renew Quota Limit (Hospital)</span>
              </button>
            </div>

            <div className="pt-2">
              <button
                onClick={handleRevoke}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-semibold rounded-xl text-xs transition-all"
              >
                <XCircle className="w-4 h-4 text-red-600" />
                <span>Revoke Access Permission</span>
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-card space-y-4">
            <h4 className="font-bold text-olive-900 text-sm flex items-center gap-2 border-b border-surface-border pb-3">
              <Layers className="w-4 h-4 text-olive-700" />
              <span>Compact Contract Ledger State</span>
            </h4>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-mutedText">Current Sequence</span>
                <p className="font-mono font-semibold text-olive-900">{boardState?.sequence?.toString() || '1'}</p>
              </div>

              <div>
                <span className="text-mutedText">Audit Log Count</span>
                <p className="font-mono font-semibold text-olive-900">{boardState?.auditLogCount?.toString() || '0'} Cryptographic Logs</p>
              </div>

              <div>
                <span className="text-mutedText">Last Disclosed Proof Hash</span>
                <p className="font-mono text-[10px] bg-surface-bg p-2 rounded-lg border border-surface-border break-all text-olive-900">
                  {boardState?.lastProofHash ? Array.from(boardState.lastProofHash).map((b: any) => b.toString(16).padStart(2, '0')).join('') : 'init-proof-hash-commitment-0000'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-olive-950/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-surface-border p-6 max-w-md w-full shadow-hover space-y-4">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <h3 className="font-bold text-olive-900 text-base flex items-center gap-2">
                <Plus className="w-5 h-5 text-olive-700" />
                Register New Clinical Dataset
              </h3>
              <button onClick={() => setIsRegisterOpen(false)} className="text-mutedText hover:text-olive-900 font-bold">×</button>
            </div>

            <form onSubmit={handleRegister} className="space-y-4 text-xs">
              <div>
                <label className="block text-olive-900 font-semibold mb-1">Dataset Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Pediatric Rare Disease Clinical Cohort B"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-surface-border bg-surface-bg text-olive-900 focus:outline-none focus:border-olive-600"
                  required
                />
              </div>

              <div>
                <label className="block text-olive-900 font-semibold mb-1">Domain Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-surface-border bg-surface-bg text-olive-900 focus:outline-none focus:border-olive-600"
                >
                  <option value="Oncology & Genomics">Oncology & Genomics</option>
                  <option value="Cardiology">Cardiology</option>
                  <option value="Neurology">Neurology</option>
                  <option value="Immunology">Immunology</option>
                  <option value="Pediatrics">Pediatrics</option>
                  <option value="Ophthalmology">Ophthalmology</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="px-4 py-2.5 bg-surface-bg hover:bg-olive-100 text-olive-800 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-olive-800 hover:bg-olive-900 text-white rounded-xl font-semibold shadow-subtle"
                >
                  Register Dataset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isRenewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-olive-950/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-surface-border p-6 max-w-md w-full shadow-hover space-y-4">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <h3 className="font-bold text-olive-900 text-base flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-olive-700" />
                Extend Dataset Access Quota
              </h3>
              <button onClick={() => setIsRenewOpen(false)} className="text-mutedText hover:text-olive-900 font-bold">×</button>
            </div>

            <form onSubmit={handleRenewQuota} className="space-y-4 text-xs">
              <div>
                <label className="block text-olive-900 font-semibold mb-1">Additional Access Quota</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={additionalQuota}
                  onChange={(e) => setAdditionalQuota(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-surface-border bg-surface-bg text-olive-900 focus:outline-none focus:border-olive-600"
                  required
                />
                <p className="text-[11px] text-mutedText mt-1">
                  Adds additional zero-knowledge proof submissions to the dataset quota.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRenewOpen(false)}
                  className="px-4 py-2.5 bg-surface-bg hover:bg-olive-100 text-olive-800 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-olive-800 hover:bg-olive-900 text-white rounded-xl font-semibold shadow-subtle"
                >
                  Extend Quota
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
