import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { FilterProvider } from './contexts/FilterContext'
import { TimeProvider } from './contexts/TimeContext'
import { MapProvider } from './contexts/MapContext'
import { SocketProvider } from './contexts/SocketContext'
import './index.css'
import App from './App.tsx'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (i) => Math.min(1000 * 2 ** i, 30_000),
      staleTime: 60 * 1000,
      refetchOnWindowFocus: true,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <SocketProvider>
        <FilterProvider>
          <TimeProvider>
            <MapProvider>
              <App />
            </MapProvider>
          </TimeProvider>
        </FilterProvider>
      </SocketProvider>
    </QueryClientProvider>
  </StrictMode>,
)
