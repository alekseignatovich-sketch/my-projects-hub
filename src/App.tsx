import { BrowserRouter, Routes, Route, Navigate, useEffect } from 'react-router-dom';
import { useAuth } from './lib/useAuth';
import { useI18n } from './lib/useI18n';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import Dashboard from './pages/Dashboard';
import ProjectDetailPage from './pages/ProjectDetail'; // теперь есть файл

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
}

function App() {
  const { user, loading, getPreferredLanguage, updatePreferredLanguage } = useAuth();
  const { lang, setLanguage } = useI18n();

  useEffect(() => {
    if (!loading && user) {
      getPreferredLanguage().then(savedLang => {
        if (savedLang !== lang) {
          setLanguage(savedLang);
        }
      });
    }
  }, [loading, user, getPreferredLanguage, lang, setLanguage]);

  const handleLangChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value as 'en' | 'ru' | 'es';
    setLanguage(newLang);
    if (user) updatePreferredLanguage(newLang);
  };

  return (
    <BrowserRouter>
      <div style={{ padding: '16px', maxWidth: '800px', margin: '0 auto' }}>
        {user && (
          <select value={lang} onChange={handleLangChange} style={{ marginBottom: '16px', fontSize: '16px' }}>
            <option value="en">English</option>
            <option value="ru">Русский</option>
            <option value="es">Español</option>
          </select>
        )}
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/project/:id" element={
            <ProtectedRoute>
              <ProjectDetailPage />
            </ProtectedRoute>
          } />
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
