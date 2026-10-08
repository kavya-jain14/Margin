"use client";
import { useEffect, useRef, useState } from "react";
import type { BlogState, Post, Route, Sort } from "@/lib/blog/types";
import { deletePost, parseState, storyHref, toggleId, upsertOwnedPost } from "@/lib/blog/model";
import { clearDraft } from "@/lib/blog/drafts";
import { useBlog } from "@/lib/blog/useBlog";
import Header from "./Header";
import Explore from "./Explore";
import Studio from "./Studio";
import Reader from "./Reader";
import Editor from "./Editor";
import EmptyState from "./EmptyState";
import Modal from "./Modal";

type Dialog = {type: "delete"; id: string; title: string} | {type: "delete-comment"; id: string} | {type: "about"} | {type: "share"; url: string} | {type: "import"; state: BlogState};

function parseRoute(): Route {
  try {
    const [page, id] = window.location.hash.replace(/^#\/?/, "").split("/");
    if (["explore", "bookmarks", "studio", "write", "read"].includes(page)) return {page: page as Route["page"], id: id ? decodeURIComponent(id) : undefined};
  } catch { /* Malformed links return to the journal. */ }
  return {page: "explore"};
}

function download(content: string, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], {type}));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function MarginApp() {
  const {state, setState, dark, setDark, ready, storageError, restoreCollection} = useBlog();
  const [route, setRoute] = useState<Route>({page: "explore"});
  const [writeSession, setWriteSession] = useState(0);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All stories");
  const [sort, setSort] = useState<Sort>("newest");
  const [limit, setLimit] = useState(6);
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [toast, setToast] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const importInput = useRef<HTMLInputElement>(null);
  const main = useRef<HTMLElement>(null);
  const selected = state.posts.find(post => post.id === route.id);
  const published = state.posts.filter(post => post.status === "published");
  const bookmarkCount = published.filter(post => state.bookmarks.includes(post.id)).length;

  useEffect(() => {
    const update = () => {setRoute(parseRoute()); window.scrollTo({top: 0, behavior: "instant"});};
    update();
    window.addEventListener("hashchange", update);
    return () => {window.removeEventListener("hashchange", update); if (toastTimer.current) clearTimeout(toastTimer.current);};
  }, []);
  useEffect(() => {
    const title = route.page === "read" ? selected?.title ?? "Story unavailable" : route.page === "studio" ? "My studio" : route.page === "bookmarks" ? "Reading list" : route.page === "write" ? "Write a story" : "The journal";
    document.title = `${title} | Margin`;
  }, [route.page, selected?.title]);
  useEffect(() => {main.current?.focus({preventScroll: true});}, [route.page, route.id]);
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (event.key !== "/" || event.ctrlKey || event.metaKey || event.altKey || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.isContentEditable || document.querySelector("dialog[open]")) return;
      event.preventDefault();
      if (!["explore", "bookmarks"].includes(route.page)) window.location.hash = "/explore";
      window.setTimeout(() => {
        searchInput.current?.scrollIntoView({behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "center"});
        searchInput.current?.focus({preventScroll: true});
      }, 50);
    };
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, [route.page]);

  function notify(message: string) {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 4000);
  }
  function clearFilters() {setQuery(""); setCategory("All stories"); setSort("newest"); setLimit(6);}
  function resetJournal() {clearFilters(); window.scrollTo({top: 0, behavior: "instant"});}
  function explore() {clearFilters(); window.location.hash = "/explore";}
  function write() {setWriteSession(current => current + 1); window.location.hash = "/write";}
  function bookmark(id: string) {
    const saved = state.bookmarks.includes(id);
    setState(current => ({...current, bookmarks: toggleId(current.bookmarks, id)}));
    notify(saved ? "Removed from your reading list." : "Saved to your reading list.");
  }
  function save(post: Post, exit: boolean) {
    setState(current => upsertOwnedPost(current, post));
    if (exit) window.location.hash = post.status === "published" ? storyHref("read", post.id) : "/studio";
  }
  function exportCollection() {
    download(JSON.stringify(state, null, 2), "margin-collection.json", "application/json");
    notify("Collection exported.");
  }
  function share(post: Post) {
    if (!post.owned) {setDialog({type: "share", url: window.location.href}); return;}
    const filename = post.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70) || "margin-story";
    download(`# ${post.title}\n\n${post.excerpt}\n\nBy ${post.author} · ${post.category}\n\n${post.body}\n`, `${filename}.md`, "text/markdown");
    notify("Story downloaded as Markdown.");
  }
  async function importCollection(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {notify("Choose a Margin backup smaller than 5 MB."); return;}
    try {setDialog({type: "import", state: parseState(await file.text())});}
    catch {notify("This file is not a valid Margin collection. Choose an exported backup.");}
  }

  return <div className="site-shell">
    <a className="skip-link" href="#main-content" onClick={event => {event.preventDefault(); main.current?.focus();}}>Skip to content</a>
    <Header page={route.page} dark={dark} bookmarkCount={bookmarkCount} onTheme={() => setDark(current => !current)} onExplore={resetJournal} onWrite={write}/>
    {storageError ? <div className="storage-warning" role="status">{storageError}</div> : null}
    <main id="main-content" ref={main} tabIndex={-1} className="main-container">
      {route.page === "explore" || route.page === "bookmarks" ? <Explore state={state} collection={route.page === "bookmarks"} query={query} category={category} sort={sort} limit={limit} searchRef={searchInput} onQuery={value => {setQuery(value); setLimit(6);}} onCategory={value => {setCategory(value); setLimit(6);}} onSort={value => {setSort(value); setLimit(6);}} onMore={() => setLimit(current => current + 6)} onClear={clearFilters} onBookmark={bookmark} onExplore={explore}/> : null}
      {route.page === "studio" ? <Studio posts={state.posts} onWrite={write} onDelete={post => setDialog({type: "delete", id: post.id, title: post.title || "Untitled story"})} onExport={exportCollection} onImport={() => importInput.current?.click()}/> : null}
      {route.page === "read" ? !ready ? <p className="loading-state" role="status">Opening story…</p> : selected?.status === "published" ? <Reader key={selected.id} post={selected} comments={state.comments.filter(comment => comment.postId === selected.id)} related={published.filter(post => post.id !== selected.id).sort((a, b) => Number(b.category === selected.category) - Number(a.category === selected.category)).slice(0, 2)} bookmarks={state.bookmarks} liked={state.liked.includes(selected.id)} onBookmark={bookmark} onLike={id => setState(current => ({...current, liked: toggleId(current.liked, id)}))} onComment={comment => {setState(current => ({...current, comments: [...current.comments, comment]})); notify("Comment added.");}} onDeleteComment={id => setDialog({type: "delete-comment", id})} onShare={() => share(selected)}/> : <EmptyState title="Story unavailable." detail="This story may be a draft, have been removed, or be saved on another device." action="Browse the journal" onAction={explore}/> : null}
      {route.page === "write" ? !ready ? <p className="loading-state" role="status">Preparing editor…</p> : route.id && !selected?.owned ? <EmptyState title="This story isn’t in your studio." detail="You can edit the stories you create. Start a new story to begin writing." action="Write a story" onAction={write}/> : <Editor key={route.id ?? `new-${writeSession}`} post={selected} existingIds={state.posts.map(post => post.id)} recoverNew={writeSession === 0} onSave={save} onNotify={notify}/> : null}
    </main>
    <input ref={importInput} type="file" accept=".json,application/json" hidden onChange={importCollection}/>
    <footer className="site-footer"><div className="footer-inner"><a href="#/explore" className="wordmark" onClick={resetJournal}>margin<span className="wordmark-dot">.</span></a><p>Stories and writing, saved on this device.</p><button className="text-button" onClick={() => setDialog({type: "about"})}>About Margin</button></div></footer>
    <div className={`toast ${toast ? "visible" : ""}`} role="status" aria-live="polite">{toast}</div>
    {dialog ? <Modal title={dialog.type === "about" ? "About Margin" : dialog.type === "share" ? "Share story" : dialog.type === "import" ? "Restore a backup?" : dialog.type === "delete" ? "Delete this story?" : "Remove this comment?"} onClose={() => setDialog(null)}>
      {dialog.type === "about" ? <><p>Margin is a journal about design, technology, culture, travel, and everyday life. Read the sample stories, save favorites, or write your own.</p><p>Your writing, comments, and reader activity are saved on this device. Export your collection from My studio to keep a backup. The sample stories and authors are fictional.</p><button className="button button-primary" onClick={() => {setDialog(null); write();}}>Write a story</button></> : null}
      {dialog.type === "share" ? <><p>Copy this link to share the sample story.</p><label className="field-label" htmlFor="share-url">Story link</label><input id="share-url" value={dialog.url} readOnly onFocus={event => event.target.select()}/><button className="button button-primary" onClick={async () => {try {await navigator.clipboard.writeText(dialog.url); notify("Story link copied."); setDialog(null);} catch {notify("Select the link above and copy it manually.");}}}>Copy link</button></> : null}
      {dialog.type === "delete" ? <><p>“{dialog.title}” and its comments, bookmarks, and likes will be removed from this device. This cannot be undone.</p><div className="button-row"><button className="button button-outline" onClick={() => setDialog(null)}>Cancel</button><button className="button button-danger" onClick={() => {setState(current => deletePost(current, dialog.id)); try {clearDraft(localStorage, dialog.id);} catch { /* Collection persistence reports storage errors. */ } setDialog(null); notify("Story deleted.");}}>Delete story</button></div></> : null}
      {dialog.type === "delete-comment" ? <><p>This comment will be removed from the conversation on this device.</p><div className="button-row"><button className="button button-outline" onClick={() => setDialog(null)}>Cancel</button><button className="button button-danger" onClick={() => {setState(current => ({...current, comments: current.comments.filter(comment => comment.id !== dialog.id)})); setDialog(null); notify("Comment removed.");}}>Remove comment</button></div></> : null}
      {dialog.type === "import" ? <><p>This backup contains {dialog.state.posts.filter(post => post.owned).length} of your stories. Restoring replaces this device’s collection, bookmarks, likes, comments, and unfinished editor changes.</p><p>Export your current collection first if you want to keep a copy.</p><div className="button-row"><button className="button button-outline" onClick={() => setDialog(null)}>Cancel</button><button className="button button-primary" onClick={() => {restoreCollection(dialog.state); setDialog(null); notify("Backup restored.");}}>Restore backup</button></div></> : null}
    </Modal> : null}
  </div>;
}
