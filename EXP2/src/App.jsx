import { useEffect, useMemo, useState } from 'react';
import { createDraft, removeDraft, upsertDraft } from './draftUtils';
import './index.css';

const STORAGE_KEY = 'draft-manager-drafts';

const loadDrafts = () => {
  if (typeof window === 'undefined') return [];
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) return [];

  try {
    return JSON.parse(saved);
  } catch {
    return [];
  }
};

const saveDrafts = (drafts) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
};

const emptyForm = { title: '', content: '' };

function App() {
  const [drafts, setDrafts] = useState(loadDrafts);
  const [form, setForm] = useState(emptyForm);
  const [selectedId, setSelectedId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('Drafts are stored locally in your browser.');

  useEffect(() => {
    saveDrafts(drafts);
  }, [drafts]);

  const selectedDraft = useMemo(() => drafts.find((draft) => draft.id === selectedId) ?? null, [drafts, selectedId]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.title.trim() && !form.content.trim()) {
      setMessage('Please enter a title or content before saving.');
      return;
    }

    setIsSaving(true);
    setMessage('Saving draft...');

    await new Promise((resolve) => setTimeout(resolve, 400));

    const draft = selectedDraft
      ? { ...selectedDraft, title: form.title.trim(), content: form.content.trim(), updatedAt: new Date().toISOString() }
      : createDraft(form.title.trim(), form.content.trim());

    setDrafts((current) => upsertDraft(current, draft));
    setSelectedId(draft.id);
    setForm(emptyForm);
    setMessage('Draft saved successfully.');
    setIsSaving(false);
  };

  const handleEdit = (draft) => {
    setSelectedId(draft.id);
    setForm({ title: draft.title, content: draft.content });
    setMessage('Editing existing draft.');
  };

  const handleDelete = (id) => {
    const nextDrafts = removeDraft(drafts, id);
    setDrafts(nextDrafts);
    if (selectedId === id) {
      setSelectedId(null);
      setForm(emptyForm);
    }
    setMessage('Draft deleted.');
  };

  const handleNew = () => {
    setSelectedId(null);
    setForm(emptyForm);
    setMessage('Started a new draft.');
  };

  return (
    <div className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Frontend draft workspace</p>
          <h1>Draft management system</h1>
          <p className="subtext">Create, edit, and manage your post drafts with local storage and async feedback.</p>
        </div>
      </header>

      <main className="content-grid">
        <section className="panel form-panel">
          <div className="panel-header">
            <h2>{selectedDraft ? 'Edit draft' : 'Create draft'}</h2>
            <button type="button" className="secondary-btn" onClick={handleNew}>New draft</button>
          </div>

          <form onSubmit={handleSubmit} className="draft-form">
            <label>
              <span>Title</span>
              <input
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="Post title"
              />
            </label>

            <label>
              <span>Content</span>
              <textarea
                rows="8"
                value={form.content}
                onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))}
                placeholder="Write your draft here..."
              />
            </label>

            <div className="actions">
              <button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save draft'}</button>
            </div>
          </form>

          <p className="message" role="status">{message}</p>
        </section>

        <section className="panel list-panel">
          <div className="panel-header">
            <h2>Saved drafts</h2>
            <span className="pill">{drafts.length}</span>
          </div>

          {drafts.length === 0 ? (
            <p className="empty">No drafts yet. Start writing to add your first one.</p>
          ) : (
            <ul className="draft-list">
              {drafts.map((draft) => (
                <li key={draft.id} className="draft-card">
                  <div>
                    <h3>{draft.title || 'Untitled draft'}</h3>
                    <p>{draft.content || 'No content added yet.'}</p>
                    <small>Updated {new Date(draft.updatedAt).toLocaleString()}</small>
                  </div>
                  <div className="card-actions">
                    <button type="button" className="secondary-btn" onClick={() => handleEdit(draft)}>Edit</button>
                    <button type="button" className="danger-btn" onClick={() => handleDelete(draft.id)}>Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
