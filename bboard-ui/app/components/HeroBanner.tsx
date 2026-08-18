'use client';

import React from 'react';
import { ShieldCheck, Lock, ArrowRight, CheckCircle, Server, EyeOff, Award } from 'lucide-react';

interface HeroBannerProps {
  onExploreDatasets: () => void;
  onExplorePrivacy: () => void;
  boardState: any;
}

export function HeroBanner({ onExploreDatasets, onExplorePrivacy, boardState }: HeroBannerProps) {
  return (
    <div className="relative overflow-hidden bg-white border-b border-surface-border py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-olive-100 border border-olive-200 text-olive-800 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-olive-600" />
              <span>Midnight Dual-State Architecture & Zero-Knowledge Proofs</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-olive-900 tracking-tight leading-tight">
              Confidential Medical Research Data Exchange
            </h1>

            <p className="text-base sm:text-lg text-mutedText max-w-2xl leading-relaxed">
              Enable accredited healthcare institutions and researchers to prove data access eligibility and record verification via Zero-Knowledge proofs — without disclosing patient PII, medical credentials, or private decryption keys on-chain.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={onExploreDatasets}
                className="flex items-center gap-2 px-6 py-3.5 bg-olive-800 hover:bg-olive-900 text-white rounded-xl font-semibold text-sm transition-all shadow-subtle hover:shadow-hover"
              >
                <span>Dataset Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onExplorePrivacy}
                className="flex items-center gap-2 px-6 py-3.5 bg-surface-bg hover:bg-olive-100 text-olive-800 border border-olive-200 rounded-xl font-semibold text-sm transition-all"
              >
                <Lock className="w-4 h-4 text-olive-600" />
                <span>Privacy Model</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-surface-border text-xs font-medium text-olive-900">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-olive-600" />
                <span>HIPAA / GDPR Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-olive-600" />
                <span>Authentic Lace Wallet</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-olive-600" />
                <span>Quota Controlled Access</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="bg-surface-bg border border-surface-border rounded-2xl p-6 shadow-card space-y-6">
              <div className="flex items-center justify-between border-b border-surface-border pb-4">
                <div className="flex items-center gap-2">
                  <Server className="w-5 h-5 text-olive-700" />
                  <h3 className="font-bold text-olive-900 text-base">System Telemetry</h3>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-olive-100 text-olive-800 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-olive-600"></span>
                  Active
                </span>
              </div>

              <div className="space-y-4 text-sm">
                <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-surface-border">
                  <span className="text-mutedText">Network Protocol</span>
                  <span className="font-semibold text-olive-900">Midnight Preprod</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-surface-border">
                  <span className="text-mutedText">Compact Contract</span>
                  <span className="font-semibold text-olive-900">v0.23 (Categorized + Quota)</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-surface-border">
                  <span className="text-mutedText">Dataset Quota Counter</span>
                  <span className="font-semibold text-olive-900">
                    {boardState?.accessCount?.toString() || '0'} / {boardState?.maxAccessLimit?.toString() || '5'} Max
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-surface-border">
                  <span className="text-mutedText">ZK Proof Engine</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-olive-700">
                    <EyeOff className="w-4 h-4 text-olive-600" />
                    Prover Witness Isolated
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-olive-100/60 border border-olive-200 text-xs text-olive-900 flex items-start gap-2.5">
                <Award className="w-4 h-4 text-olive-700 shrink-0 mt-0.5" />
                <span>
                  All contract circuits execute zero-knowledge proofs locally in the prover browser state. No medical credentials or private keys leave your device.
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
