import type { MetricsData } from '../../lib/timelineData';
import { DOMAIN_COLORS } from '../../lib/timelineData';
import type { Track } from '../../lib/timelineData';

interface MetricsPanelProps {
  metrics: MetricsData;
  activeFilter: Track | null;
  onFilter: (track: Track | null) => void;
}

const CONTRACT_COLORS: Record<string, string> = {
  employee:   '#d87943',
  freelance:  '#4a7c59',
  consultant: '#2c4a7c',
  education:  '#a0aec0',
  other:      '#6b7280',
};

const TRACK_FILTER_MAP: Record<string, Track> = {
  'Healthcare':       'leadership',
  'Finance':          'engineering',
  'Data-Driven Medicine': 'dataviz',
};

export default function MetricsPanel({ metrics, activeFilter, onFilter }: MetricsPanelProps) {
  const maxIndustryYears = metrics.byIndustry[0]?.years ?? 1;

  return (
    <div className="metrics-panel">

      {/* Total */}
      <div className="metrics-stat">
        <span className="metrics-big">{metrics.totalYears}</span>
        <span className="metrics-label">years experience</span>
      </div>

      <div className="metrics-divider" />

      {/* Industry bars */}
      <div className="metrics-section">
        <div className="metrics-section-title">Industry</div>
        {metrics.byIndustry.map(ind => (
          <div key={ind.label} className="metrics-bar-row">
            <span className="metrics-bar-label">{ind.label}</span>
            <div className="metrics-bar-track">
              <div
                className="metrics-bar-fill"
                style={{
                  width: `${(ind.years / maxIndustryYears) * 100}%`,
                  background: DOMAIN_COLORS[ind.colorKey] ?? '#d87943',
                  opacity: activeFilter ? 0.5 : 1,
                }}
              />
            </div>
            <span className="metrics-bar-value">{Math.round(ind.years)}y</span>
          </div>
        ))}
      </div>

      <div className="metrics-divider" />

      {/* Contract type */}
      <div className="metrics-section">
        <div className="metrics-section-title">Contract Type</div>
        <div className="metrics-contract-grid">
          {metrics.byContract.map(c => (
            <div key={c.label} className="metrics-contract-item">
              <div
                className="metrics-contract-badge"
                style={{ borderColor: CONTRACT_COLORS[c.label] ?? '#6b7280', color: CONTRACT_COLORS[c.label] ?? '#6b7280' }}
              >
                {Math.round(c.years)}y
              </div>
              <span className="metrics-contract-label">{c.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="metrics-divider" />

      {/* Company sizes */}
      <div className="metrics-section">
        <div className="metrics-section-title">Company Size</div>
        <div className="metrics-sizes">
          {metrics.companySizes.map(cs => (
            <div key={cs.label} className="metrics-size-item">
              <span className="metrics-size-icon">
                {cs.label === 'startup' ? '◆' : cs.label === 'scale-up' ? '◆◆' : '◆◆◆'}
              </span>
              <span className="metrics-size-count">{cs.count}</span>
              <span className="metrics-size-label">{cs.range}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="metrics-divider" />

      {/* Responsibility arc */}
      <div className="metrics-section">
        <div className="metrics-section-title">Responsibility Arc</div>
        <div className="metrics-arc">
          {metrics.responsibilityArc.map((item, i) => (
            <span key={i} className="metrics-arc-step">
              {i > 0 && <span className="metrics-arc-arrow">→</span>}
              <span className={`metrics-arc-node metrics-arc-${item.variant}`}>{item.label}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="metrics-divider" />

      {/* Filter hint */}
      <div className="metrics-filter-hint">
        {activeFilter
          ? <button className="metrics-clear-filter" onClick={() => onFilter(null)}>✕ clear filter</button>
          : <span>hover map to explore</span>
        }
      </div>

    </div>
  );
}
