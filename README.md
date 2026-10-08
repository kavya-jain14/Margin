# Margin

A responsive blog management platform built for the **Technical Department Frontend Development recruitment task, 2026–27**. Readers can discover and save stories; writers can create drafts, preview their work, and manage published posts.

- **Repository:** [github.com/kavya-jain14/Margin](https://github.com/kavya-jain14/Margin)
- **Deployed preview:** [Open Margin](https://margin-blog-kavya.kavyajain1407dtydhtb.chatgpt.site)
- **Track:** Frontend Development

> The deployed preview currently has owner-only access. Reviewer access must be enabled before submitting the recruitment form.

## Task requirements

| Requirement | Implementation |
| --- | --- |
| Explore posts with relevant details | Journal with covers, titles, introductions, authors, topics, dates, and reading estimates |
| Read individual posts | Dedicated reader with formatted article content, reading progress, and related stories |
| Search or filter content | Search across titles, authors, introductions, topics, and bodies; topic filters and three sorting modes |
| Create and manage posts | My studio with create, edit, preview, publish, move to draft, and delete actions |
| Handle application states | No results, empty reading list, empty studio, unavailable stories, validation errors, and storage recovery messages |
| Responsive experience | Desktop, tablet, and mobile layouts with wrapping controls and readable text |

### Bonus features

- React.js with TypeScript.
- Persistent light and dark modes.
- Bookmarks and likes, including your local vote in popularity sorting.
- Comments with validation and removal.
- Subtle transitions with reduced-motion support.
- Draft autosave and recovery, word count, six cover choices, and a Markdown preview.
- Collection backup export/import and Markdown downloads for your own stories.
- Keyboard search shortcut (`/`), visible focus states, a skip link, and accessible dialogs.

## Design

Margin uses warm paper, olive accents, serif headings, and a flat editorial layout. Article rows and dividers create hierarchy without turning every section into a card. Controls use text labels, and decorative filler is kept out of the reading and writing flows.

Body and input text starts at 16 px, actions at 14 px, and metadata at 13 px. Sizes use relative units so browser text preferences still work. Long titles, filter controls, and metadata wrap on smaller screens.

## Technology stack

| Layer | Technology |
| --- | --- |
| User interface | React 19, TypeScript |
| Build tool | Vite 8 with the React plugin |
| Styling | Custom responsive CSS and Tailwind's build integration |
| State and persistence | React hooks and versioned browser localStorage |
| Navigation | URL hashes, including encoded story identifiers |
| Article formatting | Small Markdown parser rendered with safe React elements |
| Illustrations | Original inline SVG covers |
| Testing | Node.js built-in test runner |
| Automation | GitHub Actions for type checking, tests, and production builds |

No external API, database, or API key is required.

## Setup and installation

Use **Node.js 22.13 or newer** and npm. Node.js 24 is supported and used by the CI workflow.

```bash
git clone https://github.com/kavya-jain14/Margin.git
cd Margin
npm ci
npm run dev
```

Open the URL printed by Vite, normally `http://localhost:5173`.

### Build, test, and preview

```bash
npm run typecheck
npm test
npm run build
npm run preview
```

The production build is written to `dist-static/`. The `dev:static`, `build:static`, and `preview:static` scripts are aliases for the same standalone app.

### Hosting

The app can be served by any static host. Its routes use URL hashes, so opening a story directly or refreshing does not require server rewrite rules.

| Setting | Value |
| --- | --- |
| Framework | Vite |
| Installation | `npm ci` |
| Build | `npm run build` |
| Published directory | `dist-static` |
| Environment variables | None required |

`vercel.json` includes the matching settings for a GitHub import. For Render, create a Static Site from this repository with `npm ci && npm run build` and publish `dist-static`.

## Data source and storage

The seven sample stories are original demo content in `lib/blog/seed.ts`. Their authors are fictional. Covers are original SVG illustrations; no stock image service is used.

Your posts, comments, bookmarks, likes, and theme preference are stored on the current browser and origin. Publishing adds a story to that browser's journal. It does **not** upload it to a shared database or make another reader's collection change.

Sample-story links work wherever the application is available. For your own writing, use **Download story** to share Markdown, or **Export collection** and **Import backup** to move the complete collection between devices. Each domain has its own saved collection.

The local ownership flag controls the demo's editing flow. It is not server authorization. A shared production blog would need authenticated APIs, server-side permissions, and durable storage.

Backups use a versioned schema. Invalid dates, unsupported records, and duplicate identifiers are rejected. Orphaned activity is removed and duplicate bookmarks or likes are normalized. An unreadable local collection is preserved for recovery before replacement; blocked or full storage produces a visible message.

## Project structure

```text
components/margin/   Header, journal, reading list, studio, reader, editor, dialogs
lib/blog/           Types, sample content, state operations, drafts, Markdown, persistence
app/globals.css     Shared light/dark styling and responsive layouts
tests/              Behavior and recovery tests
public/             Favicon
.github/workflows/  Automated checks
client.tsx          React entry point
index.html          HTML entry point and initial theme selection
vite.static.config.ts  Build configuration and import alias
```

## Challenges faced and solutions

**Draft recovery without changing a live story.** Drafts autosave into the studio. Edits to a published story stay in a separate recovery copy until Update story is selected. A new writing session starts blank when explicitly requested, including when the previous autosave is still pending. Save, delete, and backup restore clear the matching recovery data.

**Keeping related data consistent.** Deleting a post also removes its comments, bookmarks, and likes. Backup parsing validates update dates and unique identifiers so malformed data cannot crash the studio or overwrite a newer restored post with older cached text.

**Responsive typography and layout.** Small labels were replaced with a consistent readable scale. Article metadata sits in a wrapping row, editor titles and introductions grow with their text, and the reading indicator follows the measured header height.

**Rendering user writing safely.** The Markdown parser handles headings, bold text, lists, and quotes using React elements. It escapes raw HTML, and a heading no longer consumes the paragraph immediately after it.

**Accurate discovery results.** The featured story appears separately only in the default journal view. Sorting or searching returns it as an ordinary result without duplication, and popularity includes the current reader's like.

## Verification

The 16 automated tests cover search, filters and sorting, local popularity votes, publication validation, ownership boundaries, create/edit/delete, related-data cleanup, backup validation, draft recovery and cache cleanup, encoded links, Markdown boundaries, bookmarks/likes, and reading estimates.

The application has passed TypeScript checking and a production build. Interactive browser visual QA was unavailable during implementation; the walkthrough below also provides a manual evaluation path.

## Evaluation walkthrough

1. Browse the journal, filter Technology, and search for a title or author.
2. Read a story, save it, toggle a like, and add a comment.
3. Open Reading list and confirm the saved story is present.
4. Choose Write a story. Add a title, introduction, author, and at least 20 words.
5. Preview, publish, and find the story in My studio and the journal.
6. Edit it, move it to drafts, reopen it, and publish it again.
7. Refresh to check persistence, then export and restore a backup.
8. Search for an unmatched term and open `#/read/missing` to check recovery states.
9. Switch themes and review the layout at mobile and desktop widths.

Built by **Kavya Jain** for the 2026–27 recruitment task.
