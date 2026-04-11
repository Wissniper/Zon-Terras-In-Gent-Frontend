/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface TimeContextValue {
  selectedTime: string; // ISO string
  setSelectedTime: (iso: string) => void;
}

const TimeContext = createContext<TimeContextValue | null>(null);

export function TimeProvider({ children }: { children: ReactNode }) {
  const [selectedTime, setSelectedTime] = useState(() => new Date().toISOString());

  return (
    <TimeContext.Provider value={{ selectedTime, setSelectedTime }}>
      {children}
    </TimeContext.Provider>
  );
}

export function useSelectedTime(): TimeContextValue {
  const ctx = useContext(TimeContext);
  if (!ctx) throw new Error('useSelectedTime must be used inside TimeProvider');
  return ctx;
}
