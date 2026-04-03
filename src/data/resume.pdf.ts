import { readFile } from "fs/promises";
import { fileURLToPath } from "url";

type Link = {
  name: string;
  url?: string;
  link?: string;
};

type Event = {
  title: string;
  dates?: string[];
  industry?: string;
  subIndustry?: string;
  type?: string;
  company?: {
    name?: string;
    url?: string;
  };
  links?: Link[];
  description?: string;
};

type ResumeData = {
  personalInfo: {
    name: string;
    age?: number;
    phone?: string;
    location?: string;
    website?: string;
    email?: string;
  };
  header?: {
    title?: string;
    description?: string;
  };
  profile?: {
    description?: string;
  };
  socialNetworks?: Link[];
  skills?: {
    soft?: string[];
    hard?: Array<[string, number, boolean]>;
  };
  events?: Event[];
  languages?: Array<{ name: string; level: string }>;
  leadership?: Array<{ title: string; definition: string }>;
  hobbies?: Array<{ title: string; description: string }>;
};

async function getJson<T>(file: string): Promise<T> {
  const json = await readFile(fileURLToPath(import.meta.resolve(file)), "utf-8");
  return JSON.parse(json.trim()) as T;
}

function formatDate(date?: string): string {
  if (!date) return "";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("en-US", { year: "numeric", month: "short" });
}

function formatDateRange(dates?: string[]): string {
  if (!dates || dates.length === 0) return "";
  if (dates.length === 1) return `${formatDate(dates[0])} - Present`;
  return `${formatDate(dates[0])} - ${formatDate(dates[1])}`;
}

function getLinkUrl(link?: Link): string {
  return link?.url ?? link?.link ?? "";
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const lines: string[] = [];
  let current = words[0];

  for (let i = 1; i < words.length; i += 1) {
    const next = words[i];
    const candidate = `${current} ${next}`;
    if (candidate.length <= maxChars) {
      current = candidate;
    } else {
      lines.push(current);
      current = next;
    }
  }

  lines.push(current);
  return lines;
}

function escapePdfText(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function pushWrapped(lines: string[], text?: string, indent = "", maxChars = 96): void {
  if (!text) return;
  const wrapped = wrapText(text, maxChars - indent.length);
  for (const line of wrapped) lines.push(`${indent}${line}`);
}

function buildContentLines(resume: ResumeData): string[] {
  const lines: string[] = [];
  const events = [...(resume.events ?? [])].sort((a, b) => {
    const da = new Date(a.dates?.[0] ?? "").getTime() || 0;
    const db = new Date(b.dates?.[0] ?? "").getTime() || 0;
    return db - da;
  });

  const experiences = events.filter((event) => event.type === "experience");
  const formations = events.filter((event) => event.type === "formation");

  lines.push(resume.personalInfo.name);
  if (resume.header?.title) lines.push(resume.header.title);
  lines.push("");

  lines.push("CONTACT");
  if (resume.personalInfo.email) lines.push(`- Email: ${resume.personalInfo.email}`);
  if (resume.personalInfo.phone) lines.push(`- Phone: ${resume.personalInfo.phone}`);
  if (resume.personalInfo.website) lines.push(`- Website: ${resume.personalInfo.website}`);
  if (resume.personalInfo.location) lines.push(`- Location: ${resume.personalInfo.location}`);
  if (resume.personalInfo.age != null) lines.push(`- Age: ${resume.personalInfo.age}`);
  lines.push("");

  if ((resume.socialNetworks ?? []).length > 0) {
    lines.push("SOCIAL");
    for (const network of resume.socialNetworks ?? []) {
      const url = getLinkUrl(network);
      if (network.name && url) lines.push(`- ${network.name}: ${url}`);
      else if (network.name) lines.push(`- ${network.name}`);
    }
    lines.push("");
  }

  if (resume.profile?.description) {
    lines.push("PROFILE");
    pushWrapped(lines, resume.profile.description);
    lines.push("");
  }

  if ((resume.skills?.soft ?? []).length > 0 || (resume.skills?.hard ?? []).length > 0) {
    lines.push("SKILLS");
    if ((resume.skills?.soft ?? []).length > 0) {
      lines.push("- Soft: " + (resume.skills?.soft ?? []).join(", "));
    }
    if ((resume.skills?.hard ?? []).length > 0) {
      const hard = (resume.skills?.hard ?? []).map(([name, level]) => `${name} (${level}/5)`);
      pushWrapped(lines, `- Hard: ${hard.join(", ")}`);
    }
    lines.push("");
  }

  if (experiences.length > 0) {
    lines.push("PROFESSIONAL EXPERIENCE");
    for (const experience of experiences) {
      lines.push(experience.title);
      const meta = [
        formatDateRange(experience.dates),
        experience.company?.name ?? "",
        [experience.industry, experience.subIndustry].filter(Boolean).join(" - "),
      ]
        .filter(Boolean)
        .join(" | ");
      if (meta) lines.push(meta);
      pushWrapped(lines, experience.description, "  ");
      lines.push("");
    }
  }

  if (formations.length > 0) {
    lines.push("EDUCATION & CERTIFICATIONS");
    for (const formation of formations) {
      lines.push(formation.title);
      const meta = [
        formatDateRange(formation.dates),
        formation.company?.name ?? "",
        [formation.industry, formation.subIndustry].filter(Boolean).join(" - "),
      ]
        .filter(Boolean)
        .join(" | ");
      if (meta) lines.push(meta);
      pushWrapped(lines, formation.description, "  ");
      lines.push("");
    }
  }

  if ((resume.languages ?? []).length > 0) {
    lines.push("LANGUAGES");
    for (const language of resume.languages ?? []) {
      lines.push(`- ${language.name} (${language.level})`);
    }
    lines.push("");
  }

  if ((resume.leadership ?? []).length > 0) {
    lines.push("LEADERSHIP");
    for (const leadership of resume.leadership ?? []) {
      pushWrapped(lines, `- ${leadership.title}: ${leadership.definition}`);
    }
    lines.push("");
  }

  if ((resume.hobbies ?? []).length > 0) {
    lines.push("HOBBIES");
    for (const hobby of resume.hobbies ?? []) {
      pushWrapped(lines, `- ${hobby.title}: ${hobby.description}`);
    }
  }

  return lines;
}

function createPdf(lines: string[]): Buffer {
  const pageWidth = 595;
  const pageHeight = 842;
  const marginX = 50;
  const marginTop = 58;
  const marginBottom = 56;
  const lineHeight = 13;
  const linesPerPage = Math.floor((pageHeight - marginTop - marginBottom) / lineHeight);
  const pages: string[][] = [];

  for (let i = 0; i < lines.length; i += linesPerPage) {
    pages.push(lines.slice(i, i + linesPerPage));
  }
  if (pages.length === 0) pages.push(["Resume"]);

  const pageCount = pages.length;
  const firstPageObject = 3;
  const fontObject = firstPageObject + pageCount * 2;

  const objects: string[] = [];
  objects.push("<< /Type /Catalog /Pages 2 0 R >>");

  const kids = pages
    .map((_, index) => `${firstPageObject + index * 2} 0 R`)
    .join(" ");
  objects.push(`<< /Type /Pages /Kids [ ${kids} ] /Count ${pageCount} >>`);

  for (let index = 0; index < pages.length; index += 1) {
    const pageObject = firstPageObject + index * 2;
    const contentObject = pageObject + 1;
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontObject} 0 R >> >> /Contents ${contentObject} 0 R >>`,
    );

    const textLines = pages[index].map((line) => `(${escapePdfText(line)}) Tj`);
    const stream = [
      "BT",
      "/F1 11 Tf",
      `${lineHeight} TL`,
      `1 0 0 1 ${marginX} ${pageHeight - marginTop} Tm`,
      ...textLines.flatMap((line, i) => (i === 0 ? [line] : ["T*", line])),
      "ET",
    ].join("\n");

    objects.push(`<< /Length ${Buffer.byteLength(stream, "utf8")} >>\nstream\n${stream}\nendstream`);
  }

  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];

  for (let i = 0; i < objects.length; i += 1) {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
  }

  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i < offsets.length; i += 1) {
    pdf += `${offsets[i].toString().padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(pdf, "utf8");
}

const resume = await getJson<ResumeData>("./resume.json");
const lines = buildContentLines(resume);
const pdf = createPdf(lines);

process.stdout.write(pdf);
