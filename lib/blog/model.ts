import { CATEGORIES, COVERS, type BlogState, type Post, type Sort } from "./types.ts";

export const STORAGE_KEY = "margin.blog.v1";
export const THEME_KEY = "margin.theme.v1";
export function wordCount(text: string): number { return text.trim() ? text.trim().split(/\s+/).length : 0; }
export function readingMinutes(text: string): number { return Math.max(1, Math.ceil(wordCount(text) / 200)); }
export function formatDate(date: string): string {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(date));
}
export function toggleId(ids: string[], id: string): string[] { return ids.includes(id) ? ids.filter(value => value !== id) : [...ids, id]; }
export function storyHref(page: "read" | "write", id: string): string { return `#/${page}/${encodeURIComponent(id)}`; }
export function filterPosts(posts: Post[], query: string, category: string, sort: Sort, liked: string[] = []): Post[] {
  const terms = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  const votes = new Set(liked);
  return posts.filter(post => post.status === "published" && (category === "All stories" || post.category === category) && terms.every(term => `${post.title} ${post.excerpt} ${post.author} ${post.category} ${post.body}`.toLocaleLowerCase().includes(term)))
    .sort((a, b) => sort === "popular" ? (b.likes + Number(votes.has(b.id))) - (a.likes + Number(votes.has(a.id))) || Date.parse(b.date) - Date.parse(a.date) : sort === "shortest" ? readingMinutes(a.body) - readingMinutes(b.body) : Date.parse(b.date) - Date.parse(a.date));
}
export function validatePost(post: Pick<Post, "title" | "excerpt" | "body" | "author">): Record<string, string> {
  const errors: Record<string, string> = {};
  if (post.title.trim().length < 3) errors.title = "Give your story a title of at least 3 characters.";
  if (post.title.length > 120) errors.title = "Keep your title under 120 characters.";
  if (post.excerpt.trim().length < 10) errors.excerpt = "Add a short introduction of at least 10 characters.";
  if (post.excerpt.length > 240) errors.excerpt = "Keep your introduction under 240 characters.";
  if (wordCount(post.body) < 20) errors.body = "Write at least 20 words before publishing.";
  if (!post.author.trim()) errors.author = "Add your name so readers know who wrote this.";
  return errors;
}
export function isPost(value: unknown): value is Post {
  if (!value || typeof value !== "object") return false;
  const p = value as Post;
  return typeof p.id === "string" && p.id.length > 0 && typeof p.title === "string" && p.title.length <= 120 && typeof p.excerpt === "string" && p.excerpt.length <= 240 && typeof p.body === "string" && p.body.length <= 50000 && typeof p.author === "string" && p.author.length <= 60 && typeof p.owned === "boolean" && Number.isSafeInteger(p.likes) && p.likes >= 0 && typeof p.date === "string" && Number.isFinite(Date.parse(p.date)) && (p.updatedAt === undefined || (typeof p.updatedAt === "string" && Number.isFinite(Date.parse(p.updatedAt)))) && CATEGORIES.includes(p.category) && COVERS.includes(p.cover) && ["published", "draft"].includes(p.status);
}
export function parseState(raw: string): BlogState {
  const state = JSON.parse(raw) as BlogState;
  if (!state || state.version !== 1 || !Array.isArray(state.posts) || !state.posts.every(isPost) || !Array.isArray(state.bookmarks) || !state.bookmarks.every(id => typeof id === "string") || !Array.isArray(state.liked) || !state.liked.every(id => typeof id === "string") || !Array.isArray(state.comments) || !state.comments.every(c => c && typeof c.id === "string" && c.id.length > 0 && typeof c.postId === "string" && typeof c.name === "string" && c.name.length <= 50 && typeof c.body === "string" && c.body.length <= 2000 && typeof c.date === "string" && Number.isFinite(Date.parse(c.date)))) {
    throw new Error("This saved collection has an unsupported format.");
  }
  if (new Set(state.posts.map(p => p.id)).size !== state.posts.length) throw new Error("Duplicate story identifiers.");
  if (new Set(state.comments.map(c => c.id)).size !== state.comments.length) throw new Error("Duplicate comment identifiers.");
  const ids = new Set(state.posts.map(post => post.id));
  return {...state, bookmarks: [...new Set(state.bookmarks)].filter(id => ids.has(id)), liked: [...new Set(state.liked)].filter(id => ids.has(id)), comments: state.comments.filter(comment => ids.has(comment.postId))};
}
export function deletePost(state: BlogState, id: string): BlogState {
  if (!state.posts.some(p => p.id === id && p.owned)) return state;
  return { ...state, posts: state.posts.filter(p => p.id !== id), bookmarks: state.bookmarks.filter(value => value !== id), liked: state.liked.filter(value => value !== id), comments: state.comments.filter(c => c.postId !== id) };
}
export function upsertOwnedPost(state: BlogState, post: Post): BlogState {
  if (!post.owned || state.posts.some(p => p.id === post.id && !p.owned)) return state;
  return { ...state, posts: state.posts.some(p => p.id === post.id) ? state.posts.map(p => p.id === post.id ? post : p) : [post, ...state.posts] };
}
