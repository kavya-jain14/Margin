import type { Post } from "@/lib/blog/types";
import { formatDate, readingMinutes, storyHref } from "@/lib/blog/model";
import CoverArt from "./CoverArt";

export default function StoryRow({post, bookmarked, onBookmark}: {post: Post; bookmarked: boolean; onBookmark: (id: string) => void}) {
  return <article className="story-row">
    <a className="story-image" href={storyHref("read", post.id)} tabIndex={-1} aria-hidden="true"><CoverArt cover={post.cover}/></a>
    <div className="story-row-content">
      <div className="row-topline"><span className="category-label">{post.category}</span><button className="bookmark-action" onClick={() => onBookmark(post.id)} aria-label={`${bookmarked ? "Remove bookmark for" : "Save"} ${post.title}`} aria-pressed={bookmarked}>{bookmarked ? "Saved" : "Save"}</button></div>
      <h3><a href={storyHref("read", post.id)}>{post.title}</a></h3>
      <p className="story-excerpt">{post.excerpt}</p>
      <div className="post-meta"><span>{post.author}</span><time dateTime={post.date}>{formatDate(post.date)}</time><span>{readingMinutes(post.body)} min read</span></div>
    </div>
  </article>;
}
