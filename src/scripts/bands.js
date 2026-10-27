// Swizzle band geometry and rendering. Taken from sketch D. J adds `draw: "manual"`: the caller
// gets setDrawn(frac) and moves the band's front itself (the page band follows the scroll).
// Manual mode dashes every path on its own length instead of using a mask: Chrome drops parts
// of a mask on page-tall SVGs.
//
// A band is one centerline built from straight runs and circular arcs. Every lane is the
// exact parallel offset of that centerline (arc radius r - d or r + d around the same
// center), so curves stay concentric like a 70s stripe poster instead of stacked strokes.
//
// Segment notation:
//   120          straight run of 120 units
//   [r, deg]     arc of radius r; deg > 0 turns left (counterclockwise on screen), deg < 0 right
//   "|"          piece break: everything after it is drawn on top with a casing in the
//                ground color, which gives the over/under look where a band crosses itself
//
// Heading is in degrees, 0 = right, 90 = down (SVG y axis points down).

const RAD = Math.PI / 180;
const f = (v) => Math.round(v * 100) / 100;
const normal = (t) => [Math.sin(t), -Math.cos(t)]; // left of travel direction

/**
 * Trace the path at lateral offset d (positive = left of travel).
 * Returns the SVG path strings per piece, the joined path, the end pose and the length.
 */
export function trace(start, segs, d = 0) {
  let [x, y, heading] = start;
  let t = heading * RAD;
  let length = 0;
  const at = () => {
    const [nx, ny] = normal(t);
    return `${f(x + d * nx)} ${f(y + d * ny)}`;
  };
  const pieces = [];
  let cur = `M${at()}`;
  let all = cur;
  const push = (s) => {
    cur += s;
    all += s;
  };

  for (const s of segs) {
    if (s === "|") {
      pieces.push(cur);
      cur = `M${at()}`;
      continue;
    }
    if (typeof s === "number") {
      x += Math.cos(t) * s;
      y += Math.sin(t) * s;
      length += s;
      push(`L${at()}`);
      continue;
    }
    const [r, deg] = s;
    const left = deg > 0;
    const total = Math.abs(deg) * RAD;
    length += r * total;
    // Split into chunks of at most 90 degrees so no SVG arc is ever degenerate.
    let rest = total;
    while (rest > 1e-9) {
      const a = Math.min(rest, Math.PI / 2);
      rest -= a;
      const [nx, ny] = normal(t);
      if (left) {
        const cx = x + r * nx, cy = y + r * ny;
        t -= a;
        const [mx, my] = normal(t);
        x = cx - r * mx;
        y = cy - r * my;
        push(`A${f(r - d)} ${f(r - d)} 0 0 0 ${at()}`);
      } else {
        const cx = x - r * nx, cy = y - r * ny;
        t += a;
        const [mx, my] = normal(t);
        x = cx + r * mx;
        y = cy + r * my;
        push(`A${f(r + d)} ${f(r + d)} 0 0 1 ${at()}`);
      }
    }
  }
  pieces.push(cur);
  return { pieces, all, length, end: [x, y, t / RAD] };
}

/** Lateral offsets for n lanes of width w with gap g, centered on the line. Lane 0 is leftmost. */
export function laneOffsets(n, w, g) {
  return Array.from({ length: n }, (_, i) => ((n - 1) / 2 - i) * (w + g));
}

/**
 * Where a lane at offset d is, in its own path length, when the centerline has run c units.
 * Returns lane(c) -> { piece, local, pieceLen } for the lane's per-piece paths.
 */
function laneMap(segs, d) {
  const marks = [{ c: 0, l: 0 }];
  const pieceStart = [0];
  let c = 0, l = 0;
  for (const s of segs) {
    if (s === "|") { pieceStart.push(l); marks.push({ c, l, brk: true }); continue; }
    if (typeof s === "number") { c += s; l += s; }
    else { const a = Math.abs(s[1]) * RAD; c += s[0] * a; l += (s[1] > 0 ? s[0] - d : s[0] + d) * a; }
    marks.push({ c, l });
  }
  pieceStart.push(l);
  const at = (cc) => {
    for (let i = 1; i < marks.length; i++) {
      const a = marks[i - 1], b = marks[i];
      if (cc <= b.c || i === marks.length - 1) {
        const t = b.c > a.c ? Math.min(1, Math.max(0, (cc - a.c) / (b.c - a.c))) : 1;
        return a.l + (b.l - a.l) * t;
      }
    }
    return l;
  };
  return { at, pieceStart, total: c };
}

const NS = "http://www.w3.org/2000/svg";
const el = (name, attrs = {}, parent) => {
  const e = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (parent) parent.appendChild(e);
  return e;
};
let uid = 0;

// The draw-in is driven from JS via the dashoffset attribute: CSS animations inside an SVG mask
// do not reliably repaint in Chrome. It starts when the band scrolls into view.
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
function reveal(svg, path, dur, delay) {
  if (reduceMotion) return path.setAttribute("stroke-dashoffset", 0);
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  // Timer-driven (not rAF) so it also completes in headless captures and background tabs.
  const run = () => {
    const t0 = performance.now() + delay * 1000;
    const step = () => {
      const t = Math.min(1, Math.max(0, (performance.now() - t0) / (dur * 1000)));
      path.setAttribute("stroke-dashoffset", (1 - ease(t)).toFixed(4));
      if (t < 1) setTimeout(step, 16);
    };
    step();
  };
  const io = new IntersectionObserver((es) => {
    if (es.some((e) => e.isIntersecting)) { io.disconnect(); run(); }
  }, { rootMargin: "0px 0px -10% 0px" });
  io.observe(svg);
}

/**
 * Draw a band into an <svg>. Colors are CSS custom properties, so the band follows the
 * light/dark mode without re-rendering.
 *
 * opts: { start, segs, colors, w, gap, outline, casing, draw (true | false | "manual"), drawDur, drawDelay, packets }
 *   outline:  width of the ink casing around the whole band (0 = none, then gaps show the ground)
 *   casing:   ground-colored gap drawn where a later piece crosses an earlier one
 *   packets:  [{ lane, dur, delay }]  dots that travel along a lane: a run moving
 * Returns { center, length, pointAt(frac), bandW, setDrawn(frac) }.
 */
export function drawBand(svg, opts) {
  const {
    start, segs,
    colors = ["var(--l1)", "var(--l2)", "var(--l3)", "var(--l4)"],
    w = 14, gap = 3, outline = 3, casing = 7, draw = true, drawDur = 2.6, drawDelay = 0,
    packets = [],
  } = opts;
  const id = `band${++uid}`;
  const n = colors.length;
  const offs = laneOffsets(n, w, gap);
  const bandW = n * w + (n - 1) * gap;
  const center = trace(start, segs, 0);
  const g = el("g", { class: "band" }, svg);

  let rev = null;
  const manual = draw === "manual";
  const dashed = []; // manual mode: [path, map, piece]
  if (draw && !manual) {
    const mask = el("mask", { id: `${id}m`, maskUnits: "userSpaceOnUse", x: -1e4, y: -1e4, width: 2e4, height: 2e4 }, el("defs", {}, svg));
    rev = el("path", {
      d: center.all, fill: "none", stroke: "#fff", "stroke-width": bandW + outline * 2 + casing * 2 + 6,
      pathLength: 1, "stroke-dasharray": "1 1", "stroke-dashoffset": 1,
    }, mask);
    g.setAttribute("mask", `url(#${id}m)`);
    reveal(svg, rev, drawDur, drawDelay);
  }

  // The ink casing runs `outline` past both ends so the band gets closed, outlined ends.
  const t0 = start[2] * RAD;
  const ink = outline && !manual
    ? trace([start[0] - Math.cos(t0) * outline, start[1] - Math.sin(t0) * outline, start[2]], [outline, ...segs, outline], 0)
    : null;
  const lanes = offs.map((d) => trace(start, segs, d));
  const centerMap = manual ? laneMap(segs, 0) : null;
  const laneMaps = manual ? offs.map((d) => laneMap(segs, d)) : [];
  center.pieces.forEach((cp, p) => {
    if (p > 0) {
      const c = el("path", { d: cp, class: "band-casing", "stroke-width": bandW + (outline + casing) * 2 }, g);
      if (manual) dashed.push([c, centerMap, p]);
    }
    if (ink) el("path", { d: ink.pieces[p], class: "band-ink", "stroke-width": bandW + outline * 2 }, g);
    if (manual && outline) dashed.push([el("path", { d: cp, class: "band-ink", "stroke-width": bandW + outline * 2 }, g), centerMap, p]);
    lanes.forEach((lane, i) => {
      const e = el("path", { d: lane.pieces[p], class: "band-lane", "stroke-width": w, style: `stroke:${colors[i]}` }, g);
      if (manual) dashed.push([e, laneMaps[i], p]);
    });
  });

  const probe = el("path", { d: center.all, fill: "none", stroke: "none" }, g);
  const len = probe.getTotalLength();
  const pointAt = (frac) => {
    const L = Math.max(0.5, Math.min(len - 0.5, frac * len));
    const a = probe.getPointAtLength(L - 0.5), b = probe.getPointAtLength(L + 0.5);
    const p = probe.getPointAtLength(L);
    return { x: p.x, y: p.y, angle: Math.atan2(b.y - a.y, b.x - a.x) / RAD };
  };

  for (const pk of packets) {
    const lane = lanes[pk.lane ?? Math.floor(n / 2)];
    el("path", {
      d: lane.all, pathLength: 100, class: "band-packet", "stroke-width": w * 0.62,
      style: `--dur:${pk.dur ?? 8}s;--delay:${pk.delay ?? 0}s`,
    }, g);
  }

  const setDrawn = (frac) => {
    if (!manual) return rev && rev.setAttribute("stroke-dashoffset", (1 - frac).toFixed(5));
    const cc = frac * centerMap.total;
    for (const [e, map, p] of dashed) {
      const L = map.pieceStart[p + 1] - map.pieceStart[p];
      const local = Math.min(L, Math.max(0, map.at(cc) - map.pieceStart[p]));
      e.setAttribute("stroke-dasharray", `${L.toFixed(2)} ${(L + 10).toFixed(2)}`);
      e.setAttribute("stroke-dashoffset", (L - local).toFixed(2));
    }
    g.classList.toggle("band-full", frac > 0.999);
  };
  return { center, length: len, pointAt, bandW, setDrawn };
}
