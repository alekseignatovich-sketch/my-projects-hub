// src/pages/ProjectDetail.tsx
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../lib/useAuth';
import { useI18n } from '../lib/useI18n';
import { supabase } from '../lib/supabase';

// Попытка импорта ИИ
let AI_AVAILABLE = false;
try {
  // @ts-ignore
  const aiModule = await import('../lib/aiAssistant');
  if (aiModule?.getAIResponse) {
    AI_AVAILABLE = true;
  }
} catch (e) {
  console.error('AI module not loaded:', e);
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const [project, setProject] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [notes, setNotes] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !id) return;
    loadProjectData();
  }, [user, id]);

  const loadProjectData = async () => {
    const {  projectData } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!projectData) {
      navigate('/');
      return;
    }

    setProject(projectData);
    setTitle(projectData.title);
    setDescription(projectData.description);

    if (projectData.preview_path) {
      const {  signedUrlData } = await supabase.storage
        .from('project-assets')
        .createSignedUrl(projectData.preview_path, 3600);
      if (signedUrlData?.signedUrl) {
        setPreviewUrl(signedUrlData.signedUrl);
      }
    }

    const {  tasksData } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', id)
      .order('position', { ascending: true });
    setTasks(tasksData || []);

    const {  notesData } = await supabase
      .from('notes')
      .select('content')
      .eq('project_id', id)
      .single();
    setNotes(notesData?.content || '');
  };

  const handleSaveProject = async () => {
    if (!title.trim()) {
      alert(t('project_title_required'));
      return;
    }

    const { error } = await supabase
      .from('projects')
      .update({ 
        title: title.trim(), 
        description: description.trim(),
        updated_at: new Date().toISOString() 
      })
      .eq('id', id);

    if (!error) {
      setProject((prev: any) => ({ ...prev, title: title.trim(), description: description.trim() }));
      alert(t('save_success'));
    }
  };

  const handleDeleteProject = async () => {
    const confirmed = window.confirm(t('confirm_delete_project'));
    if (!confirmed) return;

    if (project.preview_path) {
      await supabase.storage
        .from('project-assets')
        .remove([project.preview_path]);
    }

    await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    navigate('/');
  };

  const handleUploadPreview = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;

    const fileExt = file.name.split('.').pop();
    const filePath = `projects/${id}/preview.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('project-assets')
      .upload(filePath, file, { upsert: true });

    if (!uploadError) {
      await supabase
        .from('projects')
        .update({ preview_path: filePath, updated_at: new Date().toISOString() })
        .eq('id', id);
      loadProjectData();
    }
  };

  const handleAddTask = async () => {
    if (!newTaskTitle.trim() || !id) return;

    const {  newTask } = await supabase
      .from('tasks')
      .insert({
        project_id: id,
        title: newTaskTitle.trim(),
        completed: false,
        hours_spent: 0
      })
      .select()
      .single();

    if (newTask) {
      setTasks([...tasks, newTask]);
      setNewTaskTitle('');
    }
  };

  const handleToggleTask = async (taskId: string, completed: boolean) => {
    await supabase
      .from('tasks')
      .update({ completed })
      .eq('id', taskId);
    setTasks(tasks.map(t => t.id === taskId ? { ...t, completed } : t));
  };

  const handleUpdateHours = async (taskId: string, hoursStr: string) => {
    const hours = parseFloat(hoursStr) || 0;
    await supabase
      .from('tasks')
      .update({ hours_spent: hours })
      .eq('id', taskId);
    setTasks(tasks.map(t => t.id === taskId ? { ...t, hours_spent: hours } : t));
  };

  const handleSaveNotes = async () => {
    if (!id) return;
    const { error } = await supabase
      .from('notes')
      .upsert(
        { 
          project_id: id, 
          content: notes,
          updated_at: new Date().toISOString()
        },
        { 
          onConflict: 'project_id',
          ignoreDuplicates: false 
        }
      );
    if (!error) {
      alert(t('notes_saved'));
    }
  };

  const progress = tasks.length
    ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100)
    : 0;

  if (!project) return <div>{t('loading')}...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h1 style={{ margin: 0, color: '#0f0' }}>{title}</h1>
        <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{progress}%</span>
      </div>

      {/* Отладочная панель */}
      <div style={{ 
        padding: '8px', 
        background: AI_AVAILABLE ? 'rgba(0,255,0,0.2)' : 'rgba(255,0,0,0.2)',
        color: '#0f0',
        borderRadius: '4px',
        marginBottom: '16px'
      }}>
        {AI_AVAILABLE ? '✅ ИИ доступен' : '❌ ИИ недоступен'}
      </div>

      {/* Кнопки ИИ — только если доступен */}
      {AI_AVAILABLE && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
          gap: '8px', 
          marginBottom: '16px' 
        }}>
          <button
            onClick={() => alert('Описание')}
            style={{
              padding: '6px 10px',
              fontSize: '14px',
              backgroundColor: '#6a0dad',
              color: 'white',
              border: 'none',
              borderRadius: '4px'
            }}
          >
            📝 Описание
          </button>
          <button
            onClick={() => alert('Этапы')}
            style={{
              padding: '6px 10px',
              fontSize: '14px',
              backgroundColor: '#6a0dad',
              color: 'white',
              border: 'none',
              borderRadius: '4px'
            }}
          >
            ✅ Этапы
          </button>
        </div>
      )}

      <textarea
        value={description}
        onChange={e => setDescription(e.target.value)}
        placeholder={t('description')}
        rows={3}
        style={{ 
          width: '100%', 
          padding: '8px', 
          marginBottom: '16px', 
          fontSize: '16px', 
          border: '1px solid #0f0', 
          borderRadius: '4px',
          background: 'rgba(0, 20, 0, 0.5)',
          color: '#0f0'
        }}
      />

      {/* ... остальной интерфейс без ИИ ... */}

      <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '10px 16px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          ← {t('back_to_projects')}
        </button>
        <button
          onClick={handleSaveProject}
          style={{
            padding: '10px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          {t('save')}
        </button>
        <button
          onClick={handleDeleteProject}
          style={{
            padding: '10px 16px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          {t('delete_project')}
        </button>
      </div>
    </div>
  );
}
