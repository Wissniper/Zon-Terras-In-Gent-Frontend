import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import NavBar from './components/NavBar';
import OfflineIndicator from './components/OfflineIndicator';
import MapPage from './pages/MapPage';
import TerrasDetailPage from './pages/TerrasDetailPage';
import RestaurantDetailPage from './pages/RestaurantDetailPage';
import EventDetailPage from './pages/EventDetailPage';
import SearchPage from './pages/SearchPage';

/**
 * Layout: a single sticky top NavBar + full-bleed content area.
 *
 * The previous left-rail Sidebar has been removed: its content (weather, top-N
 * sunny terraces) now lives inside MapPage as floating panels — that's the
 * actual context where it's useful — and the sidebar's nav links collapsed
 * into the top NavBar.
 */
function Layout() {
  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: 'var(--color-bg)' }}>
      <NavBar />
      <main className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
        <Routes>
          <Route path="/"            element={<MapPage />} />
          <Route path="/terrasen/:id"    element={<TerrasDetailPage />} />
          <Route path="/restaurants/:id" element={<RestaurantDetailPage />} />
          <Route path="/events/:id"      element={<EventDetailPage />} />
          <Route path="/discover"        element={<SearchPage />} />
          <Route path="/search"          element={<Navigate to="/discover" replace />} />
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
