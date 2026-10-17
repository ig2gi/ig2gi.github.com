import type { ScalePoint } from 'd3-scale';

// ─── Raw shape from resume.json ──────────────────────────────────────────────

export interface RawEvent {
  id: number;
  title: string;
  dates: { start: string; end: string | null };
  type: 'experience' | 'formation';
  category: string;
  industry: string;
  company: { name: string; url: string; logo: string };
  description: string;
  achievements: string[];
  hardSkills: string[];
  softSkills: string[];
  teamSize: number | null;
  diploma?: string;
}

// ─── Enriched types ───────────────────────────────────────────────────────────

export type Track = 'leadership' | 'product' | 'dataviz' | 'engineering' | 'education';

export type StationVariant = 'vp' | 'head' | 'ic' | 'degree' | 'cert' | 'mooc';

export const DOMAIN_COLORS: Record<string, string> = {
  healthcare:  '#d87943',
  finance:     '#2c4a7c',
  energy:      '#6b7280',
  telecom:     '#0d9488',
  independent: '#4a7c59',
  education:   '#a0aec0',
};

export interface ProcessedEvent {
  id: number;
  title: string;
  company: string;
  companyUrl: string;
  startDate: Date;
  endDate: Date | null;
  durationLabel: string;
  track: Track;
  variant: StationVariant;
  colorKey: string;
  color: string;
  industry: string;
  category: string;
  description: string;
  achievements: string[];
  hardSkills: string[];
  isActive: boolean;
}

export interface MetricsData {
  totalYears: number;
  byIndustry: { label: string; years: number; colorKey: string }[];
  byContract: { label: string; count: number; years: number }[];
  companySizes: { label: string; range: string; count: number }[];
  responsibilityArc: { label: string; variant: StationVariant }[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseDate(s: string): Date {
  return new Date(s);
}

function durationLabel(start: Date, end: Date | null): string {
  const endMs = end ? end.getTime() : Date.now();
  const months = Math.round((endMs - start.getTime()) / (1000 * 60 * 60 * 24 * 30.4));
  if (months < 12) return `${months}mo`;
  const y = Math.floor(months / 12);
  const m = months % 12;
  return m > 0 ? `${y}y ${m}mo` : `${y}y`;
}

function assignTrack(ev: RawEvent): Track {
  if (ev.type === 'formation') return 'education';

  const t = ev.title.toLowerCase();
  const cat = ev.category;

  if (t.startsWith('vp'))                         return 'leadership';
  if (t.startsWith('head of platform'))           return 'leadership';
  if (t.startsWith('head of product'))            return 'leadership';
  if (t.startsWith('head of front'))              return 'dataviz';
  if (t.includes('product manager'))              return 'product';
  if (t.includes('data vis') || t.includes('data viz')) return 'dataviz';
  if (t.includes('photography'))                  return 'dataviz'; // pivot station
  if (cat === 'education')                        return 'education';
  return 'engineering';
}

function assignVariant(ev: RawEvent): StationVariant {
  if (ev.type === 'formation') {
    const cat = ev.category;
    const dip = (ev.diploma ?? '').toLowerCase();
    if (cat === 'education' || ['dea', 'dess', 'engineer', 'mathematics'].some(d => dip.includes(d))) return 'degree';
    const name = ev.company.name.toLowerCase();
    if (['scrum.org', 'iiba', 'sun micro'].some(s => name.includes(s))) return 'cert';
    return 'mooc';
  }
  const t = ev.title.toLowerCase();
  if (t.startsWith('vp')) return 'vp';
  if (t.startsWith('head of')) return 'head';
  return 'ic';
}

function assignColorKey(ev: RawEvent): string {
  const ind = ev.industry.toLowerCase();
  if (ind.includes('health') || ind.includes('medicine') || ind.includes('genomic')) return 'healthcare';
  if (ind.includes('finance') || ind.includes('banking')) return 'finance';
  if (ind.includes('energy') || ind.includes('construct') || ind.includes('electric')) return 'energy';
  if (ind.includes('telecom') || ind.includes('broadcast')) return 'telecom';
  if (['photography', 'software', 'data visualization'].includes(ind)) return 'independent';
  return 'independent';
}

// ─── Main transform ───────────────────────────────────────────────────────────

export function processEvents(raw: RawEvent[]): ProcessedEvent[] {
  return raw
    .map(ev => {
      const startDate = parseDate(ev.dates.start);
      const endDate   = ev.dates.end ? parseDate(ev.dates.end) : null;
      const colorKey  = ev.type === 'formation' ? 'education' : assignColorKey(ev);
      return {
        id:            ev.id,
        title:         ev.title,
        company:       ev.company.name,
        companyUrl:    ev.company.url,
        startDate,
        endDate,
        durationLabel: durationLabel(startDate, endDate),
        track:         assignTrack(ev),
        variant:       assignVariant(ev),
        colorKey,
        color:         DOMAIN_COLORS[colorKey] ?? '#9ca3af',
        industry:      ev.industry,
        category:      ev.category,
        description:   ev.description,
        achievements:  ev.achievements,
        hardSkills:    ev.hardSkills,
        isActive:      !ev.dates.end,
      };
    })
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
}

// ─── Metrics ──────────────────────────────────────────────────────────────────

export function computeMetrics(events: ProcessedEvent[]): MetricsData {
  const experience = events.filter(e => e.track !== 'education');

  // Total years: earliest start to now
  const earliest = experience.reduce((a, b) => a.startDate < b.startDate ? a : b);
  const totalYears = Math.round((Date.now() - earliest.startDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25));

  // By industry
  const industryMap: Record<string, { years: number; colorKey: string }> = {};
  for (const ev of experience) {
    const key = ev.industry;
    const end = ev.endDate ?? new Date();
    const years = (end.getTime() - ev.startDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    if (!industryMap[key]) industryMap[key] = { years: 0, colorKey: ev.colorKey };
    industryMap[key].years += years;
  }
  const byIndustry = Object.entries(industryMap)
    .map(([label, v]) => ({ label, years: Math.round(v.years * 10) / 10, colorKey: v.colorKey }))
    .sort((a, b) => b.years - a.years)
    .slice(0, 6);

  // By contract
  const contractMap: Record<string, { count: number; years: number }> = {};
  for (const ev of experience) {
    const cat = ev.category === 'other' ? 'employee' : ev.category;
    const end = ev.endDate ?? new Date();
    const years = (end.getTime() - ev.startDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    if (!contractMap[cat]) contractMap[cat] = { count: 0, years: 0 };
    contractMap[cat].count++;
    contractMap[cat].years += years;
  }
  const byContract = Object.entries(contractMap)
    .map(([label, v]) => ({ label, count: v.count, years: Math.round(v.years * 10) / 10 }))
    .sort((a, b) => b.years - a.years);

  // Company sizes (approximated from known companies)
  const sizeBuckets: Record<string, Set<string>> = {
    'startup (<50)': new Set(),
    'scale-up (50-500)': new Set(),
    'large (500+)': new Set(),
  };
  const startupCompanies    = ['sophia', 'dalin', 'neo', 'genomsys', 'ias'];
  const scaleupCompanies    = ['bipe', 'rts', 'odyssey'];
  const largeCompanies      = ['pictet', 'spie', 'iusti', 'johns', 'coursera', 'deeplearning'];

  for (const ev of experience) {
    const cn = ev.company.toLowerCase();
    const key = startupCompanies.some(s => cn.includes(s)) ? 'startup (<50)'
              : largeCompanies.some(s => cn.includes(s))   ? 'large (500+)'
              : 'scale-up (50-500)';
    sizeBuckets[key].add(ev.company);
  }
  const companySizes = Object.entries(sizeBuckets).map(([label, set]) => ({
    label: label.split(' ')[0],
    range: label,
    count: set.size,
  }));

  // Responsibility arc: unique VP / Head / IC sequence
  const arc = experience
    .filter(e => ['vp', 'head', 'ic'].includes(e.variant))
    .reduce<{ label: string; variant: StationVariant }[]>((acc, e) => {
      const last = acc[acc.length - 1];
      const label = e.variant === 'vp' ? 'VP' : e.variant === 'head' ? 'Head' : 'IC';
      if (!last || last.label !== label) acc.push({ label, variant: e.variant as StationVariant });
      return acc;
    }, []);

  return { totalYears, byIndustry, byContract, companySizes, responsibilityArc: arc };
}
