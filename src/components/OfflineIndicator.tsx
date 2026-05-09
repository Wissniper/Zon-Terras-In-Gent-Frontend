import { useSocket } from '../contexts/SocketContext';

interface OfflineIndicatorProps {
  queryError?: boolean;
}

export default function OfflineIndicator({ queryError = false }: OfflineIndicatorProps) {
  const { isConnected } = useSocket();
  const isOffline = !isConnected || queryError;

  if (!isOffline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-medium fade-up"
      style={{
        background: 'var(--color-surface)',
        color: 'var(--color-text-1)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-float)',
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: 'var(--color-terra)', animation: 'sun-pulse 2s ease-in-out infinite' }}
      />
      {!isConnected ? 'Live updates unavailable' : 'Failed to load data'}
    </div>
  );
}
