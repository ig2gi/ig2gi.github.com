import { useState, useCallback } from 'react';
import { processEvents, computeMetrics } from '../../lib/timelineData';
import { computeLayout } from '../../lib/timelineLayout';
import type { Track } from '../../lib/timelineData';
import type { StationLayout } from '../../lib/timelineLayout';
import JourneyMap from './JourneyMap';
import MetricsPanel from './MetricsPanel';
import Tooltip from './Tooltip';
import type { RawEvent } from '../../lib/timelineData';

interface TimelineProps {
  events: RawEvent[];
}

const FILTER_TRACKS: { label: string; value: Track }[] = [
  { label: 'LEADERSHIP', value: 'leadership' },
  { label: 'PRODUCT',    value: 'product'    },
  { label: 'DATA VIZ',  value: 'dataviz'    },
  { label: 'ENGINEERING',value: 'engineering'},
  { label: 'EDUCATION', value: 'education'  },
];

export default function Timeline({ events }: TimelineProps) {
  const [activeFilter, setActiveFilter] = useState<Track | null>(null);
  const [hoveredStation, setHoveredStation] = useState<StationLayout | null>(null);
  const [svgRect, setSvgRect] = useState<DOMRect | null>(null);

  const processed = processEvents(events);
  const metrics   = computeMetrics(processed);
  const layout    = computeLayout(processed);

  const handleHover = useCallback((station: StationLayout | null, rect: DOMRect | null) => {
    setHoveredStation(station);
    setSvgRect(rect);
  }, []);

  const handleFilter = useCallback((track: Track | null) => {
    setActiveFilter(prev => prev === track ? null : track);
  }, []);

  return (
    <div className="timeline-root">

      {/* Filter bar */}
      <div className="timeline-filters">
        <button
          className={`tl-filter-btn ${activeFilter === null ? 'active' : ''}`}
          onClick={() => setActiveFilter(null)}
        >
          ALL
        </button>
        {FILTER_TRACKS.map(f => (
          <button
            key={f.value}
            className={`tl-filter-btn ${activeFilter === f.value ? 'active' : ''}`}
            onClick={() => handleFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Main 2/3 + 1/3 layout */}
      <div className="timeline-body">
        <div className="timeline-map-col">
          <JourneyMap
            stations={layout.stations}
            connections={layout.connections}
            educationDots={layout.educationDots}
            svgWidth={layout.svgWidth}
            trackY={layout.trackY}
            activeFilter={activeFilter}
            onHover={handleHover}
          />
        </div>
        <div className="timeline-metrics-col">
          <MetricsPanel
            metrics={metrics}
            activeFilter={activeFilter}
            onFilter={handleFilter}
          />
        </div>
      </div>

      {/* Floating tooltip — rendered in body space via fixed positioning */}
      <Tooltip station={hoveredStation} svgRect={svgRect} />
    </div>
  );
}
