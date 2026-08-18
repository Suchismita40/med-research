'use client';

import React, { useState } from 'react';
import {
  Database,
  Plus,
  Search,
  Filter,
  Layers,
  Lock,
  CheckCircle2,
  Clock,
  Key,
  RefreshCw,
  XCircle,
  ExternalLink,
  Shield,
  Eye,
  AlertCircle,
} from 'lucide-react';
import { useDeployedBoardContext, DatasetItem } from '../../src/hooks/useDeployedBoardContext';

export function DatasetWorkspace() {
  const {
    state,
    selectDataset,
    registerDataset,
    requestAccess,
    grantPermission,
    submitAccessProof,
    renewAccessQuota,
    revokeAccess,
    resetTxProgress,
  } = useDeployedBoardContext();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [detailDataset, setDetailDataset] = useState<DatasetItem | null>(null);
  const [renewDataset, setRenewDataset] = useState<DatasetItem | null>(null);
  const [additionalQuota, setAdditionalQuota] = useState(10);

  // Form fields for registration
  const [regTitle, setRegTitle] = useState('');
  const [regCategory, setRegCategory] = useState<DatasetItem['category']>('Oncology & Genomics');
  const [regInstitution, setRegInstitution] = useState('');
  const [regQuota, setRegQuota] = useState(50);
  const [regDescription, setRegDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const categories = [
    'All',
    'Oncology & Genomics',
    'Cardiology',
    'Neurology',
    'Immunology',
    'Pediatrics',
    'Ophthalmology',
    'General',
  ];

  const filteredDatasets = state.datasets.filter((ds) => {
    const matchesCat = selectedCategory === 'All' || ds.category === selectedCategory;
    const matchesSearch =
      ds.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ds.institution.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ds.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleOpenRegister = () => {
    setRegTitle('');
    setRegCategory('Oncology & Genomics');
    setRegInstitution('');
    setRegQuota(50);
    setRegDescription('');
    setFormError(null);
    setIsRegisterModalOpen(true);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regTitle.trim()) {
      setFormError('Please provide a dataset title.');
      return;
    }
    if (!regInstitution.trim()) {
      setFormError('Please specify the accredited healthcare institution.');
      return;
    }
    if (regQuota <= 0) {
      setFormError('Initial access quota must be at least 1.');
      return;
    }

    setFormError(null);
    setIsRegisterModalOpen(false);

    await registerDataset(regTitle, regCategory, regQuota, regInstitution, regDescription);
  };

  const handleRenewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renewDataset || additionalQuota <= 0) return;
    const targetId = renewDataset.id;
    setRenewDataset(null);
    await renewAccessQuota(targetId, additionalQuota);
  };

  const tx = state.txProgress;
  const isBusy = tx.phase === 'validating' || tx.phase === 'proving' || tx.phase === 'submitting';

  return (
    <div className="space-y-8">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-olive-950 flex items-center gap-2.5">
            <Database className="w-6 h-6 text-olive-700" />
            <span>Confidential Medical Datasets Registry</span>
          </h2>
          <p className="text-xs text-mutedText mt-1">
            Zero-knowledge indexed datasets on Midnight Preprod. Access is regulated strictly by Compact smart contract circuits.
          </p>
        </div>

        <button
          onClick={handleOpenRegister}
          disabled={isBusy}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-olive-800 hover:bg-olive-900 text-white rounded-xl font-semibold text-sm transition-all shadow-subtle hover:shadow-hover shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Dataset</span>
        </button>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white rounded-2xl border border-surface-border p-4 shadow-subtle flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-mutedText absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search datasets, institutions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-surface-bg border border-surface-border text-olive-900 focus:outline-none focus:border-olive-600"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto scrollbar-none pb-1 md:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-olive-800 text-white shadow-subtle font-semibold'
                  : 'text-mutedText bg-surface-bg hover:bg-olive-50 hover:text-olive-900 border border-surface-border'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Dataset Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredDatasets.map((dataset) => {
          const max = Number(dataset.maxAccessLimit);
          const used = Number(dataset.accessCount);
          const remaining = Math.max(0, max - used);
          const percent = max > 0 ? Math.min(100, Math.round((used / max) * 100)) : 0;

          return (
            <div
              key={dataset.id}
              className="bg-white rounded-2xl border border-surface-border p-6 shadow-card hover:shadow-hover transition-all flex flex-col justify-between space-y-5"
            >
              {/* Card Header */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <span className="px-2.5 py-1 bg-olive-100 text-olive-900 border border-olive-200 rounded-md text-[11px] font-semibold">
                    {dataset.category}
                  </span>

                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                      dataset.status === 'GRANTED'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : dataset.status === 'REQUESTED'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : dataset.status === 'REVOKED'
                        ? 'bg-red-50 text-red-800 border-red-200'
                        : 'bg-surface-bg text-mutedText border-surface-border'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        dataset.status === 'GRANTED'
                          ? 'bg-emerald-500'
                          : dataset.status === 'REQUESTED'
                          ? 'bg-amber-500 animate-pulse'
                          : dataset.status === 'REVOKED'
                          ? 'bg-red-500'
                          : 'bg-mutedText'
                      }`}
                    ></span>
                    {dataset.status === 'GRANTED'
                      ? 'Access Granted'
                      : dataset.status === 'REQUESTED'
                      ? 'Permission Pending'
                      : dataset.status === 'REVOKED'
                      ? 'Access Revoked'
                      : 'Unrequested'}
                  </span>
                </div>

                <h3 className="font-bold text-base text-olive-950 leading-snug">{dataset.title}</h3>
                <p className="text-xs text-mutedText line-clamp-2">{dataset.description}</p>
                <div className="text-[11px] text-olive-800 font-medium">{dataset.institution}</div>
              </div>

              {/* Quota Progress */}
              <div className="bg-surface-bg/70 p-4 rounded-xl border border-surface-border space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-mutedText">ZK Query Quota</span>
                  <span className="text-olive-900 font-mono">
                    {used} / {max} Queries ({remaining} remaining)
                  </span>
                </div>

                <div className="w-full h-2 bg-surface-border rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      percent > 85 ? 'bg-red-500' : percent > 50 ? 'bg-amber-500' : 'bg-olive-600'
                    }`}
                    style={{ width: `${percent}%` }}
                  ></div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-2 border-t border-surface-border flex flex-wrap items-center justify-between gap-2">
                <button
                  onClick={() => setDetailDataset(dataset)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-surface-bg hover:bg-olive-100 text-olive-900 rounded-xl text-xs font-semibold border border-surface-border transition-all"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Details</span>
                </button>

                <div className="flex items-center gap-2">
                  {dataset.status === 'NONE' || dataset.status === 'REVOKED' ? (
                    <button
                      onClick={() => requestAccess(dataset.id)}
                      disabled={isBusy}
                      className="inline-flex items-center gap-1 px-3.5 py-2 bg-olive-800 hover:bg-olive-900 text-white rounded-xl text-xs font-semibold shadow-subtle transition-all"
                    >
                      <Key className="w-3.5 h-3.5" />
                      <span>Request Access</span>
                    </button>
                  ) : dataset.status === 'REQUESTED' ? (
                    <button
                      onClick={() => grantPermission(dataset.id)}
                      disabled={isBusy}
                      className="inline-flex items-center gap-1 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-subtle transition-all"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Grant Permission</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => submitAccessProof(dataset.id)}
                      disabled={isBusy || remaining === 0}
                      className={`inline-flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-subtle transition-all ${
                        remaining > 0
                          ? 'bg-olive-800 hover:bg-olive-900 text-white'
                          : 'bg-surface-bg text-mutedText border border-surface-border cursor-not-allowed'
                      }`}
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Submit ZK Proof</span>
                    </button>
                  )}

                  <button
                    onClick={() => setRenewDataset(dataset)}
                    disabled={isBusy}
                    title="Renew access quota"
                    className="p-2 bg-surface-bg hover:bg-olive-100 text-olive-800 rounded-xl border border-surface-border transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Register Dataset Modal */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-olive-950/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-surface-border p-6 max-w-lg w-full shadow-card space-y-5">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <h3 className="font-bold text-olive-950 text-base flex items-center gap-2">
                <Database className="w-5 h-5 text-olive-700" />
                <span>Register New Clinical Dataset</span>
              </h3>
              <button
                onClick={() => setIsRegisterModalOpen(false)}
                className="text-mutedText hover:text-olive-900 text-lg font-bold"
              >
                ×
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-olive-900 font-semibold mb-1">Dataset Title</label>
                <input
                  type="text"
                  value={regTitle}
                  onChange={(e) => setRegTitle(e.target.value)}
                  placeholder="e.g. Immunotherapy Melanoma Phase III Patient Cohort"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-surface-border bg-surface-bg text-olive-900 focus:outline-none focus:border-olive-600"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-olive-900 font-semibold mb-1">Domain Category</label>
                  <select
                    value={regCategory}
                    onChange={(e) => setRegCategory(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-surface-border bg-surface-bg text-olive-900 focus:outline-none focus:border-olive-600"
                  >
                    <option value="Oncology & Genomics">Oncology & Genomics</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Neurology">Neurology</option>
                    <option value="Immunology">Immunology</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="Ophthalmology">Ophthalmology</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-olive-900 font-semibold mb-1">Initial Access Quota</label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={regQuota}
                    onChange={(e) => setRegQuota(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-surface-border bg-surface-bg text-olive-900 focus:outline-none focus:border-olive-600"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-olive-900 font-semibold mb-1">Healthcare Institution</label>
                <input
                  type="text"
                  value={regInstitution}
                  onChange={(e) => setRegInstitution(e.target.value)}
                  placeholder="e.g. Dana-Farber Cancer Institute"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-surface-border bg-surface-bg text-olive-900 focus:outline-none focus:border-olive-600"
                  required
                />
              </div>

              <div>
                <label className="block text-olive-900 font-semibold mb-1">Dataset Description</label>
                <textarea
                  rows={3}
                  value={regDescription}
                  onChange={(e) => setRegDescription(e.target.value)}
                  placeholder="Clinical metadata, trial parameters, and anonymized feature scope..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-surface-border bg-surface-bg text-olive-900 focus:outline-none focus:border-olive-600"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-4 py-2.5 bg-surface-bg hover:bg-olive-100 text-olive-800 rounded-xl font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-olive-800 hover:bg-olive-900 text-white rounded-xl font-semibold shadow-subtle transition-all"
                >
                  Confirm & Invoke Circuit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quota Renewal Modal */}
      {renewDataset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-olive-950/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-surface-border p-6 max-w-md w-full shadow-card space-y-4">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <h3 className="font-bold text-olive-950 text-base flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-olive-700" />
                <span>Renew Dataset Access Quota</span>
              </h3>
              <button onClick={() => setRenewDataset(null)} className="text-mutedText hover:text-olive-900 font-bold">
                ×
              </button>
            </div>

            <form onSubmit={handleRenewSubmit} className="space-y-4 text-xs">
              <p className="text-mutedText">
                Extend access limit for <strong className="text-olive-950">{renewDataset.title}</strong> via Compact circuit <code className="font-mono text-olive-800">renewAccessQuota</code>.
              </p>

              <div>
                <label className="block text-olive-900 font-semibold mb-1">Additional Quota Limit (+)</label>
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={additionalQuota}
                  onChange={(e) => setAdditionalQuota(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-surface-border bg-surface-bg text-olive-900 focus:outline-none focus:border-olive-600"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRenewDataset(null)}
                  className="px-4 py-2.5 bg-surface-bg hover:bg-olive-100 text-olive-800 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-olive-800 hover:bg-olive-900 text-white rounded-xl font-semibold shadow-subtle"
                >
                  Extend Quota
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dataset Details Modal */}
      {detailDataset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-olive-950/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-surface-border p-6 max-w-2xl w-full shadow-card space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div>
                <span className="text-[11px] font-semibold text-olive-700 bg-olive-50 px-2 py-0.5 rounded border border-olive-200">
                  {detailDataset.category}
                </span>
                <h3 className="font-bold text-lg text-olive-950 mt-1">{detailDataset.title}</h3>
              </div>
              <button onClick={() => setDetailDataset(null)} className="text-mutedText hover:text-olive-900 text-xl font-bold">
                ×
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <p className="text-mutedText leading-relaxed">{detailDataset.description}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-surface-bg p-3.5 rounded-xl border border-surface-border space-y-1">
                  <span className="text-mutedText font-medium">Healthcare Institution</span>
                  <p className="font-semibold text-olive-900">{detailDataset.institution}</p>
                </div>

                <div className="bg-surface-bg p-3.5 rounded-xl border border-surface-border space-y-1">
                  <span className="text-mutedText font-medium">Sample Cohort Size</span>
                  <p className="font-semibold text-olive-900">{detailDataset.sampleSize.toLocaleString()} de-identified records</p>
                </div>

                <div className="bg-surface-bg p-3.5 rounded-xl border border-surface-border space-y-1">
                  <span className="text-mutedText font-medium">Zero-Knowledge Verification</span>
                  <p className="font-semibold text-olive-900">{detailDataset.zkVerificationType}</p>
                </div>

                <div className="bg-surface-bg p-3.5 rounded-xl border border-surface-border space-y-1">
                  <span className="text-mutedText font-medium">Registration Date</span>
                  <p className="font-semibold text-olive-900">{detailDataset.createdAt}</p>
                </div>
              </div>

              {/* Public Ledger vs Private Witness Breakdown */}
              <div className="border border-surface-border rounded-xl p-4 space-y-3">
                <h4 className="font-bold text-olive-900 text-xs flex items-center gap-2">
                  <Shield className="w-4 h-4 text-olive-700" />
                  <span>On-Chain Cryptographic Identifiers</span>
                </h4>

                <div>
                  <span className="text-mutedText">Hospital Owner Public Key (Disclosed on-chain):</span>
                  <p className="font-mono text-[10px] bg-surface-bg p-2 rounded border border-surface-border break-all text-olive-900 mt-0.5">
                    {detailDataset.owner}
                  </p>
                </div>

                <div>
                  <span className="text-mutedText">Last Disclosed Proof Hash:</span>
                  <p className="font-mono text-[10px] bg-surface-bg p-2 rounded border border-surface-border break-all text-olive-900 mt-0.5">
                    {detailDataset.lastProofHash}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-surface-border">
              <button
                onClick={() => setDetailDataset(null)}
                className="px-5 py-2.5 bg-olive-800 hover:bg-olive-900 text-white font-semibold rounded-xl text-xs transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Progress Toast / Modal */}
      {tx.phase !== 'idle' && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md w-full p-4 bg-white rounded-2xl border border-surface-border shadow-card space-y-3 animate-in fade-in slide-in-from-bottom-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5 font-bold text-sm text-olive-950">
              {isBusy ? (
                <RefreshCw className="w-4 h-4 animate-spin text-olive-700" />
              ) : tx.phase === 'confirmed' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-500" />
              )}
              <span>{tx.circuit ? `Circuit: ${tx.circuit}` : 'Transaction Status'}</span>
            </div>

            {!isBusy && (
              <button onClick={resetTxProgress} className="text-mutedText hover:text-olive-900 font-bold">
                ×
              </button>
            )}
          </div>

          <p className="text-xs text-mutedText">{tx.message}</p>

          {tx.txHash && (
            <div className="bg-surface-bg p-2 rounded-lg border border-surface-border text-[10px] font-mono text-olive-900 break-all">
              <span className="text-mutedText block">Tx Hash:</span>
              {tx.txHash}
            </div>
          )}

          {tx.error && (
            <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">{tx.error}</p>
          )}

          {!isBusy && (
            <div className="flex justify-end">
              <button
                onClick={resetTxProgress}
                className="px-3 py-1.5 bg-surface-bg hover:bg-olive-100 text-olive-900 rounded-lg text-xs font-semibold"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
