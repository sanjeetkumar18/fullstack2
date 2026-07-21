import { describe, expect, it } from 'vitest';
import { createDraft, removeDraft, upsertDraft } from './draftUtils';

describe('draft utilities', () => {
  it('creates a draft with a generated id and timestamps', () => {
    const draft = createDraft('Test title', 'Test content');

    expect(draft.title).toBe('Test title');
    expect(draft.content).toBe('Test content');
    expect(draft.status).toBe('draft');
    expect(draft.id).toBeTruthy();
    expect(draft.createdAt).toBeTruthy();
  });

  it('upserts an existing draft and replaces it by id', () => {
    const existing = [createDraft('First', 'Body one')];
    const updated = upsertDraft(existing, { ...existing[0], title: 'Updated title' });

    expect(updated).toHaveLength(1);
    expect(updated[0].title).toBe('Updated title');
  });

  it('removes a draft by id', () => {
    const drafts = [createDraft('One', 'Body'), createDraft('Two', 'Body')];
    const result = removeDraft(drafts, drafts[0].id);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(drafts[1].id);
  });
});
