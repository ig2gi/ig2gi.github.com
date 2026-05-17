import { useEffect, useState } from 'react';

const SECTIONS = [
  { id: 'rs-experience',     label: 'Career' },
  { id: 'rs-education',      label: 'Degrees' },
  { id: 'rs-certifications', label: 'Learning' },
  { id: 'rs-skills',         label: 'Expertise' },
] as const;

export default function ResumeScrollNav() {
  const [active, setActive]           = useState<string>(SECTIONS[0].id);
  const [currentYear, setCurrentYear] = useState<string>('');
  const [navTop, setNavTop]           = useState<number | null>(null);

  useEffect(() => {
    const anchor = document.querySelector('#rs-experience .re-entry-wrap');
    if (anchor) {
      setNavTop(anchor.getBoundingClientRect().top + window.scrollY);
    }

    const update = () => {
      const mid = window.innerHeight / 2;

      // active section
      let current = SECTIONS[0].id;
      for (const { id } of SECTIONS) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= mid) current = id;
      }
      setActive(current);

      // year: last re-entry-year whose top is above the midpoint
      let year = '';
      for (const wrap of document.querySelectorAll('.re-entry-wrap')) {
        if (wrap.getBoundingClientRect().top <= mid) {
          const y = wrap.querySelector('.re-entry-year')?.textContent ?? '';
          if (y) year = y;
        }
      }
      setCurrentYear(year);
    };

    window.addEventListener('scroll', update, { passive: true });
    update();
    return () => window.removeEventListener('scroll', update);
  }, []);

  const topStyle = navTop != null ? { top: navTop, transform: 'none' } : undefined;

  return (
    <nav className="rs-dot-nav" style={topStyle} aria-label="Resume sections">
      {SECTIONS.map(({ id, label }) => (
        <a
          key={id}
          href={`#${id}`}
          className={`rs-dot-item${active === id ? ' rs-dot-active' : ''}`}
          aria-label={label}
        >
          <span className="rs-dot-label">{label}</span>
          <span className="rs-dot" />
          {active === id && currentYear && (
            <span className="rs-dot-year">{currentYear}</span>
          )}
        </a>
      ))}
    </nav>
  );
}
