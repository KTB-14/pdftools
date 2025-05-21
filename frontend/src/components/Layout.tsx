import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';

const Layout: React.FC = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className={`py-6 ${isHomePage ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 shadow-sm'}`}>
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <Link to="/" className="text-2xl font-bold flex items-center gap-2">
              <span className="text-4xl">📑</span> PDFTools
            </Link>
            {!isHomePage && (
              <Link to="/" className="flex items-center text-sm font-medium hover:underline">
                <span className="mr-1">←</span> Retour à l'accueil
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-grow">
        <Outlet />
      </main>

      <footer className="py-4 bg-gray-800 text-gray-300">
        <div className="container mx-auto px-4 text-center">
          <small>© PDFTools by KTB-14 – Tous droits réservés</small>
        </div>
      </footer>
    </div>
  );
};

export default Layout;