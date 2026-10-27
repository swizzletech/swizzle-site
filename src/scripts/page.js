// The page's motion: shader suns, the typing CRT, the page band drawn by the scroll, the run on the track.
import { ShaderMount, swirlFragmentShader, getShaderColorFromString, ShaderFitOptions, defaultObjectSizing } from "@paper-design/shaders";
import { drawBand } from "./bands.js";
import { DEVICE } from "../art/device-art.js";
import { GLYPH } from "../art/art.js";
import { icon } from "../art/icons.js";

const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------- nav, marquee, copy chips ---------- */
const nav = $(".nav");
const onScrollNav = () => nav.classList.toggle("scrolled", scrollY > 40);
addEventListener("scroll", onScrollNav, { passive: true });
onScrollNav();

const WORDS = ["secrets", "oauth", "cron", "webhooks", "sandboxes", "retries", "approvals", "rollback", "self-hosted"];
const glyph = GLYPH;
$$(".mq-track").forEach((t) => {
  const run = WORDS.map((w) => `<span>${w}<span class="glyph">${glyph}</span></span>`).join("");
  t.innerHTML = run + run; // two copies, the animation moves by half
});

$$("[data-copy]").forEach((b) =>
  b.addEventListener("click", async () => {
    const label = $(".copy-label", b);
    try { await navigator.clipboard.writeText(b.dataset.copy); label.textContent = "copied"; }
    catch { label.textContent = "select it"; }
    setTimeout(() => (label.textContent = "copy"), 1600);
  })
);

/* ---------- the swirl suns: the leitmotiv, alive (paper shaders, brand colors) ---------- */
function swirl(el, p) {
  try {
    const u = {
      u_colorBack: getShaderColorFromString(p.back),
      u_colors: p.colors.map(getShaderColorFromString),
      u_colorsCount: p.colors.length,
      u_bandCount: p.bands, u_twist: p.twist, u_center: 0.2, u_proportion: 0.5, u_softness: 0,
      u_noiseFrequency: 0, u_noise: 0,
      u_fit: ShaderFitOptions.cover, u_scale: p.scale ?? 1, u_rotation: 0,
      u_offsetX: 0, u_offsetY: 0, u_originX: defaultObjectSizing.originX, u_originY: defaultObjectSizing.originY,
      u_worldWidth: 0, u_worldHeight: 0,
    };
    new ShaderMount(el, swirlFragmentShader, u, undefined, reduce ? 0 : p.speed);
  } catch (e) {
    // no WebGL: the CSS rings behind the canvas stay visible
  }
}
swirl($('[data-shader="sun"]'), { back: "#FF8B61", colors: ["#FEFEEF", "#FFD8BD", "#FF8B61"], bands: 2, twist: 0.3, speed: 0.35 });
swirl($('[data-shader="finale"]'), { back: "#FF8B61", colors: ["#FEFEEF", "#FFD8BD", "#FF8B61", "#F2AE3D"], bands: 3, twist: 0.22, speed: 0.25, scale: 0.9 });

/* ---------- the CRT: an agent session, then the run it set up ---------- */
// Each line may carry an effect for the card: light up runtime tiles, add a status chip.
const SESSIONS = [
  {
    vfd: ["APPLYING", "LIVE"],
    cmd: "swizzle apply automations/invoice-chaser",
    lines: [
      ["SWZ/OS 1.0  AGENT SESSION 12", "dim"],
      ["agent> nudge open invoices mondays"],
      ["  + invoice-chaser/main.ts  31 lines", "dim"],
      ["$ swizzle apply invoice-chaser", "", { tiles: ["sandboxes"] }],
      ["  ok secrets  2 bound", "", { tiles: ["secrets"], chip: "2 secrets" }],
      ["  ok trigger  cron 0 9 * * MON", "", { tiles: ["cron"], chip: "cron 0 9 * * MON" }],
      ["[LIVE] #1  next run MON 09:00", "hot", { live: "deployment #1" }],
    ],
  },
  {
    vfd: ["RUN 4812", "RETRY 2/3", "RUN 4812 OK"],
    cmd: "run 4812 · invoice-chaser",
    lines: [
      ["SWZ/OS 1.0  RUN 4812", "dim"],
      ["09:00:01 cue cron, fresh sandbox", "", { tiles: ["cron", "sandboxes"], chip: "cron fired" }],
      ["09:00:03 stripe      12 open", "", { tiles: ["secrets"], chip: "stripe api" }],
      ["09:00:03 slack.post  429", "hot", { tiles: ["webhooks"] }],
      ["  attempt 2/3, done steps kept", "hot", { tiles: ["retries"], chip: "429 · attempt 2/3", warn: true }],
      ["09:00:07 slack.post  12 sent", "", { tiles: ["logs"] }],
      ["[OK] succeeded in 6.1 s", "", { tiles: ["logs"], live: "ok in 6.1 s" }],
    ],
  },
];
const chips = $(".status-chips"), statusCmd = $(".status .cmd");
function cardEffect(fx) {
  if (!fx) return;
  for (const t of fx.tiles || []) {
    const el = $(`.ht[data-tile="${t}"]`);
    el.classList.remove("on"); void el.offsetWidth; el.classList.add("on");
    clearTimeout(el._off); el._off = setTimeout(() => el.classList.remove("on"), 1400);
  }
  if (fx.chip) chips.insertAdjacentHTML("beforeend", `<span class="sc${fx.warn ? " warn" : ""}">${fx.warn ? "↻" : "✓"} ${fx.chip}</span>`);
  if (fx.live) chips.insertAdjacentHTML("beforeend", `<span class="live">${fx.live}</span>`);
}
const crt = $(".crt-text"), vfd = $("#vfd-text"), machine = $(".machine");
$(".crt").insertAdjacentHTML("beforeend", '<div class="roll"></div>');

// Lay the live terminal onto the drawn glass: glass pixels -> viewBox (DEVICE.screen.matrix) -> CSS px.
const art = $(".machine-art svg");
const fitScreen = () => {
  const k = art.getBoundingClientRect().width / DEVICE.vb[0];
  $(".crt").style.transform = `scale(${k}) matrix(${DEVICE.screen.matrix.join(",")})`;
};
new ResizeObserver(fitScreen).observe(art);
fitScreen();
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
async function typeSession(s) {
  const done = [];
  const paint = (cur) => {
    crt.innerHTML = done.map(([t, c]) => `<span class="${c || ""}">${esc(t)}</span>`).join("\n") +
      (cur !== undefined ? (done.length ? "\n" : "") + esc(cur) + '<span class="cursor"></span>' : '\n<span class="cursor"></span>');
  };
  vfd.textContent = s.vfd[0];
  statusCmd.textContent = s.cmd;
  chips.innerHTML = "";
  machine.classList.add("busy");
  for (const [text, cls, fx] of s.lines) {
    if (reduce || cls === "dim") { done.push([text, cls]); paint(); cardEffect(fx); continue; }
    const typed = text.startsWith("agent>") || text.startsWith("$");
    if (typed) {
      for (let k = 1; k <= text.length; k++) { paint(text.slice(0, k)); await wait(26); }
      machine.classList.add("press"); await wait(120); machine.classList.remove("press");
    }
    done.push([text, cls]); paint();
    cardEffect(fx);
    if (cls === "hot" && s.vfd[1]) vfd.textContent = s.vfd[1];
    await wait(typed ? 380 : 520);
  }
  vfd.textContent = s.vfd.at(-1);
  machine.classList.remove("busy");
}
(async () => {
  if (reduce) { await typeSession(SESSIONS[0]); return; }
  for (let i = 0; ; i = (i + 1) % SESSIONS.length) {
    await typeSession(SESSIONS[i]);
    await wait(2600);
  }
})();

/* ---------- the page band: one track from the computer's port, through the finale swirl, into the footer wordmark ---------- */
const main = $("main"), rail = $(".rail"), railHead = $(".rail-head"), foot = $(".foot"), giant = $(".giant");
let band = null, samples = [], points = [], drawn = 0, target = 0, portY = 0;
const stationsEl = $(".stations");
let stations = [], stationEls = [];

// Turn an orthogonal polyline into band segments: straights plus quarter turns of radius R.
// A point {loop: RL} on a horizontal leg inserts one full loop there (the band drops 2 * RL).
function ortho(items, R) {
  const dir = (a, b) => [Math.sign(b[0] - a[0]), Math.sign(b[1] - a[1])];
  const heading = (d) => (Math.atan2(d[1], d[0]) * 180) / Math.PI;
  const segs = [];
  let prev = null, prevD = null, start = null, pending = 0, cut = 0;
  for (const it of items) {
    if (!Array.isArray(it)) {
      const s = prevD[0]; // +1 east, -1 west
      segs.push(pending - cut, [it.loop, 270 * s], "|", 2 * it.loop, [it.loop, 90 * s]);
      pending = 0; cut = 0;
      prev = [prev[0], prev[1] + 2 * it.loop];
      continue;
    }
    if (!prev) { prev = it; continue; }
    const d = dir(prev, it), len = Math.abs(it[0] - prev[0]) + Math.abs(it[1] - prev[1]);
    if (!prevD) { start = [prev[0], prev[1], heading(d)]; pending = len; }
    else if (d[0] !== prevD[0] || d[1] !== prevD[1]) {
      const cross = prevD[0] * d[1] - prevD[1] * d[0];
      segs.push(pending - cut - R, [R, cross > 0 ? -90 : 90]);
      cut = R; pending = len;
    } else pending += len;
    prevD = d; prev = it;
  }
  segs.push(pending - cut);
  return { start, segs: segs.filter((x) => x !== 0) };
}

function layoutBand() {
  rail.innerHTML = "";
  const mainTop = main.getBoundingClientRect().top + scrollY;
  const box = (el) => { const r = el.getBoundingClientRect(); return { x: r.left, y: r.top + scrollY - mainTop, w: r.width, h: r.height }; };
  const W = main.clientWidth, H = document.documentElement.scrollHeight - mainTop;
  const pad = parseFloat(getComputedStyle($(".wrap")).paddingLeft);
  const wide = W > 760;
  const w = wide ? 8 : 4, gap = wide ? 3 : 1.5, outline = wide ? 2.5 : 1.5;
  const R = wide ? 64 : 30;
  const gx = Math.max(pad * 0.45, (5 * w + 4 * gap) / 2 + outline + 2), rx = W - gx;

  const m = box(art);
  const port = [m.x + (m.w * DEVICE.port[0]) / DEVICE.vb[0], m.y + (m.h * DEVICE.port[1]) / DEVICE.vb[1]];
  portY = port[1];
  const steps = box($(".steps"));
  const yStir = steps.y + Math.min(125, steps.h * 0.2);
  const tr = box($(".track-stage"));
  const yTrack = tr.y + tr.h * 0.42, RL = Math.max(R, Math.min(110, tr.h * 0.18));
  const loopX = W * 0.5;
  const sun = box($(".finale-sun"));
  // The band ends inside one letter of the giant wordmark: the first "z" on desktop, plunging from
  // the swirl's middle; on phones the rightmost letter it can reach from the gutter with one turn.
  const text = giant.firstChild, g = box(giant);
  const letters = [...text.data].map((_, i) => {
    const r = document.createRange(); r.setStart(text, i); r.setEnd(text, i + 1);
    const b = r.getBoundingClientRect(); return b.left + b.width / 2;
  });
  const xEnd = wide ? letters[3] : letters.filter((x) => rx - x >= 2 * R + 4).pop();
  const yTurn = wide ? sun.y + 90 : g.y - 6; // desktop: inside the sun, below the buttons; phone: under the links
  const yEnd = g.y + parseFloat(getComputedStyle(giant).fontSize) * 0.4; // inside the letter's top bar (Bagel Fat One at line-height 0.86)

  // the loop moves the band down by 2 RL mid-leg, so the next point sits 2 RL lower
  const route = ortho([port, [rx, port[1]], [rx, yStir], [gx, yStir], [gx, yTrack], [loopX, yTrack], { loop: RL }, [rx, yTrack + 2 * RL], [rx, yTurn], [xEnd, yTurn], [xEnd, yEnd]], R);

  rail.setAttribute("viewBox", `0 0 ${W} ${H}`);
  rail.setAttribute("height", H);
  band = drawBand(rail, {
    start: route.start, segs: route.segs,
    colors: ["var(--peach)", "var(--mustard)", "var(--coral)", "var(--rust)", "var(--brick)"],
    w, gap, outline, casing: wide ? 4 : 2, draw: "manual",
    packets: reduce ? [] : [{ lane: 1, dur: 40, delay: 0 }, { lane: 3, dur: 40, delay: 20 }],
  });
  railHead.style.width = `${Math.max(40, (band.bandW + 2 * outline) * 1.3)}px`;
  const n = Math.ceil(band.length / 6);
  points = Array.from({ length: n + 1 }, (_, i) => band.pointAt(i / n));
  samples = points.map((p) => p.y);

  // stations on the track, in page coordinates
  const y2 = yTrack + 2 * RL;
  const up = (f) => gx + (loopX - gx) * f, low = (f) => loopX + (rx - loopX) * f;
  stations = [
    { x: up(0.3), y: yTrack, icon: "cron", name: "Trigger", sub: "cron 0 9 * * MON", say: "cue  cron MON 09:00" },
    { x: up(0.55), y: yTrack, icon: "sandboxes", name: "Sandbox", sub: "fresh container", say: "sandbox  fresh container" },
    { x: up(0.8), y: yTrack, icon: "secrets", name: "Secrets", sub: "2 injected", say: "secrets  2 injected" },
    { x: loopX, y: yTrack - 2 * RL, icon: "retries", name: "Retry", sub: "429, attempt 2/3", say: "slack 429  attempt 2/3", warn: true },
    { x: low(0.3), y: y2, icon: "code", name: "Your code", sub: "main.ts", say: "stripe 12  slack 12", below: true },
    { x: low(0.58), y: y2, icon: "logs", name: "Log", sub: "6 steps", say: "6 steps logged", below: true },
    { x: low(0.84), y: y2, icon: "done", name: "Done", sub: "ok in 6.1 s", say: "ok in 6.1 s", below: true },
  ];
  // where along the band each station sits: the icon pops in once the band's front has passed it
  for (const s of stations) {
    let best = 0;
    points.forEach((p, i) => { if (Math.hypot(p.x - s.x, p.y - s.y) < Math.hypot(points[best].x - s.x, points[best].y - s.y)) best = i; });
    s.at = (best / n) * band.length;
  }
  stationsEl.innerHTML = stations.map((s, i) =>
    `<div class="st${s.below ? " below" : ""}${s.warn ? " warn" : ""}" data-i="${i}" style="left:${s.x}px;top:${s.y - tr.y}px">
      <span class="lbl"><b>${s.name}</b><small>${s.sub}</small></span><span class="dot"><span class="ico">${icon(s.icon)}</span></span></div>`).join("");
  stationEls = $$(".st");

  measureTarget();
  drawn = reduce ? band.length : Math.min(drawn, target);
  paintBand();
}

// The band's front follows the scroll: it stops where the track first passes 62% down the viewport.
function measureTarget() {
  if (!band) return;
  const mainTop = main.getBoundingClientRect().top + scrollY;
  // on load the band already leaves the boot, so the hero shows where it goes
  const yT = Math.max(scrollY + innerHeight * 0.62 - mainTop, portY + 240);
  let i = samples.findIndex((y) => y > yT);
  // the wordmark sits below the last reachable 62% line, so the bottom of the page finishes the band
  if (i === -1 || scrollY + innerHeight >= document.documentElement.scrollHeight - 8) i = samples.length - 1;
  target = (i / (samples.length - 1)) * band.length;
}
function paintBand() {
  const f = Math.max(0, Math.min(1, drawn / band.length));
  band.setDrawn(f);
  const p = band.pointAt(f);
  railHead.style.left = `${p.x}px`;
  railHead.style.top = `${p.y}px`;
  const home = f > 0.998; // the head dives into the letter and the footer lights up
  railHead.classList.toggle("on", f > 0.002 && !home);
  foot.classList.toggle("lit", home);
  stations.forEach((s, i) => stationEls[i].classList.toggle("reached", drawn >= s.at));
}
// Timer-driven (not rAF) so the band also settles in background tabs and headless captures.
// The step scales with the real time since the last tick: 6% of the gap per 16 ms, at least 4 px,
// so a busy main thread (slow ticks) does not slow the band down.
let lastTick = performance.now();
setInterval(() => {
  const now = performance.now(), ticks = Math.min((now - lastTick) / 16, 30);
  lastTick = now;
  if (!band) return;
  if (reduce) { drawn = band.length; return paintBand(); }
  const d = target - drawn;
  if (Math.abs(d) < 0.5) return;
  const step = Math.max(Math.abs(d) * (1 - 0.94 ** ticks), 4 * ticks);
  drawn += Math.sign(d) * Math.min(Math.abs(d), step);
  paintBand();
}, 16);
addEventListener("scroll", measureTarget, { passive: true });

/* ---------- the run on the track: stations light up in order, the readout talks ---------- */
const readout = $(".ro-text");
let trackVisible = false;
new IntersectionObserver((es) => { trackVisible = es.some((e) => e.isIntersecting); }, { threshold: 0.3 }).observe($(".track-stage"));
(async () => {
  for (;;) {
    if (!trackVisible || reduce) { await wait(400); continue; }
    for (let i = 0; i < stations.length; i++) {
      const s = stations[i];
      $$(".st").forEach((el) => el.classList.toggle("on", Number(el.dataset.i) === i));
      readout.textContent = s.say;
      await wait(s.warn ? 1800 : 1000);
    }
    await wait(1600);
    $$(".st").forEach((el) => el.classList.remove("on"));
    readout.textContent = "waiting for cue";
    await wait(1400);
  }
})();

const relayout = () => layoutBand();
document.fonts.ready.then(relayout);
addEventListener("load", relayout);
let t;
addEventListener("resize", () => { clearTimeout(t); t = setTimeout(relayout, 150); });
