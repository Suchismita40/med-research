'use client';

import React, { useState } from 'react';
import { Header } from './components/Header';
import { Overview } from './components/Overview';
import { DatasetWorkspace } from './components/DatasetWorkspace';
import { PermissionsView } from './components/PermissionsView';
import { ActivityView } from './components/ActivityView';
import { Shield, ExternalLink } from 'lucide-react';

export default function MainDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen flex flex-col bg-surface-bg text-primaryText">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && <Overview setActiveTab={setActiveTab} />}
        {activeTab === 'datasets' && <DatasetWorkspace />}
        {activeTab === 'permissions' && <PermissionsView />}
        {activeTab === 'activity' && <ActivityView />}
      </main>

      <footer className="bg-white border-t border-surface-border py-8 text-xs text-mutedText mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-medium text-olive-900">
            <Shield className="w-4 h-4 text-olive-700" />
            <span>MedEx Private Medical Research Data Exchange</span>
          </div>

          <div className="flex items-center gap-6">
            <a
              href="https://preprod.midnightexplorer.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-olive-900 inline-flex items-center gap-1 font-medium"
            >
              <span>Midnight Preprod Explorer</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <span>Powered by Midnight Zero-Knowledge Technology</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
