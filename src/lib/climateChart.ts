// Global surface temperature change: the interactive chart (runs in the browser).
// Three panels share one time axis: yearly lines, every month as a strip, and the
// 8 latitude bands with each band as tall as its share of the Earth's surface.
// Interactions: scrub a year (or a month), click a band to compare it, brush the
// stripes at the bottom to zoom, switch the baseline.
import * as d3 from 'd3';
import type { ClimateData } from './gistemp';

type Base = 'nasa' | 'pre';
const BASELINES: Record<Base, [number, number]> = { nasa: [1951, 1980], pre: [1880, 1900] };

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
// ink only: the colour of the chart is the temperature
const GLOBAL_LINES = [
  { key: 'Glob', label: 'Global', color: 'var(--ink)', width: 2.25, dash: null },
  { key: 'NHem', label: 'North', color: 'var(--ink)', width: 1, dash: null },
  { key: 'SHem', label: 'South', color: 'var(--ink-2)', width: 1.25, dash: '4 3' },
];
/** CSS background for a line swatch, dashed when the line is */
const swatch = (g: { color: string; dash?: string | null }) =>
  g.dash ? `repeating-linear-gradient(90deg, ${g.color} 0 4px, transparent 4px 7px)` : g.color;
const PIN_COLORS = ['var(--cat-4)', 'var(--cat-5)', 'var(--cat-1)', 'var(--cat-2)'];
const MAX_PINS = PIN_COLORS.length;
const TEMP_STOPS = ['--temp-c3', '--temp-c2', '--temp-c1', '--temp-0', '--temp-w1', '--temp-w2', '--temp-w3'];

const fmt = (v: number | null | undefined) => (v == null ? '–' : d3.format('+.2f')(v).replace('+0.00', '0.00'));
const ordinal = (n: number) => {
  const s = ['th', 'st', 'nd', 'rd'], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};
const mean = (a: number[]) => (a.length ? d3.mean(a)! : 0);

export function initClimateChart(root: HTMLElement, data: ClimateData) {
  const plot = root.querySelector<HTMLElement>('.clim-plot')!;
  const read = root.querySelector<HTMLElement>('.clim-read')!;
  const zonesEl = root.querySelector<HTMLElement>('.clim-zones')!;
  const mapBox = root.querySelector<HTMLElement>('.clim-map')!;
  const mapYear = root.querySelector<HTMLElement>('.clim-map-year')!;
  const keyEl = root.querySelector<HTMLElement>('.clim-key')!;
  const legendEl = root.querySelector<HTMLElement>('.clim-legend')!;
  const resetBtn = root.querySelector<HTMLButtonElement>('.clim-reset')!;
  const status = root.querySelector<HTMLElement>('.clim-status')!;
  const baseBtns = [...root.querySelectorAll<HTMLButtonElement>('[data-base]')];

  const { years, zones } = data;
  const firstYear = years[0], lastYear = years[years.length - 1];
  const mStart = data.monthly.start;
  const mCount = data.monthly.values.length;
  const tEnd = mStart + mCount / 12;           // end of the last published month
  const full: [number, number] = [firstYear, tEnd];

  // ---------- baselines: shift each series by its own mean over the reference period ----------
  const rebased = new Map<Base, { series: Record<string, number[]>; monthly: (number | null)[] }>();
  function values(base: Base) {
    if (rebased.has(base)) return rebased.get(base)!;
    let out;
    if (base === 'nasa') {
      out = { series: data.series, monthly: data.monthly.values };   // NASA's own numbers, untouched
    } else {
      const [a, b] = BASELINES[base];
      const series: Record<string, number[]> = {};
      for (const [k, s] of Object.entries(data.series)) {
        const off = mean(s.filter((_, i) => years[i] >= a && years[i] <= b));
        series[k] = s.map(v => v - off);
      }
      // monthly: one offset per calendar month, as NASA does for its own baseline
      const offs = MONTHS.map((_, m) => mean(
        d3.range(a, b + 1).map(y => data.monthly.values[(y - mStart) * 12 + m]).filter((v): v is number => v != null)));
      const monthly = data.monthly.values.map((v, i) => (v == null ? null : v - offs[i % 12]));
      out = { series, monthly };
    }
    rebased.set(base, out);
    return out;
  }

  // rank of each month among the same calendar month (does not depend on the baseline)
  const monthRank = new Map<number, [number, number]>();
  for (let m = 0; m < 12; m++) {
    const idx = d3.range(m, mCount, 12).filter(i => data.monthly.values[i] != null);
    idx.sort((p, q) => data.monthly.values[q]! - data.monthly.values[p]!);
    idx.forEach((i, r) => monthRank.set(i, [r + 1, idx.length]));
  }

  // rank of each year in each series, warmest first
  const yearRank: Record<string, number[]> = {};
  for (const [k, s] of Object.entries(data.series)) {
    const order = d3.range(s.length).sort((p, q) => s[q] - s[p]);
    yearRank[k] = [];
    order.forEach((i, r) => (yearRank[k][i] = r + 1));
  }

  // ---------- state ----------
  const state = {
    base: 'nasa' as Base,
    domain: full as [number, number],
    pins: [] as string[],
    year: lastYear,
    month: null as number | null,     // index into monthly values when the month strip is scrubbed
    hoverZone: null as string | null,
  };

  // ---------- svg skeleton ----------
  const uid = Math.random().toString(36).slice(2, 8);
  const svg = d3.select(plot).append('svg')
    .attr('class', 'clim-svg')
    .attr('tabindex', 0)
    .attr('role', 'img')
    .attr('aria-label', 'Temperature anomalies, global and by latitude band, 1880 to today. Use the arrow keys to move through the years.');
  const clip = svg.append('defs').append('clipPath').attr('id', `clim-clip-${uid}`).append('rect');
  const gMain = svg.append('g');
  const gCursor = svg.append('g').attr('class', 'clim-cursor').attr('pointer-events', 'none');
  const gOver = svg.append('g').attr('class', 'clim-over');
  const overlay = svg.append('rect').attr('class', 'clim-overlay');
  const mapSvg = d3.select(mapBox).append('svg').attr('class', 'clim-map-svg');

  let W = 0;
  let L: ReturnType<typeof layout>;
  let x = d3.scaleLinear();
  let yA = d3.scaleLinear();
  let color: d3.ScaleDiverging<string> = d3.scaleDivergingSqrt<string>();
  let bandY = new Map<string, [number, number]>();

  function layout(width: number) {
    const narrow = width < 560;
    const ends = width >= 640;             // values of the last year in view, boxed inside the line panel
    const m = { l: narrow ? 58 : 68, r: narrow ? 6 : 10 };
    // overview first: the zoom strip sits next to the controls and shows where the view is in time
    const O = { top: 24, h: narrow ? 24 : 30 };
    const A = { top: O.top + O.h + 76, h: narrow ? 170 : 250 };
    const B = { top: A.top + A.h + 40, h: narrow ? 18 : 24 };
    const C = { top: B.top + B.h + 40, h: narrow ? 180 : 220 };
    const axisY = C.top + C.h + 6;
    return { narrow, ends, m, A, B, C, axisY, O, height: axisY + 28 };
  }

  function colorScale() {
    const v = values(state.base);
    const all = [...zones.flatMap(z => v.series[z.key]), ...v.monthly.filter((d): d is number => d != null)];
    const M = Math.ceil(d3.max(all, d => Math.abs(d))! * 2) / 2;
    const cs = getComputedStyle(root);
    const stops = TEMP_STOPS.map(s => cs.getPropertyValue(s).trim());
    // square root: most anomalies sit within ±1 °C, so they get more of the colour range;
    // 0 stays neutral and the legend samples the same scale
    return d3.scaleDivergingSqrt<string>(d3.interpolateRgbBasis(stops)).domain([-M, 0, M]).clamp(true);
  }

  // ---------- full draw (size, baseline) ----------
  function renderAll() {
    W = plot.clientWidth;
    if (!W) return;
    L = layout(W);
    color = colorScale();
    svg.attr('width', W).attr('height', L.height).attr('viewBox', `0 0 ${W} ${L.height}`);
    clip.attr('x', L.m.l).attr('y', 0).attr('width', W - L.m.l - L.m.r).attr('height', L.height);
    overlay.attr('x', L.m.l).attr('y', L.A.top - 20).attr('width', W - L.m.l - L.m.r).attr('height', L.C.top + L.C.h - L.A.top + 20);

    // latitude bands: half an equal share, half the share of the Earth's surface (see gistemp.ts)
    let y0 = L.C.top;
    bandY = new Map();
    for (const z of zones) {
      const h = z.share * L.C.h;
      bandY.set(z.key, [y0, y0 + h]);
      y0 += h;
    }

    renderOverview();
    renderMain();
    renderMap();
    renderLegend();
    renderKey();
    updateCursor();
    updateReadout();
  }

  // ---------- the three panels ----------
  function renderMain() {
    const { m, A, B, C, axisY, narrow } = L;
    const v = values(state.base);
    x = d3.scaleLinear().domain(state.domain).range([m.l, W - m.r]);
    const [d0, d1] = state.domain;
    const visible = years.map((y, i) => [y, i] as const).filter(([y]) => y + 1 > d0 && y < d1);
    const ref = BASELINES[state.base];

    gMain.selectAll('*').remove();
    const clipped = gMain.append('g').attr('clip-path', `url(#clim-clip-${uid})`);

    // panel titles
    const title = (y: number, text: string) =>
      gMain.append('text').attr('class', 'clim-panel').attr('x', m.l).attr('y', y).text(text);
    title(A.top - 30, narrow ? 'Yearly mean · band range' : 'Yearly mean, °C · bars: coldest to warmest band');
    title(B.top - 12, narrow ? 'Every month, global' : 'Every month, global');
    title(C.top - 12, narrow ? 'By latitude' : 'By latitude, North Pole to South Pole');

    // --- A: for each year, a bar from the coldest to the warmest band, the yearly lines on top ---
    const zoneKeys = zones.map(z => z.key);
    const spread = visible.map(([y, i]) => ({ y, i, ext: d3.extent(zoneKeys, k => v.series[k][i]) as [number, number] }));
    const lineKeys = [...GLOBAL_LINES.map(g => g.key), ...state.pins];
    const ext = d3.extent([...spread.flatMap(d => d.ext), ...visible.flatMap(([, i]) => lineKeys.map(k => v.series[k][i]))]) as [number, number];
    yA = d3.scaleLinear().domain([Math.min(ext[0], 0), Math.max(ext[1], 0)]).nice(5).range([A.top + A.h, A.top]);

    // both reference periods stay visible: the active baseline shaded, NASA's outlined when it is not the one in use
    for (const [b, [r0, r1]] of Object.entries(BASELINES) as [Base, [number, number]][]) {
      const active = b === state.base;
      if (!active && b !== 'nasa') continue;
      clipped.append('rect').attr('class', active ? 'clim-ref' : 'clim-ref clim-ref--other')
        .attr('x', x(r0)).attr('width', x(r1 + 1) - x(r0))
        .attr('y', A.top).attr('height', A.h);
      const name = b === 'nasa' ? 'NASA baseline' : 'baseline';
      clipped.append('text').attr('class', 'clim-ref-label')
        .attr('x', x(r0) + 6).attr('y', A.top + 13)
        .text(narrow ? (active ? 'baseline' : 'NASA') : active ? `baseline ${r0}–${r1}` : `${name} ${r0}–${r1}`);
    }

    const grid = gMain.append('g').attr('class', 'clim-yaxis');
    for (const t of yA.ticks(5)) {
      grid.append('line').attr('class', t === 0 ? 'zero' : null)
        .attr('x1', m.l).attr('x2', W - m.r).attr('y1', yA(t)).attr('y2', yA(t));
      grid.append('text').attr('x', m.l - 8).attr('y', yA(t)).attr('dy', '0.32em')
        .text(t === 0 ? '0 °C' : d3.format('+.1f')(t));
    }

    // one vertical gradient for every bar, on the same colour scale as the strips
    const gid = `clim-spread-${uid}`;
    const [lo, hi] = yA.domain();
    gMain.append('defs').append('linearGradient').attr('id', gid)
      .attr('gradientUnits', 'userSpaceOnUse').attr('x1', 0).attr('x2', 0).attr('y1', yA(lo)).attr('y2', yA(hi))
      .selectAll('stop').data(d3.range(0, 1.0001, 1 / 24)).join('stop')
      .attr('offset', t => t).attr('stop-color', t => color(lo + t * (hi - lo)));
    clipped.append('g').attr('class', 'clim-spread').selectAll('rect').data(spread).join('rect')
      .attr('x', d => x(d.y)).attr('width', d => Math.max(0.5, x(d.y + 1) - x(d.y) - (x(1) - x(0) > 4 ? 1 : 0)))
      .attr('y', d => yA(d.ext[1])).attr('height', d => Math.max(1, yA(d.ext[0]) - yA(d.ext[1])))
      .attr('fill', `url(#${gid})`);

    const line = (k: string) => d3.line<number>()
      .defined((_, i) => years[i] + 1 > d0 - 1 && years[i] < d1 + 1)
      .x((_, i) => x(years[i] + 0.5)).y(d => yA(d))(v.series[k]);
    state.pins.forEach((k, i) => clipped.append('path').attr('class', 'clim-line clim-line--pin')
      .attr('d', line(k)).style('stroke', PIN_COLORS[i]));
    for (const g of [...GLOBAL_LINES].reverse()) {
      clipped.append('path').attr('class', 'clim-line').attr('d', line(g.key))
        .style('stroke', g.color).style('stroke-width', g.width).style('stroke-dasharray', g.dash);
    }

    // --- B: every month ---
    gMain.append('text').attr('class', 'clim-row-label').attr('x', m.l - 8).attr('y', B.top + B.h / 2).attr('dy', '0.32em').text('Global');
    const i0 = Math.max(0, Math.floor((d0 - mStart) * 12)), i1 = Math.min(mCount, Math.ceil((d1 - mStart) * 12));
    const cells = d3.range(i0, i1).filter(i => v.monthly[i] != null);
    clipped.append('g').attr('class', 'clim-cells').selectAll('rect').data(cells).join('rect')
      .attr('x', i => x(mStart + i / 12)).attr('width', i => x(mStart + (i + 1) / 12) - x(mStart + i / 12) + 0.4)
      .attr('y', B.top).attr('height', B.h).attr('fill', i => color(v.monthly[i]!));

    // --- C: latitude bands ---
    const bands = clipped.append('g').attr('class', 'clim-cells');
    for (const z of zones) {
      const [ya, yb] = bandY.get(z.key)!;
      const s = v.series[z.key];
      bands.append('g').selectAll('rect').data(visible).join('rect')
        .attr('x', ([y]) => x(y)).attr('width', ([y]) => x(y + 1) - x(y) + 0.4)
        .attr('y', ya).attr('height', Math.max(1, yb - ya - 1)).attr('fill', ([, i]) => color(s[i]));
    }
    // equator
    const eq = (bandY.get('EQU-24N')![1]);
    gMain.append('line').attr('class', 'clim-eq').attr('x1', m.l).attr('x2', W - m.r).attr('y1', eq - 0.5).attr('y2', eq - 0.5);

    const labels = gMain.append('g').attr('class', 'clim-band-labels');
    for (const z of zones) {
      const [ya, yb] = bandY.get(z.key)!;
      const pin = state.pins.indexOf(z.key);
      labels.append('text').attr('data-zone', z.key)
        .classed('is-pinned', pin >= 0)
        .attr('x', m.l - 8).attr('y', (ya + yb) / 2).attr('dy', '0.32em')
        .style('fill', pin >= 0 ? PIN_COLORS[pin] : null)
        .text(z.label);
      if (pin >= 0) {
        clipped.append('rect').attr('class', 'clim-pin-frame')
          .attr('x', m.l).attr('width', W - m.l - m.r).attr('y', ya + 0.75).attr('height', Math.max(1, yb - ya - 2.5))
          .style('stroke', PIN_COLORS[pin]);
      }
    }

    // values of the last year in view, in a box at the bottom right of the line panel (usually empty there)
    if (L.ends && visible.length) {
      const [ly, li] = visible[visible.length - 1];
      const rows = [
        ...GLOBAL_LINES.map(g => ({ text: g.label, v: v.series[g.key][li], color: g.color, dash: g.dash })),
        ...state.pins.map((k, i) => ({ text: zones.find(z => z.key === k)!.label, v: v.series[k][li], color: PIN_COLORS[i], dash: null })),
      ];
      const bw = 132, rh = 15, bh = 24 + rows.length * rh;
      const bx = W - m.r - bw - 6, by = A.top + A.h - bh - 6;
      const box = gMain.append('g').attr('class', 'clim-ends').attr('transform', `translate(${bx},${by})`);
      box.append('rect').attr('width', bw).attr('height', bh);
      box.append('text').attr('class', 'clim-ends-year').attr('x', 10).attr('y', 16).text(ly);
      rows.forEach((r, k) => {
        const y = 32 + k * rh;
        box.append('line').attr('x1', 10).attr('x2', 22).attr('y1', y - 4).attr('y2', y - 4).style('stroke', r.color).style('stroke-dasharray', r.dash);
        box.append('text').attr('x', 28).attr('y', y).text(r.text);
        box.append('text').attr('class', 'clim-ends-v').attr('x', bw - 10).attr('y', y).text(fmt(r.v));
      });
    }

    // shared year axis
    const axis = d3.axisBottom(x).ticks(narrow ? 5 : 10).tickFormat(d3.format('d')).tickSize(4).tickSizeOuter(0);
    gMain.append('g').attr('class', 'clim-axis').attr('transform', `translate(0,${axisY})`).call(axis);

    resetBtn.hidden = state.domain[0] === full[0] && state.domain[1] === full[1];
  }

  // ---------- world map under the readout: the 8 bands at their true latitudes, coloured by the selected year ----------
  function renderMap() {
    const w = mapBox.clientWidth;
    if (!w) return;
    const k = w / 1000;   // paths are projected at build time, 1000 wide
    const h = Math.ceil(data.map.height * k);
    mapSvg.attr('width', w).attr('height', h).attr('viewBox', `0 0 ${w} ${h}`);
    mapSvg.selectAll('*').remove();
    const g = mapSvg.append('g').attr('transform', `scale(${k})`);
    g.append('path').attr('class', 'clim-map-sphere').attr('d', data.map.sphere);
    for (const z of zones) {
      g.append('path').attr('class', 'clim-map-band').attr('data-zone', z.key).attr('d', data.map.bands[z.key])
        .on('click', () => togglePin(z.key))
        .on('pointerenter', () => { state.hoverZone = z.key; updateCursor(); })
        .on('pointerleave', () => { state.hoverZone = null; updateCursor(); })
        .append('title').text(z.label);
    }
    g.append('path').attr('class', 'clim-map-land').attr('d', data.map.land);
    state.pins.forEach((key, i) => g.append('path').attr('class', 'clim-pin-frame')
      .attr('d', data.map.bands[key]).style('stroke', PIN_COLORS[i]).attr('vector-effect', 'non-scaling-stroke'));
    g.append('path').attr('class', 'clim-map-edge').attr('d', data.map.sphere).attr('vector-effect', 'non-scaling-stroke');
  }

  // ---------- overview: global stripes + brush to zoom ----------
  const brush = d3.brushX<unknown>().on('brush end', onBrush);
  let silent = false;

  function renderOverview() {
    const { m, O } = L;
    const v = values(state.base);
    const xo = d3.scaleLinear().domain(full).range([m.l, W - m.r]);
    gOver.selectAll('*').remove();
    gOver.append('text').attr('class', 'clim-panel').attr('x', m.l).attr('y', O.top - 12)
      .text(L.narrow ? 'Drag here to zoom' : 'Global, one stripe per year · drag here to zoom');
    gOver.append('g').attr('class', 'clim-cells').selectAll('rect').data(years.map((y, i) => [y, i] as const)).join('rect')
      .attr('x', ([y]) => xo(y)).attr('width', ([y]) => xo(y + 1) - xo(y) + 0.4)
      .attr('y', O.top).attr('height', O.h).attr('fill', ([, i]) => color(v.series.Glob[i]));
    gOver.append('g').attr('class', 'clim-axis').attr('transform', `translate(0,${O.top + O.h + 2})`)
      .call(d3.axisBottom(xo).ticks(L.narrow ? 4 : 8).tickFormat(d3.format('d')).tickSize(3).tickSizeOuter(0));

    brush.extent([[m.l, O.top - 2], [W - m.r, O.top + O.h + 2]]);
    const gb = gOver.append('g').attr('class', 'clim-brush').call(brush);
    silent = true;
    gb.call(brush.move, isFull() ? null : (state.domain.map(xo) as [number, number]));
    silent = false;
  }

  const isFull = () => state.domain[0] === full[0] && state.domain[1] === full[1];

  // snapped to whole years, at least 5 years wide; the right edge sticks to the last month
  function onBrush(this: SVGGElement, ev: d3.D3BrushEvent<unknown>) {
    if (silent) return;
    const xo = d3.scaleLinear().domain(full).range([L.m.l, W - L.m.r]);
    if (!ev.selection) {
      state.domain = full;
    } else {
      let [a, b] = (ev.selection as [number, number]).map(xo.invert);
      a = Math.max(full[0], Math.round(a));
      b = Math.round(b) >= Math.floor(full[1]) ? full[1] : Math.round(b);
      if (b - a < 5) { a = Math.max(full[0], b - 5); b = Math.max(b, a + 5); }
      state.domain = a === full[0] && b === full[1] ? full : [a, b];
      if (ev.type === 'end' && ev.sourceEvent) {
        silent = true;
        d3.select(this).call(brush.move, state.domain.map(xo) as [number, number]);
        silent = false;
      }
    }
    renderMain();
    updateCursor();
  }

  function resetZoom() {
    gOver.select<SVGGElement>('.clim-brush').call(brush.move, null);
  }

  // ---------- cursor and readout ----------
  function updateCursor() {
    const { A, B, C } = L;
    const v = values(state.base);
    gCursor.selectAll('*').remove();
    const t = state.month != null ? mStart + (state.month + 0.5) / 12 : state.year + 0.5;
    const cx = x(t);
    const inView = t >= state.domain[0] && t <= state.domain[1];

    gMain.selectAll<SVGTextElement, unknown>('.clim-band-labels text')
      .classed('is-hover', function () { return this.dataset.zone === state.hoverZone; });
    const yi = years.indexOf(state.year);
    mapSvg.selectAll<SVGPathElement, unknown>('.clim-map-band')
      .attr('fill', function () { return color(v.series[this.dataset.zone!][yi]); })
      .classed('is-hover', function () { return this.dataset.zone === state.hoverZone; });
    mapYear.textContent = String(state.year);
    if (!inView) return;

    gCursor.append('line').attr('class', 'clim-cursor-line')
      .attr('x1', cx).attr('x2', cx).attr('y1', A.top - 4).attr('y2', C.top + C.h);
    const label = state.month != null ? `${MONTHS[state.month % 12]} ${mStart + Math.floor(state.month / 12)}` : String(state.year);
    const lx = Math.max(L.m.l + 24, Math.min(W - L.m.r - 24, cx));
    gCursor.append('text').attr('class', 'clim-cursor-label').attr('x', lx).attr('y', A.top - 10).text(label);

    if (state.month != null) {
      gCursor.append('rect').attr('class', 'clim-cursor-cell')
        .attr('x', x(mStart + state.month / 12) - 1).attr('width', Math.max(3, x(mStart + (state.month + 1) / 12) - x(mStart + state.month / 12)) + 2)
        .attr('y', B.top - 2).attr('height', B.h + 4);
    } else {
      const i = years.indexOf(state.year);
      const keys = [...state.pins, ...GLOBAL_LINES.map(g => g.key)];
      for (const k of keys) {
        const pin = state.pins.indexOf(k);
        gCursor.append('circle').attr('class', 'clim-cursor-dot').attr('cx', cx).attr('cy', yA(v.series[k][i]))
          .attr('r', k === 'Glob' ? 4 : 3)
          .style('stroke', pin >= 0 ? PIN_COLORS[pin] : GLOBAL_LINES.find(g => g.key === k)!.color);
      }
      gCursor.append('rect').attr('class', 'clim-cursor-cell')
        .attr('x', x(state.year) - 1).attr('width', Math.max(3, x(state.year + 1) - x(state.year)) + 2)
        .attr('y', C.top - 2).attr('height', C.h + 2);
    }
  }

  // fixed layout: the same rows for a year or a month, so nothing below moves while scrubbing
  function updateReadout() {
    const v = values(state.base);
    const i = years.indexOf(state.year);
    const ref = BASELINES[state.base];
    const mo = state.month;
    // one fixed scale over every year and month, so bars compare across the whole record
    const all = [...GLOBAL_LINES.flatMap(g => v.series[g.key]), ...v.monthly.filter((d): d is number => d != null)];
    const mx = d3.scaleLinear().domain([Math.min(0, d3.min(all)!), Math.max(0, d3.max(all)!)]).range([0, 100]);
    const zero = mx(0);
    const bar = (val: number | null | undefined) => {
      const tick = `style="--zero:${zero}%"`;
      if (val == null) return `<span class="clim-meter" ${tick}></span>`;
      const a = Math.min(mx(val), zero), w = Math.abs(mx(val) - zero);
      return `<span class="clim-meter" ${tick}><i style="left:${a}%;width:${w}%;background:${color(val)}"></i></span>`;
    };
    const row = (label: string, colorCss: string | null, val: number | null | undefined, rank: number | null, extra = '') =>
      `<div class="clim-row${extra}"><span class="clim-row-k">${colorCss ? `<i style="background:${colorCss}"></i>` : '<i class="clim-row-ring"></i>'}${label}</span>
        ${bar(val)}<b>${fmt(val)}</b><span class="clim-row-rank">${rank ? ordinal(rank) : ''}</span></div>`;

    const mRank = mo != null ? monthRank.get(mo) : undefined;
    const monthLabel = mo != null ? MONTHS[mo % 12] : 'Month';
    read.innerHTML = `
      <p class="label">${mo != null ? 'Month' : 'Year'}</p>
      <p class="clim-read-when">${mo != null ? `${MONTHS[mo % 12]} ${mStart + Math.floor(mo / 12)}` : state.year}</p>
      <div class="clim-rows">
        <div class="clim-row clim-row--head"><span></span><span></span><span>°C</span><span>rank</span></div>
        ${GLOBAL_LINES.map(g => row(g.label, swatch(g), v.series[g.key][i], yearRank[g.key][i])).join('')}
        ${row(monthLabel, null, mo != null ? v.monthly[mo] : null, mRank?.[0] ?? null, mo == null ? ' is-empty' : '')}
      </div>
      <p class="clim-read-note">${mo != null
        ? `Ranks of ${years.length} years · ${MONTHS[mo % 12]} of ${mRank?.[1]}`
        : `Ranks of ${years.length} years, warmest first`}</p>`;

    zonesEl.innerHTML = `<p class="label">By latitude · ${state.year} · tap to compare</p><ul class="clim-read-zones">` + zones.map(z => {
      const val = v.series[z.key][i];
      const pin = state.pins.indexOf(z.key);
      return `<li><button type="button" data-zone="${z.key}" aria-pressed="${pin >= 0}"
        ${pin >= 0 ? `style="--pin:${PIN_COLORS[pin]}"` : ''} class="${z.key === state.hoverZone ? 'is-hover' : ''}">
        <i style="background:${color(val)}"></i><span>${z.label}</span><b>${fmt(val)}</b></button></li>`;
    }).join('') + `</ul><p class="clim-read-note">°C compared with the ${ref[0]}–${ref[1]} mean</p>`;
  }

  function renderKey() {
    keyEl.innerHTML = GLOBAL_LINES.map(g => `<span class="clim-key-item"><i style="background:${swatch(g)}"></i>${g.label}</span>`).join('')
      + state.pins.map((k, i) => `<button type="button" class="clim-key-item clim-key-pin" data-zone="${k}" aria-label="Remove ${zones.find(z => z.key === k)!.label}">
          <i style="background:${PIN_COLORS[i]}"></i>${zones.find(z => z.key === k)!.label}<span aria-hidden="true">×</span></button>`).join('');
  }

  function renderLegend() {
    const w = Math.min(260, legendEl.clientWidth || 260), h = 10;
    const [lo, , hi] = color.domain();
    const s = d3.scaleLinear().domain([lo, hi]).range([0, w]);
    const el = d3.select(legendEl).html('').append('svg').attr('width', w + 32).attr('height', 32);
    const gid = `clim-grad-${uid}`;
    el.append('defs').append('linearGradient').attr('id', gid).selectAll('stop')
      .data(d3.range(0, 1.0001, 0.1)).join('stop')
      .attr('offset', d => d).attr('stop-color', d => color(lo + d * (hi - lo)));
    const g = el.append('g').attr('transform', 'translate(16,0)');
    g.append('rect').attr('width', w).attr('height', h).attr('fill', `url(#${gid})`);
    g.append('g').attr('class', 'clim-axis').attr('transform', `translate(0,${h})`)
      .call(d3.axisBottom(s).tickValues([lo, lo / 2, 0, hi / 2, hi]).tickFormat(d => (d === 0 ? '0' : d3.format('+.1~f')(d as number))).tickSize(3).tickSizeOuter(0))
      .call(a => a.select('.domain').remove());
  }

  // ---------- interactions ----------
  function zoneAt(py: number) {
    for (const [k, [a, b]] of bandY) if (py >= a && py < b) return k;
    return null;
  }

  function scrub(ev: PointerEvent) {
    const [px, py] = d3.pointer(ev, svg.node());
    const t = x.invert(px);
    const inMonths = py >= L.B.top - 14 && py <= L.B.top + L.B.h + 14;
    if (inMonths) {
      state.month = Math.max(0, Math.min(mCount - 1, Math.floor((t - mStart) * 12)));
      while (state.month > 0 && data.monthly.values[state.month] == null) state.month--;
      state.year = Math.min(lastYear, mStart + Math.floor(state.month / 12));
    } else {
      state.month = null;
      state.year = Math.max(firstYear, Math.min(lastYear, Math.floor(t)));
    }
    state.hoverZone = zoneAt(py);
    updateCursor();
    updateReadout();
  }

  function togglePin(k: string) {
    const at = state.pins.indexOf(k);
    if (at >= 0) state.pins.splice(at, 1);
    else {
      state.pins.push(k);
      if (state.pins.length > MAX_PINS) state.pins.shift();
    }
    renderMain();
    renderMap();
    renderKey();
    updateCursor();
    updateReadout();
  }

  let downX = 0;
  overlay
    .on('pointerdown', (ev: PointerEvent) => { downX = ev.clientX; scrub(ev); })
    .on('pointermove', scrub)
    .on('pointerleave', () => { state.hoverZone = null; updateCursor(); })
    .on('click', (ev: MouseEvent) => {
      if (Math.abs(ev.clientX - downX) > 6) return;   // a drag, not a tap
      const zone = zoneAt(d3.pointer(ev, svg.node())[1]);
      if (zone) togglePin(zone);
    })
    .on('dblclick', resetZoom);

  svg.on('keydown', (ev: KeyboardEvent) => {
    const step = ev.shiftKey ? 10 : 1;
    let y = state.year;
    if (ev.key === 'ArrowLeft') y -= step;
    else if (ev.key === 'ArrowRight') y += step;
    else if (ev.key === 'Home') y = firstYear;
    else if (ev.key === 'End') y = lastYear;
    else return;
    ev.preventDefault();
    state.month = null;
    state.year = Math.max(firstYear, Math.min(lastYear, y));
    updateCursor();
    updateReadout();
    status.textContent = `${state.year}: global ${fmt(values(state.base).series.Glob[years.indexOf(state.year)])} °C`;
  });

  zonesEl.addEventListener('click', ev => {
    const b = (ev.target as HTMLElement).closest<HTMLButtonElement>('button[data-zone]');
    if (b) togglePin(b.dataset.zone!);
  });
  keyEl.addEventListener('click', ev => {
    const b = (ev.target as HTMLElement).closest<HTMLButtonElement>('button[data-zone]');
    if (b) togglePin(b.dataset.zone!);
  });
  resetBtn.addEventListener('click', resetZoom);
  for (const b of baseBtns) {
    b.addEventListener('click', () => {
      state.base = b.dataset.base as Base;
      baseBtns.forEach(o => o.setAttribute('aria-pressed', String(o === b)));
      root.querySelectorAll('[data-base-label]').forEach(el => (el.textContent = BASELINES[state.base].join('–')));
      renderAll();
    });
  }

  let lastW = 0;
  new ResizeObserver(() => {
    if (plot.clientWidth !== lastW) { lastW = plot.clientWidth; renderAll(); }
  }).observe(plot);
  new ResizeObserver(() => { renderMap(); updateCursor(); }).observe(mapBox);
}
