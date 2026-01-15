import { useI18n } from '../lib/useI18n';
import { useAuth } from '../lib/useAuth';
import { useEffect } from 'react';

export default function Dashboard() {
  const { t } = useI18n();
  const { logout } = useAuth();

  return (
    <div>
      <h1>{t('projects')}</h1>
      <button
        onClick={() => logout()}
        style={{
          marginTop: '16px',
          padding: '8px 16px',
          backgroundColor: '#dc3545',
          color: 'white',
          border: 'none',
          borderRadius: '4px'
        }}
      >
        Logout
      </button>
    </div>
  );
}
