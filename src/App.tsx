import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import OfflineIndicator from './components/OfflineIndicator';
import MapPage from './pages/MapPage';
import TerrasDetailPage from './pages/TerrasDetailPage';
import RestaurantDetailPage from './pages/RestaurantDetailPage';
import EventDetailPage from './pages/EventDetailPage';
import SearchPage from './pages/SearchPage';

function MobileHeader({ onOpen }: { onOpen: () => void }) {
  const location = useLocation();
  const title =
    location.pathname === '/' ? 'Map' :
    location.pathname === '/search' ? 'Search' :
    location.pathname.startsWith('/terrasen') ? 'Terrace' :
    location.pathname.startsWith('/restaurants') ? 'Restaurant' :
    location.pathname.startsWith('/events') ? 'Event' : 'Sun Seeker';

  return (
    <header className="md:hidden shrink-0 flex items-center gap-3 px-4 h-12 bg-surface border-b border-surface-3">
      <button
        onClick={onOpen}
        className="p-1.5 rounded-lg hover:bg-surface-2 transition-colors text-text-2"
        aria-label="Open menu"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>
      <span className="text-sm font-semibold text-text-1">{title}</span>
    </header>
  );
}

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  return (
    <div className="flex h-screen bg-bg text-text-primary overflow-hidden">
      {/* Backdrop (mobile only) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — always visible on desktop, slide-in on mobile */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out
          md:static md:translate-x-0 md:z-auto md:transition-none
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <MobileHeader onOpen={() => setSidebarOpen(true)} />
        <Routes>
          <Route path="/" element={<MapPage />} />
          <Route path="/terrasen/:id" element={<TerrasDetailPage />} />
          <Route path="/restaurants/:id" element={<RestaurantDetailPage />} />
          <Route path="/events/:id" element={<EventDetailPage />} />
          <Route path="/search" element={<SearchPage />} />
        </Routes>
      </main>

      <OfflineIndicator />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}
