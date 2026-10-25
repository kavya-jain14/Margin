import { clearAllDrafts, clearDraft } from "./drafts.ts";
import { STORAGE_KEY } from "./model.ts";
import type { BlogState } from "./types.ts";

type CollectionStorage = Pick<Storage, "getItem" | "setItem" | "removeItem" | "key" | "length">;

export function restoreCollectionStorage(storage: CollectionStorage, state: BlogState): void {
  // A quota failure must leave the previous collection's unfinished edits intact.
  storage.setItem(STORAGE_KEY, JSON.stringify(state));
  clearAllDrafts(storage);
}

export function saveStoryStorage(storage: CollectionStorage, state: BlogState, id: string): void {
  // Keep the editor's recovery copy until its collection write has succeeded.
  storage.setItem(STORAGE_KEY, JSON.stringify(state));
  clearDraft(storage, id);
}
