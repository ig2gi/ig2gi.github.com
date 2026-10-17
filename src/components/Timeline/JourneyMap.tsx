import { useRef, useState, useCallback } from 'react';
import type { StationLayout, ConnectionLayout } from '../../lib/timelineLayout';
import { SVG_HEIGHT, TRACK_LABELS } from '../../lib/timelineLayout';
import type { Track } from '../../lib/timelineData';
import { DOMAIN_COLORS } from '../../lib/timelineData';

interface JourneyMapProps {
  stations: StationLayout[];
  connections: ConnectionLayout[];
  educationDots: StationLayout[];
  svgWidth: number;
  trackY: (track: Track) => number;
  activeFilter: Track | null;
  onHover: (station: StationLayout | null, rect: DOMRect | null) => void;
}

const TRACKS: Track[] = ['leadership', 'product', 'dataviz', 'engineering', 'education'];

// Shape for each station variant
function StationShape({ s, dimmed }: { s: StationLayout; dimmed: boolean }) {
  const { x, y, r, event: ev } = s;
  const opacity = dimmed ? 0.15 : 1;

  if (ev.variant === 'vp') {
    // Hexagon for VP roles
    const pts = Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 3) * i - Math.PI / 6;
      return `${x + r * Math.cos(a)},${y + r * Math.sin(a)}`;
    }).join(' ');
    return <polygon points={pts} fill={ev.color} stroke="white" strokeWidth={2} opacity={opacity} />;
  }

  if (ev.variant === 'head') {
    return (
      <g opacity={opacity}>
        <circle cx={x} cy={y} r={r} fill={ev.color} stroke="white" strokeWidth={2} />
        <circle cx={x} cy={y} r={r - 3} fill="none" stroke="white" strokeWidth={1.5} />
      </g>
    );
  }

  if (ev.variant === 'degree') {
    return <rect x={x - r} y={y - r} width={r * 2} height={r * 2} fill={ev.color} stroke="white" strokeWidth={1} rx={1} opacity={opacity} />;
  }

  if (ev.variant === 'cert') {
    const pts = [
      `${x},${y - r}`,
      `${x + r},${y + r * 0.6}`,
      `${x - r},${y + r * 0.6}`,
    ].join(' ');
    return <polygon points={pts} fill={ev.color} stroke="white" strokeWidth={1} opacity={opacity} />;
  }

  // Default circle (ic, mooc)
  return <circle cx={x} cy={y} r={r} fill={ev.color} stroke="white" strokeWidth={1.5} opacity={opacity} />;
}

export default function JourneyMap({
  stations, connections, educationDots, svgWidth, trackY, activeFilter, onHover,
}: JourneyMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  const isDimmed = useCallback((track: Track) =>
    activeFilter !== null && track !== activeFilter, [activeFilter]);

  const getSvgRect = () => svgRef.current?.getBoundingClientRect() ?? null;

  // Year labels — show year at each station (deduplicated)
  const yearLabels: { x: number; year: number }[] = [];
  let lastYear = -1;
  for (const s of stations) {
    const y = s.event.startDate.getFullYear();
    if (y !== lastYear) { yearLabels.push({ x: s.x, year: y }); lastYear = y; }
  }

  return (
    <div className="journey-map-scroll">
      <svg
        ref={svgRef}
        width={svgWidth}
        height={SVG_HEIGHT}
        className="journey-map-svg"
      >
        {/* Track background lines */}
        {TRACKS.map(track => (
          <line
            key={track}
            x1={40}
            y1={trackY(track)}
            x2={svgWidth - 20}
            y2={trackY(track)}
            stroke={track === 'education' ? '#e5e7eb' : '#f0ede8'}
            strokeWidth={track === 'education' ? 1 : 2}
            strokeDasharray={track === 'education' ? '4 6' : undefined}
            opacity={isDimmed(track) ? 0.3 : 1}
          />
        ))}

        {/* Track labels */}
        {TRACKS.filter(t => t !== 'education').map(track => (
          <text
            key={`lbl-${track}`}
            x={38}
            y={trackY(track)}
            textAnchor="end"
            dominantBaseline="middle"
            fontSize={9}
            fontFamily="'Space Mono', monospace"
            fill="#9ca3af"
            opacity={isDimmed(track) ? 0.2 : 1}
            letterSpacing={1}
          >
            {TRACK_LABELS[track]}
          </text>
        ))}

        {/* Connection paths */}
        {connections.map((c, i) => (
          <path
            key={i}
            d={c.path}
            stroke={c.color}
            strokeWidth={c.isTransition ? 2 : 3}
            strokeDasharray={c.isTransition ? '6 3' : undefined}
            fill="none"
            opacity={
              activeFilter
                ? (c.from.event.track === activeFilter || c.to.event.track === activeFilter ? 0.9 : 0.08)
                : 0.75
            }
          />
        ))}

        {/* Education dots */}
        {educationDots.map(s => (
          <g
            key={`edu-${s.event.id}`}
            onMouseEnter={() => onHover(s, getSvgRect())}
            onMouseLeave={() => onHover(null, null)}
            style={{ cursor: 'pointer' }}
            opacity={activeFilter && activeFilter !== 'education' ? 0.15 : 1}
          >
            <StationShape s={s} dimmed={false} />
          </g>
        ))}

        {/* Education track label */}
        <text
          x={38}
          y={trackY('education')}
          textAnchor="end"
          dominantBaseline="middle"
          fontSize={9}
          fontFamily="'Space Mono', monospace"
          fill="#9ca3af"
          opacity={activeFilter && activeFilter !== 'education' ? 0.2 : 0.7}
          letterSpacing={1}
        >
          {TRACK_LABELS['education']}
        </text>

        {/* Experience stations */}
        {stations.map(s => (
          <g
            key={`st-${s.event.id}`}
            onMouseEnter={() => onHover(s, getSvgRect())}
            onMouseLeave={() => onHover(null, null)}
            style={{ cursor: 'pointer' }}
          >
            {/* Hit area */}
            <circle cx={s.x} cy={s.y} r={s.r + 8} fill="transparent" />
            <StationShape s={s} dimmed={isDimmed(s.event.track)} />
          </g>
        ))}

        {/* Year labels along bottom */}
        {yearLabels.map(({ x, year }) => (
          <text
            key={`yr-${year}`}
            x={x}
            y={SVG_HEIGHT - 8}
            textAnchor="middle"
            fontSize={9}
            fontFamily="'Space Mono', monospace"
            fill="#c4b9a8"
          >
            {year}
          </text>
        ))}
      </svg>
    </div>
  );
}
