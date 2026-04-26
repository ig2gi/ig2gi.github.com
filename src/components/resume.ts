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

interface EventGroup {
  id: number;
  company: string;
  events: number[];
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
  eventGroups?: EventGroup[];
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

function calculateDuration(dates?: { start: string; end: string | null }): string {
  if (!dates?.start) return "";
  const start = new Date(dates.start);
  const end = dates.end ? new Date(dates.end) : new Date();
  if (isNaN(start.getTime())) return "";
  const totalMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  if (totalMonths <= 0) return "";
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  if (years === 0) return `${months}mo`;
  if (months === 0) return `${years}yr`;
  return `${years}yr ${months}mo`;
}

// Returns gap in whole months between end of earlier and start of later.
// events are sorted descending, so "later" is events[i], "earlier" is events[i+1].
function gapMonths(later: ResumeEvent, earlier: ResumeEvent): number {
  if (!later.dates?.start || !earlier.dates?.end) return 0;
  const laterStart = new Date(later.dates.start).getTime();
  const earlierEnd = new Date(earlier.dates.end).getTime();
  if (isNaN(laterStart) || isNaN(earlierEnd)) return 0;
  const diffMs = laterStart - earlierEnd;
  if (diffMs <= 0) return 0;
  return Math.round(diffMs / (30.44 * 24 * 60 * 60 * 1000));
}

function sumDurations(events: ResumeEvent[]): string {
  let totalMonths = 0;
  for (const event of events) {
    if (!event.dates?.start) continue;
    const start = new Date(event.dates.start);
    const end = event.dates.end ? new Date(event.dates.end) : new Date();
    if (isNaN(start.getTime())) continue;
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    if (months > 0) totalMonths += months;
  }
  if (totalMonths <= 0) return "";
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  if (years === 0) return `${totalMonths}mo`;
  if (months === 0) return `${years}yr`;
  return `${years}yr ${months}mo`;
}

function formatGapDuration(months: number): string {
  const years = Math.floor(months / 12);
  const rem = months % 12;
  if (years === 0) return `${months}mo`;
  if (rem === 0) return `${years}yr`;
  return `${years}yr ${rem}mo`;
}

function skillDots(level: number): HTMLElement {
  return html`<span class="re-skill-level">${
    Array.from({ length: 5 }, (_, i) =>
      html`<span class=${i < level ? "re-skill-dot filled" : "re-skill-dot"}></span>`
    )
  }</span>`;
}

// ── Shared sub-builders ───────────────────────────────────────────────────────

function buildDateline(dates?: { start: string; end: string | null }): HTMLElement | string {
  if (!dates) return "";
  const period = formatDateRange(dates);
  const duration = calculateDuration(dates);
  if (!period) return "";
  return html`<div class="re-entry-dateline">
    <span class="re-entry-period">${period}</span>
    ${duration ? html`<span class="re-entry-duration">${duration}</span>` : ""}
  </div>`;
}

function buildLinks(links: Link[]): HTMLElement | string {
  const els = links.filter(l => getLinkUrl(l)).map(l =>
    html`<a href="${getLinkUrl(l)}" target="_blank">${l.name}</a>`
  );
  return els.length ? html`<div class="re-entry-links">${els}</div>` : "";
}

function descEl(text: string | undefined): HTMLElement | string {
  if (!text) return "";
  const p = document.createElement('p');
  p.className = 're-entry-desc';
  p.innerHTML = text;
  return p;
}

function buildAchievements(achievements: string[]): HTMLElement | string {
  const filtered = achievements.filter(Boolean);
  return filtered.length
    ? html`<div class="re-soft-tags re-entry-tags">${filtered.map(a => html`<span class="re-soft-tag">${a}</span>`)}</div>`
    : "";
}

function buildGapIndicator(months: number): HTMLElement {
  return html`<div class="re-role-gap" aria-hidden="true">
    <span class="re-role-gap-line"></span>
    <span class="re-role-gap-label"><strong>${formatGapDuration(months)}</strong> — other activities</span>
    <span class="re-role-gap-line"></span>
  </div>`;
}

function getStartYear(dateStr?: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? "" : String(d.getFullYear());
}

function buildEntryWrap(year: string, entryEl: HTMLElement): HTMLElement {
  return html`<div class="re-entry-wrap">
    <div class="re-entry-year" aria-hidden="true">${year}</div>
    ${entryEl}
  </div>`;
}

// ── Single entry (non-grouped) ────────────────────────────────────────────────

function buildEntry(event: ResumeEvent): HTMLElement {
  const companyName = event.company?.name ?? "";
  const companyUrl = event.company?.url;
  const industry = [event.industry, event.subIndustry].filter(Boolean).join(" · ");
  const companyEl: any = companyUrl
    ? html`<a href="${companyUrl}" target="_blank">${companyName}</a>`
    : companyName;
  const subText = industry ? html`${companyEl} · ${industry}` : companyEl;
  const hasSub = !!(companyName || industry);

  const entry = html`<div class="re-entry">
    <div class="re-entry-title">${event.title}</div>
    ${buildDateline(event.dates)}
    ${hasSub ? html`<div class="re-entry-sub">${subText}</div>` : ""}
    ${event.location ? html`<div class="re-entry-sub re-entry-location">${event.location}</div>` : ""}
    ${event.diploma ? html`<div class="re-entry-sub">${event.diploma}</div>` : ""}
    ${descEl(event.description)}
    ${buildAchievements(event.achievements ?? [])}
    ${buildLinks(event.links ?? [])}
  </div>`;
  return buildEntryWrap(getStartYear(event.dates?.start), entry);
}

// ── Role inside a group ───────────────────────────────────────────────────────

function buildRole(event: ResumeEvent): HTMLElement {
  return html`<div class="re-role">
    <div class="re-role-title">${event.title}</div>
    ${buildDateline(event.dates)}
    ${event.diploma ? html`<div class="re-entry-sub">${event.diploma}</div>` : ""}
    ${descEl(event.description)}
    ${buildAchievements(event.achievements ?? [])}
    ${buildLinks(event.links ?? [])}
  </div>`;
}

// ── Grouped entry (multiple roles at one company) ─────────────────────────────

function buildGroupEntry(group: EventGroup, events: ResumeEvent[]): HTMLElement {
  const starts = events
    .map(e => e.dates?.start ? new Date(e.dates.start).getTime() : NaN)
    .filter(t => !isNaN(t));
  const hasPresent = events.some(e => e.dates?.end === null);
  const ends = events
    .map(e => e.dates?.end ? new Date(e.dates.end).getTime() : NaN)
    .filter(t => !isNaN(t));

  const overallStart = starts.length ? new Date(Math.min(...starts)).toISOString() : "";
  const overallEnd: string | null = hasPresent ? null : (ends.length ? new Date(Math.max(...ends)).toISOString() : "");

  const companyUrl = events[0]?.company?.url;
  const industry = [events[0]?.industry, events[0]?.subIndustry].filter(Boolean).join(" · ");

  // Build role list, inserting gap indicators where continuity breaks (threshold: 2 months)
  const roleItems: HTMLElement[] = [];
  for (let i = 0; i < events.length; i++) {
    roleItems.push(buildRole(events[i]));
    if (i < events.length - 1) {
      const gap = gapMonths(events[i], events[i + 1]);
      if (gap >= 2) roleItems.push(buildGapIndicator(gap));
    }
  }

  const groupPeriod = formatDateRange({ start: overallStart, end: overallEnd });
  const groupDuration = sumDurations(events);

  const groupEntry = html`<div class="re-entry re-entry-group">
    <div class="re-entry-company-name">
      ${companyUrl
        ? html`<a href="${companyUrl}" target="_blank">${group.company}</a>`
        : group.company}
    </div>
    <div class="re-entry-dateline">
      <span class="re-entry-period">${groupPeriod}</span>
      ${groupDuration ? html`<span class="re-entry-duration">${groupDuration}</span>` : ""}
    </div>
    ${industry ? html`<div class="re-entry-sub">${industry}</div>` : ""}
    <div class="re-entry-roles">
      ${roleItems}
    </div>
  </div>`;
  return buildEntryWrap(getStartYear(overallStart), groupEntry);
}

// ── Grouping logic (shared for experiences + education) ───────────────────────

function applyGrouping(
  events: ResumeEvent[],
  eventToGroup: Map<number, EventGroup>,
  buildSingle: (e: ResumeEvent) => HTMLElement
): HTMLElement[] {
  const result: HTMLElement[] = [];
  const seenGroupIds = new Set<number>();

  for (const event of events) {
    const group = event.id != null ? eventToGroup.get(event.id) : undefined;
    if (group) {
      if (!seenGroupIds.has(group.id)) {
        seenGroupIds.add(group.id);
        const groupEvents = events.filter(e => e.id != null && group.events.includes(e.id));
        result.push(buildGroupEntry(group, groupEvents));
      }
    } else {
      result.push(buildSingle(event));
    }
  }

  return result;
}

// ── Main export ───────────────────────────────────────────────────────────────

export function buildResume(data: ResumeData): HTMLElement[] {
  const sorted = [...(data.events ?? [])].sort((a, b) => {
    const da = new Date(a.dates?.start ?? "").getTime() || 0;
    const db = new Date(b.dates?.start ?? "").getTime() || 0;
    return db - da;
  });

  const groups = data.eventGroups ?? [];
  const eventToGroup = new Map<number, EventGroup>();
  groups.forEach(g => g.events.forEach(eid => eventToGroup.set(eid, g)));

  const experiences    = applyGrouping(sorted.filter(e => e.type === "experience"), eventToGroup, buildEntry);
  const education      = applyGrouping(sorted.filter(e => e.type === "formation" && e.category === "education"), eventToGroup, buildEntry);
  const certifications = sorted.filter(e => e.type === "formation" && e.category === "formation").map(buildEntry);

  const softTags = (data.skills?.soft ?? []).map(s =>
    html`<span class="re-soft-tag">${s}</span>`
  );
  const hardItems = (data.skills?.hard ?? []).map(([skill, level]: [string, number]) =>
    html`<li><span>${skill}</span>${skillDots(level)}</li>`
  );

  return [
    html`<div class="ps">
      <div class="ps-label"><h2>Experience</h2>01 — CAREER</div>
      <div class="ps-body">${experiences}</div>
    </div>`,

    html`<div class="ps">
      <div class="ps-label"><h2>Education</h2>02 — DEGREES</div>
      <div class="ps-body">${education}</div>
    </div>`,

    html`<div class="ps">
      <div class="ps-label"><h2>Certifications</h2>03 — LEARNING</div>
      <div class="ps-body">${certifications}</div>
    </div>`,

    html`<div class="ps">
      <div class="ps-label"><h2>Skills</h2>04 — EXPERTISE</div>
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
