import test from "node:test";
import assert from "node:assert/strict";
import {seedPosts} from "../lib/blog/seed.ts";
import {deletePost, filterPosts, parseState, readingMinutes, STORAGE_KEY, storyHref, toggleId, upsertOwnedPost, validatePost, wordCount} from "../lib/blog/model.ts";
import {restoreCollectionStorage} from "../lib/blog/storage.ts";
import {cacheDraft, clearAllDrafts, clearDraft, DRAFT_PREFIX, NEW_DRAFT_KEY, recoverDraft} from "../lib/blog/drafts.ts";
import {parseMarkdown} from "../lib/blog/markdown.ts";
import type {BlogState, Post} from "../lib/blog/types.ts";

const state = (): BlogState => ({version: 1, posts: [...seedPosts], bookmarks: [], liked: [], comments: []});
const own = (): Post => ({...seedPosts[0], id: "my-story", owned: true, likes: 0});

test("search combines case-insensitive terms across titles, authors and body", () => {
  const matches = filterPosts(seedPosts, "MAYA attention", "All stories", "newest");
  assert.deepEqual(matches.map(post => post.id), [seedPosts[0].id]);
  assert.equal(filterPosts(seedPosts, "definitely-no-matches", "All stories", "newest").length, 0);
});
test("category filtering and all sorting modes exclude drafts without mutating input", () => {
  const posts = [...seedPosts, {...own(), status: "draft" as const}];
  const before = [...posts];
  assert.equal(filterPosts(posts, "", "Technology", "newest").length, 2);
  assert.equal(filterPosts(posts, "", "All stories", "popular")[0].likes, 124);
  const newest = filterPosts(posts, "", "All stories", "newest");
  assert.equal(newest.length, 7);
  assert.deepEqual(posts, before);
  const short = filterPosts(posts, "", "All stories", "shortest");
  assert.ok(short.every((post, index) => index === 0 || readingMinutes(short[index - 1].body) <= readingMinutes(post.body)));
});
test("publishing rejects incomplete stories and accepts all editorial seeds", () => {
  assert.equal(Object.keys(validatePost({title: "", excerpt: "", body: "", author: " "})).length, 4);
  seedPosts.forEach(post => assert.deepEqual(validatePost(post), {}));
});
test("create, edit and delete preserve editorial ownership and clean related data", () => {
  const original = state();
  assert.equal(deletePost(original, seedPosts[0].id), original);
  assert.equal(upsertOwnedPost(original, {...seedPosts[0], owned: true}), original);
  const created = upsertOwnedPost(original, own());
  assert.equal(created.posts.length, 8);
  const edited = upsertOwnedPost(created, {...own(), title: "An updated headline"});
  assert.equal(edited.posts.length, 8);
  assert.equal(edited.posts[0].title, "An updated headline");
  const withActivity = {...edited, bookmarks: ["my-story"], liked: ["my-story"], comments: [{id: "comment-1", postId: "my-story", body: "Thoughtful!", name: "Reader", date: new Date().toISOString()}]};
  const deleted = deletePost(withActivity, "my-story");
  assert.equal(deleted.posts.length, 7);
  assert.equal(deleted.comments.length + deleted.bookmarks.length + deleted.liked.length, 0);
});
test("saved state round-trips and rejects malformed or incompatible backups", () => {
  assert.deepEqual(parseState(JSON.stringify(state())), state());
  assert.throws(() => parseState('{"version":2}'));
  assert.throws(() => parseState("not-json"));
  assert.throws(() => parseState(JSON.stringify({...state(), posts: [{...seedPosts[0], category: "Unknown"}]})));
  assert.throws(() => parseState(JSON.stringify({...state(), posts: [seedPosts[0], seedPosts[0]]})));
  assert.throws(() => parseState(JSON.stringify({...state(), comments: [{id: "bad", date: "tomorrow"}]})));
});
test("likes and bookmarks toggle without duplicates", () => {
  assert.deepEqual(toggleId([], "story"), ["story"]);
  assert.deepEqual(toggleId(["story"], "story"), []);
  assert.deepEqual(toggleId(["one"], "two"), ["one", "two"]);
});
test("reading estimates handle empty and long content", () => {
  assert.equal(wordCount(""), 0);
  assert.equal(wordCount(" hello\n world "), 2);
  assert.equal(readingMinutes(""), 1);
  assert.equal(readingMinutes("word ".repeat(401)), 3);
});

class MemoryStorage {
  data = new Map<string, string>();
  get length() {return this.data.size;}
  getItem(key: string) {return this.data.get(key) ?? null;}
  setItem(key: string, value: string) {this.data.set(key, value);}
  removeItem(key: string) {this.data.delete(key);}
  key(index: number) {return [...this.data.keys()][index] ?? null;}
}

test("a failed backup write preserves the previous collection and unfinished edits", () => {
  class FullStorage extends MemoryStorage {
    failWrites = false;
    setItem(key: string, value: string) {
      if (this.failWrites && key === STORAGE_KEY) throw new Error("Quota exceeded");
      super.setItem(key, value);
    }
  }
  const storage = new FullStorage();
  const published = own();
  storage.setItem(STORAGE_KEY, JSON.stringify({...state(), posts: [published]}));
  cacheDraft(storage, {...published, title: "Unpublished revision"}, false);
  cacheDraft(storage, {...own(), id: "unsaved-story"}, true);
  const before = [...storage.data.entries()];
  storage.failWrites = true;
  assert.throws(() => restoreCollectionStorage(storage, state()), /Quota exceeded/);
  assert.deepEqual([...storage.data.entries()], before);
  assert.equal(recoverDraft(storage, published, [published.id])?.title, "Unpublished revision");
});

test("a persisted backup clears editor recovery while retaining unrelated preferences", () => {
  const storage = new MemoryStorage();
  storage.setItem(STORAGE_KEY, JSON.stringify(state()));
  storage.setItem("unrelated-preference", "keep");
  cacheDraft(storage, own(), true);
  storage.setItem(`${DRAFT_PREFIX}new`, JSON.stringify(own()));
  const restored = {...state(), posts: [own()]};
  restoreCollectionStorage(storage, restored);
  assert.deepEqual(parseState(storage.getItem(STORAGE_KEY)!), restored);
  assert.equal(storage.getItem("unrelated-preference"), "keep");
  assert.equal([...storage.data.keys()].some(key => key.startsWith(DRAFT_PREFIX) || key === NEW_DRAFT_KEY), false);
});

test("popular sorting includes the reader's vote and resolves ties by date", () => {
  const older = {...own(), id: "older", likes: 2, date: "2026-01-01"};
  const newer = {...own(), id: "newer", likes: 2, date: "2026-02-01"};
  assert.equal(filterPosts([older, newer], "", "All stories", "popular")[0].id, "newer");
  assert.equal(filterPosts([older, newer], "", "All stories", "popular", ["older"])[0].id, "older");
});

test("backup parsing rejects dates that would crash the studio and duplicate comments", () => {
  const comment = {id: "c", postId: seedPosts[0].id, name: "Reader", body: "A thought", date: "2026-01-01"};
  assert.throws(() => parseState(JSON.stringify({...state(), posts: [{...own(), updatedAt: "not-a-date"}]})));
  assert.throws(() => parseState(JSON.stringify({...state(), comments: [comment, comment]})));
  assert.throws(() => parseState(JSON.stringify({...state(), posts: [{...own(), likes: -1}]})));
});

test("backup restoration removes orphaned activity and duplicate votes", () => {
  const id = seedPosts[0].id;
  const restored = parseState(JSON.stringify({...state(), bookmarks: [id, id, "missing"], liked: [id, id, "missing"], comments: [{id: "orphan", postId: "missing", name: "Reader", body: "Lost story", date: "2026-01-01"}]}));
  assert.deepEqual(restored.bookmarks, [id]);
  assert.deepEqual(restored.liked, [id]);
  assert.deepEqual(restored.comments, []);
});

test("story links encode imported identifiers so punctuation cannot change routing", () => {
  const id = "notes/one # café";
  const href = storyHref("read", id);
  assert.equal(href.split("/").length, 3);
  assert.equal(decodeURIComponent(href.split("/")[2]), id);
});

test("backup identifiers must remain safe to encode when rendering story links", () => {
  for (const id of ["\ud800", "story-\udfff", "\ud800\ud800"]) {
    const post = {...own(), id};
    assert.throws(() => parseState(JSON.stringify({...state(), posts: [post]})), /unsupported format/);
    const original = state();
    assert.equal(upsertOwnedPost(original, post), original);
    const storage = new MemoryStorage();
    cacheDraft(storage, post, true);
    assert.equal(recoverDraft(storage, undefined, []), undefined);
  }
  for (const id of ["notes/one # café", "कहानी-📖", "\ud800\udc00"]) {
    const restored = parseState(JSON.stringify({...state(), posts: [{...own(), id}]}));
    assert.equal(decodeURIComponent(storyHref("read", restored.posts[0].id).split("/")[2]), id);
  }
});

test("new writing recovers only drafts that were never saved into the studio", () => {
  const storage = new MemoryStorage();
  const draft = {...own(), status: "draft" as const};
  cacheDraft(storage, draft, true);
  assert.equal(recoverDraft(storage, undefined, [])?.id, draft.id);
  assert.equal(recoverDraft(storage, undefined, [draft.id]), undefined);
  assert.equal(storage.getItem(NEW_DRAFT_KEY), null);
  assert.ok(storage.getItem(`${DRAFT_PREFIX}${draft.id}`));
});

test("fresh published edits recover without changing the published collection", () => {
  const storage = new MemoryStorage();
  const published = {...own(), date: "2026-01-01T00:00:00.000Z"};
  const edited = {...published, title: "Unpublished changes"};
  cacheDraft(storage, edited, false);
  assert.equal(recoverDraft(storage, published, [published.id])?.title, edited.title);
  assert.equal(published.title, own().title);
  assert.equal(storage.getItem(NEW_DRAFT_KEY), null);
});

test("new writing does not overwrite recovery for an imported story named new", () => {
  const storage = new MemoryStorage();
  const published = {...own(), id: "new"};
  const edited = {...published, title: "Unpublished revision"};
  const unsaved = {...own(), id: "fresh-story", status: "draft" as const};
  cacheDraft(storage, edited, false);
  cacheDraft(storage, unsaved, true);
  assert.equal(recoverDraft(storage, published, [published.id])?.title, edited.title);
  assert.equal(recoverDraft(storage, undefined, [published.id])?.id, unsaved.id);
  clearDraft(storage, published.id);
  assert.equal(recoverDraft(storage, undefined, [published.id])?.id, unsaved.id);
});

test("opening a new editor preserves legacy edits for a story named new", () => {
  const storage = new MemoryStorage();
  const published = {...own(), id: "new"};
  const edited = {...published, title: "Legacy unpublished revision"};
  storage.setItem(`${DRAFT_PREFIX}new`, JSON.stringify(edited));
  assert.equal(recoverDraft(storage, undefined, [published.id]), undefined);
  assert.equal(recoverDraft(storage, published, [published.id])?.title, edited.title);
});

test("legacy new-session recovery remains available and clears after saving", () => {
  const storage = new MemoryStorage();
  const draft = {...own(), status: "draft" as const};
  storage.setItem(`${DRAFT_PREFIX}new`, JSON.stringify(draft));
  assert.equal(recoverDraft(storage, undefined, [])?.id, draft.id);
  clearDraft(storage, draft.id);
  assert.equal(storage.getItem(`${DRAFT_PREFIX}new`), null);
});

test("saving or deleting a draft clears its recovery alias but preserves other writing", () => {
  const storage = new MemoryStorage();
  const first = own();
  const second = {...own(), id: "another-story"};
  cacheDraft(storage, first, true);
  cacheDraft(storage, second, false);
  clearDraft(storage, first.id);
  assert.equal(storage.getItem(NEW_DRAFT_KEY), null);
  assert.equal(recoverDraft(storage, undefined, []), undefined);
  assert.equal(recoverDraft(storage, second, [second.id])?.id, second.id);
});

test("older editor recovery cannot overwrite a newly restored collection", () => {
  const storage = new MemoryStorage();
  const draft = own();
  storage.setItem(`${DRAFT_PREFIX}${draft.id}`, JSON.stringify({...draft, title: "Old cached text", updatedAt: "2026-01-01"}));
  assert.equal(recoverDraft(storage, {...draft, updatedAt: "2026-02-01"}, [draft.id]), undefined);
  assert.equal(storage.getItem(`${DRAFT_PREFIX}${draft.id}`), null);
  cacheDraft(storage, draft, true);
  storage.setItem("unrelated-preference", "keep");
  clearAllDrafts(storage);
  assert.deepEqual([...storage.data.entries()], [["unrelated-preference", "keep"]]);
});

test("Markdown headings and lists do not consume adjacent prose", () => {
  assert.deepEqual(parseMarkdown("## Heading\nFirst paragraph\n- One\n- Two\nLast paragraph"), [
    {type: "heading", text: "Heading"}, {type: "paragraph", text: "First paragraph"},
    {type: "list", items: ["One", "Two"]}, {type: "paragraph", text: "Last paragraph"}
  ]);
  assert.deepEqual(parseMarkdown("> First\r\n> Second\r\n\r\n> Separate\r\n<script>alert(1)</script>"), [
    {type: "quote", text: "First\nSecond"}, {type: "quote", text: "Separate"}, {type: "paragraph", text: "<script>alert(1)</script>"}
  ]);
});


test("invalid editor updates cannot corrupt the saved collection", () => {
  const original = {version: 1 as const, posts: [own()], bookmarks: [], liked: [], comments: []};
  for (const patch of [{title: "x".repeat(121)}, {body: "x".repeat(50001)}, {author: "x".repeat(61)}, {date: "invalid"}, {likes: -1}]) {
    assert.equal(upsertOwnedPost(original, {...own(), ...patch}), original);
  }
});
