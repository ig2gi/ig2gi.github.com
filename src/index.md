---
theme: air
toc: false
style: style/main.css
---

<div class="hero-page">

  <nav class="hp-nav">
    <a href="/index" class="active">01 HOME</a>
    <a href="/timeline">02 TIMELINE</a>
    <a href="/resume">03 RESUME</a>
    <a href="/dataviz">04 DATAVIZ</a>
    <a href="/photography">05 PHOTOGRAPHY</a>
    <a href="/contact">06 CONTACT</a>
  </nav>

  <div class="hp-watermark" aria-hidden="true">GP</div>

  <div class="hp-tagline">
    <p>I turn complex data into clear,<br>usable experiences — where product,<br>design and engineering converge.</p>
    <span class="hp-scroll">[SCROLL TO EXPLORE]</span>
  </div>

  <div class="hp-thumbnails">
    <figure class="hp-thumb">
      <figcaption>[01]</figcaption>
      <img src="/images/portfolio/travelmap.png" alt="Travel Map">
    </figure>
    <figure class="hp-thumb">
      <figcaption>[02]</figcaption>
      <img src="/images/portfolio/dashboards.png" alt="Dashboards">
    </figure>
    <figure class="hp-thumb">
      <figcaption>[03]</figcaption>
      <img src="/images/portfolio/circos.jpeg" alt="Circos">
    </figure>
    <figure class="hp-thumb">
      <figcaption>[04]</figcaption>
      <img src="/images/portfolio/sgmap.png" alt="World Map">
    </figure>
  </div>

</div>

```js
import { html } from "npm:htl"
const profileData = FileAttachment("./data/profile.json").json()
```

```js
{
  function tick() {
    const timeEl = document.getElementById('hp-time');
    const dateEl = document.getElementById('hp-date');
    if (!timeEl || !dateEl) return;
    const now = new Date();
    timeEl.textContent = now.toLocaleTimeString('fr-FR', {
      timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit'
    }) + ' [FR]';
    dateEl.textContent = now.toLocaleDateString('en-US', {
      timeZone: 'Europe/Paris', month: 'long', day: 'numeric', year: 'numeric'
    }).toUpperCase();
  }
  tick();
  const t = setInterval(tick, 1000);
  invalidation.then(() => clearInterval(t));
}
```

```js
function buildSection(section) {
  const p = (content) => Object.assign(document.createElement('p'), { innerHTML: content });

  const imgEl = section.image
    ? html`<span>
        <img src="${section.image.src}" class="ps-image" alt="${section.image.alt}">
        ${section.image.caption ? html`<span class="ps-caption">${section.image.caption}</span>` : ""}
      </span>`
    : null;

  const linksEl = section.links?.length
    ? html`<div class="ps-links">${section.links.map(l =>
        l.external
          ? html`<a href="${l.url}" target="_blank">${l.label}</a>`
          : html`<a href="${l.url}">${l.label}</a>`
      )}</div>`
    : null;

  return html`<div class="ps">
    <div class="ps-label">
      <strong>${section.label}</strong>
      ${section.sublabel}
    </div>
    <div class="ps-body">
      ${section.image?.position === "top" ? imgEl : ""}
      ${section.paragraphs.map(p)}
      ${section.image?.position === "bottom" ? imgEl : ""}
      ${linksEl}
    </div>
  </div>`;
}

display(html`<div class="profile-sections">${profileData.sections.map(buildSection)}</div>`);
```
