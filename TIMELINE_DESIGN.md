# Timeline Page — Design Specification

> Last updated: 2026-05-17  
> Status: Pre-implementation — design locked, ready to build

---

## Purpose

The timeline page is a **spatial, interactive version of the career story**.  
It answers one implicit question from the visitor:

> *"Why should I trust someone who's done 12 different things as my advisor?"*

The answer is in the **pattern**, not the duration. The map makes that pattern visible at a glance — without scrolling through the resume page.

---

## Layout

```
┌──────────────────────────────────────────────────┬───────────────────────────┐
│  JOURNEY MAP  (SVG — D3 layout + React render)   │  METRICS  (HTML / React)  │
│  ──────────────────────────────────── 2/3 width  │  ─────────────── 1/3      │
│                                                  │                           │
│  [filter chips: ALL / ENGINEERING / DATA VIZ /   │  Industry bars            │
│                 PRODUCT / LEADERSHIP ]            │  Contract type blocks     │
│                                                  │  Company size icons       │
│  STRATEGY   · · · · · · · · · · · · ⬡────────⬡  │  Responsibility arc       │
│                                  ╱         ╲ ╱   │                           │
│  PRODUCT    · · · · · · · · ◉────◉  ◉───────◉   │  ← clicking any metric    │
│                           ╱                      │     highlights matching   │
│  DATA VIZ   · · · · · ●──◉──────────────────     │     stations on the map   │
│                      ╱                           │                           │
│  ENGINEER   ●──●──●──●───────────────────────    │                           │
│             │  │  │  │  │  │  │  │  │  │  │      │                           │
│             □──◇──□──◇──△──△──△──△──△──◇──□      │                           │
│             └──────── education anchor ──────┘   │                           │
└──────────────────────────────────────────────────┴───────────────────────────┘

ABOUT THIS VISUALISATION
────────────────────────────────────────────────────────────────────────────────
[prose — see About section spec below]
```

---

## Visual Encoding

### Y-axis — contribution type (4 tracks)

| Track | Meaning | Roles |
|---|---|---|
| **STRATEGY / ADVISORY** | Org-level decisions, vision, advisory | VP roles |
| **PRODUCT / DESIGN** | Roadmap, UX, product ownership | Head of PO, PM, VP UX |
| **DATA & VISUALISATION** | D3.js, charts, dashboards, data craft | Data Viz Eng, Head FE |
| **ENGINEERING / CODE** | IC software development, architecture | SE, Java Dev, Thermal Eng |

Reading the map top-to-bottom = reading the career arc: starts at Engineering, gradually activates higher tracks, and from 2015+ **all four tracks are simultaneously active**. This convergence IS the advisory claim made visual.

### X-axis — schematic career sequence (not proportional time)

Each event = one station, **equal horizontal spacing** regardless of duration. This is the subway map principle: topology over geography. Year labels appear at key events only (not as a proportional ruler). Short roles (GenomSys, 3 months) get equal visual weight to long ones (SOPHiA, 12 years) — duration is metadata visible on hover.

### Line color — industry domain

| Color | Industry |
|---|---|
| `#d87943` orange | Healthcare — SOPHiA GENETICS (the signature chapter) |
| Deep blue `#2c4a7c` | Finance — Odyssey, Pictet |
| Steel grey `#6b7280` | Engineering / Energy — Spie Batignolles, early career |
| Teal `#0d9488` | Telecom / Broadcast — BIPE Sirius, RTS |
| Muted green `#4a7c59` | Independent / Freelance — IAS, DALIN Software |

Color shifts along the line = domain-hopping story told passively, without labels.

### Station size — responsibility scope

| Shape | Meaning |
|---|---|
| Small ● | Individual contributor |
| Medium ◉ | Team lead / Head-of (director level) |
| Large ⬡ | VP / executive |
| Square □ | Formal degree / diploma |
| Diamond ◇ | Professional certificate (Scrum, IIBA…) |
| Triangle △ | Online cert / MOOC (Coursera, freeCodeCamp…) |

---

## Education Anchor Track

Education and formation events sit on a **bottom dashed track**, anchored below the Engineering line. They are not decoration — they carry narrative meaning:

**What the education track communicates:**
- The **density of learning** varies by career stage — 2012–2020 is very dense (continuous upskilling phase: R, JS, BABOK, Deep Learning, PSPO, NLP). This cluster is visible at a glance.
- The **type of formation** is encoded by shape: □ formal degrees, ◇ professional certs, △ MOOCs — showing a shift from institutional to self-directed learning.
- **Vertical stems** connect a formation event upward to the role/track it enabled: the Deep Learning specialization (2019) → AI work at SOPHiA; the DESS Computer Science (1997) → Java Developer career start; the Data Viz MOOC (2012) → IAS freelance project → SOPHiA data viz pivot. These stems tell the "I learned this, then this became possible" story.
- The **Photography sabbatical** (2008–2009) sits on the education track as a special node — same importance as a formal degree, with a note connecting it to the UX/Design track it fed into later.

---

## Interaction

### Hover tooltip (on any station)
Compact floating card showing:
- Role title + company
- Date range + duration
- Industry tag (colored)
- 2–3 achievement chips
- Description excerpt (1 sentence)

Full detail is on the resume page — the tooltip is a teaser, not a replacement.

### Metrics panel as filter
Clicking any metric in the right panel highlights matching stations on the map and dims others:
- Click "Healthcare" bar → orange stations glow, others dim
- Click "freelance" block → freelance-category stations highlighted
- Click "VP" in responsibility arc → ⬡ stations highlighted
- Click a track label (STRATEGY, PRODUCT…) → filter to that Y-track

---

## Metrics Panel Content

Mirrors the left panel of the 2013 resume, updated and interactive:

```
30 yrs  ──────────────────────── total experience

── Industry (years) ──────────────────────────────
Healthcare     ████████████  13y  [click to filter]
Finance        ████████       8y
Energy         ████           4y
Telecom        ██             2y
Broadcast      █              1y

── Contract Type ─────────────────────────────────
  employee  ██████████████  17y
  freelance ████████         8y
  consultant████             5y

── Company Size ──────────────────────────────────
  👤👤👤   startup  (<20)      4 roles
  👥👥      mid      (20–500)   8 roles
  🏢        large    (500+)     3 roles

── Responsibility Arc ────────────────────────────
  IC → Lead → Head → VP → Head → VP
  ●────◉──────◉──────⬡───◉──────⬡
```

---

## Architecture — 4 strict layers

```
resume.json  (events[], eventGroups[])
      │
      ▼  Layer 1 — RAW DATA (source of truth, untouched)
      │
      ▼  Layer 2 — DATA TRANSFORM   src/lib/timelineData.ts
         parseEvents(events)         → normalized events, Date objects, durations
         assignTracks(event)         → maps each event to Y-track(s)
         assignDomain(event)         → maps industry to color token
         assignStationSize(event)    → derives ●/◉/⬡ from category + title
         computeMetrics(events)      → { totalYears, byIndustry, byContract, … }
         buildEducationAnchors(events) → formation events with stem targets
      │
      ▼  Layer 3 — D3 LAYOUT        src/lib/timelineLayout.ts
         stationScale()              → ordinal x-scale (equal spacing)
         trackYScale()               → band scale: track name → y pixel
         stationPaths()              → SVG path data for connecting lines (cubic bezier)
         educationStems()            → vertical connector paths to parent stations
      │
      ▼  Layer 4 — REACT + SVG RENDER   src/components/Timeline/
         Timeline.tsx                → root, owns filter/hover state
         JourneyMap.tsx              → <svg> 2/3, receives layout props
         ├─ TrackLines.tsx           → the 4 horizontal domain lines
         ├─ Stations.tsx             → role circles/hexagons
         ├─ EducationTrack.tsx       → bottom anchor with stems
         └─ Tooltip.tsx              → floating hover card
         MetricsPanel.tsx            → <div> 1/3, receives metrics props
```

**D3 never touches the DOM.** It computes numbers and path strings only. React renders all SVG elements declaratively. No `useEffect` + `d3.select` conflicts.

---

## Tech Stack

| Concern | Tool |
|---|---|
| Framework | Astro v6 (static output) |
| Interactivity | React (`client:load` island) |
| Layout math + scales | D3.js v7 |
| SVG rendering | React JSX (not D3 DOM) |
| Metrics charts (v2) | Observable Plot |
| Skills spike chart (v2) | D3.js |

---

## Skills Spike Chart (v2)

Deferred to v2. Will sit between the journey map and the About section. Shows `hardSkills` from each event plotted as vertical spikes over time — the "skills over time" axis from the 2012 resume, rebuilt with D3. A recognisable signature of the 2012 dataviz.

---

## About This Visualisation (section below the map)

This section explicitly frames the page as a portfolio piece, not just a career overview.

Key narrative points:
1. **The 2012 origin**: an earlier version of this visualisation was built in 2012 using nodebox3 — a Python generative graphics tool, not D3. Remarkable for its time, it already carried the design DNA of this site: orange accents, monospace typography, data-journalism density, and a skills-over-time axis that most CV tools don't attempt.
2. **The 2026 rebuild**: same person, same aesthetic instincts, a generation of tooling later. Built with D3.js + React inside Astro.
3. **Portfolio-within-a-portfolio**: Gilbert's title arc goes through "Data Visualisation Engineer" — building this visualisation *is* a demonstration of the craft, not just a description of it.
4. **Tech transparency**: link to the source data (`resume.json`), the GitHub repo, and a brief note on the D3+React architecture.
