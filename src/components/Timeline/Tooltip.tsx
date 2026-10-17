import type { StationLayout } from '../../lib/timelineLayout';

interface TooltipProps {
  station: StationLayout | null;
  svgRect: DOMRect | null;
}

export default function Tooltip({ station, svgRect }: TooltipProps) {
  if (!station || !svgRect) return null;

  const ev = station.event;
  const left = svgRect.left + station.x;
  const top  = svgRect.top  + station.y - station.r - 12;

  const startYear = ev.startDate.getFullYear();
  const endYear   = ev.endDate ? ev.endDate.getFullYear() : 'present';
  const dateRange = startYear === endYear ? `${startYear}` : `${startYear} – ${endYear}`;

  return (
    <div
      className="timeline-tooltip"
      style={{ left: `${left}px`, top: `${top}px` }}
    >
      <div className="tt-header">
        <span className="tt-dot" style={{ background: ev.color }} />
        <span className="tt-title">{ev.title}</span>
      </div>
      <div className="tt-company">{ev.company}</div>
      <div className="tt-meta">
        <span>{dateRange}</span>
        <span className="tt-sep">·</span>
        <span>{ev.durationLabel}</span>
        {ev.isActive && <span className="tt-active">now</span>}
      </div>
      {ev.achievements.length > 0 && (
        <div className="tt-chips">
          {ev.achievements.slice(0, 3).map((a, i) => (
            <span key={i} className="tt-chip">{a}</span>
          ))}
        </div>
      )}
    </div>
  );
}
