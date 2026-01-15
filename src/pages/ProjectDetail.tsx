// src/pages/ProjectDetail.tsx
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../lib/useAuth';
import { useI18n } from '../lib/useI18n';
import { supabase } from '../lib/supabase';

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
  const [showNotes, setShowNotes] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !id) return;
    loadProjectData();
  }, [user, id]);

  const loadProjectData = async () => {
    // Загрузка проекта
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (projectError || !projectData) {
      navigate('/');
      return;
    }

    setProject(projectData);
    setTitle(projectData.title);
    setDescription(projectData.description);

    // Загрузка превью
    if (projectData.preview_path) {
      const { data: signedUrlData } = await supabase.storage
        .from('project-assets')
        .createSignedUrl(projectData.preview_path, 3600);
      if (signedUrlData) {
        setPreviewUrl(signedUrlData.signedUrl);
      }
    }

    // Загрузка этапов
    const { data: tasksData, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', id)
      .order('position', { ascending: true });
    setTasks(tasksData || []);

    // Загрузка заметок
    const { data: notesData } = await supabase
      .from('notes')
      .select('content')
      .eq('project_id', id)
      .single();
    setNotes(notesData?.content || '');
  };

  const handleSaveProject = async () => {
    const { error } = await supabase
      .from('projects')
      .update({ 
        title, 
        description, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', id);

    if (!error) {
      setProject((prev: any) => ({ ...prev, title, description }));
      alert(t('save_success'));
    }
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

    const { data: newTask, error } = await supabase
      .from('tasks')
      .insert({
        project_id: id,
        title: newTaskTitle.trim(),
        completed: false,
        hours_spent: 0
      })
      .select()
      .single();

    if (!error && newTask) {
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
    await supabase
      .from('notes')
      .upsert(
        { project_id: id, content: notes },
        { onConflict: 'project_id' }
      );
    setShowNotes(false);
  };

  const progress = tasks.length
    ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100)
    : 0;

  if (!project) return <div>{t('loading')}...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h1 style={{ margin: 0 }}>{title}</h1>
        <span style={{ fontSize: '14px', color: '#666', fontWeight: 'bold' }}>{progress}%</span>
      </div>

      <textarea
        value={description}
        onChange={e => setDescription(e.target.value)}
        placeholder={t('description')}
        rows={3}
        style={{ width: '100%', padding: '8px', marginBottom: '16px', fontSize: '16px', border: '1px solid #ccc', borderRadius: '4px' }}
      />

      {/* Превью — ограничено по высоте */}
      {previewUrl && (
        <div style={{ marginBottom: '16px', textAlign: 'center' }}>
          {previewUrl.endsWith('.mp4') ? (
            <video
              src={previewUrl}
              controls
              style={{
                maxWidth: '100%',
                maxHeight: '300px',
                width: 'auto',
                height: 'auto',
                borderRadius: '4px'
              }}
            />
          ) : (
            <img
              src={previewUrl}
              alt="Preview"
              style={{
                maxWidth: '100%',
                maxHeight: '300px',
                width: 'auto',
                height: 'auto',
                borderRadius: '4px'
              }}
            />
          )}
        </div>
      )}

      <button
        onClick={() => document.getElementById('preview-input')?.click()}
        style={{
          marginBottom: '16px',
          padding: '8px 12px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        {t('upload_preview')}
      </button>
      <input
        id="preview-input"
        type="file"
        accept="image/*,video/mp4,.gif"
        onChange={handleUploadPreview}
        style={{ display: 'none' }}
      />

      <h3 style={{ marginBottom: '8px' }}>
        {t('tasks')} ({tasks.filter(t => t.completed).length}/{tasks.length})
      </h3>
      <div style={{ marginBottom: '16px' }}>
        {tasks.map(task => (
          <div key={task.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <input
              type="checkbox"
              checked={task.completed}
              onChange={e => handleToggleTask(task.id, e.target.checked)}
              style={{ marginRight: '8px', transform: 'scale(1.2)' }}
            />
            <span style={{ flex: 1, fontSize: '16px' }}>{task.title}</span>
            <input
              type="number"
              step="0.25"
              min="0"
              value={task.hours_spent}
              onChange={e => handleUpdateHours(task.id, e.target.value)}
              placeholder="0"
              style={{ width: '80px', padding: '4px', fontSize: '14px', textAlign: 'right' }}
            />
            <span style={{ marginLeft: '4px', fontSize: '14px', color: '#555' }}>{t('hours_spent')}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <input
          value={newTaskTitle}
          onChange={e => setNewTaskTitle(e.target.value)}
          placeholder={t('task_title')}
          style={{ flex: 1, padding: '8px', fontSize: '16px', border: '1px solid #ccc', borderRadius: '4px' }}
        />
        <button
          onClick={handleAddTask}
          disabled={!newTaskTitle.trim()}
          style={{
            padding: '8px 16px',
            backgroundColor: newTaskTitle.trim() ? '#28a745' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: newTaskTitle.trim() ? 'pointer' : 'not-allowed'
          }}
        >
          +
        </button>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={() => setShowNotes(true)}
          style={{
            padding: '8px 16px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {t('notes')}
        </button>
      </div>

      {showNotes && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ marginTop: 0 }}>{t('notes')}</h3>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder={t('notes_placeholder')}
              rows={10}
              style={{ width: '100%', padding: '8px', fontSize: '16px', marginBottom: '12px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => setShowNotes(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleSaveNotes}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                {t('save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Кнопки: На главную + Сохранить */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '10px 16px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
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
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {t('save')}
        </button>
      </div>
    </div>
  );
}
