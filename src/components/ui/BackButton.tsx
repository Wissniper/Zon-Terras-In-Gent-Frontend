import { useNavigate } from 'react-router-dom';

interface Props {
  /** Optional fallback path if there's nothing to go back to. */
  fallback?: string;
  label?: string;
}

export default function BackButton({ fallback = '/', label = 'Back' }: Props) {
  const navigate = useNavigate();
  const onBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate(fallback);
  };
  return (
    <button
      onClick={onBack}
      className="inline-flex items-center gap-2 text-sm font-medium px-3 py-2 -ml-3 rounded-lg transition-colors min-h-[44px]"
      style={{ color: 'var(--color-text-3)' }}
      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text-1)')}
      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-3)')}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
        <polyline points="15 18 9 12 15 6" />
      </svg>
      {label}
    </button>
  );
}
