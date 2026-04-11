import { Link } from 'react-router-dom';
import { useSelectedTime } from '../contexts/TimeContext';

export default function NavBar() {
  const { selectedTime } = useSelectedTime();

  const formatted = new Date(selectedTime).toLocaleString('nl-BE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <nav className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center gap-6">
        <span className="font-semibold text-lg text-yellow-600">ZonTerras</span>
        <Link to="/" className="text-gray-700 hover:text-yellow-600 transition-colors">
          Map
        </Link>
        <Link to="/search" className="text-gray-700 hover:text-yellow-600 transition-colors">
          Search
        </Link>
      </div>
      <span className="text-sm text-gray-500">{formatted}</span>
    </nav>
  );
}
