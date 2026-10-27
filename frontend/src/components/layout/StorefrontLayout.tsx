import React from 'react';
import { Outlet, Link } from 'react-router-dom';
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
        <main id="main-content" tabIndex={-1} className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto focus:outline-none">
          <Outlet />
        </main>

        {/* Right Info & Tracking Panel */}
        {showRightPanel && <RightPanel />}
      </div>

      {/* Storefront Footer Disclaimer */}
      <footer className="w-full border-t border-navy-800 bg-navy-950/80 py-4 px-6 text-center text-xs text-gray-400">
        <p>
          ShopNest is a demonstration store. Brand names and product images belong to their respective owners.
          <span className="mx-2 text-gray-600">•</span>
          <Link to="/image-credits" className="text-orange-400 hover:text-orange-300 underline font-medium">
            Image credits & licensing
          </Link>
        </p>
      </footer>
    </div>
  );
}
