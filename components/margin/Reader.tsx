"use client";
import { useEffect, useRef, useState } from "react";
import type { Comment, Post } from "@/lib/blog/types";
import { formatDate, readingMinutes, storyHref } from "@/lib/blog/model";
import CoverArt from "./CoverArt";
import Markdown from "./Markdown";
import StoryRow from "./StoryRow";

type Props = {post: Post; comments: Comment[]; related: Post[]; bookmarks: string[]; liked: boolean; onBookmark: (id: string) => void; onLike: (id: string) => void; onComment: (comment: Comment) => void; onDeleteComment: (id: string) => void; onShare: () => void};

export default function Reader({post, comments, related, bookmarks, liked, onBookmark, onLike, onComment, onDeleteComment, onShare}: Props) {
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const progress = useRef<HTMLDivElement>(null);
  const article = useRef<HTMLElement>(null);
  useEffect(() => {
    const update = () => {
      const bottom = (article.current?.getBoundingClientRect().bottom ?? 0) + window.scrollY;
      const total = Math.max(1, bottom - window.innerHeight);
      progress.current?.style.setProperty("--reading-progress", `${Math.min(100, Math.max(0, window.scrollY / total * 100))}%`);
    };
    update();
    window.addEventListener("scroll", update, {passive: true});
    window.addEventListener("resize", update);
    return () => {window.removeEventListener("scroll", update); window.removeEventListener("resize", update);};
  }, [post.id, post.body]);
  function submit(event: React.FormEvent) {
    event.preventDefault();
    const issues: Record<string, string> = {};
    if (!name.trim()) issues.name = "Enter your name.";
    if (body.trim().length < 3) issues.body = "Write a comment of at least 3 characters.";
    setErrors(issues);
    if (Object.keys(issues).length) {document.getElementById(`comment-${Object.keys(issues)[0]}`)?.focus(); return;}
    onComment({id: crypto.randomUUID(), postId: post.id, name: name.trim(), body: body.trim(), date: new Date().toISOString()});
    setBody("");
  }
  const saved = bookmarks.includes(post.id);
  return <div className="reader-page page-enter">
    <div ref={progress} className="reading-progress" aria-hidden="true"/>
    <div className="page-topline"><a className="back-link" href="#/explore">All stories</a><button className="text-button" onClick={onShare}>{post.owned ? "Download story" : "Share story"}</button></div>
    <article ref={article} className="reader-article">
      <header className="article-heading"><p className="section-label category-label">{post.category}</p><h1>{post.title}</h1><p className="reader-deck">{post.excerpt}</p><div className="article-byline"><div className="post-meta"><strong>{post.author}</strong><time dateTime={post.date}>{formatDate(post.date)}, {new Date(post.date).getUTCFullYear()}</time><span>{readingMinutes(post.body)} min read</span></div><button className="bookmark-action" onClick={() => onBookmark(post.id)} aria-pressed={saved}>{saved ? "Saved to reading list" : "Save for later"}</button></div></header>
      <CoverArt cover={post.cover} className="reader-cover"/>
      <Markdown text={post.body}/>
      <div className="article-actions"><button className={`button button-outline ${liked ? "is-liked" : ""}`} onClick={() => onLike(post.id)} aria-pressed={liked}>{liked ? "Liked" : "Like story"}<span className="reaction-count">{post.likes + Number(liked)}</span></button><button className="button button-quiet" onClick={() => onBookmark(post.id)} aria-pressed={saved}>{saved ? "Saved to reading list" : "Save for later"}</button>{post.owned ? <a className="button button-quiet" href={storyHref("write", post.id)}>Edit story</a> : null}</div>
    </article>
    <section className="comments-section" aria-labelledby="comments-heading"><div className="section-heading"><h2 id="comments-heading">Comments</h2><span className="result-count">{comments.length}</span></div><p className="section-description">Leave a thought or a question about this story.</p>
      <form onSubmit={submit} noValidate className="comment-form"><label className="field-label" htmlFor="comment-name">Your name</label><input id="comment-name" value={name} onChange={event => {setName(event.target.value); setErrors(current => ({...current, name: ""}));}} maxLength={50} autoComplete="name" required aria-invalid={!!errors.name} aria-describedby={errors.name ? "comment-name-error" : undefined}/>{errors.name ? <p className="field-error" id="comment-name-error">{errors.name}</p> : null}<label className="field-label" htmlFor="comment-body">Comment</label><textarea id="comment-body" value={body} onChange={event => {setBody(event.target.value); setErrors(current => ({...current, body: ""}));}} maxLength={2000} rows={4} required minLength={3} aria-invalid={!!errors.body} aria-describedby={errors.body ? "comment-body-error comment-storage" : "comment-storage"}/>{errors.body ? <p className="field-error" id="comment-body-error">{errors.body}</p> : null}<div className="comment-form-bottom"><span id="comment-storage" className="input-help">Comments are saved on this device.</span><button className="button button-primary" type="submit">Post comment</button></div></form>
      {comments.length ? <div className="comments-list">{comments.map(comment => <article className="comment" key={comment.id}><div className="comment-top"><strong>{comment.name}</strong><time dateTime={comment.date}>{formatDate(comment.date)}</time><button className="text-button danger-text" onClick={() => onDeleteComment(comment.id)}>Remove<span className="sr-only"> comment by {comment.name}</span></button></div><p>{comment.body}</p></article>)}</div> : <p className="no-comments">No comments yet.</p>}
    </section>
    {related.length ? <section className="related-section"><div className="section-heading"><h2>More to read</h2><a href="#/explore" className="text-button">All stories</a></div><div className="story-list">{related.map(item => <StoryRow key={item.id} post={item} bookmarked={bookmarks.includes(item.id)} onBookmark={onBookmark}/>)}</div></section> : null}
  </div>;
}
