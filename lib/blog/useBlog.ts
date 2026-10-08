"use client";
import { useEffect, useRef, useState } from "react";
import { seedPosts } from "./seed";
import { parseState, STORAGE_KEY, THEME_KEY } from "./model";
import type { BlogState } from "./types";
import { clearAllDrafts } from "./drafts";

export const initialState: BlogState = { version: 1, posts: seedPosts, bookmarks: [], liked: [], comments: [] };

export function useBlog() {
  const [state, setState] = useState<BlogState>(initialState);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState("");
  const [dark, setDark] = useState(false);
  const preserveUnreadableData = useRef(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        try {setState(parseState(raw));}
        catch {
          // Keep the original bytes before replacing an unreadable collection.
          localStorage.setItem(`${STORAGE_KEY}.recovery`, raw);
          setStorageError("An unreadable saved collection was preserved for recovery. This session starts with the sample stories; export new writing to keep a copy.");
        }
      }
    } catch {
      preserveUnreadableData.current = true;
      setStorageError("Saved data could not be loaded. Your session still works; export your stories to keep a copy.");
    }
    try {
      const theme = localStorage.getItem(THEME_KEY);
      setDark(theme ? theme === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches);
    } catch { /* Use the default theme when preferences are unavailable. */ }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready || preserveUnreadableData.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      setStorageError(current => current.startsWith("Your browser could not save") ? "" : current);
    }
    catch { setStorageError("Your browser could not save this change. Export your collection from My studio before closing the page."); }
  }, [state, ready]);
  useEffect(() => {
    if (!ready) return;
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    try { localStorage.setItem(THEME_KEY, dark ? "dark" : "light"); } catch { /* Theme changes still work for this session. */ }
  }, [dark, ready]);
  function restoreCollection(next: BlogState) {
    preserveUnreadableData.current = false;
    setState(next);
    try {
      clearAllDrafts(localStorage);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setStorageError("");
    } catch {
      setStorageError("Your browser could not save the restored backup. It is available for this session; export your collection before closing.");
    }
  }
  return { state, setState, dark, setDark, ready, storageError, restoreCollection };
}
