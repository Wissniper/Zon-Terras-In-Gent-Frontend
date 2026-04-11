import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { FilterProvider } from './contexts/FilterContext'
import { TimeProvider } from './contexts/TimeContext'
import { MapProvider } from './contexts/MapContext'
import './index.css'
import App from './App.tsx'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <FilterProvider>
        <TimeProvider>
          <MapProvider>
            <App />
          </MapProvider>
        </TimeProvider>
      </FilterProvider>
    </QueryClientProvider>
  </StrictMode>,
)
