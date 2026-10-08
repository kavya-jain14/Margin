"use client";
import { useEffect, useRef, useState } from "react";
import { CATEGORIES, COVERS, type Post } from "@/lib/blog/types";
import { readingMinutes, validatePost, wordCount } from "@/lib/blog/model";
import { cacheDraft, clearDraft, recoverDraft, sameWriting } from "@/lib/blog/drafts";
import CoverArt from "./CoverArt";
import Markdown from "./Markdown";

type Props = {post?: Post; existingIds: string[]; recoverNew?: boolean; onSave: (post: Post, exit: boolean) => void; onNotify: (text: string) => void};
const coverNames = {stillness: "Stillness", shapes: "Form", code: "Digital", sunset: "Golden", landscape: "Wander", play: "Play"};

export default function Editor({post, existingIds, recoverNew = true, onSave, onNotify}: Props) {
  const [value, setValue] = useState<Post>(() => post ?? {id: `story-${crypto.randomUUID()}`, title: "", excerpt: "", body: "", author: "", category: "Perspectives", cover: "stillness", date: new Date().toISOString(), status: "draft", owned: true, likes: 0});
  const [preview, setPreview] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveLabel, setSaveLabel] = useState("Drafts save as you write.");
  const [loaded, setLoaded] = useState(false);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const excerptRef = useRef<HTMLTextAreaElement>(null);
  const session = useRef({post, existingIds, recoverNew, initial: value, explicitlySaved: false, changed: false});
  const latestValue = useRef(value);
  const saveCallback = useRef(onSave);
  latestValue.current = value;
  saveCallback.current = onSave;
  const isPublished = session.current.post?.status === "published";

  useEffect(() => {
    const current = session.current;
    // An explicit New story action must not recover the writer just unmounted.
    if (!current.post && !current.recoverNew) {setLoaded(true); return;}
    try {
      const restored = recoverDraft(localStorage, current.post, current.existingIds);
      if (restored) {setValue(restored); setSaveLabel("Unfinished changes restored.");}
    } catch {setSaveLabel("Draft recovery is unavailable. Save a backup before leaving.");}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (!sameWriting(value, session.current.initial)) session.current.changed = true;
    if (!session.current.changed) return;
    if (isPublished && sameWriting(value, session.current.initial)) {
      try {clearDraft(localStorage, value.id); setSaveLabel("No unpublished changes.");}
      catch {setSaveLabel("Draft recovery could not be cleared. Export a backup before leaving.");}
      return;
    }
    setSaveLabel("Saving changes…");
    const timer = window.setTimeout(() => {
      try {cacheDraft(localStorage, value, !session.current.post); setSaveLabel(isPublished ? "Changes saved. Update story to publish them." : "Draft saved on this device.");}
      catch {setSaveLabel("Autosave unavailable. Export a backup before leaving.");}
      if (!isPublished) saveCallback.current({...value, status: "draft", updatedAt: new Date().toISOString()}, false);
    }, 600);
    return () => window.clearTimeout(timer);
  }, [value, loaded, isPublished]);

  useEffect(() => {
    const flush = () => {
      const current = session.current;
      const latest = latestValue.current;
      if (current.explicitlySaved || !current.changed) return true;
      if (current.post?.status === "published" && sameWriting(latest, current.initial)) {
        try {clearDraft(localStorage, latest.id); return true;} catch {return false;}
      }
      try {cacheDraft(localStorage, latest, !current.post); return true;} catch {return false;}
    };
    const protect = (event: BeforeUnloadEvent) => {
      const saved = flush();
      if (!session.current.explicitlySaved && (!saved || (session.current.post?.status === "published" && !sameWriting(latestValue.current, session.current.initial)))) {event.preventDefault(); event.returnValue = "";}
    };
    window.addEventListener("beforeunload", protect);
    return () => {
      window.removeEventListener("beforeunload", protect);
      flush();
      const current = session.current;
      const latest = latestValue.current;
      if (!current.explicitlySaved && current.changed && current.post?.status !== "published") saveCallback.current({...latest, status: "draft", updatedAt: new Date().toISOString()}, false);
    };
  }, []);

  useEffect(() => {
    const resizeFields = () => {
      for (const element of [titleRef.current, excerptRef.current]) {
        if (!element) continue;
        element.style.height = "auto";
        element.style.height = `${element.scrollHeight}px`;
      }
    };
    resizeFields();
    window.addEventListener("resize", resizeFields);
    return () => window.removeEventListener("resize", resizeFields);
  }, [value.title, value.excerpt, preview]);

  function update<K extends keyof Post>(key: K, next: Post[K]) {
    if (next !== latestValue.current[key]) session.current.changed = true;
    setValue(current => ({...current, [key]: next}));
    setErrors(current => ({...current, [key]: ""}));
  }

  function save(status: Post["status"]) {
    if (status === "published") {
      const issues = validatePost(value);
      setErrors(issues);
      if (Object.keys(issues).length) {
        setPreview(false);
        window.setTimeout(() => document.getElementById(`editor-${Object.keys(issues)[0]}`)?.focus(), 0);
        return;
      }
    }
    const next = {...value, title: value.title.trim() || "Untitled story", author: value.author.trim() || "You", excerpt: value.excerpt.trim(), body: value.body.trim(), status, updatedAt: new Date().toISOString(), date: status === "published" && !isPublished ? new Date().toISOString() : value.date};
    session.current.explicitlySaved = true;
    try {clearDraft(localStorage, value.id);} catch { /* The collection save reports storage errors. */ }
    onSave(next, true);
    onNotify(status === "published" ? isPublished ? "Story updated." : "Story published." : "Draft saved to your studio.");
  }

  return <section className="editor-page page-enter">
    <div className="page-topline"><a href="#/studio" className="back-link">My studio</a><span className="section-label">{isPublished ? "Edit story" : "Write a story"}</span></div>
    <div className="editor-topbar">
      <p className="editor-status" role="status">{saveLabel}</p>
      <div className="button-row"><button className="button button-quiet" onClick={() => setPreview(current => !current)} aria-pressed={preview}>{preview ? "Continue writing" : "Preview"}</button><button className="button button-outline" onClick={() => save("draft")}>{isPublished ? "Move to drafts" : "Save draft"}</button><button className="button button-primary" onClick={() => save("published")}>{isPublished ? "Update story" : "Publish"}</button></div>
    </div>
    {preview ? <div className="editor-preview"><p className="section-label">{value.category} / Preview</p><h1>{value.title || "Untitled story"}</h1>{value.excerpt ? <p className="reader-deck">{value.excerpt}</p> : null}<div className="post-meta"><span>{value.author || "You"}</span><span>{readingMinutes(value.body)} min read</span></div><CoverArt cover={value.cover}/><Markdown text={value.body || "Your story is still blank. Return to the editor to begin writing."}/></div> : <div className="editor-layout">
      <div className="writing-area">
        <label className="field-label" htmlFor="editor-title">Title</label>
        <textarea ref={titleRef} id="editor-title" className="title-input" placeholder="Give your story a title" maxLength={120} rows={1} value={value.title} onChange={event => update("title", event.target.value)} aria-invalid={!!errors.title} aria-describedby={errors.title ? "error-title" : undefined}/>
        {errors.title ? <p className="field-error" id="error-title">{errors.title}</p> : null}
        <label className="field-label" htmlFor="editor-excerpt">Introduction</label>
        <textarea ref={excerptRef} id="editor-excerpt" className="excerpt-input" placeholder="A short introduction for readers" maxLength={240} rows={2} value={value.excerpt} onChange={event => update("excerpt", event.target.value)} aria-invalid={!!errors.excerpt} aria-describedby={errors.excerpt ? "error-excerpt" : undefined}/>
        {errors.excerpt ? <p className="field-error" id="error-excerpt">{errors.excerpt}</p> : null}
        <div className="body-label"><label className="field-label" htmlFor="editor-body">Story</label><span>{wordCount(value.body)} words · {readingMinutes(value.body)} min read</span></div>
        <textarea id="editor-body" className="body-input" placeholder="Start writing here…" value={value.body} maxLength={50000} onChange={event => update("body", event.target.value)} aria-invalid={!!errors.body} aria-describedby={`body-help${errors.body ? " error-body" : ""}`}/>
        {errors.body ? <p className="field-error" id="error-body">{errors.body}</p> : null}
        <p className="input-help" id="body-help">Formatting: ## Heading, **bold**, &gt; quote, or - list items.</p>
      </div>
      <aside className="editor-details">
        <h2>Story details</h2>
        <label className="field-label" htmlFor="editor-author">Author</label><input id="editor-author" autoComplete="name" placeholder="Your name" value={value.author} maxLength={60} onChange={event => update("author", event.target.value)} aria-invalid={!!errors.author} aria-describedby={errors.author ? "error-author" : undefined}/>{errors.author ? <p className="field-error" id="error-author">{errors.author}</p> : null}
        <label className="field-label" htmlFor="editor-category">Topic</label><select id="editor-category" value={value.category} onChange={event => update("category", event.target.value as Post["category"])}>{CATEGORIES.map(category => <option key={category}>{category}</option>)}</select>
        <fieldset className="cover-picker"><legend className="field-label">Cover</legend><div className="cover-options">{COVERS.map(cover => <button key={cover} onClick={() => update("cover", cover)} aria-label={`${coverNames[cover]} cover`} aria-pressed={value.cover === cover}><CoverArt cover={cover}/><span>{coverNames[cover]}{value.cover === cover ? <span className="cover-selected">Selected</span> : null}</span></button>)}</div></fieldset>
        <p className="input-help editor-help">Drafts stay in your studio. Publishing adds a story to the journal. You can return here to edit it.</p>
      </aside>
    </div>}
  </section>;
}
