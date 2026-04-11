import { html } from "npm:htl"

// ── Types ────────────────────────────────────────────────────────────────────

interface Link { name: string; url?: string; link?: string; }

interface ResumeEvent {
  id?: number;
  title: string;
  dates?: { start: string; end: string | null };
  location?: string;
  type?: string;
  category?: string;
  industry?: string;
  subIndustry?: string;
  diploma?: string;
  teamSize?: number | null;
  company?: { name?: string; url?: string; };
  description?: string;
  achievements?: string[];
  links?: Link[];
  hardSkills?: string[];
  softSkills?: string[];
}

export interface ResumeData {
  personalInfo: {
    name: string;
    phone?: string;
    location?: string;
    website?: string;
    email?: string;
  };
  socialNetworks?: Link[];
  header?: { title?: string; };
  skills?: {
    soft?: string[];
    hard?: Array<[string, number, boolean]>;
  };
  events?: ResumeEvent[];
  languages?: Array<{ name: string; level: string }>;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getLinkUrl(link: Link): string {
  return link?.url ?? link?.link ?? "";
}

function formatDate(date?: string | null): string {
  if (!date) return "";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("en-US", { year: "numeric", month: "short" });
}

function formatDateRange(dates?: { start: string; end: string | null }): string {
  if (!dates) return "";
  const start = formatDate(dates.start);
  if (dates.end === null) return `${start} — Present`;
  return `${start} — ${formatDate(dates.end)}`;
}

function skillDots(level: number): HTMLElement {
  return html`<span class="re-skill-level">${
    Array.from({ length: 5 }, (_, i) =>
      html`<span class=${i < level ? "re-skill-dot filled" : "re-skill-dot"}></span>`
    )
  }</span>`;
}

// ── Entry builder ─────────────────────────────────────────────────────────────

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

  const achievements = (event.achievements ?? []).filter(Boolean);

  return html`<div class="re-entry">
    <div class="re-entry-head">
      <span class="re-entry-title">${event.title}</span>
      <span class="re-entry-period">${period}</span>
    </div>
    ${hasSub ? html`<div class="re-entry-sub">${subText}</div>` : ""}
    ${event.location ? html`<div class="re-entry-sub re-entry-location">${event.location}</div>` : ""}
    ${event.diploma ? html`<div class="re-entry-sub">${event.diploma}</div>` : ""}
    ${event.description ? html`<p class="re-entry-desc">${event.description}</p>` : ""}
    ${achievements.length ? html`<ul class="re-entry-achievements">${achievements.map(a => html`<li>${a}</li>`)}</ul>` : ""}
    ${linkEls.length ? html`<div class="re-entry-links">${linkEls}</div>` : ""}
  </div>`;
}

// ── Main export ───────────────────────────────────────────────────────────────

export function buildResume(data: ResumeData): HTMLElement[] {
  const sorted = [...(data.events ?? [])].sort((a, b) => {
    const da = new Date(a.dates?.start ?? "").getTime() || 0;
    const db = new Date(b.dates?.start ?? "").getTime() || 0;
    return db - da;
  });

  const experiences    = sorted.filter(e => e.type === "experience").map(buildEntry);
  const education      = sorted.filter(e => e.type === "formation" && e.category === "education").map(buildEntry);
  const certifications = sorted.filter(e => e.type === "formation" && e.category === "formation").map(buildEntry);

  const softTags = (data.skills?.soft ?? []).map(s =>
    html`<span class="re-soft-tag">${s}</span>`
  );

  const hardItems = (data.skills?.hard ?? []).map(([skill, level]: [string, number]) =>
    html`<li><span>${skill}</span>${skillDots(level)}</li>`
  );

  return [
    html`<div class="ps">
      <div class="ps-label">
        <h2>Experience</h2>
        01 — CAREER
      </div>
      <div class="ps-body">${experiences}</div>
    </div>`,

    html`<div class="ps">
      <div class="ps-label">
        <h2>Education</h2>
        02 — DEGREES
      </div>
      <div class="ps-body">${education}</div>
    </div>`,

    html`<div class="ps">
      <div class="ps-label">
        <h2>Certifications</h2>
        03 — LEARNING
      </div>
      <div class="ps-body">${certifications}</div>
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

  ];
}
