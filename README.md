# Resume Template & Editor

A minimalist, client-first **Resume Template & Editor** built with Next.js 16. Edit your resume inline, store a 512×512 WebP profile photo in IndexedDB, export/import JSON, print plain or visual PDFs, and optionally connect an AI assistant over **MCP (Model Context Protocol)** with zero server-side disk persistence.

---

## Features & How to Use

### 1. Inline Editing

- **Header & About:** Click **Edit** in the header to update your name, headline, contact info (location, email, phone, website, LinkedIn, GitHub), and professional summary. Changes commit on blur or when clicking **Done**.
- **Profile Picture:** Click the circular avatar to upload an image. It is center-cropped and compressed in the browser to a **512×512 WebP `Blob` (80% quality)** and stored directly in IndexedDB. Hover/focus the avatar and click **×** to remove it (with confirmation).
- **Experience & Education:** Add, edit, reorder, or delete entries and bullet points inline. Month/year badges use native month pickers (`YYYY-MM` or `Present`).
- **Skills:** Add skills with autocomplete and automatic alias normalization (e.g., `css` → `CSS3`), drag pills to reorder them, or use **Reorder skills** and the move buttons with a keyboard or touchscreen.

### 2. Local Persistence & History

- Edits are managed in **Zustand** with a **50-step Undo / Redo** stack.
- Manual and MCP edits share the same history and **IndexedDB** save queue. Writes use a **1-second debounce** and are flushed when the page goes into the background. The editor reports when a write succeeds and offers retry and JSON download if it fails.
- **Import / Save / Reset:** Use the toolbar to **Import** a resume `.json` file, with field-level feedback for invalid data. **Save** exports the current resume as JSON. **Reset** restores the starter template and clears local history and the avatar after confirmation. On narrow screens, look in **More actions** for Import, Save, MCP, and Reset.

### 3. Print / PDF Export

Click **Print / PDF** in the toolbar to choose between two print modes:

- **Printer-Ready:** Flat, high-contrast text layout designed for ATS readability with empty fields/sections and editor controls hidden.
- **Editor-Like View:** Preserves the on-screen card styling, pills, and visual accents (`html[data-print-mode="visual"]`).

---

## Tech Stack

| Layer             | Technology                                                                                                        |
| ----------------- | ----------------------------------------------------------------------------------------------------------------- |
| Framework         | Next.js 16 (App Router, Turbopack, Cache Components), React 19, TypeScript 5                                      |
| Styling           | SCSS Modules, `lucide-react`                                                                                      |
| State & Storage   | Zustand, `idb-keyval` (IndexedDB), `lodash-es`                                                                    |
| API & Docs        | Hono (`@hono/zod-openapi`), Zod (payload validation & OpenAPI schemas), Scalar (`/api/docs`, `/api/openapi.json`) |
| MCP Server        | `@modelcontextprotocol/sdk`, Zod                                                                                  |
| Quality & Testing | Vitest, Testing Library, ESLint, Prettier, Husky (`pre-commit`)                                                   |

---

## MCP Connection (Optional AI Integration)

You can let an MCP-compatible AI client read and update your resume live in the browser:

1. Click **MCP** in the toolbar to start an ephemeral session.
2. Reveal/copy your session bearer token and the MCP endpoint URL:
   ```text
   POST http://localhost:3000/api/mcp
   Authorization: Bearer <your-session-token>
   ```
3. Keep the editor tab open. The browser owns the resume, and the server relays read and edit commands to one connected tab. The agent should call `get_resume` first and include its returned `revision` with edits.

### Security & Privacy

- The server keeps session and command relay state in RAM with a **4-hour inactivity timeout**. Only the editor's browser credential can connect the command stream and acknowledge commands.
- The token is never written to `resume.json` or IndexedDB.
- You can disconnect/revoke the session at any time from the MCP modal.

### Available MCP Tools

- `get_resume` — Read the current session resume JSON.
- `update_profile` — Update `name`, `headline`, `summary`, and `contact` fields.
- `upsert_experience` / `delete_experience` — Add, update, or delete experience entries by `id`.
- `upsert_education` / `delete_education` — Add, update, or delete education entries by `id`.
- `add_skills` / `remove_skills` — Add skills (auto-resolving catalog aliases) or remove skills by name.

Edits preserve unrelated browser changes. When a targeted field changed after the supplied revision, the editor rejects the whole request and returns the conflicting fields. An `applied` response means the editor accepted the change. Read `saveStatus` to see whether IndexedDB has confirmed it. A disconnected editor cannot accept edits.

### API Endpoints

- `POST /api/session` / `DELETE /api/session` — Create or disconnect an MCP session.
- `GET /api/resume` ? Read the live editor resume and its revision in the ETag. Returns 503 when the editor is unavailable.
- `GET /api/resume/events` ? Connect the browser to the command stream.
- `POST /api/resume/commands/{id}/result` ? Acknowledge a command from the connected editor.
- `POST /api/mcp` — Streamable HTTP MCP endpoint.
- `GET /api/openapi.json` & `GET /api/docs` — OpenAPI 3.1 spec and Scalar API reference.

---

## Getting Started

### Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Scripts

- `npm run dev` — Start the Next.js development server.
- `npm run build` — Create a standalone production build.
- `npm run start` — Start the production server.
- `npm run check` — Run `format:check`, `lint`, `test`, and `build` (also enforced by Husky `pre-commit`).
- `npm run lint` — Run ESLint and the `<250` code-lines check (`scripts/check-file-lines.mjs`).
- `npm run test` — Run Vitest test suites.
- `npm run format` — Format all files with Prettier.

### Docker

```bash
docker compose up --build
```

The app will be available at [http://localhost:3000](http://localhost:3000).
