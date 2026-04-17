import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useSelectedTime } from '../contexts/TimeContext';

export default function NavBar() {
  const { selectedTime } = useSelectedTime();
  const [open, setOpen] = useState(false);

  const formatted = new Date(selectedTime).toLocaleString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <nav className="bg-surface border-b border-surface-3 px-5 sticky top-0 z-50 shadow-soft">
      <div className="flex items-center justify-between h-14">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#F5A623' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            </div>
            <span className="font-semibold text-text-1 tracking-tight">Sun Seeker</span>
          </Link>

          <div className="hidden md:flex items-center gap-0.5">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-primary-light text-primary' : 'text-text-2 hover:text-text-1 hover:bg-surface-2'
                }`
              }
            >
              Map
            </NavLink>
            <NavLink
              to="/search"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-primary-light text-primary' : 'text-text-2 hover:text-text-1 hover:bg-surface-2'
                }`
              }
            >
              Search
            </NavLink>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-xs text-text-2 font-medium bg-surface-2 px-3 py-1.5 rounded-full">
            {formatted}
          </span>
          <button
            className="md:hidden p-2 rounded-lg hover:bg-surface-2 transition-colors text-text-2"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {open ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden pb-3 pt-2 border-t border-surface-3 flex flex-col gap-1">
          <NavLink
            to="/"
            end
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `px-3 py-2 rounded-lg text-sm font-medium ${isActive ? 'bg-primary-light text-primary' : 'text-text-2'}`
            }
          >
            Map
          </NavLink>
          <NavLink
            to="/search"
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `px-3 py-2 rounded-lg text-sm font-medium ${isActive ? 'bg-primary-light text-primary' : 'text-text-2'}`
            }
          >
            Search
          </NavLink>
          <p className="px-3 pt-1 text-xs text-text-3">{formatted}</p>
        </div>
      )}
    </nav>
  );
}
