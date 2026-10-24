// Builds public/gilbert-perrin-resume.pdf (npm run pdf): a 2-page CV that sums up the whole site,
// built around the track record's capabilities, not a copy of the resume page.
// Copy comes from profile.json (home), track-record.json and resume.json.
import { readFileSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const ROOT = new URL('..', import.meta.url);
const OUT = new URL('public/gilbert-perrin-resume.pdf', ROOT);
const json = f => JSON.parse(readFileSync(new URL(`src/data/${f}`, ROOT), 'utf8'));
const resume = json('resume.json');
const profile = json('profile.json');
const track = json('track-record.json');
const { personalInfo: me, pdf } = resume;

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const linkText = url => url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
const linkedin = resume.socialNetworks.find(n => n.name === 'LinkedIn').link;

// colours: the site's tokens, so the line colours match the track record map
const css = readFileSync(new URL('src/styles/main.css', ROOT), 'utf8');
const token = name => {
  const v = css.match(new RegExp(`${name}:\\s*([^;]+);`))[1].trim();
  return v.startsWith('var(') ? token(v.slice(4, -1)) : v;
};

// static Geist files (not the variable font) so Chrome embeds TrueType, not Type 3 glyphs
const FONTS = new URL('node_modules/geist/dist/fonts/', ROOT);
const face = (family, file, weight) => {
  const b64 = readFileSync(new URL(file, FONTS)).toString('base64');
  return `@font-face { font-family: '${family}'; font-weight: ${weight}; src: url(data:font/ttf;base64,${b64}) format('truetype'); }`;
};
const fontFaces = [
  face('Geist', 'geist-sans/Geist-Regular.ttf', 400),
  face('Geist', 'geist-sans/Geist-Medium.ttf', 500),
  face('Geist', 'geist-sans/Geist-SemiBold.ttf', 600),
  face('Geist Mono', 'geist-mono/GeistMono-Regular.ttf', 400),
  face('Geist Mono', 'geist-mono/GeistMono-Medium.ttf', 500),
].join('\n');

// 24px line icons (contact lines)
const ICON = {
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  pin: '<path d="M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7L12 6.3M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
};
const icon = (name, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICON[name]}</svg>`;
const secHead = title => `<h2 class="sec">${esc(title)}</h2>`;
const sideHead = title => `<h3 class="side-h">${esc(title)}</h3>`;

// ---------- content ----------
const hero = profile.hero;
const sections = Object.fromEntries(profile.sections.map(s => [s.id, s]));
const highlight = s => s.replace(/<em>(.*?)<\/em>/g, '<span class="hl">$1</span>');
const open = hero.byline.find(b => /open to/i.test(b));
const role = hero.byline[0];

// each capability: its summary and where it was proven (track-record.json lines: pitch, trace)
const capabilities = track.lines.map(l => `
  <section class="cap" style="--c:${token(l.color)}">
    <h3>${esc(l.name)}${l.fast ? '<span class="fast">AI-accelerated</span>' : ''}</h3>
    <p>${esc(l.pitch)}</p>
    <p class="trace">${esc(l.trace)}</p>
  </section>`);

const principles = `<div class="principles">${profile.principles.map(p => `
  <div><span class="when">${esc(p.when)}</span><h4>${esc(p.title)}</h4><p>${esc(p.text)}</p></div>`).join('')}</div>`;

const yr = d => d.slice(0, 4);
const span = (s, e) => {
  const a = yr(s), b = e ? yr(e) : 'now';
  return a === b ? a : `${a}–${b === 'now' ? b : b.slice(2)}`;
};
const experience = resume.events
  .filter(e => e.type === 'experience' && e.resume !== false)
  .sort((a, b) => b.dates.start.localeCompare(a.dates.start));
const career = `<ul class="career">${experience.map(e => `
  <li><span class="yr">${span(e.dates.start, e.dates.end)}</span><span><b>${esc(e.title.split(' — ')[0])}</b>${e.category === 'other' ? ' · independent study' : ` · ${esc(e.company.name)}`}</span></li>`).join('')}</ul>`;


const education = resume.events
  .filter(e => e.type === 'formation' && e.category === 'education')
  .sort((a, b) => b.dates.start.localeCompare(a.dates.start))
  .map(e => {
    const [degree, field] = e.title.split(/ — /);
    const honours = (e.description.match(/<b>((?:highest )?honours)<\/b>/) || [])[1];
    return `<li><b>${esc(field ?? degree)}</b><span>${esc(degree)}${honours ? `, ${honours}` : ''} · ${yr(e.dates.end)}</span></li>`;
  }).join('');

const languages = resume.languages.map(l => `<li><b>${esc(l.name)}</b><span>${esc(l.label ?? l.level)}</span></li>`).join('');
const skills = pdf.skills.map(g => `<div class="sk"><span class="sk-l">${esc(g.label)}</span><p>${g.items.map(esc).join(' · ')}</p></div>`).join('');
const photoSite = resume.socialNetworks.find(n => n.name === '500px portfolio').link;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${esc(me.name)} — CV</title>
<style>
  ${fontFaces}
  :root {
    --ink: ${token('--ink')}; --ink-2: ${token('--ink-2')}; --ink-3: ${token('--ink-3')};
    --rule: ${token('--rule')}; --side: ${token('--paper')}; --band: ${token('--band')}; --accent: ${token('--accent')}; --accent-text: ${token('--accent-text')};
    --body: 'Geist', sans-serif; --mono: 'Geist Mono', monospace;
    --side-w: 64mm;
  }
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { margin: 0; color: var(--ink-2); font: 400 8.5pt/1.45 var(--body); }
  h1, h2, h3, h4, p, ul { margin: 0; }
  ul { list-style: none; padding: 0; }
  b { font-weight: 600; color: var(--ink); }
  a { color: inherit; text-decoration: none; }
  .ic { width: 1em; height: 1em; fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; flex: none; }

  /* sidebar | main columns; page 1 adds a full-width top band above them */
  .page { width: 210mm; height: 297mm; overflow: hidden; break-after: page; background: #fff;
          display: grid; grid-template-columns: var(--side-w) 1fr; grid-template-rows: 1fr; }
  .p1 { grid-template-rows: auto 1fr; }
  .page:last-child { break-after: auto; }
  .side { min-height: 0; background: var(--side); padding: 0 8mm 10mm; display: flex; flex-direction: column; }
  .p1 .side { padding-top: 6mm; }
  .main { min-height: 0; padding: 11mm 12mm 10mm; display: flex; flex-direction: column; }
  .p1 .main { padding-top: 6mm; }
  .flow { position: relative; flex: 1; min-height: 0; }

  /* top band in the site's header band colour: identity left, profile right */
  .top { grid-column: 1 / -1; display: grid; grid-template-columns: var(--side-w) 1fr; background: var(--band); color: var(--ink); }
  .top .id { padding: 11mm 8mm 8mm; text-align: right; }
  .top .profile { padding: 11mm 12mm 8mm; }
  .id h1 { font: 600 21pt/1.05 var(--body); letter-spacing: .03em; text-transform: uppercase; }
  .id .role { margin-top: 3mm; font-size: 8.6pt; line-height: 1.35; color: var(--ink-2); }
  .id .tag { margin-top: 2.2mm; font: 500 6pt/1.4 var(--mono); letter-spacing: .02em; white-space: nowrap; text-transform: uppercase; color: var(--accent-text); }
  .p2 .id { flex: none; margin: 0 -8mm; padding: 7mm 8mm 5mm; background: var(--band); color: var(--ink); }
  .p2 .id p { font: 500 7.4pt/1.4 var(--mono); letter-spacing: .05em; text-transform: uppercase; }
  .p2 .id p + p { color: var(--accent-text); }

  /* sidebar */
  .side-h { margin: 6mm 0 2.4mm; padding-bottom: 1.4mm; border-bottom: .8pt solid var(--ink); font: 600 9.4pt/1 var(--body); letter-spacing: .05em; text-transform: uppercase; color: var(--ink); }
  .contact li { display: flex; gap: 2.4mm; align-items: center; padding: .9mm 0; font-size: 8.2pt; }
  .contact .ic { font-size: 9pt; color: var(--accent-text); }
  .sk { margin-bottom: 2.2mm; }
  .sk-l { display: block; font: 500 6.8pt/1.4 var(--mono); letter-spacing: .04em; text-transform: uppercase; color: var(--accent-text); }
  .sk p { font-size: 8.5pt; line-height: 1.45; }
  .pairs li { padding: .8mm 0; font-size: 8.5pt; line-height: 1.35; }
  .pairs li span { display: block; color: var(--ink-3); font-size: 7.8pt; }
  .side .note { font-size: 8.5pt; line-height: 1.45; }
  .side .note a { color: var(--accent-text); }

  /* main */
  .sec { position: relative; display: flex; align-items: center; margin: 6mm 0 3mm; padding-bottom: 1.4mm; border-bottom: .8pt solid var(--ink);
         font: 600 9.4pt/1 var(--body); letter-spacing: .05em; text-transform: uppercase; color: var(--ink); }
  .flow > .sec:first-child { margin-top: 0; }
  .lead { font: 600 13pt/1.25 var(--body); letter-spacing: -.01em; color: var(--ink); }
  .lead .hl { color: var(--accent-text); }
  .deck { margin-top: 2mm; font-size: 9.2pt; line-height: 1.45; color: var(--ink); }
  .about { margin-top: 2mm; }
  .about { color: var(--ink-2); }
  .open { display: inline-block; margin-top: 4mm; padding: .9mm 2.2mm; border: .8pt solid var(--accent); font: 500 6.8pt/1.2 var(--mono); letter-spacing: .04em; text-transform: uppercase; color: var(--accent-text); }

  /* each capability: a left border in its track record line colour */
  .cap { margin-top: 4.2mm; padding: .4mm 0 .4mm 3.6mm; border-left: 1.8pt solid var(--c); }
  .cap h3 { font: 600 9.4pt/1.3 var(--body); color: var(--ink); display: flex; align-items: baseline; gap: 2.4mm; }
  .fast { font: 500 6.2pt/1 var(--mono); letter-spacing: .04em; text-transform: uppercase; color: var(--ink-3); }
  .cap p { margin-top: 1mm; line-height: 1.45; }
  .cap .trace { margin-top: 1.2mm; font: 400 7pt/1.3 var(--mono); color: var(--ink-3); }

  .principles { display: grid; grid-template-columns: 1fr 1fr; gap: 3mm 6mm; }
  .when { font: 500 6.6pt/1 var(--mono); letter-spacing: .04em; text-transform: uppercase; color: var(--accent-text); }
  .principles h4 { margin: 1mm 0 .6mm; font: 600 9.2pt/1.2 var(--body); color: var(--ink); }
  .principles p { line-height: 1.42; }

  .career li { display: grid; grid-template-columns: 17mm 1fr; gap: 3mm; padding: .55mm 0; line-height: 1.35; }
  .yr { font: 400 7.4pt/1.6 var(--mono); color: var(--ink-3); }
  .career b { font-weight: 500; }

  /* justified text blocks; hyphenation keeps the word gaps even in narrow columns */
  /* not the skills lists: terms, not sentences, would open gaps around the separators */
  .deck, .about, .cap p:not(.trace), .principles p, .side .note { text-align: justify; hyphens: auto; }
  a { hyphens: none; }
  .side .note.link { margin-top: 1mm; text-align: left; }

  /* closing band, the mirror of the page 1 top band: contact left, call to action right */
  .p2 { grid-template-rows: 1fr auto; }
  .end { grid-column: 1 / -1; display: grid; grid-template-columns: var(--side-w) 1fr; align-items: center; background: var(--band); color: var(--ink); }
  .end-contact { padding: 9mm 8mm 10mm; font: 400 7.6pt/1.7 var(--mono); color: var(--ink-2); }
  .end-contact a { color: var(--ink); }
  .talk { padding: 9mm 12mm 10mm; font: 600 13pt/1.3 var(--body); letter-spacing: -.01em; }
  .talk .hl { color: var(--accent-text); }
</style>
</head>
<body>

<div class="page p1">
  <header class="top">
    <div class="id">
      <h1>${esc(me.name)}</h1>
      <p class="role">${role.split(' · ').map(esc).join('<br>')}</p>
      <p class="tag">Product · Design · Engineering + AI</p>
      ${open ? `<span class="open">${esc(open)}</span>` : ''}
    </div>
    <div class="profile">
      <p class="lead">${highlight(hero.title).replace('. ', '.<br>')}</p>
      <p class="deck">${hero.deck}</p>
      <p class="about">${sections.profile.paragraphs.join(' ')}</p>
    </div>
  </header>
  <aside class="side">
    <div class="flow" id="s1">
      ${sideHead('Contact')}
      <ul class="contact">
        <li>${icon('pin')}${esc(me.location)}</li>
        <li>${icon('mail')}<a href="mailto:${esc(me.email)}">${esc(me.email)}</a></li>
        <li>${icon('link')}<a href="${esc(linkedin)}">${esc(linkText(linkedin))}</a></li>
        <li>${icon('globe')}<a href="${esc(me.website)}">${esc(linkText(me.website))}</a></li>
      </ul>
      ${sideHead('Skills')}
      ${skills}
      ${sideHead('Languages')}
      <ul class="pairs">${languages}</ul>
    </div>
  </aside>
  <main class="main"><div class="flow" id="m1">
    ${secHead('What I can help with')}
    ${capabilities.join('')}
  </div></main>
</div>

<div class="page p2">
  <aside class="side">
    <header class="id"><p>${esc(me.name)}</p><p>${esc(linkText(me.website))}</p></header>
    <div class="flow" id="s2">
    ${sideHead('Photography')}
    <p class="note">${esc(pdf.photography)}</p>
    <p class="note link">Portfolio: <a href="${esc(photoSite)}">${esc(linkText(photoSite))}</a></p>
    ${sideHead('Education')}
    <ul class="pairs">${education}</ul>
    ${sideHead('Background')}
    <p class="note">${sections.background.paragraphs.join(' ')}</p>
  </div></aside>
  <main class="main"><div class="flow" id="m2">
    ${secHead('How I work')}
    ${principles}
    ${secHead('Career')}
    ${career}
  </div></main>
  <footer class="end">
    <p class="end-contact">
      <a href="mailto:${esc(me.email)}">${esc(me.email)}</a><br>
      <a href="${esc(linkedin)}">${esc(linkText(linkedin))}</a><br>
      <a href="${esc(me.website)}">${esc(linkText(me.website))}</a>
    </p>
    <p class="talk">${highlight(profile.close.title)}</p>
  </footer>
</div>

</body>
</html>`;

// the installed Google Chrome, so no Playwright browser download is needed
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage();
await page.emulateMedia({ media: 'print' });
await page.setContent(html, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);

// page 1 overflow moves to the top of page 2; a heading never stays alone at the bottom
const fit = await page.evaluate(() => {
  const bottom = el => el.lastElementChild ? el.lastElementChild.getBoundingClientRect().bottom - el.getBoundingClientRect().top : 0;
  const spill = (a, b) => {
    const from = document.getElementById(a), to = document.getElementById(b);
    while (bottom(from) > from.clientHeight + 1 && from.children.length > 1) {
      to.prepend(from.lastElementChild);
      if (from.lastElementChild?.matches('.sec, .side-h')) to.prepend(from.lastElementChild);
    }
  };
  spill('m1', 'm2');
  spill('s1', 's2');
  return ['m1', 'm2', 's1', 's2'].map(id => {
    const el = document.getElementById(id);
    return { id, spare: Math.round(el.clientHeight - bottom(el)) };
  });
});

const buf = await page.pdf({ preferCSSPageSize: true, printBackground: true, tagged: true, outline: true });
await browser.close();

writeFileSync(OUT, buf);
if (process.argv.includes('--html')) writeFileSync(new URL('resume-pdf.html', import.meta.url), html);
const pages = (buf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
console.log(`${OUT.pathname}: ${pages} pages, ${(buf.length / 1024).toFixed(0)} KB`);
console.log(fit.map(f => `${f.id} ${f.spare < 0 ? `${-f.spare}px OVER` : `${f.spare}px spare`}`).join(' · '));
if (pages !== 2 || fit.some(f => f.spare < 0)) process.exitCode = 1;
