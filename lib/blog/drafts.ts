import { isPost } from "./model.ts";
import type { Post } from "./types.ts";

export const DRAFT_PREFIX = "margin.editor.v1.";
type DraftStorage = Pick<Storage, "getItem" | "setItem" | "removeItem" | "key" | "length">;
const fields = ["title", "excerpt", "body", "author", "category", "cover"] as const;

export function sameWriting(a: Post, b: Post): boolean {
  return fields.every(field => a[field] === b[field]);
}

export function cacheDraft(storage: DraftStorage, post: Post, newSession: boolean): void {
  const value = JSON.stringify({...post, updatedAt: new Date().toISOString()});
  storage.setItem(`${DRAFT_PREFIX}${post.id}`, value);
  if (newSession) storage.setItem(`${DRAFT_PREFIX}new`, value);
}

export function clearDraft(storage: DraftStorage, id: string): void {
  storage.removeItem(`${DRAFT_PREFIX}${id}`);
  const raw = storage.getItem(`${DRAFT_PREFIX}new`);
  if (!raw) return;
  try {if (JSON.parse(raw).id === id) storage.removeItem(`${DRAFT_PREFIX}new`);} catch {storage.removeItem(`${DRAFT_PREFIX}new`);}
}

export function recoverDraft(storage: DraftStorage, post: Post | undefined, existingIds: string[]): Post | undefined {
  const raw = storage.getItem(`${DRAFT_PREFIX}${post?.id ?? "new"}`);
  if (!raw) return;
  const recovered: unknown = JSON.parse(raw);
  if (!isPost(recovered) || !recovered.owned) return;
  if (!post) {
    // An autosaved story already belongs in the studio; New story starts fresh.
    if (existingIds.includes(recovered.id)) {storage.removeItem(`${DRAFT_PREFIX}new`); return;}
    return recovered;
  }
  if (recovered.id !== post.id) return;
  if (Date.parse(recovered.updatedAt ?? recovered.date) < Date.parse(post.updatedAt ?? post.date)) {clearDraft(storage, post.id); return;}
  return recovered;
}

export function clearAllDrafts(storage: DraftStorage): void {
  const keys = Array.from({length: storage.length}, (_, index) => storage.key(index));
  keys.forEach(key => {if (key?.startsWith(DRAFT_PREFIX)) storage.removeItem(key);});
}
