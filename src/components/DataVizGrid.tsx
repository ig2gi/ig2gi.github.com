import { useState, useEffect, useCallback, type FC, type ReactNode } from 'react';

export interface PortfolioItem {
  id: number;
  title: string;
  year: number[];
  description: string;
  company: string;
  technology: string | string[];
  category: string;
  link?: string;        // live project: internal page or external notebook
  slug?: string;        // internal pages open in a frame page at /dataviz/<slug>
  gallery?: string[];   // full-size screenshots; defaults to the card image
  url?: string;
  image: string;
  open?: boolean;
}

export interface PortfolioGroup { id: string; key: string; name: string; label: string; }

// tool chips are hidden: tools say little about the work (data kept in dataviz.json)
const SHOW_TECHS = false;

// the company line is set in capitals; SOPHiA keeps its lowercase i
const keepCase = (s: string): ReactNode =>
  s.includes('SOPHiA') ? <>{s.split('SOPHiA')[0]}SOPH<span className="keep-case">i</span>A{s.split('SOPHiA')[1]}</> : s;

// ── Lightbox ──────────────────────────────────────────────────────────────────

const Lightbox: FC<{ images: string[]; alt: string; onClose: () => void }> = ({ images, alt, onClose }) => {
  const [index, setIndex] = useState(0);
  const many = images.length > 1;
  const step = useCallback((d: number) => setIndex(i => (i + d + images.length) % images.length), [images.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (many && e.key === 'ArrowRight') step(1);
      if (many && e.key === 'ArrowLeft') step(-1);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose, many, step]);

  return (
    <div className="pf-lightbox pf-lightbox--open" role="dialog" aria-modal="true" aria-label={alt}>
      <div className="pf-lightbox-backdrop" onClick={onClose} />
      <button className="pf-lightbox-close" onClick={onClose} aria-label="Close">×</button>
      <img key={images[index]} className="pf-lightbox-img" src={images[index]} alt={many ? `${alt}, ${index + 1} of ${images.length}` : alt} />
      {many && (
        <div className="pf-lightbox-nav">
          <button onClick={() => step(-1)} aria-label="Previous image">←</button>
          <span>{index + 1} / {images.length}</span>
          <button onClick={() => step(1)} aria-label="Next image">→</button>
        </div>
      )}
    </div>
  );
};

// ── Card ──────────────────────────────────────────────────────────────────────

// the whole card opens the project: a live page in a new tab, or its screenshots
const Card: FC<{ item: PortfolioItem; onView: (images: string[], alt: string) => void }> = ({ item, onView }) => {
  const techs = (Array.isArray(item.technology)
    ? item.technology
    : String(item.technology).split(/\s*\/\s*|\s+/)
  ).filter(Boolean);

  const yearStr = item.year.join('–');
  const images  = item.gallery ?? [item.image];
  const href    = item.slug ? `/dataviz/${item.slug}` : item.link;
  const hint    = item.link ? 'Open ↗' : images.length > 1 ? `${images.length} images` : 'View';

  return (
    <div className={item.link ? 'pf-card pf-card--link' : 'pf-card'}>
      <div className="pf-image-wrap">
        <img src={item.image} alt="" loading="lazy" />
      </div>
      <div className="pf-card-body">
        <div className="pf-card-meta">
          <span className="pf-year">{yearStr}</span>
          <span className="pf-company">{keepCase(item.company)}</span>
          <span className="pf-hint" aria-hidden="true">{hint}</span>
        </div>
        <h3 className="pf-title">
          {item.link
            ? <a className="pf-target" href={href} target="_blank" rel="noopener noreferrer">{item.title}</a>
            : <button type="button" className="pf-target" onClick={() => onView(images, item.title)}>{item.title}</button>}
        </h3>
        {item.description && <p className="pf-desc">{item.description}</p>}
      </div>
      {SHOW_TECHS && (
        <div className="pf-techs">
          {techs.map((t, i) => <span key={i} className="pf-chip">{t}</span>)}
        </div>
      )}
    </div>
  );
};

// ── Grid ──────────────────────────────────────────────────────────────────────

const DataVizGrid: FC<{ items: PortfolioItem[]; groups: PortfolioGroup[] }> = ({ items, groups }) => {
  const [lightbox, setLightbox] = useState<{ images: string[]; alt: string } | null>(null);

  const sorted = [...items].sort((a, b) => Math.max(...b.year) - Math.max(...a.year));

  const view  = useCallback((images: string[], alt: string) => setLightbox({ images, alt }), []);
  const close = useCallback(() => setLightbox(null), []);

  return (
    <>
      {groups.map(g => (
        <section key={g.id} id={g.id} className="pf-section" aria-labelledby={`${g.id}-title`}>
          <div className="ps-aside">
            <h2 id={`${g.id}-title`}>{g.name}</h2>
            <span className="label">{keepCase(g.label)}</span>
          </div>
          <div className="pf-grid">
            {sorted.filter(i => i.category === g.key).map(item => <Card key={item.id} item={item} onView={view} />)}
          </div>
        </section>
      ))}
      {lightbox && <Lightbox images={lightbox.images} alt={lightbox.alt} onClose={close} />}
    </>
  );
};

export default DataVizGrid;
