# gilbert perrin — personal website

Personal portfolio site for Gilbert Perrin, built with [Astro](https://astro.build/) v6 + React. Deployed as a static site to GitHub Pages.

## Getting started

```bash
npm install
npm run dev      # http://localhost:4321
```

## Commands

| Command | Description |
|---|---|
| `npm run dev` | Start local preview server with hot reload |
| `npm run build` | Build static site to `dist/` |
| `npm run preview` | Preview the built site locally |
| `npm run clean` | Clear `dist/` |

## Project structure

```
src/
├─ pages/        # .astro pages — file-based routing
├─ layouts/      # Layout.astro — global header, nav, shell
├─ components/   # React (.tsx) interactive components
├─ data/         # JSON source-of-truth for all content
└─ styles/       # main.css — global styles and design tokens
public/          # Static assets (images, fonts, icons)
astro.config.mjs # Astro configuration
```

## Stack

- [Astro](https://astro.build/) v6 — static output
- [React](https://react.dev/) v19 — interactive components
- Plain CSS with custom properties — no CSS framework
- Deployed to GitHub Pages at [ig2gi.github.io](https://ig2gi.github.io)
