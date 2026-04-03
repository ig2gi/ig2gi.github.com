import { html } from "npm:htl"

// ── Types ────────────────────────────────────────────────────────────────────

interface Link { name: string; url?: string; link?: string; }

interface ResumeEvent {
  title: string;
  dates?: string[];
  type?: string;
  industry?: string;
  subIndustry?: string;
  diploma?: string;
  company?: { name?: string; url?: string; };
  links?: Link[];
  description?: string;
}

export interface ResumeData {
  personalInfo: {
    name: string;
    age?: number;
    phone?: string;
    location?: string;
    website?: string;
    email?: string;
  };
  socialNetworks?: Link[];
  profile?: {
    description?: string;
    axes?: Array<{ title: string; description: string }>;
  };
  header?: { title?: string; };
  skills?: {
    soft?: string[];
    hard?: Array<[string, number, boolean]>;
  };
  events?: ResumeEvent[];
  languages?: Array<{ name: string; level: string }>;
  hobbies?: Array<{ title: string; description: string }>;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getLinkUrl(link: Link): string {
  return link?.url ?? link?.link ?? "";
}

function formatDate(date?: string): string {
  if (!date) return "";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("en-US", { year: "numeric", month: "short" });
}

function formatDateRange(dates?: string[]): string {
  if (!dates || dates.length === 0) return "";
  if (dates.length === 1) return `${formatDate(dates[0])} — Present`;
  return `${formatDate(dates[0])} — ${formatDate(dates[1])}`;
}

function skillDots(level: number): HTMLElement {
  return html`<span class="re-skill-level">${
    Array.from({ length: 5 }, (_, i) =>
      html`<span class=${i < level ? "re-skill-dot filled" : "re-skill-dot"}></span>`
    )
  }</span>`;
}

// ── Section builders ─────────────────────────────────────────────────────────

function buildEntry(event: ResumeEvent): HTMLElement {
  const period = formatDateRange(event.dates);
  const companyName = event.company?.name ?? "";
  const companyUrl = event.company?.url;
  const industry = [event.industry, event.subIndustry].filter(Boolean).join(" · ");

  const companyEl: any = companyUrl
    ? html`<a href="${companyUrl}" target="_blank">${companyName}</a>`
    : companyName;

  const subText = industry ? html`${companyEl} · ${industry}` : companyEl;
  const hasSub = !!(companyName || industry);

  const linkEls = (event.links ?? [])
    .filter(l => getLinkUrl(l))
    .map(l => html`<a href="${getLinkUrl(l)}" target="_blank">${l.name}</a>`);

  return html`<div class="re-entry">
    <div class="re-entry-head">
      <span class="re-entry-title">${event.title}</span>
      <span class="re-entry-period">${period}</span>
    </div>
    ${hasSub ? html`<div class="re-entry-sub">${subText}</div>` : ""}
    ${event.diploma ? html`<div class="re-entry-sub">${event.diploma}</div>` : ""}
    ${event.description ? html`<p class="re-entry-desc">${event.description}</p>` : ""}
    ${linkEls.length ? html`<div class="re-entry-links">${linkEls}</div>` : ""}
  </div>`;
}

// ── Main export ───────────────────────────────────────────────────────────────

export function buildResume(data: ResumeData): HTMLElement[] {
  const sorted = [...(data.events ?? [])].sort((a, b) => {
    const da = new Date(a.dates?.[0] ?? "").getTime() || 0;
    const db = new Date(b.dates?.[0] ?? "").getTime() || 0;
    return db - da;
  });

  const experiences = sorted.filter(e => e.type === "experience").map(buildEntry);
  const formations  = sorted.filter(e => e.type === "formation").map(buildEntry);

  const softTags = (data.skills?.soft ?? []).map(s =>
    html`<span class="re-soft-tag">${s}</span>`
  );

  const hardItems = (data.skills?.hard ?? []).map(([skill, level]: [string, number]) =>
    html`<li><span>${skill}</span>${skillDots(level)}</li>`
  );

  const axisTags = (data.profile?.axes ?? []).map(a =>
    html`<span class="re-soft-tag">${a.title}</span>`
  );

  const contactItems = [
    data.personalInfo.email
      ? html`<li><span>Email</span><span><a href="mailto:${data.personalInfo.email}">${data.personalInfo.email}</a></span></li>`
      : null,
    data.personalInfo.phone
      ? html`<li><span>Phone</span><span>${data.personalInfo.phone}</span></li>`
      : null,
    data.personalInfo.location
      ? html`<li><span>Location</span><span>${data.personalInfo.location}</span></li>`
      : null,
    data.personalInfo.website
      ? html`<li><span>Website</span><span><a href="${data.personalInfo.website}" target="_blank">${data.personalInfo.website}</a></span></li>`
      : null,
    ...(data.socialNetworks ?? []).map(n => {
      const url = getLinkUrl(n);
      return html`<li><span>${n.name}</span><span><a href="${url}" target="_blank">${url}</a></span></li>`;
    }),
  ].filter(Boolean);

  const languageItems = (data.languages ?? []).map(l =>
    html`<li><span>${l.name}</span><span class="re-entry-period">${l.level}</span></li>`
  );

  const hobbyItems = (data.hobbies ?? []).map(h =>
    html`<li><span><b>${h.title}</b> — ${h.description}</span></li>`
  );

  return [
    html`<div class="ps">
      <div class="ps-label">
        <h2>Profile</h2>
        01 — WHO I AM
      </div>
      <div class="ps-body">
        <p>${data.profile?.description ?? ""}</p>
        ${axisTags.length ? html`<div class="re-soft-tags">${axisTags}</div>` : ""}
        <div class="re-actions">
          <a class="btn" href="./data/resume.pdf" download="gilbert-perrin-resume.pdf">Download PDF</a>
          <a class="btn btn-secondary" href="https://www.linkedin.com/in/gilbertperrin/" target="_blank">LinkedIn</a>
        </div>
      </div>
    </div>`,

    html`<div class="ps">
      <div class="ps-label">
        <h2>Experience</h2>
        02 — CAREER
      </div>
      <div class="ps-body">${experiences}</div>
    </div>`,

    html`<div class="ps">
      <div class="ps-label">
        <h2>Education</h2>
        03 — FORMATION
      </div>
      <div class="ps-body">${formations}</div>
    </div>`,

    html`<div class="ps">
      <div class="ps-label">
        <h2>Skills</h2>
        04 — EXPERTISE
      </div>
      <div class="ps-body">
        <div class="re-skills-grid">
          <div>
            <span class="re-skill-group-title">Soft Skills</span>
            <div class="re-soft-tags">${softTags}</div>
          </div>
          <div>
            <span class="re-skill-group-title">Technical Skills</span>
            <ul class="re-skill-list">${hardItems}</ul>
          </div>
        </div>
      </div>
    </div>`,

    html`<div class="ps">
      <div class="ps-label">
        <h2>Contact</h2>
        05 — CONNECT
      </div>
      <div class="ps-body">
        <ul class="re-contact-list">${contactItems}</ul>
        ${languageItems.length ? html`<span class="re-skill-group-title">Languages</span><ul class="re-skill-list">${languageItems}</ul>` : ""}
        ${hobbyItems.length ? html`<ul class="re-skill-list" style="margin-top:1rem;">${hobbyItems}</ul>` : ""}
      </div>
    </div>`,
  ];
}
