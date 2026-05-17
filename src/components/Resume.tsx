import type { FC, ReactNode } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

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
  company?: { name?: string; url?: string };
  description?: string;
  achievements?: string[];
  links?: Link[];
}

interface EventGroup { id: number; company: string; events: number[]; }

export interface ResumeData {
  personalInfo: { name: string; phone?: string; location?: string; website?: string; email?: string };
  socialNetworks?: Link[];
  header?: { title?: string };
  skills?: { soft?: string[]; hard?: Array<[string, number, boolean]> };
  events?: ResumeEvent[];
  languages?: Array<{ name: string; level: string }>;
  eventGroups?: EventGroup[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getLinkUrl(link: Link) { return link?.url ?? link?.link ?? ''; }

function formatDate(date?: string | null) {
  if (!date) return '';
  const d = new Date(date);
  return isNaN(d.getTime()) ? date : d.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
}

function formatDateRange(dates?: { start: string; end: string | null }) {
  if (!dates) return '';
  const start = formatDate(dates.start);
  return dates.end === null ? `${start} — Present` : `${start} — ${formatDate(dates.end)}`;
}

function calculateDuration(dates?: { start: string; end: string | null }) {
  if (!dates?.start) return '';
  const start = new Date(dates.start);
  const end = dates.end ? new Date(dates.end) : new Date();
  if (isNaN(start.getTime())) return '';
  const totalMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  if (totalMonths <= 0) return '';
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  if (years === 0) return `${totalMonths}mo`;
  if (months === 0) return `${years}yr`;
  return `${years}yr ${months}mo`;
}

function gapMonths(later: ResumeEvent, earlier: ResumeEvent) {
  if (!later.dates?.start || !earlier.dates?.end) return 0;
  const diff = new Date(later.dates.start).getTime() - new Date(earlier.dates.end).getTime();
  return diff <= 0 ? 0 : Math.round(diff / (30.44 * 24 * 60 * 60 * 1000));
}

function sumDurations(events: ResumeEvent[]) {
  let total = 0;
  for (const e of events) {
    if (!e.dates?.start) continue;
    const start = new Date(e.dates.start);
    const end = e.dates.end ? new Date(e.dates.end) : new Date();
    if (isNaN(start.getTime())) continue;
    total += (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  }
  if (total <= 0) return '';
  const y = Math.floor(total / 12), m = total % 12;
  return m === 0 ? `${y}yr` : y === 0 ? `${total}mo` : `${y}yr ${m}mo`;
}

function fmtGap(months: number) {
  const y = Math.floor(months / 12), m = months % 12;
  return m === 0 ? `${y}yr` : y === 0 ? `${months}mo` : `${y}yr ${m}mo`;
}

function getEndYear(dateStr?: string | null) {
  if (dateStr === null) return String(new Date().getFullYear());
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? '' : String(d.getFullYear());
}

// ── Sub-components ────────────────────────────────────────────────────────────

const SkillDots: FC<{ level: number }> = ({ level }) => (
  <span className="re-skill-level">
    {Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < level ? 're-skill-dot filled' : 're-skill-dot'} />
    ))}
  </span>
);

const Dateline: FC<{ dates?: { start: string; end: string | null } }> = ({ dates }) => {
  if (!dates) return null;
  const period = formatDateRange(dates);
  const duration = calculateDuration(dates);
  if (!period) return null;
  return (
    <div className="re-entry-dateline">
      <span className="re-entry-period">{period}</span>
      {duration && <span className="re-entry-duration">{duration}</span>}
    </div>
  );
};

const EntryLinks: FC<{ links: Link[] }> = ({ links }) => {
  const valid = links.filter(l => getLinkUrl(l));
  if (!valid.length) return null;
  return (
    <div className="re-entry-links">
      {valid.map((l, i) => <a key={i} href={getLinkUrl(l)} target="_blank" rel="noopener noreferrer">{l.name}</a>)}
    </div>
  );
};

const Achievements: FC<{ achievements: string[] }> = ({ achievements }) => {
  const filtered = achievements.filter(Boolean);
  if (!filtered.length) return null;
  return (
    <div className="re-soft-tags re-entry-tags">
      {filtered.map((a, i) => <span key={i} className="re-soft-tag">{a}</span>)}
    </div>
  );
};

const GapIndicator: FC<{ months: number }> = ({ months }) => (
  <div className="re-role-gap" aria-hidden="true">
    <span className="re-role-gap-line" />
    <span className="re-role-gap-label"><strong>{fmtGap(months)}</strong> — other activities</span>
    <span className="re-role-gap-line" />
  </div>
);

const EntryWrap: FC<{ year: string; company?: string; children: ReactNode }> = ({ year, company, children }) => (
  <div className="re-entry-wrap">
    {children}
    <div className="re-entry-year-cell" aria-hidden="true">
      <span className="re-entry-year">{year}</span>
      {company && <span className="re-entry-company-tag">{company}</span>}
    </div>
  </div>
);

// ── Single entry ──────────────────────────────────────────────────────────────

const Entry: FC<{ event: ResumeEvent }> = ({ event }) => {
  const companyName = event.company?.name ?? '';
  const companyUrl  = event.company?.url;
  const industry    = [event.industry, event.subIndustry].filter(Boolean).join(' · ');
  const companyEl   = companyUrl
    ? <a href={companyUrl} target="_blank" rel="noopener noreferrer">{companyName}</a>
    : <>{companyName}</>;
  const subText = industry ? <>{companyEl} · {industry}</> : companyEl;
  const hasSub  = !!(companyName || industry);

  return (
    <EntryWrap year={getEndYear(event.dates?.end)} company={companyName || undefined}>
      <div className="re-entry">
        <div className="re-entry-title">{event.title}</div>
        <Dateline dates={event.dates} />
        {hasSub && <div className="re-entry-sub">{subText}</div>}
        {event.location && <div className="re-entry-sub re-entry-location">{event.location}</div>}
        {event.diploma  && <div className="re-entry-sub">{event.diploma}</div>}
        {event.description && <p className="re-entry-desc" dangerouslySetInnerHTML={{ __html: event.description }} />}
        <Achievements achievements={event.achievements ?? []} />
        <EntryLinks links={event.links ?? []} />
      </div>
    </EntryWrap>
  );
};

// ── Role inside a grouped company ─────────────────────────────────────────────

const Role: FC<{ event: ResumeEvent }> = ({ event }) => (
  <div className="re-role">
    <div className="re-role-title">{event.title}</div>
    <Dateline dates={event.dates} />
    {event.diploma && <div className="re-entry-sub">{event.diploma}</div>}
    {event.description && <p className="re-entry-desc" dangerouslySetInnerHTML={{ __html: event.description }} />}
    <Achievements achievements={event.achievements ?? []} />
    <EntryLinks links={event.links ?? []} />
  </div>
);

// ── Grouped company ───────────────────────────────────────────────────────────

const GroupEntry: FC<{ group: EventGroup; events: ResumeEvent[] }> = ({ group, events }) => {
  const starts     = events.map(e => e.dates?.start ? new Date(e.dates.start).getTime() : NaN).filter(t => !isNaN(t));
  const ends       = events.map(e => e.dates?.end   ? new Date(e.dates.end).getTime()   : NaN).filter(t => !isNaN(t));
  const hasPresent = events.some(e => e.dates?.end === null);

  const overallStart = starts.length ? new Date(Math.min(...starts)).toISOString() : '';
  const overallEnd: string | null = hasPresent ? null : (ends.length ? new Date(Math.max(...ends)).toISOString() : '');

  const companyUrl = events[0]?.company?.url;
  const industry   = [events[0]?.industry, events[0]?.subIndustry].filter(Boolean).join(' · ');

  const groupPeriod   = formatDateRange({ start: overallStart, end: overallEnd });
  const groupDuration = sumDurations(events);

  const roleItems: ReactNode[] = [];
  for (let i = 0; i < events.length; i++) {
    const ev = events[i];
    roleItems.push(
      <EntryWrap key={ev.id ?? i} year={getEndYear(ev.dates?.end)} company={group.company}>
        <Role event={ev} />
      </EntryWrap>
    );
    if (i < events.length - 1) {
      const gap = gapMonths(events[i], events[i + 1]);
      if (gap >= 2) roleItems.push(<GapIndicator key={`gap-${i}`} months={gap} />);
    }
  }

  return (
    <div className="re-group-block">
      <div className="re-group-header">
        <div className="re-entry-company-name">
          {companyUrl
            ? <a href={companyUrl} target="_blank" rel="noopener noreferrer">{group.company}</a>
            : group.company}
        </div>
        <div className="re-entry-dateline">
          <span className="re-entry-period">{groupPeriod}</span>
          {groupDuration && <span className="re-entry-duration">{groupDuration}</span>}
        </div>
        {industry && <div className="re-entry-sub">{industry}</div>}
      </div>
      <div className="re-entry-roles">{roleItems}</div>
    </div>
  );
};

// ── Grouping logic ────────────────────────────────────────────────────────────

function applyGrouping(
  events: ResumeEvent[],
  eventToGroup: Map<number, EventGroup>,
  buildSingle: (e: ResumeEvent) => ReactNode
): ReactNode[] {
  const result: ReactNode[] = [];
  const seen = new Set<number>();

  for (const event of events) {
    const group = event.id != null ? eventToGroup.get(event.id) : undefined;
    if (group) {
      if (!seen.has(group.id)) {
        seen.add(group.id);
        const groupEvents = events.filter(e => e.id != null && group.events.includes(e.id));
        result.push(<GroupEntry key={group.id} group={group} events={groupEvents} />);
      }
    } else {
      result.push(buildSingle(event));
    }
  }
  return result;
}

// ── Main component ────────────────────────────────────────────────────────────

const Resume: FC<{ data: ResumeData }> = ({ data }) => {
  const sorted = [...(data.events ?? [])].sort((a, b) => {
    const da = new Date(a.dates?.start ?? '').getTime() || 0;
    const db = new Date(b.dates?.start ?? '').getTime() || 0;
    return db - da;
  });

  const groups = data.eventGroups ?? [];
  const eventToGroup = new Map<number, EventGroup>();
  groups.forEach(g => g.events.forEach(eid => eventToGroup.set(eid, g)));

  const experiences    = applyGrouping(sorted.filter(e => e.type === 'experience'), eventToGroup, e => <Entry key={e.id} event={e} />);
  const education      = applyGrouping(sorted.filter(e => e.type === 'formation' && e.category === 'education'), eventToGroup, e => <Entry key={e.id} event={e} />);
  const certifications = sorted.filter(e => e.type === 'formation' && e.category === 'formation').map(e => <Entry key={e.id} event={e} />);

  const softTags  = (data.skills?.soft ?? []).map((s, i) => <span key={i} className="re-soft-tag">{s}</span>);
  const hardItems = (data.skills?.hard ?? []).map(([skill, level], i) => (
    <li key={i}><span>{skill}</span><SkillDots level={level} /></li>
  ));

  return (
    <div className="profile-sections">
      <div className="ps" id="rs-experience">
        <div className="ps-body">{experiences}</div>
      </div>
      <div className="ps" id="rs-education">
        <div className="ps-body">{education}</div>
      </div>
      <div className="ps" id="rs-certifications">
        <div className="ps-body">{certifications}</div>
      </div>
      <div className="ps" id="rs-skills">
        <div className="ps-body">
          <div className="re-skills-grid">
            <div>
              <span className="re-skill-group-title">Soft Skills</span>
              <div className="re-soft-tags">{softTags}</div>
            </div>
            <div>
              <span className="re-skill-group-title">Technical Skills</span>
              <ul className="re-skill-list">{hardItems}</ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Resume;
