import { isPost } from "./model.ts";
import type { Post } from "./types.ts";

export const DRAFT_PREFIX = "margin.editor.v1.";
export const NEW_DRAFT_KEY = "margin.editor.new.v1";
type DraftStorage = Pick<Storage, "getItem" | "setItem" | "removeItem" | "key" | "length">;
const fields = ["title", "excerpt", "body", "author", "category", "cover"] as const;

export function sameWriting(a: Post, b: Post): boolean {
  return fields.every(field => a[field] === b[field]);
}

export function cacheDraft(storage: DraftStorage, post: Post, newSession: boolean): void {
  const value = JSON.stringify({...post, updatedAt: new Date().toISOString()});
  storage.setItem(`${DRAFT_PREFIX}${post.id}`, value);
  if (newSession) storage.setItem(NEW_DRAFT_KEY, value);
}

export function clearDraft(storage: DraftStorage, id: string): void {
  storage.removeItem(`${DRAFT_PREFIX}${id}`);
  for (const key of [NEW_DRAFT_KEY, `${DRAFT_PREFIX}new`]) {
    const raw = storage.getItem(key);
    if (!raw) continue;
    try {if (JSON.parse(raw).id === id) storage.removeItem(key);} catch {storage.removeItem(key);}
  }
}

export function recoverDraft(storage: DraftStorage, post: Post | undefined, existingIds: string[]): Post | undefined {
  // Old versions used the story id "new" as the new-session alias too.
  const key = post ? `${DRAFT_PREFIX}${post.id}` : storage.getItem(NEW_DRAFT_KEY) ? NEW_DRAFT_KEY : `${DRAFT_PREFIX}new`;
  const raw = storage.getItem(key);
  if (!raw) return;
  const recovered: unknown = JSON.parse(raw);
  if (!isPost(recovered) || !recovered.owned) return;
  if (!post) {
    // An autosaved story already belongs in the studio; New story starts fresh.
    if (existingIds.includes(recovered.id)) {
      // A legacy entry for the actual story "new" is its edit recovery, not an alias.
      if (key === NEW_DRAFT_KEY || recovered.id !== "new") storage.removeItem(key);
      return;
    }
    return recovered;
  }
  if (recovered.id !== post.id) return;
  if (Date.parse(recovered.updatedAt ?? recovered.date) < Date.parse(post.updatedAt ?? post.date)) {clearDraft(storage, post.id); return;}
  return recovered;
}

export function clearAllDrafts(storage: DraftStorage): void {
  const keys = Array.from({length: storage.length}, (_, index) => storage.key(index));
  keys.forEach(key => {if (key === NEW_DRAFT_KEY || key?.startsWith(DRAFT_PREFIX)) storage.removeItem(key);});
}
