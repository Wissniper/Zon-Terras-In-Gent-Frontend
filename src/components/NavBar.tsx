import { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';

function useTheme() {
  const [dark, setDark] = useState(() =>
    document.documentElement.getAttribute('data-theme') === 'dark',
  );
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);
  return { dark, toggle: () => setDark((d) => !d) };
}

function SunMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <defs>
        <radialGradient id="nav-sun-mark" cx="35%" cy="35%" r="65%">
          <stop offset="0%"   stopColor="#FFD075" />
          <stop offset="100%" stopColor="#C4502A" />
        </radialGradient>
      </defs>
      <circle cx="12" cy="12" r="6" fill="url(#nav-sun-mark)" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
        const r = (deg * Math.PI) / 180;
        return (
          <line
            key={deg}
            x1={12 + Math.cos(r) * 8.5}  y1={12 + Math.sin(r) * 8.5}
            x2={12 + Math.cos(r) * 11}   y2={12 + Math.sin(r) * 11}
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
            style={{ color: 'var(--color-primary)', opacity: 0.65 }}
          />
        );
      })}
    </svg>
  );
}

export default function NavBar() {
  const [open, setOpen] = useState(false);
  const { dark, toggle } = useTheme();

  return (
    <nav
      className="sticky top-0 z-50 px-5 backdrop-blur-md"
      style={{
        background: 'rgba(250,246,238,0.86)',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <div className="flex items-center justify-between h-14 max-w-screen-2xl mx-auto">
        <div className="flex items-center gap-7">
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <SunMark />
            <span className="font-display font-semibold text-text-1 tracking-tight" style={{ fontSize: '1.1rem' }}>
              Sun Seeker
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            <NavLink
              to="/" end
              className={({ isActive }) =>
                `px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  isActive ? '' : 'text-text-3 hover:text-text-1'
                }`
              }
              style={({ isActive }) => isActive ? { color: 'var(--color-primary)', background: 'var(--color-primary-light)' } : {}}
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
              style={({ isActive }) => isActive ? { color: 'var(--color-primary)', background: 'var(--color-primary-light)' } : {}}
            >
              Discover
            </NavLink>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            className="p-2 rounded-lg transition-colors text-text-3 hover:text-text-1 min-w-[40px] min-h-[40px] flex items-center justify-center"
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {dark ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4.5" />
                {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
                  const r = (deg * Math.PI) / 180;
                  return <line key={deg} x1={12 + Math.cos(r) * 7} y1={12 + Math.sin(r) * 7} x2={12 + Math.cos(r) * 9.5} y2={12 + Math.sin(r) * 9.5} />;
                })}
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>

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

      {open && (
        <div className="md:hidden pb-3 pt-2 flex flex-col gap-1 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <NavLink
            to="/" end onClick={() => setOpen(false)}
            className={({ isActive }) => `px-3 py-2.5 rounded-lg text-sm font-medium ${isActive ? '' : 'text-text-2'}`}
            style={({ isActive }) => isActive ? { color: 'var(--color-primary)', background: 'var(--color-primary-light)' } : {}}
          >
            Map
          </NavLink>
          <NavLink
            to="/discover" onClick={() => setOpen(false)}
            className={({ isActive }) => `px-3 py-2.5 rounded-lg text-sm font-medium ${isActive ? '' : 'text-text-2'}`}
            style={({ isActive }) => isActive ? { color: 'var(--color-primary)', background: 'var(--color-primary-light)' } : {}}
          >
            Discover
          </NavLink>
        </div>
      )}
    </nav>
  );
}
