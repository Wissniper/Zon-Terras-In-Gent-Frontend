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
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50
                 bg-surface text-text-1 text-xs font-medium shadow-float
                 px-4 py-2 rounded-full border border-surface-3"
    >
      {!isConnected ? 'Live updates unavailable' : 'Failed to load data'}
    </div>
  );
}
