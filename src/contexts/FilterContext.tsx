import { createContext, useContext, useState, ReactNode } from 'react';

interface FilterState {
  sunnyOnly: boolean;
  minIntensity: number;
  cuisine: string;
  query: string;
}

interface FilterContextValue extends FilterState {
  setSunnyOnly: (val: boolean) => void;
  setMinIntensity: (val: number) => void;
  setCuisine: (val: string) => void;
  setQuery: (val: string) => void;
}

const FilterContext = createContext<FilterContextValue | null>(null);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [sunnyOnly, setSunnyOnly] = useState(false);
  const [minIntensity, setMinIntensity] = useState(0);
  const [cuisine, setCuisine] = useState('');
  const [query, setQuery] = useState('');

  return (
    <FilterContext.Provider
      value={{ sunnyOnly, setSunnyOnly, minIntensity, setMinIntensity, cuisine, setCuisine, query, setQuery }}
    >
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters(): FilterContextValue {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error('useFilters must be used inside FilterProvider');
  return ctx;
}
