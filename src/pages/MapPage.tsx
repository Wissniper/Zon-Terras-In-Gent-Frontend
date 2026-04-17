import { Suspense, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Sky } from '@react-three/drei';
import { CityTiles } from '../components/CityTiles';
import { useSelectedTime } from '../contexts/TimeContext';
import { useWeatherData } from '../hooks/useWeatherData';

// ─── Helpers ───────────────────────────────────────────────────────────────

function skyIntensity(hour: number): number {
  if (hour < 5.5 || hour > 21.5) return 0;
  const peak = 13;
  const halfSpan = 8;
  return Math.max(0, Math.round(100 - ((hour - peak) / halfSpan) ** 2 * 100));
}

// ─── Sun Timeline (drag slider, today + tomorrow, full width) ──────────────

function SunTimeline() {
  const { selectedTime, setSelectedTime } = useSelectedTime();
  const { data: weather } = useWeatherData();

  const todayMidnight = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, []);

  const TOTAL_MINUTES = 48 * 60 - 1;
  const selected = new Date(selectedTime);
  const selectedMinutes = Math.round(
    Math.min(TOTAL_MINUTES, Math.max(0, (selected.getTime() - todayMidnight) / 60000))
  );

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const minutes = Number(e.target.value);
    setSelectedTime(new Date(todayMidnight + minutes * 60000).toISOString());
  }

  const cloudFactor = (100 - (weather?.cloudCover ?? 0)) / 100;
  const gradient = useMemo(() => {
    const stops: string[] = [];
    for (let m = 0; m <= TOTAL_MINUTES; m += 60) {
      const h = (m / 60) % 24;
      const sky = skyIntensity(h) * cloudFactor;
      const pct = ((m / TOTAL_MINUTES) * 100).toFixed(1);
      const color = sky > 60 ? '#FDE68A' : sky > 30 ? '#FEF3C7' : sky > 5 ? '#E8F4FF' : '#EDE9E3';
      stops.push(`${color} ${pct}%`);
    }
    return `linear-gradient(to right, ${stops.join(', ')})`;
  }, [cloudFactor]);

  const selectedDate = new Date(todayMidnight + selectedMinutes * 60000);
  const displayTime = selectedDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const displayDay = selectedMinutes < 1440 ? 'Today' : 'Tomorrow';

  const marks = useMemo(() => {
    const result: { label: string; pct: number; isDayBoundary: boolean }[] = [];
    for (let m = 0; m <= TOTAL_MINUTES; m += 180) {
      const h = (m / 60) % 24;
      const day = m < 1440 ? 0 : 1;
      if (m === 0 || m === 1440 || m % 360 === 0) {
        result.push({
          label: day === 0 && m === 0 ? 'Today' : day === 1 && m === 1440 ? 'Tomorrow' : `${String(h).padStart(2, '0')}:00`,
          pct: (m / TOTAL_MINUTES) * 100,
          isDayBoundary: m === 0 || m === 1440,
        });
      } else {
        result.push({
          label: `${String(h).padStart(2, '0')}:00`,
          pct: (m / TOTAL_MINUTES) * 100,
          isDayBoundary: false,
        });
      }
    }
    return result;
  }, []);

  const thumbPct = (selectedMinutes / TOTAL_MINUTES) * 100;

  return (
    <div className="shrink-0 bg-surface border-t border-surface-3 px-6 py-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold uppercase tracking-label text-text-2">Sun Timeline</p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-3">{displayDay}</span>
          <span className="text-sm font-semibold text-text-1 tabular-nums">{displayTime}</span>
        </div>
      </div>

      <div className="relative">
        <div
          className="absolute inset-y-0 left-0 right-0 my-auto rounded-full pointer-events-none"
          style={{ height: 6, background: gradient, top: '50%', transform: 'translateY(-50%)' }}
        />
        <div
          className="absolute my-auto rounded-l-full pointer-events-none"
          style={{
            height: 6,
            top: '50%',
            transform: 'translateY(-50%)',
            left: 0,
            width: `${thumbPct}%`,
            background: 'linear-gradient(to right, #FDE68A, #F5A623)',
            opacity: 0.7,
          }}
        />
        <input
          type="range"
          min={0}
          max={TOTAL_MINUTES}
          step={15}
          value={selectedMinutes}
          onChange={onChange}
          className="sun-slider relative"
          style={{ background: 'transparent' }}
        />
      </div>

      <div className="relative mt-1.5" style={{ height: 16 }}>
        {marks.map((m) => (
          <span
            key={m.pct}
            className="absolute text-center pointer-events-none"
            style={{
              left: `${m.pct}%`,
              transform: 'translateX(-50%)',
              fontSize: m.isDayBoundary ? 10 : 9,
              fontWeight: m.isDayBoundary ? 700 : 400,
              color: m.isDayBoundary ? '#5A5A6E' : '#9B9BAE',
              lineHeight: 1,
            }}
          >
            {m.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Vertical Sun Timeline (mobile right panel) ────────────────────────────

function SunTimelineVertical() {
  const { selectedTime, setSelectedTime } = useSelectedTime();
  const { data: weather } = useWeatherData();

  const todayMidnight = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, []);

  const TOTAL_MINUTES = 48 * 60 - 1;
  const selected = new Date(selectedTime);
  const selectedMinutes = Math.round(
    Math.min(TOTAL_MINUTES, Math.max(0, (selected.getTime() - todayMidnight) / 60000))
  );

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const minutes = Number(e.target.value);
    setSelectedTime(new Date(todayMidnight + minutes * 60000).toISOString());
  }

  const cloudFactor = (100 - (weather?.cloudCover ?? 0)) / 100;
  const gradient = useMemo(() => {
    const stops: string[] = [];
    for (let m = 0; m <= TOTAL_MINUTES; m += 60) {
      const h = (m / 60) % 24;
      const sky = skyIntensity(h) * cloudFactor;
      const pct = ((m / TOTAL_MINUTES) * 100).toFixed(1);
      const color = sky > 60 ? '#FDE68A' : sky > 30 ? '#FEF3C7' : sky > 5 ? '#E8F4FF' : '#EDE9E3';
      stops.push(`${color} ${pct}%`);
    }
    return `linear-gradient(to bottom, ${stops.join(', ')})`;
  }, [cloudFactor]);

  const marks = useMemo(() => {
    const result: { label: string; pct: number; isDayBoundary: boolean }[] = [];
    for (let m = 0; m <= TOTAL_MINUTES; m += 180) {
      const h = (m / 60) % 24;
      const day = m < 1440 ? 0 : 1;
      if (m === 0 || m === 1440 || m % 360 === 0) {
        result.push({
          label: day === 0 && m === 0 ? 'Today' : day === 1 && m === 1440 ? 'Tmrw' : `${String(h).padStart(2, '0')}:00`,
          pct: (m / TOTAL_MINUTES) * 100,
          isDayBoundary: m === 0 || m === 1440,
        });
      } else {
        result.push({
          label: `${String(h).padStart(2, '0')}:00`,
          pct: (m / TOTAL_MINUTES) * 100,
          isDayBoundary: false,
        });
      }
    }
    return result;
  }, []);

  const thumbPct = (selectedMinutes / TOTAL_MINUTES) * 100;

  return (
    <div className="flex flex-1 min-h-0 px-2 py-3 gap-1 select-none">
      <div className="relative flex justify-center w-7 flex-shrink-0 self-stretch">
        <div
          className="absolute rounded-full pointer-events-none"
          style={{ width: 5, top: 0, bottom: 0, left: '50%', transform: 'translateX(-50%)', background: gradient }}
        />
        <div
          className="absolute rounded-t-full pointer-events-none"
          style={{
            width: 5, top: 0, height: `${thumbPct}%`,
            left: '50%', transform: 'translateX(-50%)',
            background: 'linear-gradient(to bottom, #FDE68A, #F5A623)', opacity: 0.8,
          }}
        />
        <input
          type="range"
          min={0}
          max={TOTAL_MINUTES}
          step={15}
          value={selectedMinutes}
          onChange={onChange}
          className="sun-slider absolute"
          style={{
            height: 28,
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%) rotate(-90deg)',
            background: 'transparent', cursor: 'pointer',
            width: 'calc(100vh - 80px)',
          }}
        />
      </div>

      <div className="relative flex-1 self-stretch">
        {marks.map((m) => (
          <span
            key={m.pct}
            className="absolute pointer-events-none leading-none left-1"
            style={{
              top: `${m.pct}%`,
              transform: 'translateY(-50%)',
              fontSize: m.isDayBoundary ? 9 : 8,
              fontWeight: m.isDayBoundary ? 700 : 400,
              color: m.isDayBoundary ? '#5A5A6E' : '#9B9BAE',
            }}
          >
            {m.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Legend ────────────────────────────────────────────────────────────────

function Legend() {
  return (
    <div className="bg-surface rounded-2xl shadow-soft p-4 w-44">
      <p className="text-xs font-bold uppercase tracking-label text-text-2 mb-3">
        Sun Intensity
      </p>
      <div
        className="h-2 rounded-full mb-2"
        style={{ background: 'linear-gradient(to right, #E5E7EB, #FEF3C7, #F5A623)' }}
      />
      <div className="flex justify-between text-xs text-text-3 mb-4">
        <span>Shade</span>
        <span>Full sun</span>
      </div>
      <div className="space-y-2">
        {[
          { color: '#F5A623', label: '70%+  Full sun' },
          { color: '#FBBF24', label: '40%+  Partial' },
          { color: '#D1D5DB', label: 'Below 40%' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
            <span className="text-xs text-text-2">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main MapPage ───────────────────────────────────────────────────────────

export default function MapPage() {
  const [timelineOpen, setTimelineOpen] = useState(false);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Map area */}
      <div className="flex-1 relative overflow-hidden">
        <Canvas shadows camera={{ position: [0, 500, 500], fov: 50 }}>
          <color attach="background" args={['#f0f0f0']} />
          <Sky sunPosition={[100, 20, 100]} />
          <ambientLight intensity={0.7} />
          <directionalLight
            position={[100, 200, 100]}
            intensity={1.5}
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-camera-left={-2000}
            shadow-camera-right={2000}
            shadow-camera-top={2000}
            shadow-camera-bottom={-2000}
          />
          <Suspense fallback={null}>
            <CityTiles />
          </Suspense>
        </Canvas>

        {/* Floating legend — right (desktop) */}
        <div className="absolute top-4 right-4 z-10 hidden md:block">
          <Legend />
        </div>

        {/* Mobile timeline toggle button */}
        <button
          className="md:hidden absolute bottom-4 right-4 z-20 w-11 h-11 rounded-full bg-surface shadow-float flex items-center justify-center text-primary border border-surface-3"
          onClick={() => setTimelineOpen(true)}
          aria-label="Open sun timeline"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </button>

        {/* Mobile timeline right panel */}
        {timelineOpen && (
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/30"
            onClick={() => setTimelineOpen(false)}
          />
        )}
        <div
          className={`md:hidden fixed inset-y-0 right-0 z-50 w-28 bg-surface shadow-float flex flex-col transition-transform duration-300 ease-in-out ${
            timelineOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex justify-end px-2 pt-2">
            <button
              onClick={() => setTimelineOpen(false)}
              className="p-1 rounded-lg hover:bg-surface-2 transition-colors text-text-3"
              aria-label="Close timeline"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <SunTimelineVertical />
        </div>
      </div>

      {/* Timeline — bottom bar on desktop only */}
      <div className="hidden md:block">
        <SunTimeline />
      </div>
    </div>
  );
}
