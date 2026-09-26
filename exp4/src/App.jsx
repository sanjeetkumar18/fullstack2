import React, { memo, useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, CalendarDays, Check, ChevronDown, Clock3, GripVertical, LayoutGrid, List, Plus, Search, Sparkles, X } from 'lucide-react';
import { CATEGORY_STYLES, formatMonth, getCalendarDays, INITIAL_POSTS, movePost, postsForDate, toDateKey } from './calendarUtils';

const TODAY = '2026-09-08';
const EMPTY_FORM = { title: '', date: TODAY, time: '09:00', category: 'Insight', channel: 'LinkedIn', status: 'Draft' };

function postsReducer(posts, action) {
  if (action.type === 'move') return movePost(posts, action.postId, action.date);
  if (action.type === 'add') return [...posts, { ...action.post, id: `p-${Date.now()}` }];
  return posts;
}

const StatusDot = ({ status }) => <span className={`status-dot status-${status.toLowerCase()}`} aria-label={status} />;

const PostChip = memo(function PostChip({ post, onDragStart, onSelect, renderStats }) {
  renderStats.current.chips += 1;
  const style = CATEGORY_STYLES[post.category] ?? CATEGORY_STYLES.Insight;
  return (
    <button
      type="button"
      className="post-chip"
      draggable
      onDragStart={(event) => onDragStart(event, post.id)}
      onClick={() => onSelect(post)}
      style={{ '--chip-color': style.color, '--chip-soft': style.soft }}
      aria-label={`${post.title}, ${post.status}`}
    >
      <GripVertical size={12} className="grip" aria-hidden="true" />
      <span className="chip-copy"><strong>{post.title}</strong><small>{post.time} · {post.channel}</small></span>
      <StatusDot status={post.status} />
    </button>
  );
});

const CalendarDay = memo(function CalendarDay({ day, month, posts, onDrop, onDragStart, onSelect, renderStats }) {
  renderStats.current.days += 1;
  const dateKey = toDateKey(day);
  const isCurrentMonth = day.getMonth() === month.getMonth();
  const isToday = dateKey === TODAY;
  return (
    <div
      className={`calendar-day ${isCurrentMonth ? '' : 'outside-month'} ${isToday ? 'today' : ''}`}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => onDrop(event, dateKey)}
    >
      <div className="day-number"><span>{day.getDate()}</span>{isToday && <em>Today</em>}</div>
      <div className="day-posts">
        {posts.map((post) => <PostChip key={post.id} post={post} onDragStart={onDragStart} onSelect={onSelect} renderStats={renderStats} />)}
      </div>
      <button type="button" className="day-add" onClick={() => onSelect({ date: dateKey })} aria-label={`Add post on ${dateKey}`}><Plus size={14} /></button>
    </div>
  );
});

const RenderStats = memo(function RenderStats({ enabled, appRenders, renderSnapshot, onReset }) {
  return (
    <div className="render-stats" aria-live="polite">
      <div className="render-stats-heading"><span className="pulse" /> Live render monitor <strong>{enabled ? 'optimized' : 'unoptimized'}</strong></div>
      <div className="render-counts"><span><strong>{appRenders}</strong> app</span><span><strong>{renderSnapshot.days}</strong> calendar cells</span><span><strong>{renderSnapshot.chips}</strong> post chips</span><button type="button" className="reset-counts" onClick={onReset}>Reset counts</button></div>
    </div>
  );
});

function App() {
  const [posts, dispatch] = useReducer(postsReducer, INITIAL_POSTS);
  const [month, setMonth] = useState(new Date(2026, 8, 1));
  const [view, setView] = useState('month');
  const [query, setQuery] = useState('');
  const [activePost, setActivePost] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [notice, setNotice] = useState('');
  const [optimizationEnabled, setOptimizationEnabled] = useState(true);
  const renderStats = useRef({ days: 0, chips: 0 });
  const [renderSnapshot, setRenderSnapshot] = useState({ days: 0, chips: 0 });
  const appRenderCount = useRef(0);
  appRenderCount.current += 1;
  const days = useMemo(() => getCalendarDays(month), [month]);
  const visiblePosts = useMemo(() => posts.filter((post) => post.title.toLowerCase().includes(query.toLowerCase())), [posts, query]);
  const counts = useMemo(() => ({ scheduled: posts.filter((post) => post.status === 'Scheduled').length, drafts: posts.filter((post) => post.status === 'Draft').length, published: posts.filter((post) => post.status === 'Published').length }), [posts]);
  const postsByDate = useMemo(() => Object.fromEntries(days.map((day) => [toDateKey(day), postsForDate(visiblePosts, toDateKey(day))])), [days, visiblePosts]);

  const openComposer = useCallback((post = {}) => {
    setActivePost(post.id ?? 'new');
    setForm({ ...EMPTY_FORM, ...post });
  }, []);

  const handleDrop = useCallback((event, date) => {
    event.preventDefault();
    const postId = event.dataTransfer.getData('text/plain');
    if (!postId) return;
    dispatch({ type: 'move', postId, date });
    const moved = posts.find((post) => post.id === postId);
    setNotice(`${moved?.title ?? 'Post'} moved to ${date}.`);
  }, [posts]);

  const handleDragStart = useCallback((event, id) => {
    event.dataTransfer.setData('text/plain', id);
    event.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleSubmit = useCallback((event) => {
    event.preventDefault();
    if (!form.title.trim()) return;
    dispatch({ type: 'add', post: { ...form, title: form.title.trim() } });
    setActivePost(null);
    setNotice('New post added to your calendar.');
  }, [form]);

  const changeMonth = useCallback((offset) => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1)), []);
  const resetRenderCounts = useCallback(() => {
    renderStats.current = { days: 0, chips: 0 };
    appRenderCount.current = 0;
    setRenderSnapshot({ days: 0, chips: 0 });
  }, []);
  const selectPost = optimizationEnabled ? openComposer : (post = {}) => openComposer(post);
  const dropPost = optimizationEnabled ? handleDrop : (event, date) => handleDrop(event, date);
  const startDrag = optimizationEnabled ? handleDragStart : (event, id) => handleDragStart(event, id);
  const appRenders = appRenderCount.current;

  useEffect(() => {
    setRenderSnapshot((current) => {
      const next = { ...renderStats.current };
      return current.days === next.days && current.chips === next.chips ? current : next;
    });
  }, [activePost, form, month, notice, optimizationEnabled, posts, query, view]);

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark"><Sparkles size={18} /></div><span>signal<span className="brand-dot">.</span></span></div>
        <div className="workspace-switcher"><span className="avatar">AM</span><span><strong>Acme media</strong><small>Content workspace</small></span><ChevronDown size={15} /></div>
        <nav className="main-nav" aria-label="Main navigation">
          <a href="#calendar" className="nav-item active"><CalendarDays size={17} /> Calendar <span className="nav-count">{posts.length}</span></a>
          <a href="#inbox" className="nav-item"><List size={17} /> Content inbox</a>
          <a href="#analytics" className="nav-item"><LayoutGrid size={17} /> Analytics</a>
        </nav>
        <div className="sidebar-bottom"><div className="plan-label"><span>September rhythm</span><strong>68%</strong></div><div className="progress"><span /></div><small>12 of 18 planned slots</small><button type="button" className="invite-button">Invite teammate <Plus size={14} /></button></div>
      </aside>

      <section className="workspace" id="calendar">
        <header className="topbar"><div><p className="eyebrow">Tuesday, September 8, 2026</p><h1>Content calendar</h1></div><div className="top-actions"><button type="button" className="icon-button" aria-label="Search"><Search size={18} /></button><span className="top-avatar">JS</span><button type="button" className="primary-button" onClick={() => openComposer()}><Plus size={17} /> New post</button></div></header>
        <div className="intro-row"><div><p className="subtitle">A clear view of what your team is saying, and when.</p></div><div className="legend"><span><StatusDot status="Scheduled" /> Scheduled</span><span><StatusDot status="Draft" /> Draft</span><span><StatusDot status="Published" /> Published</span></div></div>
        <section className="metrics" aria-label="Calendar summary"><div><span className="metric-label">Scheduled</span><strong>{counts.scheduled}</strong><small>this month</small></div><div><span className="metric-label">Drafts</span><strong>{counts.drafts}</strong><small>need a review</small></div><div><span className="metric-label">Published</span><strong>{counts.published}</strong><small>in September</small></div><div className="metric-note"><Check size={18} /><span><strong>On track</strong><small>2 posts ahead of last month</small></span></div></section>
        <section className="calendar-panel">
          <div className="calendar-toolbar"><div className="month-controls"><button type="button" className="icon-button quiet" onClick={() => changeMonth(-1)} aria-label="Previous month"><ArrowLeft size={17} /></button><h2>{formatMonth(month)}</h2><button type="button" className="icon-button quiet" onClick={() => changeMonth(1)} aria-label="Next month"><ArrowRight size={17} /></button><button type="button" className="today-button" onClick={() => setMonth(new Date(2026, 8, 1))}>Today</button></div><div className="toolbar-right"><label className="search-box"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter posts" aria-label="Filter posts" /></label><div className="view-toggle"><button type="button" className={view === 'month' ? 'selected' : ''} onClick={() => setView('month')} aria-label="Month view"><LayoutGrid size={16} /></button><button type="button" className={view === 'list' ? 'selected' : ''} onClick={() => setView('list')} aria-label="List view"><List size={16} /></button></div></div></div>
          {view === 'month' ? <div className="calendar-grid"><div className="weekday-row">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => <span key={day}>{day}</span>)}</div><div className="days-grid">{days.map((day) => <CalendarDay key={toDateKey(day)} day={day} month={month} posts={postsByDate[toDateKey(day)]} onDrop={dropPost} onDragStart={startDrag} onSelect={selectPost} renderStats={renderStats} />)}</div></div> : <div className="list-view">{visiblePosts.slice().sort((a, b) => a.date.localeCompare(b.date)).map((post) => <button type="button" className="list-post" key={post.id} onClick={() => selectPost(post)}><span className="list-date">{new Date(`${post.date}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span><span className="list-title"><StatusDot status={post.status} /><strong>{post.title}</strong></span><span className="category-tag" style={{ color: CATEGORY_STYLES[post.category]?.color }}>{post.category}</span><span>{post.channel}</span><ArrowRight size={15} /></button>)}</div>}
        </section>
        <section className="optimization-panel" aria-label="Rendering optimization controls"><div><p className="eyebrow">Experiment control</p><h2>Render optimization</h2><p>Toggle memoization and stable callbacks to compare live component work.</p></div><button type="button" className={`optimization-toggle ${optimizationEnabled ? 'enabled' : ''}`} onClick={() => setOptimizationEnabled((enabled) => !enabled)} aria-pressed={optimizationEnabled}><span /> {optimizationEnabled ? 'Optimization on' : 'Optimization off'}</button></section>
        <RenderStats enabled={optimizationEnabled} appRenders={appRenders} renderSnapshot={renderSnapshot} onReset={resetRenderCounts} />
        {notice && <p className="notice" role="status"><Check size={15} /> {notice}<button type="button" onClick={() => setNotice('')} aria-label="Dismiss message"><X size={14} /></button></p>}
      </section>
      {activePost && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setActivePost(null)}><form className="composer" onSubmit={handleSubmit}><div className="composer-head"><div><p className="eyebrow">{activePost === 'new' ? 'New entry' : 'Edit entry'}</p><h2>Shape the next signal</h2></div><button type="button" className="icon-button quiet" onClick={() => setActivePost(null)} aria-label="Close composer"><X size={18} /></button></div><label>Post title<input autoFocus value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Give this idea a name" /></label><div className="form-row"><label>Date<input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></label><label>Time<input type="time" value={form.time} onChange={(event) => setForm({ ...form, time: event.target.value })} /></label></div><div className="form-row"><label>Category<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{Object.keys(CATEGORY_STYLES).map((category) => <option key={category}>{category}</option>)}</select></label><label>Channel<select value={form.channel} onChange={(event) => setForm({ ...form, channel: event.target.value })}><option>LinkedIn</option><option>Instagram</option><option>Blog</option></select></label></div><div className="composer-footer"><span><Clock3 size={15} /> Autosaves to workspace</span><button type="submit" className="primary-button"><Check size={16} /> Add to calendar</button></div></form></div>}
    </main>
  );
}

export default App;
