# CasaHub — Agent & contributor instructions

This file is the source of truth for agents, AI tools, and contributors working on this repository.
Read it before opening any issue or writing any code.

---

## Development workflow

- **One issue → one branch → one PR.** Never bundle unrelated changes.
- Always start from an up-to-date `main`:

  ```bash
  git checkout main
  git pull --ff-only
  ```

- Branch naming: `type/issue-number-short-description`
  Examples: `feat/4-grocery-screen`, `fix/12-nav-active-state`, `docs/21-root-project-instructions`

- Keep changes **strictly scoped** to the issue. Do not modify unrelated files.

- Before requesting review, run both checks from the repository root:

  ```bash
  npm run lint
  npm run build
  ```

  Both must pass without errors.

- PR title: short, imperative, prefixed by type (`feat:`, `fix:`, `docs:`, `refactor:`…).
- PR description must include `Closes #<issue-number>`.

- After merge, delete the remote branch and the local branch:

  ```bash
  git checkout main
  git pull --ff-only
  git branch -d <branch-name>
  git push origin --delete <branch-name>
  ```

---

## Design handoff — read this for every UI issue

Before implementing any screen or component, read the following references in order:

1. **[docs/design/README-design.md](docs/design/README-design.md)** — overview, file list, design tokens summary, typography, responsive breakpoint.
2. **[docs/design/tokens.md](docs/design/tokens.md)** — CSS variable names and their values; use these, never hardcode hex values.
3. **[docs/design/handoff/README.md](docs/design/handoff/README.md)** — complete design spec: screens, interactions, state model, assets.
4. **[docs/design/handoff/](docs/design/handoff/)** — `.dc.html` prototype files. Open in a browser to inspect the reference UI. `CasaHub Web.dc.html` is the primary reference.
5. **[public/screenshots/](public/screenshots/)** — pixel-level reference screenshots (desktop and mobile). Check if the relevant screen exists before starting implementation.

The responsive breakpoint is **880px**. Below: mobile layout (bottom nav, 2-column bento). Above: desktop layout (sidebar, 4-column bento).

---

## Project constraints

These rules apply to every issue unless the issue **explicitly** overrides one:

- **Do not introduce Supabase** or any backend/auth dependency. The app uses local state for V1.
- **Do not redesign the UI.** Implement what the design files specify. Style changes require an explicit issue.
- **Do not overengineer.** Prefer the simplest readable implementation.
- **Keep components small and readable.** One responsibility per component.
- **Prefer small, reviewable PRs.** A PR that touches 3 files is better than one that touches 30.
- **Do not modify unrelated files.** If you spot an unrelated bug, open a new issue instead.
- Use CSS variables from `globals.css` for all colors. Import UI primitives from `@/components/ui`.

---

## Repository layout

```
casahub/
├── apps/
│   └── web/              # Next.js app (App Router, TypeScript, Tailwind)
│       └── src/
│           ├── app/      # Routes, global CSS, layout
│           ├── components/
│           │   └── ui/   # Shared primitives: Button, Card, Input, Badge, Avatar
│           └── lib/      # Utilities (cn, etc.)
├── packages/
│   └── shared/           # Shared types/schemas (placeholder)
├── docs/
│   └── design/           # Design documentation and handoff files
│       └── handoff/      # .dc.html prototypes + full design spec
├── public/
│   └── screenshots/      # Reference screenshots (desktop + mobile)
└── AGENTS.md             # ← you are here
```

Available npm scripts (run from repository root):

| Command | Description |
|---|---|
| `npm run dev` | Start Next.js dev server at http://localhost:3000 |
| `npm run build` | Production build |
| `npm run lint` | ESLint check |
