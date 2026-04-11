---
title: Contact
toc: false
---

<div class="page-content-only" hidden></div>

```js
import { html } from "npm:htl"
const data = FileAttachment("./data/resume2.json").json()
```

```js
function getLinkUrl(link) {
  return link?.url ?? link?.link ?? "";
}

const info = data.personalInfo;
const networks = data.socialNetworks ?? [];

const contactRows = [
  info.email    ? { label: "Email",    value: html`<a href="mailto:${info.email}">${info.email}</a>` } : null,
  info.phone    ? { label: "Phone",    value: info.phone } : null,
  info.location ? { label: "Location", value: info.location } : null,
  info.website  ? { label: "Website",  value: html`<a href="${info.website}" target="_blank">${info.website}</a>` } : null,
  ...networks.map(n => ({ label: n.name, value: html`<a href="${getLinkUrl(n)}" target="_blank">${getLinkUrl(n)}</a>` }))
].filter(Boolean);

display(html`<div class="profile-sections page-content-only">
  <div class="ps">
    <div class="ps-label">
      <h2>Connect</h2>
      01 — REACH OUT
    </div>
    <div class="ps-body">
      <ul class="re-contact-list">
        ${contactRows.map(r => html`<li><span>${r.label}</span><span>${r.value}</span></li>`)}
      </ul>
    </div>
  </div>
</div>`);
```
