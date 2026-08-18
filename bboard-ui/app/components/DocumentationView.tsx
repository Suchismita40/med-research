'use client';

import React from 'react';
import { BookOpen, FileText, Code, Shield } from 'lucide-react';

export function DocumentationView() {
  return (
    <div className="bg-white p-8 rounded-2xl border border-surface-border shadow-card space-y-6">
      <div className="border-b border-surface-border pb-4">
        <h2 className="text-2xl font-extrabold text-olive-900 flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-olive-700" />
          Technical Documentation & Architecture Guide
        </h2>
        <p className="text-xs text-mutedText mt-1">
          Private Medical Research Data Exchange on Midnight Protocol
        </p>
      </div>

      <div className="space-y-4 text-xs text-olive-900 leading-relaxed">
        <h3 className="font-bold text-sm text-olive-900">1. Dual-State Architecture</h3>
        <p className="text-mutedText">
          Midnight smart contracts split execution into public ledger state (transparent on-chain) and private witness state (prover browser execution).
        </p>

        <h3 className="font-bold text-sm text-olive-900">2. Compact Circuits</h3>
        <ul className="list-disc list-inside space-y-1 text-mutedText">
          <li><strong>registerDataset(title, category)</strong>: Registers clinical dataset with category metadata.</li>
          <li><strong>requestAccess(datasetId)</strong>: Verifies doctor credential witness and publishes active researcher PK.</li>
          <li><strong>grantPermission(datasetId, researcherPk)</strong>: Hospital dataset owner authorizes research access.</li>
          <li><strong>submitAccessProof(datasetId, patientRecordHash)</strong>: Generates ZK proof and checks accessCount &lt; maxAccessLimit.</li>
          <li><strong>renewAccessQuota(datasetId, additionalQuota)</strong>: Hospital dataset owner extends access limit.</li>
          <li><strong>revokeAccess(datasetId)</strong>: Revokes access authorization.</li>
        </ul>
      </div>
    </div>
  );
}
