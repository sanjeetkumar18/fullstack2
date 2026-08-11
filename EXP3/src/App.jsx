import { useEffect, useMemo, useState } from 'react';
import { createDraft, removeDraft, upsertDraft } from './draftUtils';
import {
  createToken,
  getStoredToken,
  saveToken,
  verifyToken,
  clearToken,
  users,
  userDisplayName,
} from './authUtils';
import './index.css';

const STORAGE_KEY = 'exp3-drafts';
const ROLE_PRIORITY = { viewer: 1, editor: 2, admin: 3 };

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
const canPerform = (role, requiredRole) => ROLE_PRIORITY[role] >= ROLE_PRIORITY[requiredRole];

function App() {
  const [drafts, setDrafts] = useState(loadDrafts);
  const [form, setForm] = useState(emptyForm);
  const [selectedId, setSelectedId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('Drafts are stored locally in your browser.');

  const [authUser, setAuthUser] = useState(null);
  const [authRole, setAuthRole] = useState('viewer');
  const [rememberMe, setRememberMe] = useState(false);
  const [authMessage, setAuthMessage] = useState('Sign in to access protected resources.');
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [view, setView] = useState('dashboard');

  useEffect(() => {
    saveDrafts(drafts);
  }, [drafts]);

  useEffect(() => {
    const initAuth = async () => {
      const token = getStoredToken();
      if (!token) return;
      const payload = await verifyToken(token);
      if (payload) {
        setAuthUser(payload.sub);
        setAuthRole(payload.role);
        setAuthMessage(`Authenticated as ${payload.sub} (${payload.role}).`);
      } else {
        clearToken();
      }
    };
    initAuth();
  }, []);

  const selectedDraft = useMemo(() => drafts.find((draft) => draft.id === selectedId) ?? null, [drafts, selectedId]);
  const isAuthenticated = Boolean(authUser);
  const canEdit = canPerform(authRole, 'editor');
  const showAdminSection = canPerform(authRole, 'admin');

  const handleLogin = async (event) => {
    event.preventDefault();
    const normalized = loginForm.username.trim().toLowerCase();
    const found = users.find(
      (user) => user.username === normalized && user.password === loginForm.password,
    );

    if (!found) {
      setAuthMessage('Invalid credentials. Use admin/editor/viewer sample credentials.');
      return;
    }

    const token = await createToken(found.username, found.role);
    saveToken(token, rememberMe);
    setAuthUser(found.username);
    setAuthRole(found.role);
    setAuthMessage(`Signed in as ${found.username} (${found.role}).`);
    setLoginForm({ username: '', password: '' });
    setView('drafts');
  };

  const handleLogout = () => {
    clearToken();
    setAuthUser(null);
    setAuthRole('viewer');
    setAuthMessage('Signed out successfully.');
    setView('dashboard');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canEdit) {
      setMessage('Only editors and admins can save drafts.');
      return;
    }

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
    if (!canEdit) {
      setMessage('You do not have permission to edit drafts.');
      return;
    }
    setSelectedId(draft.id);
    setForm({ title: draft.title, content: draft.content });
    setMessage('Editing existing draft.');
  };

  const handleDelete = (id) => {
    if (!canEdit) {
      setMessage('You do not have permission to delete drafts.');
      return;
    }
    const nextDrafts = removeDraft(drafts, id);
    setDrafts(nextDrafts);
    if (selectedId === id) {
      setSelectedId(null);
      setForm(emptyForm);
    }
    setMessage('Draft deleted.');
  };

  const handleNew = () => {
    if (!canEdit) {
      setMessage('Only editors and admins can create drafts.');
      return;
    }
    setSelectedId(null);
    setForm(emptyForm);
    setMessage('Started a new draft.');
  };

  const availableViews = [
    { key: 'dashboard', label: 'Overview', minRole: 'viewer' },
    { key: 'drafts', label: 'Draft area', minRole: 'viewer' },
    { key: 'admin', label: 'Admin console', minRole: 'admin' },
  ];

  const renderNav = () => (
    <nav className="nav-panel">
      <div className="panel-header">
        <h2>Workspace</h2>
      </div>
      <ul className="nav-list">
        {availableViews.map((item) => (
          canPerform(authRole, item.minRole) ? (
            <li key={item.key}>
              <button
                type="button"
                className={view === item.key ? 'nav-btn active' : 'nav-btn'}
                onClick={() => setView(item.key)}
              >
                {item.label}
              </button>
            </li>
          ) : null
        ))}
      </ul>
    </nav>
  );

  const renderLoginPanel = () => (
    <section className="panel auth-panel">
      <div className="panel-header">
        <div>
          <h2>JWT Sign-In</h2>
          <p className="subtext">Authenticate and receive a signed JSON Web Token for protected access.</p>
        </div>
      </div>
      <form onSubmit={handleLogin} className="auth-form">
        <label>
          <span>Username</span>
          <input
            value={loginForm.username}
            onChange={(event) => setLoginForm((current) => ({ ...current, username: event.target.value }))}
            placeholder="admin, editor, viewer"
          />
        </label>
        <label>
          <span>Password</span>
          <input
            type="password"
            value={loginForm.password}
            onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))}
            placeholder="Admin123!"
          />
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(event) => setRememberMe(event.target.checked)}
          />
          Remember me (localStorage)
        </label>
        <div className="actions">
          <button type="submit">Sign in</button>
        </div>
      </form>
      <div className="hint-box">
        <p>Demo users:</p>
        <ul>
          <li><strong>admin</strong> / Admin123!</li>
          <li><strong>editor</strong> / Editor123!</li>
          <li><strong>viewer</strong> / Viewer123!</li>
        </ul>
      </div>
      <p className="message" role="status">{authMessage}</p>
    </section>
  );

  const renderDraftsPanel = () => (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>Draft workspace</h2>
          <p className="subtext">Role-based access controls are enforced here.</p>
        </div>
        <span className="role-pill">{authRole}</span>
      </div>
      <div className="panel-body">
        <div className="panel-inner">
          <h3>{selectedDraft ? 'Edit draft' : 'Create draft'}</h3>
          <form onSubmit={handleSubmit} className="draft-form">
            <label>
              <span>Title</span>
              <input
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="Post title"
                disabled={!canEdit}
              />
            </label>
            <label>
              <span>Content</span>
              <textarea
                rows="8"
                value={form.content}
                onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))}
                placeholder={canEdit ? 'Write your draft here...' : 'View-only access for viewers.'}
                disabled={!canEdit}
              />
            </label>
            <div className="actions">
              <button type="button" className="secondary-btn" onClick={handleNew} disabled={!canEdit}>New draft</button>
              <button type="submit" disabled={isSaving || !canEdit}>{isSaving ? 'Saving...' : 'Save draft'}</button>
            </div>
          </form>
          {!canEdit && <p className="hint-text">Editors and admins can save, update, and delete drafts; viewers can only read.</p>}
        </div>
        <div className="panel-inner">
          <div className="panel-header">
            <h3>Saved drafts</h3>
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
                    <button type="button" className="secondary-btn" onClick={() => handleEdit(draft)} disabled={!canEdit}>Edit</button>
                    <button type="button" className="danger-btn" onClick={() => handleDelete(draft.id)} disabled={!canEdit}>Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <p className="message" role="status">{message}</p>
    </section>
  );

  const renderAdminPanel = () => (
    <section className="panel auth-panel">
      <div className="panel-header">
        <div>
          <h2>Admin console</h2>
          <p className="subtext">Admins can access token and role details here.</p>
        </div>
      </div>
      <div className="panel-inner">
        <p>Authorized access only. This area simulates RBAC-protected admin routes.</p>
        <div className="hint-box">
          <p>Current user:</p>
          <strong>{userDisplayName(authUser)}</strong>
          <p>Role:</p>
          <strong>{authRole}</strong>
          <p>Session persistence:</p>
          <strong>{rememberMe ? 'localStorage' : 'sessionStorage'}</strong>
        </div>
      </div>
    </section>
  );

  return (
    <div className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">EXP3 Security Lab</p>
          <h1>JWT Authentication and RBAC</h1>
          <p className="subtext">Sign in, store a signed token, and access resources based on your role.</p>
        </div>
      </header>
      <div className="auth-bar">
        <div>
          {isAuthenticated ? (
            <p>Signed in as <strong>{userDisplayName(authUser)}</strong> with role <strong>{authRole}</strong>.</p>
          ) : (
            <p>{authMessage}</p>
          )}
        </div>
        {isAuthenticated && (
          <button type="button" className="secondary-btn" onClick={handleLogout}>Sign out</button>
        )}
      </div>
      <main className="content-grid auth-grid">
        {isAuthenticated && <aside>{renderNav()}</aside>}
        <section className="panel main-panel">
          {!isAuthenticated && renderLoginPanel()}
          {isAuthenticated && view === 'dashboard' && (
            <div className="panel auth-panel">
              <div className="panel-header">
                <h2>Welcome</h2>
              </div>
              <div className="panel-inner">
                <ul className="dashboard-list">
                  <li><strong>Viewer</strong>: read-only access.</li>
                  <li><strong>Editor</strong>: create and manage drafts.</li>
                  <li><strong>Admin</strong>: full access plus console.</li>
                </ul>
              </div>
            </div>
          )}
          {isAuthenticated && view === 'drafts' && renderDraftsPanel()}
          {isAuthenticated && view === 'admin' && (showAdminSection ? renderAdminPanel() : (
            <div className="panel auth-panel">
              <div className="panel-header">
                <h2>Unauthorized</h2>
              </div>
              <p className="message">This route is protected for admin users only.</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}

export default App;
