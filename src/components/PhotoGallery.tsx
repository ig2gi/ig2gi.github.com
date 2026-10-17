import { useState, useEffect, useCallback, type FC } from 'react';

export interface Photo {
  id: number;
  src: string;
  title: string;
  year: number;
  theme: string;
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

// ── Gallery ───────────────────────────────────────────────────────────────────

const PhotoGallery: FC<{ photos: Photo[] }> = ({ photos }) => {
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);

  const open  = useCallback((src: string, alt: string) => setLightbox({ src, alt }), []);
  const close = useCallback(() => setLightbox(null), []);

  const hero      = photos[0];
  const secondary = photos.slice(1, 3);
  const fold      = photos.slice(3);

  if (!hero) return null;

  return (
    <>
      <div className="ph-newspaper">
        <div className="ph-frontpage">
          <div className="ph-hero-col">
            <figure className="ph-fig ph-fig--hero" onClick={() => open(hero.src, hero.theme)}>
              <img src={hero.src} alt={hero.theme} loading="lazy" />
            </figure>
            <div className="ph-caption">{hero.theme.toUpperCase()} · {hero.year}</div>
          </div>

          <div className="ph-text-col">
            <p className="ph-article">
              Self-taught since 2008, grounded in <em>Shore</em>, <em>Mante</em>, and <em>Freeman</em>.
              A press internship at the Police Cantonale Vaudoise, then four years as official photographer
              for <em>La Nuit des Musées de Lausanne</em> — events, crowds, low light. The same attention
              to composition and light informs my work in UX design and data visualisation.
            </p>

            <div className="ph-chips">
              {['Street', 'Urban', 'Portraits', 'Minimalist'].map(t => (
                <span key={t} className="ph-chip">{t}</span>
              ))}
            </div>

            <a href="https://ig2gi.500px.photography/" target="_blank" rel="noopener noreferrer" className="btn ph-ext-link">
              Full portfolio on 500px <span aria-hidden="true">↗</span>
            </a>

            {secondary.length > 0 && (
              <div className="ph-secondary">
                {secondary.map(p => (
                  <figure key={p.id} className="ph-fig ph-fig--sec" onClick={() => open(p.src, p.theme)}>
                    <img src={p.src} alt={p.theme} loading="lazy" />
                    <div className="ph-caption">{p.theme.toUpperCase()} · {p.year}</div>
                  </figure>
                ))}
              </div>
            )}
          </div>
        </div>

        {fold.length > 0 && (
          <div className="ph-fold">
            {fold.map(p => (
              <figure key={p.id} className="ph-fig ph-fig--fold" onClick={() => open(p.src, p.theme)}>
                <img src={p.src} alt={p.theme} loading="lazy" />
                <div className="ph-caption">{p.theme.toUpperCase()} · {p.year}</div>
              </figure>
            ))}
          </div>
        )}
      </div>

      {lightbox && <Lightbox src={lightbox.src} alt={lightbox.alt} onClose={close} />}
    </>
  );
};

export default PhotoGallery;
