import { useState } from "react";
import type { Post } from "@/lib/blog/types";
import { formatDate, readingMinutes, storyHref } from "@/lib/blog/model";
import CoverArt from "./CoverArt";
import EmptyState from "./EmptyState";

type Props = {posts: Post[]; onWrite: () => void; onDelete: (post: Post) => void; onExport: () => void; onImport: () => void};

export default function Studio({posts, onWrite, onDelete, onExport, onImport}: Props) {
  const [filter, setFilter] = useState("All stories");
  const owned = posts.filter(post => post.owned);
  const published = owned.filter(post => post.status === "published").length;
  const filtered = owned.filter(post => filter === "All stories" || post.status === (filter === "Drafts" ? "draft" : "published"));
  return <section className="studio-page page-enter">
    <div className="studio-intro"><div><p className="section-label">Your writing</p><h1>My studio.</h1><p className="intro-copy">Write, revise, and publish your stories.</p></div><button className="button button-primary" onClick={onWrite}>New story</button></div>
    <div className="studio-summary"><p>{published} published <span>/</span> {owned.length - published} drafts</p><div className="button-row"><button className="text-button" onClick={onExport}>Export collection</button><button className="text-button" onClick={onImport}>Import backup</button></div></div>
    <div className="topic-tabs" role="group" aria-label="Filter your stories">{["All stories", "Published", "Drafts"].map(option => <button key={option} aria-pressed={filter === option} onClick={() => setFilter(option)}>{option}</button>)}</div>
    {filtered.length ? <div className="studio-list">{filtered.map(post => <article className="studio-story" key={post.id}>
      <a className="studio-cover" href={storyHref(post.status === "draft" ? "write" : "read", post.id)} tabIndex={-1} aria-hidden="true"><CoverArt cover={post.cover}/></a>
      <div className="studio-story-text"><span className="story-status">{post.status === "draft" ? "Draft" : "Published"}</span><h2><a href={storyHref(post.status === "draft" ? "write" : "read", post.id)}>{post.title || "Untitled story"}</a></h2><div className="post-meta"><span>{post.category}</span><time dateTime={post.updatedAt ?? post.date}>{formatDate(post.updatedAt ?? post.date)}</time><span>{readingMinutes(post.body)} min read</span></div></div>
      <div className="studio-story-actions"><a className="text-button" href={storyHref("write", post.id)}>Edit<span className="sr-only"> {post.title || "untitled story"}</span></a><button className="text-button danger-text" onClick={() => onDelete(post)}>Delete<span className="sr-only"> {post.title || "untitled story"}</span></button></div>
    </article>)}</div> : <EmptyState title={filter === "Published" ? "No published stories yet." : filter === "Drafts" ? "No drafts yet." : "Start with your first story."} detail={filter === "Published" ? "Open a draft to finish and publish it." : "Your writing will appear here. Unfinished stories save as drafts."} action="Write a story" onAction={onWrite}/>}
    <p className="studio-storage-note">Your collection is saved on this device. Export a backup to keep a copy or use it elsewhere.</p>
  </section>;
}
