'use client';

import React from 'react';
import { Eye, EyeOff, ShieldCheck, Lock, FileText, CheckCircle } from 'lucide-react';

export function PrivacyCenter() {
  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-2xl border border-surface-border shadow-subtle">
        <h2 className="text-2xl font-extrabold text-olive-900 flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-olive-700" />
          Midnight Zero-Knowledge Privacy Architecture
        </h2>
        <p className="text-xs text-mutedText mt-1">
          Detailed comparison between transparent on-chain ledger state and secret off-chain prover witness state.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* PUBLIC LEDGER STATE */}
        <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-card space-y-4">
          <div className="flex items-center gap-3 border-b border-surface-border pb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-olive-900 text-base">Public Ledger State (On-Chain)</h3>
              <p className="text-xs text-mutedText">Published transparently to Midnight blockchain nodes</p>
            </div>
          </div>

          <ul className="space-y-3 text-xs text-olive-900 font-medium">
            <li className="flex items-start gap-2 p-2.5 rounded-xl bg-surface-bg border border-surface-border">
              <CheckCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Dataset Metadata & Domain Category</span>
                <p className="text-[11px] text-mutedText">Title and category tag (e.g. "Oncology & Genomics") for public discovery.</p>
              </div>
            </li>

            <li className="flex items-start gap-2 p-2.5 rounded-xl bg-surface-bg border border-surface-border">
              <CheckCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Access Quota Counters</span>
                <p className="text-[11px] text-mutedText">maxAccessLimit and accessCount for access quota governance.</p>
              </div>
            </li>

            <li className="flex items-start gap-2 p-2.5 rounded-xl bg-surface-bg border border-surface-border">
              <CheckCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Derived Proof Commitments</span>
                <p className="text-[11px] text-mutedText">disclose(persistentHash(...)) cryptographic proof hash for verification.</p>
              </div>
            </li>
          </ul>
        </div>

        {/* PRIVATE WITNESS STATE */}
        <div className="bg-olive-900 text-white rounded-2xl p-6 shadow-card space-y-4">
          <div className="flex items-center gap-3 border-b border-olive-800 pb-4">
            <div className="w-10 h-10 rounded-xl bg-olive-700 text-olive-100 flex items-center justify-center">
              <EyeOff className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Private Witness State (Off-Chain)</h3>
              <p className="text-xs text-olive-200">Maintained strictly within local browser prover state</p>
            </div>
          </div>

          <ul className="space-y-3 text-xs text-olive-100 font-medium">
            <li className="flex items-start gap-2 p-2.5 rounded-xl bg-olive-800/80 border border-olive-700">
              <Lock className="w-4 h-4 text-olive-300 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white">Local Secret Key (localSecretKey)</span>
                <p className="text-[11px] text-olive-300">Wallet secret key used for deterministic public key derivation.</p>
              </div>
            </li>

            <li className="flex items-start gap-2 p-2.5 rounded-xl bg-olive-800/80 border border-olive-700">
              <Lock className="w-4 h-4 text-olive-300 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white">Medical License Credential (medicalCredentialSecret)</span>
                <p className="text-[11px] text-olive-300">Doctor/researcher credential secret verified locally inside ZK circuit.</p>
              </div>
            </li>

            <li className="flex items-start gap-2 p-2.5 rounded-xl bg-olive-800/80 border border-olive-700">
              <Lock className="w-4 h-4 text-olive-300 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white">Patient Record Key (patientRecordKey)</span>
                <p className="text-[11px] text-olive-300">Patient data decryption key. Never disclosed or sent across network.</p>
              </div>
            </li>
          </ul>
        </div>

      </div>
    </div>
  );
}
