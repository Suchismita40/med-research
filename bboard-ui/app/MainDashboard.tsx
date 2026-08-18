'use client';

import React from 'react';
import { Header } from './components/Header';
import { HeroBanner } from './components/HeroBanner';
import { DatasetWorkspace } from './components/DatasetWorkspace';
import { AccessWorkflowStepper } from './components/AccessWorkflowStepper';
import { PrivacyCenter } from './components/PrivacyCenter';
import { AnalyticsView } from './components/AnalyticsView';
import { DocumentationView } from './components/DocumentationView';
import { useDeployedBoardContext } from '../src/hooks/useDeployedBoardContext';
import { Shield, ExternalLink } from 'lucide-react';

export default function MainDashboard() {
  const { state: boardState } = useDeployedBoardContext();
  const [activeTab, setActiveTab] = React.useState('overview');

  return (
    <div className="min-h-screen flex flex-col bg-surface-bg text-primaryText">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-grow">
        {activeTab === 'overview' && (
          <div className="space-y-12">
            <HeroBanner
              onExploreDatasets={() => setActiveTab('datasets')}
              onExplorePrivacy={() => setActiveTab('privacy')}
              boardState={boardState}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-12">
              <DatasetWorkspace boardState={boardState} />
              <AccessWorkflowStepper boardState={boardState} />
              <PrivacyCenter />
            </div>
          </div>
        )}

        {activeTab === 'datasets' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <DatasetWorkspace boardState={boardState} />
          </div>
        )}

        {activeTab === 'stepper' && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <AccessWorkflowStepper boardState={boardState} />
          </div>
        )}

        {activeTab === 'privacy' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <PrivacyCenter />
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <AnalyticsView boardState={boardState} />
          </div>
        )}

        {activeTab === 'docs' && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <DocumentationView />
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-surface-border py-8 text-xs text-mutedText">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-medium text-olive-900">
            <Shield className="w-4 h-4 text-olive-700" />
            <span>MedEx Private Medical Research Data Exchange</span>
          </div>

          <div className="flex items-center gap-6">
            <a
              href="https://preprod.midnight-explorer.com"
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
