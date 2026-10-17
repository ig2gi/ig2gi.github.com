import type { FC } from 'react';

interface SectionImage {
  src: string;
  alt: string;
  caption?: string;
  position: 'top' | 'bottom';
}

interface SectionLink {
  label: string;
  url: string;
  external: boolean;
}

interface ProfileSectionData {
  id: string;
  label: string;
  sublabel: string;
  paragraphs: string[];
  keywords?: string[];
  image?: SectionImage;
  links?: SectionLink[];
}

const ProfileSection: FC<{ section: ProfileSectionData }> = ({ section }) => {
  const img = section.image ? (
    <figure>
      <img src={section.image.src} className="ps-image" alt={section.image.alt} />
      {section.image.caption && <figcaption className="ps-caption">{section.image.caption}</figcaption>}
    </figure>
  ) : null;

  return (
    <section className="ps" id={section.id}>
      <aside className="ps-aside">
        <span className="label">{section.sublabel}</span>
        <h2>{section.label}</h2>
      </aside>
      <div className="ps-body ps-prose">
        {section.image?.position === 'top' && img}
        {section.paragraphs.map((text, i) => (
          <p key={i} dangerouslySetInnerHTML={{ __html: text }} />
        ))}
        {section.image?.position === 'bottom' && img}
        {section.keywords && section.keywords.length > 0 && (
          <div className="chips">
            {section.keywords.map(k => <span key={k} className="chip">{k}</span>)}
          </div>
        )}
        {section.links && section.links.length > 0 && (
          <div className="ps-links">
            {section.links.map((l, i) => (
              <a key={i} className="btn" href={l.url}
                {...(l.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                {l.label}
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

interface ProfileData {
  sections: ProfileSectionData[];
}

const ProfileSections: FC<{ data: ProfileData }> = ({ data }) => (
  <div className="profile-sections">
    {data.sections.map(s => <ProfileSection key={s.id} section={s} />)}
  </div>
);

export default ProfileSections;
