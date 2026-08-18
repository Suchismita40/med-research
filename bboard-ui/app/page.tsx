'use client';

import dynamic from 'next/dynamic';

const MainDashboard = dynamic(() => import('./MainDashboard'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-surface-bg flex items-center justify-center">
      <div className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-white border border-surface-border shadow-subtle">
        <div className="w-5 h-5 rounded-full border-2 border-olive-800 border-t-transparent animate-spin"></div>
        <span className="text-sm font-semibold text-olive-900">Initializing Midnight Prover Engine...</span>
      </div>
    </div>
  ),
});

export default function Page() {
  return <MainDashboard />;
}
