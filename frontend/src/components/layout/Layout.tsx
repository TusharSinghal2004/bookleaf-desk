import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';

export const Layout: React.FC = () => {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <Navbar />
      <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div key={location.pathname} className="animate-slide-up w-full">
          <Outlet />
        </div>
      </main>
      <footer className="bg-black border-t border-neutral-900 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-neutral-500">
          BookLeaf Publishing Author Support & Communication Portal · Production Submission
        </div>
      </footer>
    </div>
  );
};
