import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useSelectedTime } from '../contexts/TimeContext';

function SunMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <defs>
        <radialGradient id="nav-sun" cx="35%" cy="35%" r="65%">
          <stop offset="0%"   stopColor="#FFD075" />
          <stop offset="100%" stopColor="#C4502A" />
        </radialGradient>
      </defs>
      <circle cx="12" cy="12" r="6" fill="url(#nav-sun)" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
        const r = (deg * Math.PI) / 180;
        return (
          <line
            key={deg}
            x1={12 + Math.cos(r) * 8.5}  y1={12 + Math.sin(r) * 8.5}
            x2={12 + Math.cos(r) * 11}   y2={12 + Math.sin(r) * 11}
            stroke="#E5870A" strokeWidth="1.6" strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}

export default function NavBar() {
  const { selectedTime } = useSelectedTime();
  const [open, setOpen] = useState(false);

  const formatted = new Date(selectedTime).toLocaleString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <nav
      className="sticky top-0 z-50 px-5 backdrop-blur-md"
      style={{
        background: 'rgba(251,246,236,0.78)',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <div className="flex items-center justify-between h-14 max-w-screen-2xl mx-auto">
        {/* Brand */}
        <div className="flex items-center gap-7">
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <SunMark />
            <span className="font-display font-semibold text-text-1 tracking-tight" style={{ fontSize: '1.0625rem' }}>
              Sun Seeker
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  isActive ? '' : 'text-text-3 hover:text-text-1'
                }`
              }
              style={({ isActive }) => isActive ? {
                color: 'var(--color-primary)',
                background: 'var(--color-primary-light)',
              } : {}}
            >
              Map
            </NavLink>
            <NavLink
              to="/discover"
              className={({ isActive }) =>
                `px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  isActive ? '' : 'text-text-3 hover:text-text-1'
                }`
              }
              style={({ isActive }) => isActive ? {
                color: 'var(--color-primary)',
                background: 'var(--color-primary-light)',
              } : {}}
            >
              Discover
            </NavLink>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          <span
            className="hidden sm:inline-flex items-center text-xs font-medium px-3 py-1.5 rounded-full"
            style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-2)' }}
          >
            {formatted}
          </span>
          <button
            className="md:hidden p-2 rounded-lg transition-colors text-text-2 min-w-[40px] min-h-[40px] flex items-center justify-center"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {open ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden pb-3 pt-2 flex flex-col gap-1 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <NavLink
            to="/"
            end
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `px-3 py-2.5 rounded-lg text-sm font-medium ${isActive ? '' : 'text-text-2'}`
            }
            style={({ isActive }) => isActive ? {
              color: 'var(--color-primary)', background: 'var(--color-primary-light)',
            } : {}}
          >
            Map
          </NavLink>
          <NavLink
            to="/discover"
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `px-3 py-2.5 rounded-lg text-sm font-medium ${isActive ? '' : 'text-text-2'}`
            }
            style={({ isActive }) => isActive ? {
              color: 'var(--color-primary)', background: 'var(--color-primary-light)',
            } : {}}
          >
            Discover
          </NavLink>
          <p className="px-3 pt-2 text-xs text-text-3">{formatted}</p>
        </div>
      )}
    </nav>
  );
}
