import type { RefObject } from "react";
import { CATEGORIES, type BlogState, type Sort } from "@/lib/blog/types";
import { filterPosts, formatDate, readingMinutes, storyHref } from "@/lib/blog/model";
import CoverArt from "./CoverArt";
import StoryRow from "./StoryRow";
import EmptyState from "./EmptyState";

type Props = {
  state: BlogState; collection: boolean; query: string; category: string; sort: Sort; limit: number;
  searchRef: RefObject<HTMLInputElement | null>;
  onQuery: (value: string) => void; onCategory: (value: string) => void; onSort: (value: Sort) => void;
  onMore: () => void; onClear: () => void; onBookmark: (id: string) => void; onExplore: () => void;
};

export default function Explore({state, collection, query, category, sort, limit, searchRef, onQuery, onCategory, onSort, onMore, onClear, onBookmark, onExplore}: Props) {
  const published = state.posts.filter(post => post.status === "published");
  const featured = published.find(post => post.id === "the-quiet-art-of-paying-attention") ?? filterPosts(published, "", "All stories", "newest")[0];
  const hasFilters = Boolean(query.trim() || category !== "All stories");
  const showFeatured = !collection && !hasFilters && sort === "newest" && Boolean(featured);
  const source = collection ? state.posts.filter(post => state.bookmarks.includes(post.id)) : state.posts;
  const results = filterPosts(source, query, category, sort, state.liked);
  const shown = showFeatured ? results.filter(post => post.id !== featured?.id) : results;
  const popular = filterPosts(published, "", "All stories", "popular", state.liked).slice(0, 3);

  return <div className="page-enter">
    <section className="journal-intro">
      <div><p className="section-label">{collection ? "Reading list" : "Design · Technology · Everyday life"}</p><h1>{collection ? "Kept for later." : "The journal."}</h1></div>
      <p>{collection ? "The stories you want to return to. Everything you save is collected here." : "A place to read something thoughtful, follow an idea, and put your own experience into words."}</p>
    </section>
    {showFeatured && featured ? <section className="featured-story" aria-labelledby="featured-title">
      <a className="featured-art" href={storyHref("read", featured.id)} tabIndex={-1} aria-hidden="true"><CoverArt cover={featured.cover}/></a>
      <div className="featured-content">
        <p className="section-label">Featured story <span className="label-separator">/</span> <span className="category-label">{featured.category}</span></p>
        <h2 id="featured-title"><a href={storyHref("read", featured.id)}>{featured.title}</a></h2>
        <p className="featured-excerpt">{featured.excerpt}</p>
        <div className="post-meta"><span>{featured.author}</span><time dateTime={featured.date}>{formatDate(featured.date)}</time><span>{readingMinutes(featured.body)} min read</span></div>
        <div className="featured-actions"><a className="read-link" href={storyHref("read", featured.id)}>Read story</a><button className="bookmark-action" onClick={() => onBookmark(featured.id)} aria-pressed={state.bookmarks.includes(featured.id)}>{state.bookmarks.includes(featured.id) ? "Saved to reading list" : "Save for later"}</button></div>
      </div>
    </section> : null}
    <section className="discovery" aria-labelledby="stories-heading">
      <div className="discovery-heading"><h2 id="stories-heading">{collection ? "Saved stories" : hasFilters ? "Search the journal" : showFeatured ? "Latest stories" : "All stories"}</h2><span className="result-count" aria-live="polite">{shown.length} {shown.length === 1 ? "story" : "stories"}</span></div>
      <div className="discovery-controls">
        <div className="search-field"><label className="sr-only" htmlFor="story-search">Search stories, authors, or topics</label><input id="story-search" ref={searchRef} type="search" value={query} onChange={event => onQuery(event.target.value)} placeholder="Search stories, authors, or topics"/>{query ? <button className="text-button" onClick={() => onQuery("")}>Clear</button> : <kbd aria-hidden="true">/</kbd>}</div>
        <label className="sort-label" htmlFor="story-sort">Sort<select id="story-sort" value={sort} onChange={event => onSort(event.target.value as Sort)}><option value="newest">Newest first</option><option value="popular">Most liked</option><option value="shortest">Quick reads</option></select></label>
      </div>
      <div className="topic-tabs" role="group" aria-label="Filter by topic">{["All stories", ...CATEGORIES].map(topic => <button key={topic} onClick={() => onCategory(topic)} aria-pressed={category === topic}>{topic}</button>)}</div>
      <div className={`stories-layout ${collection ? "collection-layout" : ""}`}>
        <div className="story-list">
          {shown.length ? <>
            {shown.slice(0, limit).map(post => <StoryRow key={post.id} post={post} bookmarked={state.bookmarks.includes(post.id)} onBookmark={onBookmark}/>)}
            {shown.length > limit ? <button className="button button-outline load-more" onClick={onMore}>Show more stories</button> : <p className="end-note">{collection ? "Your reading list is up to date." : "That’s the latest from the journal."}</p>}
          </> : hasFilters ? <EmptyState title="No matching stories." detail="Try a different search or choose another topic." action="Clear search and filters" onAction={onClear}/> : <EmptyState title={collection ? "Your reading list is empty." : "No published stories yet."} detail={collection ? "Choose Save on a story to keep it here." : "Published stories will appear in the journal."} action="Browse the journal" onAction={onExplore}/>}
        </div>
        {!collection ? <aside className="discovery-sidebar">
          <section aria-labelledby="topics-heading"><h3 id="topics-heading">Browse by topic</h3><div className="topic-index">{CATEGORIES.map(topic => <button key={topic} onClick={() => {onCategory(topic); document.getElementById("stories-heading")?.scrollIntoView({behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start"});}}><span>{topic}</span><span>{published.filter(post => post.category === topic).length}</span></button>)}</div></section>
          <section className="popular-stories" aria-labelledby="popular-heading"><h3 id="popular-heading">Most liked</h3><ol>{popular.map(post => <li key={post.id}><a href={storyHref("read", post.id)}>{post.title}</a><p>{post.category} · {post.likes + Number(state.liked.includes(post.id))} likes</p></li>)}</ol></section>
          <p className="sidebar-caption">New perspectives are always welcome. <a href="#/write">Write a story.</a></p>
        </aside> : null}
      </div>
    </section>
  </div>;
}
