---
theme: air
toc: false
style: style/main.css
---

<div class="page-content-only">

<section class="ih-hero">
  <h1 class="ih-hero-title">where <span class="ih-accent">product</span>, design &amp; engineering converge.</h1>
  <p class="ih-hero-sub">I build prototypes hands-on, then lead teams to scale them — turning ambitious ideas into shipped products across genomics SaaS, data visualisation, and design systems.</p>
  <div class="ih-hero-ctas">
    <a class="ih-btn ih-btn-primary" href="/dataviz">View portfolio</a>
    <a class="ih-btn" href="/contact">Get in touch</a>
  </div>
</section>

<section class="ih-features">
  <article class="ih-feature">
    <div class="ih-feature-num">01</div>
    <h3 class="ih-feature-title">build first</h3>
    <p>Hands-on prototyping. I ship the PoC myself before asking anyone else to.</p>
  </article>
  <article class="ih-feature">
    <div class="ih-feature-num">02</div>
    <h3 class="ih-feature-title">scale through teams</h3>
    <p>Then grow the team to take what works to production. Build-first leadership.</p>
  </article>
  <article class="ih-feature">
    <div class="ih-feature-num">03</div>
    <h3 class="ih-feature-title">product + design</h3>
    <p>End-to-end thinking — from user research and strategy to design systems and shipping.</p>
  </article>
  <article class="ih-feature">
    <div class="ih-feature-num">04</div>
    <h3 class="ih-feature-title">data into stories</h3>
    <p>Turning complex datasets into clear, navigable interfaces that people actually use.</p>
  </article>
</section>

</div>

```js
import { html } from "npm:htl"
const profileData = FileAttachment("./data/profile.json").json()
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

<section class="ih-cta">
  <h2>Ready to talk?</h2>
  <p>If you're working on something where product, design and engineering have to converge — let's chat.</p>
  <a class="ih-btn ih-btn-primary" href="/contact">Get in touch <span aria-hidden="true">→</span></a>
</section>
