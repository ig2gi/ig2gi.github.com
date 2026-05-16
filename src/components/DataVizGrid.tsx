import { useState, useEffect, useCallback, type FC } from 'react';

export interface PortfolioItem {
  id: number;
  title: string;
  year: number[];
  description: string;
  company: string;
  technology: string | string[];
  url: string;
  image: string;
  open?: boolean;
}

// ── Lightbox ──────────────────────────────────────────────────────────────────

const Lightbox: FC<{ src: string; alt: string; onClose: () => void }> = ({ src, alt, onClose }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="pf-lightbox pf-lightbox--open">
      <div className="pf-lightbox-backdrop" onClick={onClose} />
      <button className="pf-lightbox-close" onClick={onClose} aria-label="Close">×</button>
      <img className="pf-lightbox-img" src={src} alt={alt} />
    </div>
  );
};

// ── Card ──────────────────────────────────────────────────────────────────────

const Card: FC<{ item: PortfolioItem; onImageClick: (src: string, alt: string) => void }> = ({ item, onImageClick }) => {
  const techs = (Array.isArray(item.technology)
    ? item.technology
    : String(item.technology).split(/\s*\/\s*|\s+/)
  ).filter(Boolean);

  const yearStr = item.year.join('–');

  return (
    <div className="pf-card">
      <div className="pf-image-wrap" onClick={() => onImageClick(item.image, item.title)}>
        <img src={item.image} alt={item.title} loading="lazy" />
      </div>
      <div className="pf-card-body">
        <div className="pf-card-meta">
          <span className="pf-year">{yearStr}</span>
          <span className="pf-company">{item.company}</span>
          {item.open && item.url && (
            <a className="pf-open-btn" href={item.url} target="_blank" rel="noopener noreferrer">OPEN ↗</a>
          )}
        </div>
        <div className="pf-title">{item.title}</div>
        {item.description && <p className="pf-desc">{item.description}</p>}
      </div>
      <div className="pf-techs">
        {techs.map((t, i) => <span key={i} className="pf-chip">{t}</span>)}
      </div>
    </div>
  );
};

// ── Grid ──────────────────────────────────────────────────────────────────────

const DataVizGrid: FC<{ items: PortfolioItem[] }> = ({ items }) => {
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);

  const sorted = [...items].sort((a, b) => Math.max(...b.year) - Math.max(...a.year));

  const open  = useCallback((src: string, alt: string) => setLightbox({ src, alt }), []);
  const close = useCallback(() => setLightbox(null), []);

  return (
    <>
      <div className="pf-grid">
        {sorted.map(item => <Card key={item.id} item={item} onImageClick={open} />)}
      </div>
      {lightbox && <Lightbox src={lightbox.src} alt={lightbox.alt} onClose={close} />}
    </>
  );
};

export default DataVizGrid;
