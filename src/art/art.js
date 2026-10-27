// Every illustration on the page, as inline SVG strings. The page inlines them at build time
// (Fragment set:html), so the HTML ships complete; inline rather than <use> so parts can animate.

import { DEVICE_SVG } from "./device-art.js";

const INK = "#2A1712";
const C = {
  ink: INK, oxblood: "#5B1621", brick: "#8E2A1E", rust: "#C24E28", coral: "#FF8B61",
  mustard: "#F2AE3D", peach: "#FFD8BD", creme: "#FEFEEF", shade: "#F2B999",
};

/* ---------- Swiz, the swizzle stick (from C/D, finer strokes) ---------- */
const head = (cx, cy) => `
  <path d="M${cx} ${cy - 56} C${cx} ${cy - 76} ${cx + 24} ${cy - 76} ${cx + 22} ${cy - 62} C${cx + 21} ${cy - 54} ${cx + 10} ${cy - 56} ${cx + 12} ${cy - 63}" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
  <circle cx="${cx}" cy="${cy}" r="58" fill="${C.coral}" stroke="${INK}" stroke-width="4.5"/>
  <circle cx="${cx - 3}" cy="${cy + 3}" r="45" fill="${C.peach}"/>
  <circle cx="${cx - 5}" cy="${cy + 5}" r="33" fill="${C.creme}" stroke="${INK}" stroke-width="3"/>
  <g class="eyes">
    <ellipse cx="${cx - 16}" cy="${cy - 2}" rx="6" ry="9.5" fill="${INK}"/>
    <ellipse cx="${cx + 7}" cy="${cy - 2}" rx="6" ry="9.5" fill="${INK}"/>
    <circle cx="${cx - 14}" cy="${cy - 6}" r="2.4" fill="${C.creme}"/>
    <circle cx="${cx + 9}" cy="${cy - 6}" r="2.4" fill="${C.creme}"/>
  </g>
  <ellipse cx="${cx - 26}" cy="${cy + 14}" rx="6" ry="4" fill="${C.coral}" opacity=".7"/>
  <ellipse cx="${cx + 17}" cy="${cy + 14}" rx="6" ry="4" fill="${C.coral}" opacity=".7"/>
  <path d="M${cx - 16} ${cy + 13} Q${cx - 4} ${cy + 30} ${cx + 8} ${cy + 13} Z" fill="${INK}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M${cx - 9} ${cy + 21} Q${cx - 4} ${cy + 17} ${cx + 2} ${cy + 21} Q${cx - 4} ${cy + 25} ${cx - 9} ${cy + 21} Z" fill="${C.coral}"/>`;

const glove = (x, y, r = 0) => `
  <g transform="translate(${x} ${y}) rotate(${r})">
    <path d="M-6 12 h12 v8 h-12 z" fill="${C.creme}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
    <circle r="14" fill="${C.creme}" stroke="${INK}" stroke-width="3.5"/>
    <ellipse cx="-12" cy="2" rx="6" ry="8" fill="${C.creme}" stroke="${INK}" stroke-width="3.5"/>
    <path d="M-2 -6 v8 M5 -6 v8" stroke="${INK}" stroke-width="2.5" stroke-linecap="round"/>
  </g>`;

const SWIZ = `
<svg viewBox="0 0 200 330" aria-hidden="true">
  <defs><clipPath id="stickclip"><rect x="89" y="112" width="22" height="138" rx="11"/></clipPath></defs>
  <ellipse cx="100" cy="318" rx="70" ry="8" fill="#000" opacity=".28"/>
  <g fill="none" stroke="${INK}" stroke-width="6.5" stroke-linecap="round">
    <path d="M95 244 C90 274 72 282 64 300"/>
    <path d="M105 244 C112 272 128 284 136 300"/>
  </g>
  <path d="M36 308 C36 292 70 286 76 300 C80 310 70 312 58 312 H42 C37 312 36 311 36 308Z" fill="${INK}"/>
  <path d="M164 308 C164 292 130 286 124 300 C120 310 130 312 142 312 H158 C163 312 164 311 164 308Z" fill="${INK}"/>
  <rect x="89" y="112" width="22" height="138" rx="11" fill="${C.creme}"/>
  <g clip-path="url(#stickclip)" stroke="${C.coral}" stroke-width="8">
    <path d="M84 132 L116 116 M84 156 L116 140 M84 180 L116 164 M84 204 L116 188 M84 228 L116 212 M84 252 L116 236"/>
  </g>
  <rect x="89" y="112" width="22" height="138" rx="11" fill="none" stroke="${INK}" stroke-width="4"/>
  <g class="arm-r">
    <path d="M110 160 C138 168 150 186 142 206" fill="none" stroke="${INK}" stroke-width="6.5" stroke-linecap="round"/>
    ${glove(140, 212, 160)}
  </g>
  <g class="arm-l">
    <path d="M90 162 C62 164 36 150 24 126" fill="none" stroke="${INK}" stroke-width="6.5" stroke-linecap="round"/>
    ${glove(20, 112, -30)}
  </g>
  <g class="head">${head(102, 78)}</g>
</svg>`;

const HEAD = `<svg viewBox="30 0 144 144" aria-hidden="true">${head(102, 78)}</svg>`;

/* ---------- the hero terminal: generated airbrush drawing, see device/gen.py ---------- */

/* ---------- step illustrations ---------- */
const px = (x, y) => `<rect x="${x}" y="${y}" width="9" height="9"/>`;
const TERMI = `
<svg viewBox="0 0 220 220" aria-hidden="true">
  <ellipse cx="110" cy="208" rx="82" ry="7" fill="#000" opacity=".22"/>
  <rect x="52" y="176" width="30" height="24" rx="5" fill="${INK}"/>
  <rect x="138" y="176" width="30" height="24" rx="5" fill="${INK}"/>
  <rect x="16" y="26" width="188" height="160" rx="34" fill="${C.peach}" stroke="${INK}" stroke-width="4"/>
  <rect x="38" y="46" width="144" height="92" rx="22" fill="${INK}"/>
  <rect x="46" y="54" width="128" height="76" rx="16" fill="#0F2421"/>
  <g class="pxface" fill="#8FF5DA">
    <g class="peyes">${px(80, 70)}${px(80, 79)}${px(131, 70)}${px(131, 79)}</g>
    ${px(76, 100)}${px(85, 109)}${px(94, 109)}${px(103, 109)}${px(112, 109)}${px(121, 109)}${px(130, 100)}
  </g>
  <circle cx="54" cy="160" r="9" fill="${C.oxblood}" stroke="${INK}" stroke-width="3.5"/>
  <circle cx="80" cy="160" r="9" fill="${C.mustard}" stroke="${INK}" stroke-width="3.5"/>
  <rect x="104" y="154" width="72" height="12" rx="6" fill="${INK}"/>
  <path d="M110 22 V8" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
  <circle cx="110" cy="8" r="7" fill="${C.rust}" stroke="${INK}" stroke-width="3.5"/>
</svg>`;

const GLASS = `
<svg viewBox="0 0 220 220" aria-hidden="true">
  <defs><clipPath id="glassclip"><path d="M64 64 L156 64 L145 196 Q144 200 138 200 H82 Q76 200 75 196 Z"/></clipPath></defs>
  <ellipse cx="110" cy="210" rx="66" ry="6" fill="#000" opacity=".22"/>
  <g clip-path="url(#glassclip)">
    <rect x="40" y="60" width="140" height="150" fill="${C.creme}" opacity=".55"/>
    <g class="liquid">
      <rect x="40" y="98" width="140" height="26" fill="${C.peach}"/>
      <rect x="40" y="124" width="140" height="26" fill="${C.mustard}"/>
      <rect x="40" y="150" width="140" height="26" fill="${C.coral}"/>
      <rect x="40" y="176" width="140" height="34" fill="${C.rust}"/>
    </g>
    <g class="bubbles" fill="${C.creme}">
      <circle cx="92" cy="190" r="4"/><circle cx="128" cy="180" r="3"/><circle cx="110" cy="196" r="3.5"/>
    </g>
  </g>
  <g class="stick">
    <rect x="104" y="18" width="12" height="176" rx="6" fill="${C.creme}" stroke="${INK}" stroke-width="3.5"/>
    <path d="M106 50 l8 -6 M106 74 l8 -6 M106 98 l8 -6 M106 122 l8 -6 M106 146 l8 -6" stroke="${C.coral}" stroke-width="5"/>
    <circle cx="110" cy="20" r="15" fill="${C.coral}" stroke="${INK}" stroke-width="3.5"/>
    <circle cx="105" cy="15" r="4.5" fill="${C.peach}"/>
  </g>
  <path d="M64 64 L156 64 L145 196 Q144 200 138 200 H82 Q76 200 75 196 Z" fill="none" stroke="${INK}" stroke-width="4.5" stroke-linejoin="round"/>
  <path d="M58 64 H162" stroke="${INK}" stroke-width="4.5" stroke-linecap="round"/>
  <path d="M76 82 L82 170" stroke="${C.creme}" stroke-width="5" stroke-linecap="round" opacity=".8"/>
</svg>`;

const MOON = `
<svg viewBox="0 0 220 220" aria-hidden="true">
  <defs><mask id="moonmask"><rect width="220" height="220" fill="#fff"/><circle cx="118" cy="82" r="56" fill="#000"/></mask></defs>
  <ellipse cx="110" cy="210" rx="70" ry="6" fill="#000" opacity=".22"/>
  <g mask="url(#moonmask)"><circle cx="88" cy="108" r="64" fill="${C.mustard}" stroke="${INK}" stroke-width="4.5"/></g>
  <path d="M118 26 A56 56 0 0 1 146 128" fill="none" stroke="${INK}" stroke-width="0"/>
  <g class="zz" font-family="Archivo" font-weight="900" fill="${C.creme}">
    <text x="128" y="62" font-size="26">z</text><text x="150" y="40" font-size="18">z</text>
  </g>
  <g transform="translate(132 104) rotate(8)">
    <rect width="62" height="84" rx="8" fill="${C.creme}" stroke="${INK}" stroke-width="4"/>
    <path d="M12 22 l5 5 l9 -11 M12 44 l5 5 l9 -11 M12 66 l5 5 l9 -11" fill="none" stroke="${C.rust}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M34 22 H50 M34 44 H50 M34 66 H50" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
  </g>
</svg>`;

// The leitmotiv, small: eccentric rings, used as separator glyph.
export const GLYPH = `<svg viewBox="0 0 40 40" aria-hidden="true">
  <circle cx="20" cy="20" r="18" fill="${C.coral}"/><circle cx="18" cy="22" r="12.5" fill="${C.peach}"/>
  <circle cx="16.5" cy="23.5" r="7" fill="${C.creme}"/></svg>`;

/* ---------- op-art patterns for the runtime tiles (300 x 200) ---------- */
const W = 300, H = 200;
const cyc = (arr, i) => arr[((i % arr.length) + arr.length) % arr.length];
const hash = (i, j) => { const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return s - Math.floor(s); };

const PATTERNS = {
  // a vault: concentric rounded squares closing in on a keyhole
  secrets() {
    const cols = [C.oxblood, C.rust, C.coral, C.peach, C.creme];
    let s = "";
    for (let i = 0; i < 9; i++) {
      const w = 340 - i * 34, h = 240 - i * 24;
      s += `<rect x="${(W - w) / 2}" y="${(H - h) / 2}" width="${w}" height="${h}" rx="${Math.max(8, 44 - i * 4)}" fill="${cyc(cols, i)}"/>`;
    }
    return `<g class="breathe">${s}</g><circle cx="150" cy="92" r="11" fill="${INK}"/><path d="M144 96 L156 96 L160 122 H140 Z" fill="${INK}"/>`;
  },
  // two ring sets that hold on to each other: you and the provider
  oauth() {
    const set = (cx, cols) => {
      let s = "";
      for (let r = 96, i = 0; r > 10; r -= 14, i++) s += `<circle cx="${cx}" cy="100" r="${r}" fill="${cyc(cols, i)}"/>`;
      return s;
    };
    return `<rect width="${W}" height="${H}" fill="${C.peach}"/>
      <g class="drift-l">${set(108, [C.coral, C.peach])}</g>
      <g class="drift-r" style="mix-blend-mode:multiply">${set(192, [C.rust, C.creme])}</g>`;
  },
  // a sunrise clock: rays turn, the hours stay
  cron() {
    let rays = "";
    for (let i = 0; i < 24; i++) {
      const a0 = (i / 24) * Math.PI * 2, a1 = ((i + 0.5) / 24) * Math.PI * 2, R = 260;
      rays += `<path d="M150 200 L${150 + R * Math.cos(a0)} ${200 + R * Math.sin(a0)} L${150 + R * Math.cos(a1)} ${200 + R * Math.sin(a1)} Z" fill="${C.coral}"/>`;
    }
    return `<rect width="${W}" height="${H}" fill="${C.peach}"/>
      <g class="spin" style="transform-origin:150px 200px">${rays}</g>
      <circle cx="150" cy="200" r="92" fill="${C.oxblood}"/><circle cx="150" cy="200" r="72" fill="${C.rust}"/>
      <circle cx="150" cy="200" r="52" fill="${C.mustard}"/><circle cx="150" cy="200" r="32" fill="${C.creme}"/>`;
  },
  // signals arriving: stacked waves, sliding one period on hover
  webhooks() {
    const cols = [C.oxblood, C.coral, C.peach, C.rust, C.mustard];
    let s = "";
    for (let i = 0; i < 13; i++) {
      const y = i * 18 - 6;
      let d = `M-80 ${y}`;
      for (let x = -80; x < 380; x += 40) d += ` q10 -12 20 0 t20 0`;
      s += `<path d="${d}" fill="none" stroke="${cyc(cols, i)}" stroke-width="11"/>`;
    }
    return `<rect width="${W}" height="${H}" fill="${C.creme}"/><g class="slide">${s}</g>`;
  },
  // truchet tiles: every run gets its own little cell
  sandboxes() {
    let s = "";
    const g = 40;
    for (let i = 0; i < 8; i++) for (let j = 0; j < 5; j++) {
      const x = i * g, y = j * g, flip = hash(i, j) > 0.5;
      const col = (i + j) % 2 ? C.coral : C.rust;
      s += flip
        ? `<path d="M${x + g / 2} ${y} A${g / 2} ${g / 2} 0 0 1 ${x} ${y + g / 2} M${x + g} ${y + g / 2} A${g / 2} ${g / 2} 0 0 0 ${x + g / 2} ${y + g}" stroke="${col}"/>`
        : `<path d="M${x + g / 2} ${y} A${g / 2} ${g / 2} 0 0 0 ${x + g} ${y + g / 2} M${x} ${y + g / 2} A${g / 2} ${g / 2} 0 0 1 ${x + g / 2} ${y + g}" stroke="${col}"/>`;
    }
    return `<rect width="${W}" height="${H}" fill="${C.peach}"/><g fill="none" stroke-width="12" stroke-linecap="butt">${s}</g>`;
  },
  // the loop: lanes that go round once more
  retries() {
    const cols = [C.oxblood, C.rust, C.coral, C.mustard];
    let lanes = "", rings = "";
    cols.forEach((c, i) => { lanes += `<rect x="0" y="${130 + i * 13}" width="${W}" height="10" fill="${c}"/>`; });
    cols.forEach((c, i) => { rings += `<circle cx="150" cy="${110}" r="${82 - i * 13}" fill="none" stroke="${c}" stroke-width="10"/>`; });
    return `<rect width="${W}" height="${H}" fill="${C.creme}"/>${lanes}
      <g class="spin" style="transform-origin:150px 110px">${rings}<circle cx="150" cy="${110 - 82}" r="7" fill="${C.creme}" stroke="${INK}" stroke-width="3"/></g>
      <rect x="0" y="126" width="${W}" height="4" fill="${C.creme}" opacity="0"/>`;
  },
  // log lines: a tape of bars, typed out on hover
  logs() {
    const cols = [C.coral, C.mustard, C.rust, C.peach];
    let s = "";
    for (let j = 0; j < 9; j++) {
      const y = 18 + j * 20;
      s += `<circle cx="24" cy="${y + 5}" r="5" fill="${j === 4 ? C.rust : C.oxblood}"/>`;
      let x = 40;
      for (let k = 0; k < 3; k++) {
        const w = 24 + Math.floor(hash(j, k) * 80);
        if (x + w > 284) break;
        s += `<rect class="bar" x="${x}" y="${y}" width="${w}" height="10" rx="5" fill="${cyc(cols, j + k)}" style="--i:${j * 3 + k}"/>`;
        x += w + 8;
      }
    }
    return `<rect width="${W}" height="${H}" fill="${C.creme}"/>${s}`;
  },
  // a halftone sun: every agent can reach in
  api() {
    let s = "";
    for (let i = 0; i < 21; i++) for (let j = 0; j < 14; j++) {
      const x = 8 + i * 14.2, y = 8 + j * 14.2, d = Math.hypot(x - 150, y - 210) / 230;
      const r = Math.max(0, 6.4 * (1 - d));
      if (r > 0.6) s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="${d < 0.45 ? C.rust : d < 0.7 ? C.coral : C.mustard}"/>`;
    }
    return `<rect width="${W}" height="${H}" fill="${C.oxblood}"/><g class="pulse">${s}</g>`;
  },
};

export const ART = { computer: DEVICE_SVG, swiz: SWIZ, head: HEAD, termi: TERMI, glass: GLASS, moon: MOON, glyph: GLYPH };

/** The op-art background of a runtime tile: secrets | oauth | cron | webhooks | sandboxes | retries | logs | api. */
export const pattern = (name) =>
  `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${PATTERNS[name]()}</svg>`;
