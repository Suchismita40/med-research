'use client';

import React from 'react';
import { Wallet, Key, Send, Lock, CheckCircle2, Shield, ArrowRight } from 'lucide-react';

interface StepperProps {
  boardState: any;
}

export function AccessWorkflowStepper({ boardState }: StepperProps) {
  const stateEnum = boardState?.state ?? 0;

  const steps = [
    {
      id: 1,
      title: 'Lace Wallet Enablement',
      desc: 'Detect window.midnight provider and authenticate with Midnight Lace Browser Extension.',
      icon: Wallet,
      status: 'completed',
    },
    {
      id: 2,
      title: 'Dataset & Credential Selection',
      desc: 'Select clinical dataset and load local medical credential witness secret in prover state.',
      icon: Key,
      status: stateEnum >= 0 ? 'completed' : 'pending',
    },
    {
      id: 3,
      title: 'Confidential Access Request',
      desc: 'Invoke requestAccess circuit to publish derived researcher public key hash on-chain.',
      icon: Send,
      status: stateEnum >= 1 ? 'completed' : 'current',
    },
    {
      id: 4,
      title: 'Hospital Permission Grant',
      desc: 'Hospital dataset owner verifies researcher identity and grants permission via grantPermission.',
      icon: CheckCircle2,
      status: stateEnum >= 2 ? 'completed' : 'pending',
    },
    {
      id: 5,
      title: 'ZK Access Proof & Quota Check',
      desc: 'Generate persistent proof commitment on patient record key. Enforces maxAccessLimit check.',
      icon: Lock,
      status: stateEnum >= 2 && (boardState?.accessCount > 0) ? 'completed' : 'pending',
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-card space-y-8">
      <div>
        <h3 className="text-xl font-bold text-olive-900 flex items-center gap-2">
          <Shield className="w-5 h-5 text-olive-700" />
          Zero-Knowledge Verification Workflow Stepper
        </h3>
        <p className="text-xs text-mutedText mt-1">
          Visual progression of smart contract state transitions and off-chain prover witness executions.
        </p>
      </div>

      <div className="space-y-6">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isDone = step.status === 'completed';

          return (
            <div key={step.id} className="relative flex items-start gap-4">
              {idx !== steps.length - 1 && (
                <div
                  className={`absolute left-5 top-10 bottom-0 w-0.5 ${
                    isDone ? 'bg-olive-600' : 'bg-olive-200'
                  }`}
                />
              )}

              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-subtle ${
                  isDone
                    ? 'bg-olive-800 text-white'
                    : 'bg-surface-bg border border-surface-border text-mutedText'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>

              <div className="space-y-1 pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-olive-800 uppercase tracking-wide">
                    Step 0{step.id}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-olive-100 text-olive-900 font-semibold">
                    {isDone ? 'Verified' : 'Active Stage'}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-olive-900">{step.title}</h4>
                <p className="text-xs text-mutedText leading-relaxed">{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
