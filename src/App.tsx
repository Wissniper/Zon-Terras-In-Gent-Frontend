import { BrowserRouter, Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import MapPage from './pages/MapPage';
import TerrasDetailPage from './pages/TerrasDetailPage';
import RestaurantDetailPage from './pages/RestaurantDetailPage';
import EventDetailPage from './pages/EventDetailPage';
import SearchPage from './pages/SearchPage';

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen">
        <NavBar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<MapPage />} />
            <Route path="/terrasen/:id" element={<TerrasDetailPage />} />
            <Route path="/restaurants/:id" element={<RestaurantDetailPage />} />
            <Route path="/events/:id" element={<EventDetailPage />} />
            <Route path="/search" element={<SearchPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
