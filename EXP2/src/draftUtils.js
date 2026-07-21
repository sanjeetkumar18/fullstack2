export const createDraft = (title, content) => ({
  id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  title,
  content,
  status: 'draft',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

export const upsertDraft = (drafts, draft) => {
  const filtered = drafts.filter((item) => item.id !== draft.id);
  return [...filtered, draft].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
};

export const removeDraft = (drafts, id) => drafts.filter((draft) => draft.id !== id);
