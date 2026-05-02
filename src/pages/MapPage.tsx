import { Suspense, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { CityTiles } from '../components/CityTiles';
import { Sky, OrbitControls } from '@react-three/drei';
import { useSelectedTime } from '../contexts/TimeContext';
import { useWeatherData } from '../hooks/useWeatherData';

const TOTAL_MINUTES = 48 * 60 - 1;

function skyIntensity(hour: number): number {
  if (hour < 5.5 || hour > 21.5) return 0;
  const peak = 13;
  const halfSpan = 8;
  return Math.max(0, Math.round(100 - ((hour - peak) / halfSpan) ** 2 * 100));
}

function SunTimeline() {
  const { selectedTime, setSelectedTime } = useSelectedTime();
  const { data: weather } = useWeatherData();

  const todayMidnight = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, []);

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
      const color = sky > 60 ? '#F5AC32' : sky > 30 ? '#F5DFA0' : sky > 5 ? '#D4C4A8' : '#2A2018';
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
    <div className="shrink-0 px-6 py-4" style={{ background: '#150F08', borderTop: '1px solid #2E1E0A' }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium uppercase tracking-label" style={{ color: '#7A6048', letterSpacing: '0.12em' }}>
          Sun Timeline
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: '#7A6048' }}>{displayDay}</span>
          <span className="text-sm font-semibold tabular-nums" style={{ color: '#E8C98A' }}>{displayTime}</span>
        </div>
      </div>

      <div className="relative">
        <div
          className="absolute inset-y-0 left-0 right-0 my-auto rounded-full pointer-events-none"
          style={{ height: 8, background: gradient, top: '50%', transform: 'translateY(-50%)', opacity: 0.7 }}
        />
        <div
          className="absolute my-auto rounded-l-full pointer-events-none"
          style={{
            height: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            left: 0,
            width: `${thumbPct}%`,
            background: 'linear-gradient(to right, #7A5010, #E5870A)',
            opacity: 0.9,
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

      <div className="relative mt-2" style={{ height: 16 }}>
        {marks.map((m) => (
          <span
            key={m.pct}
            className="absolute text-center pointer-events-none"
            style={{
              left: `${m.pct}%`,
              transform: 'translateX(-50%)',
              fontSize: m.isDayBoundary ? 10 : 9,
              fontWeight: m.isDayBoundary ? 600 : 400,
              color: m.isDayBoundary ? '#9B8570' : '#5A4030',
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

function SunTimelineVertical() {
  const { selectedTime, setSelectedTime } = useSelectedTime();
  const { data: weather } = useWeatherData();

  const todayMidnight = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, []);

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
      const color = sky > 60 ? '#F5AC32' : sky > 30 ? '#F5DFA0' : sky > 5 ? '#D4C4A8' : '#2A2018';
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
    <div className="flex flex-1 min-h-0 px-2 py-3 gap-1 select-none" style={{ background: '#150F08' }}>
      <div className="relative flex justify-center w-7 flex-shrink-0 self-stretch">
        <div
          className="absolute rounded-full pointer-events-none"
          style={{ width: 6, top: 0, bottom: 0, left: '50%', transform: 'translateX(-50%)', background: gradient, opacity: 0.7 }}
        />
        <div
          className="absolute rounded-t-full pointer-events-none"
          style={{
            width: 6, top: 0, height: `${thumbPct}%`,
            left: '50%', transform: 'translateX(-50%)',
            background: 'linear-gradient(to bottom, #7A5010, #E5870A)', opacity: 0.9,
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
              fontWeight: m.isDayBoundary ? 600 : 400,
              color: m.isDayBoundary ? '#9B8570' : '#5A4030',
            }}
          >
            {m.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function Legend() {
  return (
    <div className="rounded-2xl p-4 w-44" style={{ background: 'rgba(21,15,8,0.88)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}>
      <p className="text-xs font-medium uppercase tracking-label mb-3" style={{ color: '#7A6048', letterSpacing: '0.12em' }}>
        Sun Intensity
      </p>
      <div
        className="h-2 rounded-full mb-2"
        style={{ background: 'linear-gradient(to right, #3A2A18, #F5DFA0, #E5870A)' }}
      />
      <div className="flex justify-between text-xs mb-4" style={{ color: '#7A6048' }}>
        <span>Shade</span>
        <span>Full sun</span>
      </div>
      <div className="space-y-2">
        {[
          { color: '#E5870A', label: '70%+  Full sun' },
          { color: '#F5AC32', label: '40%+  Partial' },
          { color: '#5A4030', label: 'Below 40%' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
            <span className="text-xs" style={{ color: '#9B8570' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MapPage() {
  const [timelineOpen, setTimelineOpen] = useState(false);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 relative overflow-hidden">
        <Canvas
          shadows
          camera={{ position: [0, 1500, 1500], fov: 50, far: 15000, near: 1 }}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        >
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
          <OrbitControls />
          <Suspense fallback={null}>
            <CityTiles />
          </Suspense>
        </Canvas>

        {/* Legend — desktop right */}
        <div className="absolute top-4 right-4 z-10 hidden md:block fade-up fade-up-delay-1">
          <Legend />
        </div>

        {/* Mobile timeline toggle */}
        <button
          className="md:hidden absolute bottom-4 right-4 z-20 w-12 h-12 rounded-full flex items-center justify-center shadow-amber transition-transform hover:scale-105 active:scale-95"
          style={{ background: 'linear-gradient(135deg, #E5870A, #C46010)', color: '#FFF' }}
          onClick={() => setTimelineOpen(true)}
          aria-label="Open sun timeline"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </button>

        {/* Mobile timeline overlay */}
        {timelineOpen && (
          <div
            className="md:hidden fixed inset-0 z-40"
            style={{ background: 'rgba(21,15,8,0.5)', backdropFilter: 'blur(2px)' }}
            onClick={() => setTimelineOpen(false)}
          />
        )}
        <div
          className={`md:hidden fixed inset-y-0 right-0 z-50 w-28 shadow-float flex flex-col transition-transform duration-300 ease-in-out ${
            timelineOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          style={{ background: '#150F08', borderLeft: '1px solid #2E1E0A' }}
        >
          <div className="flex justify-end px-2 pt-2">
            <button
              onClick={() => setTimelineOpen(false)}
              className="p-1 rounded-lg transition-colors"
              style={{ color: '#7A6048' }}
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

      {/* Timeline bar — desktop */}
      <div className="hidden md:block">
        <SunTimeline />
      </div>
    </div>
  );
}
