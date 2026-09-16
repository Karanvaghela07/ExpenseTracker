import { PackageOpen } from 'lucide-react';

const EmptyState = ({ icon: Icon = PackageOpen, message, actionLabel, onAction }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '64px 24px',
      textAlign: 'center',
      animation: 'fadeIn 400ms ease-out',
    }}>
      <div style={{
        width: 72,
        height: 72,
        borderRadius: 'var(--radius-lg)',
        background: 'var(--accent-gradient-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
      }}>
        <Icon size={32} style={{ color: 'var(--text-accent)' }} />
      </div>
      <p style={{
        fontSize: 'var(--text-sm)',
        color: 'var(--text-secondary)',
        maxWidth: 320,
        lineHeight: 1.6,
        marginBottom: actionLabel ? 20 : 0,
      }}>
        {message}
      </p>
      {actionLabel && onAction && (
        <button className="btn btn-primary btn-sm" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
