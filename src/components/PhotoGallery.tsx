import { useState, useEffect, useCallback, type FC } from 'react';

export interface Photo {
  id: number;
  src: string;
  title: string;
  year?: number;      // no year → no caption (e.g. a mosaic)
  theme: string;
  srcSet?: string;    // smaller versions for phones
}

// one hero mosaic per set (b&w, colour…), same size, switched in place
export interface Mosaic {
  label: string;      // switch label, e.g. "b&w"
  src: string;        // full size, also opened in the lightbox
  srcSet: string;
  alt: string;
}

// theme chips are hidden for now (data kept), like the resume and dataviz tags
const SHOW_TAGS = false;

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

// ── Mosaic switch ─────────────────────────────────────────────────────────────

const MosaicSwitch: FC<{ mosaics: Mosaic[]; onOpen: (m: Mosaic) => void }> = ({ mosaics, onOpen }) => {
  const [active, setActive] = useState(0);
  // the other mosaics are only downloaded once the visitor reaches for the switch
  const [warm, setWarm] = useState(false);
  const current = mosaics[active];

  return (
    <>
      {mosaics.length > 1 && (
        <div className="ph-switch" role="group" aria-label="Mosaic"
             onPointerEnter={() => setWarm(true)} onFocus={() => setWarm(true)}>
          {mosaics.map((m, i) => (
            <button key={m.label} type="button" aria-pressed={i === active}
                    onPointerDown={() => setWarm(true)} onClick={() => setActive(i)}>{m.label}</button>
          ))}
        </div>
      )}
      <figure className="ph-fig ph-fig--hero ph-mosaic" onClick={() => onOpen(current)}>
        {mosaics.map((m, i) => (i === active || warm) && (
          <img key={m.src} src={m.src} srcSet={m.srcSet} sizes="(max-width: 768px) 100vw, 640px"
               alt={i === active ? m.alt : ''} aria-hidden={i !== active}
               className={i === active ? 'is-active' : undefined} />
        ))}
      </figure>
    </>
  );
};

// ── Gallery ───────────────────────────────────────────────────────────────────

const PhotoGallery: FC<{ photos: Photo[]; mosaics?: Mosaic[]; portfolio: string }> = ({ photos, mosaics = [], portfolio }) => {
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);

  const open  = useCallback((src: string, alt: string) => setLightbox({ src, alt }), []);
  const close = useCallback(() => setLightbox(null), []);

  // with mosaics, they are the hero and every photo goes below
  const hero      = mosaics.length ? undefined : photos[0];
  const rest      = hero ? photos.slice(1) : photos;
  const secondary = rest.slice(0, 2);
  const fold      = rest.slice(2);

  if (!hero && !mosaics.length) return null;

  return (
    <>
      <div className="ph-newspaper">
        <div className="ph-frontpage">
          <div className="ph-hero-col">
            {hero ? (
              <>
                <figure className="ph-fig ph-fig--hero" onClick={() => open(hero.src, hero.title || hero.theme)}>
                  <img src={hero.src} srcSet={hero.srcSet} sizes="(max-width: 768px) 100vw, 640px" alt={hero.title || hero.theme} />
                </figure>
                {hero.year && <div className="ph-caption">{hero.theme.toUpperCase()} · {hero.year}</div>}
              </>
            ) : (
              <MosaicSwitch mosaics={mosaics} onOpen={m => open(m.src, m.alt)} />
            )}
          </div>

          <div className="ph-text-col">
            <div className="ph-article">
              <p>
                Photography began in 2008 as a deliberate year out, to train my eye for composition and light.
                I took formal courses and studied the classics on my own: <em>Stephen Shore</em> for how
                to frame the ordinary, <em>Harald Mante</em> for colour and form, <em>Michael Freeman</em> for
                the <span className="no-hyphens">photographer's</span> eye.
              </p>
              <p>
                Then practice. A four-month internship as a press photographer at the Police Cantonale Vaudoise
                taught me to document events with factual precision. From 2009 to 2012 I was the official
                photographer of <em>La Nuit des Musées de Lausanne</em>: crowds, events and low light, four
                years in a row.
              </p>
              <p>
                Today I photograph streets and cities, people, landscapes and abstract forms, in black and
                white and in colour.
              </p>
              <p>
                The same habits run through my design and data visualisation work: what to leave out of the
                frame, where the eye lands first, how light and contrast carry the message.
              </p>
            </div>

            {SHOW_TAGS && (
              <div className="ph-chips">
                {['Street', 'Urban', 'Portraits', 'Landscape', 'Abstract', 'Minimalist'].map(t => (
                  <span key={t} className="ph-chip">{t}</span>
                ))}
              </div>
            )}

            <a href={portfolio} target="_blank" rel="noopener noreferrer" className="btn ph-ext-link">
              Portfolio on 500px <span aria-hidden="true">↗</span>
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
