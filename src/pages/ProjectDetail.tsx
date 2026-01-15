// src/pages/ProjectDetail.tsx
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../lib/useAuth';
import { useI18n } from '../lib/useI18n';
import { supabase } from '../lib/supabase';

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { t } = useI18n();
  const [project, setProject] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !id) return;
    loadProject();
  }, [user, id]);

  const loadProject = async () => {
    const {  data } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();
    if (data) {
      setProject(data);
      setTitle(data.title);
      setDescription(data.description);
    } else {
      navigate('/');
    }
  };

  const handleSave = async () => {
    await supabase
      .from('projects')
      .update({ title, description, updated_at: new Date().toISOString() })
      .eq('id', id);
    alert(t('save_success'));
  };

  if (!project) return <div>{t('loading')}...</div>;

  return (
    <div>
      <h1>{t('project')}</h1>
      <input
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder={t('title')}
        style={{ width: '100%', padding: '8px', marginBottom: '12px', fontSize: '16px' }}
      />
      <textarea
        value={description}
        onChange={e => setDescription(e.target.value)}
        placeholder={t('description')}
        rows={4}
        style={{ width: '100%', padding: '8px', marginBottom: '12px', fontSize: '16px' }}
      />
      <button
        onClick={handleSave}
        style={{
          padding: '10px 16px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        {t('save')}
      </button>
      <button
        onClick={() => navigate('/')}
        style={{
          marginLeft: '12px',
          padding: '10px 16px',
          backgroundColor: '#6c757d',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        {t('cancel')}
      </button>
    </div>
  );
}
