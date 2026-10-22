import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export const Layout: React.FC = () => {
  const [mobileNav, setMobileNav] = useState(false);

  return (
    <div className="min-h-screen bg-[#eef2f7] text-slate-900 flex">
      <Sidebar open={mobileNav} onClose={() => setMobileNav(false)} />
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Header onMenu={() => setMobileNav(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-[1400px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
