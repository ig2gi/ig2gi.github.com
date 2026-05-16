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
  image?: SectionImage;
  links?: SectionLink[];
}

const ProfileSection: FC<{ section: ProfileSectionData }> = ({ section }) => {
  const img = section.image ? (
    <span>
      <img src={section.image.src} className="ps-image" alt={section.image.alt} />
      {section.image.caption && (
        <span className="ps-caption">{section.image.caption}</span>
      )}
    </span>
  ) : null;

  return (
    <div className="ps">
      <div className="ps-label">
        <strong>{section.label}</strong>
        {section.sublabel}
      </div>
      <div className="ps-body">
        {section.image?.position === 'top' && img}
        {section.paragraphs.map((text, i) => (
          <p key={i} dangerouslySetInnerHTML={{ __html: text }} />
        ))}
        {section.image?.position === 'bottom' && img}
        {section.links && section.links.length > 0 && (
          <div className="ps-links">
            {section.links.map((l, i) =>
              l.external ? (
                <a key={i} href={l.url} target="_blank" rel="noopener noreferrer">{l.label}</a>
              ) : (
                <a key={i} href={l.url}>{l.label}</a>
              )
            )}
          </div>
        )}
      </div>
    </div>
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
