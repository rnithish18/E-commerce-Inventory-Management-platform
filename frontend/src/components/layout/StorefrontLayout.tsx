import React from 'react';
import { Outlet } from 'react-router-dom';
import { Topbar } from './Topbar';
import { Sidebar } from './Sidebar';
import { RightPanel } from './RightPanel';

interface Props {
  showRightPanel?: boolean;
}

export function StorefrontLayout({ showRightPanel = true }: Props) {
  return (
    <div className="min-h-screen bg-navy-900 text-gray-100 flex flex-col font-sans">
      <Topbar />
      
      <div className="flex-1 flex max-w-[1720px] w-full mx-auto">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Center Main Content Area */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>

        {/* Right Info & Tracking Panel */}
        {showRightPanel && <RightPanel />}
      </div>

      {/* Storefront Footer Disclaimer */}
      <footer className="w-full border-t border-navy-800 bg-navy-950/80 py-4 px-6 text-center text-xs text-gray-500">
        <p>ShopNest is a demonstration store. Brand names and product images belong to their respective owners.</p>
      </footer>
    </div>
  );
}
