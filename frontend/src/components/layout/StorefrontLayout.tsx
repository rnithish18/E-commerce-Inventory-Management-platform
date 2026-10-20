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
    </div>
  );
}
