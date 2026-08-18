'use client';

import React from 'react';
import { Shield, Wallet, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useDeployedBoardContext } from '../../src/hooks/useDeployedBoardContext';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Header({ activeTab, setActiveTab }: HeaderProps) {
  const { state, connectWallet } = useDeployedBoardContext();

  const navItems = [
    { id: 'overview', label: 'Overview' },
    { id: 'datasets', label: 'Dataset Workspace' },
    { id: 'stepper', label: 'ZK Engine Stepper' },
    { id: 'privacy', label: 'Privacy Center' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'docs', label: 'Documentation' },
  ];

  const isConnected = state.status === 'connected';
  const isConnecting = state.status === 'connecting';

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-surface-border shadow-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">

          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('overview')}>
            <div className="w-11 h-11 rounded-xl bg-olive-800 flex items-center justify-center text-white shadow-subtle">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xl text-olive-900 tracking-tight">MedEx</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-olive-100 text-olive-800 font-semibold border border-olive-200">
                  Midnight ZK
                </span>
              </div>
              <p className="text-xs text-mutedText hidden sm:block">Private Medical Research Exchange</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1 bg-surface-bg p-1.5 rounded-xl border border-surface-border">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  activeTab === item.id
                    ? 'bg-white text-olive-900 shadow-subtle font-semibold'
                    : 'text-mutedText hover:text-olive-800 hover:bg-white/50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 bg-olive-50 rounded-lg border border-olive-200 text-xs text-olive-800 font-medium">
              <span className="w-2 h-2 rounded-full bg-olive-500 animate-pulse"></span>
              Midnight Preprod
            </div>

            <button
              onClick={connectWallet}
              disabled={isConnecting}
              className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-medium text-sm transition-all shadow-subtle hover:shadow-hover active:scale-[0.98] ${
                isConnected
                  ? 'bg-olive-900 text-emerald-300 border border-emerald-500/30'
                  : 'bg-olive-800 hover:bg-olive-900 text-white'
              }`}
            >
              {isConnecting ? (
                <RefreshCw className="w-4 h-4 animate-spin text-olive-200" />
              ) : isConnected ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <Wallet className="w-4 h-4 text-olive-200" />
              )}
              <span>
                {isConnecting
                  ? 'Authorizing Lace...'
                  : isConnected
                  ? state.connectedWallet?.address || 'Lace Connected'
                  : 'Connect Lace Wallet'}
              </span>
            </button>
          </div>

        </div>
      </div>

      <div className="md:hidden flex overflow-x-auto px-4 py-2 bg-surface-bg border-t border-surface-border gap-1 scrollbar-none">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`px-3 py-1.5 text-xs font-medium whitespace-nowrap rounded-lg ${
              activeTab === item.id
                ? 'bg-olive-800 text-white font-semibold'
                : 'text-mutedText bg-white border border-surface-border'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </header>
  );
}
