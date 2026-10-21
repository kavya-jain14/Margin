import { clearAllDrafts } from "./drafts.ts";
import { STORAGE_KEY } from "./model.ts";
import type { BlogState } from "./types.ts";

type CollectionStorage = Pick<Storage, "getItem" | "setItem" | "removeItem" | "key" | "length">;

export function restoreCollectionStorage(storage: CollectionStorage, state: BlogState): void {
  // A quota failure must leave the previous collection's unfinished edits intact.
  storage.setItem(STORAGE_KEY, JSON.stringify(state));
  clearAllDrafts(storage);
}
