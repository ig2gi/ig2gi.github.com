---
title: Photography
toc: false
---

<div class="page-full">
  <div class="page-full-watermark">PHOTO</div>
</div>

```js
import { html } from "npm:htl"
```

```js
function ensureLightbox() {
    let lb = document.getElementById("ph-lightbox");
    if (lb) return lb;
    lb = document.createElement("div");
    lb.id = "ph-lightbox";
    lb.className = "pf-lightbox";
    lb.innerHTML = `
        <div class="pf-lightbox-backdrop"></div>
        <button class="pf-lightbox-close" aria-label="Close">×</button>
        <img class="pf-lightbox-img" src="" alt="">
    `;
    document.body.appendChild(lb);
    const close = () => { lb.classList.remove("pf-lightbox--open"); document.body.style.overflow = ""; };
    lb.querySelector(".pf-lightbox-backdrop").addEventListener("click", close);
    lb.querySelector(".pf-lightbox-close").addEventListener("click", close);
    document.addEventListener("keydown", e => { if (e.key === "Escape") close(); });
    return lb;
}
function openLightbox(src, alt) {
    const lb = ensureLightbox();
    lb.querySelector(".pf-lightbox-img").src = src;
    lb.querySelector(".pf-lightbox-img").alt = alt;
    lb.classList.add("pf-lightbox--open");
    document.body.style.overflow = "hidden";
}
```

```js
// ── Add photos here ──────────────────────────────────────
// photos[0]   → hero (large, left column)
// photos[1-2] → secondary (right column, below text)
// photos[3+]  → below the fold strip
const photos = [
  { id: 1, title: "", year: 2009, theme: "Street" },
];

const images = {
  1: FileAttachment("images/photography/photo1.jpg"),
};
// ─────────────────────────────────────────────────────────

const hero      = photos[0];
const secondary = photos.slice(1, 3);
const fold      = photos.slice(3);
```

```js
display(html`<div class="ph-newspaper">

  <div class="ph-frontpage">

    <div class="ph-hero-col">
      <figure class="ph-fig ph-fig--hero" onclick=${() => openLightbox(images[hero.id]?.href ?? "", hero.theme)}>
        <img src="${images[hero.id]?.href ?? ""}" alt="${hero.theme}" loading="lazy">
      </figure>
      <div class="ph-caption">${hero.theme.toUpperCase()} · ${hero.year}</div>
    </div>

    <div class="ph-text-col">
      <p class="ph-article">Self-taught since 2008, grounded in <em>Shore</em>, <em>Mante</em>, and <em>Freeman</em>. A press internship at the Police Cantonale Vaudoise, then four years as official photographer for <em>La Nuit des Musées de Lausanne</em> — events, crowds, low light. The same attention to composition and light informs my work in UX design and data visualisation.</p>

      <div class="ph-chips">
        ${["Street", "Urban", "Portraits", "Minimalist"].map(t => html`<span class="ph-chip">${t}</span>`)}
      </div>

      <a href="https://ig2gi.500px.photography/" target="_blank" class="ph-ext-link">→ Full portfolio on 500px ↗</a>

      ${secondary.length > 0 ? html`<div class="ph-secondary">
        ${secondary.map(p => html`<figure class="ph-fig ph-fig--sec" onclick=${() => openLightbox(images[p.id]?.href ?? "", p.theme)}>
          <img src="${images[p.id]?.href ?? ""}" alt="${p.theme}" loading="lazy">
          <div class="ph-caption">${p.theme.toUpperCase()} · ${p.year}</div>
        </figure>`)}
      </div>` : null}
    </div>

  </div>

  ${fold.length > 0 ? html`<div class="ph-fold">
    ${fold.map(p => html`<figure class="ph-fig ph-fig--fold" onclick=${() => openLightbox(images[p.id]?.href ?? "", p.theme)}>
      <img src="${images[p.id]?.href ?? ""}" alt="${p.theme}" loading="lazy">
      <div class="ph-caption">${p.theme.toUpperCase()} · ${p.year}</div>
    </figure>`)}
  </div>` : null}

</div>`);
```
