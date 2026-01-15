// src/pages/Dashboard.tsx
import { useEffect, useState } from 'react';
import { useAuth } from '../lib/useAuth';
import { useI18n } from '../lib/useI18n';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    fetchProjects();
  }, [user]);

  const fetchProjects = async () => {
    const {  data } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setProjects(data || []);
    setLoading(false);
  };

  const handleCreate = async () => {
    const {  data } = await supabase
      .from('projects')
      .insert({ user_id: user.id, title: t('new_project'), description: '' })
      .select()
      .single();
    navigate(`/project/${data.id}`);
  };

  if (loading) return <div>{t('loading')}...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h1>{t('projects')}</h1>
        <button
          onClick={handleCreate}
          style={{
            padding: '8px 16px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          + {t('new_project')}
        </button>
      </div>

      {projects.length === 0 ? (
        <p>{t('no_projects_yet')}</p>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {projects.map(project => (
            <div
              key={project.id}
              onClick={() => navigate(`/project/${project.id}`)}
              style={{
                padding: '16px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                cursor: 'pointer',
                background: '#fafafa'
              }}
            >
              <h3 style={{ margin: '0 0 8px 0' }}>{project.title}</h3>
              <p style={{ fontSize: '14px', color: '#555', margin: '0' }}>
                {project.description.substring(0, 100)}{project.description.length > 100 ? '...' : ''}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
