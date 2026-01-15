import { useState } from 'react';
import { useAuth } from '../lib/useAuth';
import { useI18n } from '../lib/useI18n';
import { useNavigate } from 'react-router-dom';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { signup } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await signup(email, password);
      alert('Account created! Please check email if confirmation is enabled.');
      navigate('/login');
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '400px', margin: '0 auto' }}>
      <h2>{t('signup')}</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <div style={{ marginBottom: '12px' }}>
        <input
          type="email"
          placeholder={t('email')}
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          style={{ width: '100%', padding: '8px', fontSize: '16px' }}
        />
      </div>
      <div style={{ marginBottom: '12px' }}>
        <input
          type="password"
          placeholder={t('password')}
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          style={{ width: '100%', padding: '8px', fontSize: '16px' }}
        />
      </div>
      <button
        type="submit"
        style={{
          width: '100%',
          padding: '10px',
          backgroundColor: '#28a745',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          fontSize: '16px'
        }}
      >
        {t('signup')}
      </button>
      <p style={{ textAlign: 'center', marginTop: '16px' }}>
        <a href="/login">{t('login')}</a>
      </p>
    </form>
  );
}
