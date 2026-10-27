// The runtime icons, sticker style: flat fills and an ink contour.
// The page inlines them at build time; the track's stations call icon(name) in the browser.

const C = {
  ink: "#2A1712", creme: "#FEFEEF", paper: "#FFFDF6", peach: "#FFD8BD", coral: "#FF8B61", rust: "#C24E28",
  brick: "#8E2A1E", oxblood: "#5B1621", mustard: "#F2AE3D", petrol: "#1F7A73", sky: "#A6D8E7",
};
const svg = (body) => `<svg viewBox="0 0 120 120" aria-hidden="true">${body}</svg>`;

// shared geometry for the icons
const G = {
  bolt: "M70 8 L32 66 L56 66 L44 112 L88 48 L64 48 L78 8 Z",
  receipt: "M32 14 H88 V104 L81 98 L74 104 L67 98 L60 104 L53 98 L46 104 L39 98 L32 104 Z",
  bucket: "M28 48 H92 L83 106 H37 Z",
  arc: "M81.4 48.0 A28 28 0 1 0 84.2 80.0",  // centre 60,66, open on the right
  arrow: "M87.2 37.8 L91.7 60.2 L70.4 52.0 Z",
};

const STICKER = {
  cron: () => svg(`
    <g stroke="${C.ink}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round">
      <path d="M22 40 A16 16 0 0 1 44 20 Z" fill="${C.coral}"/><path d="M98 40 A16 16 0 0 0 76 20 Z" fill="${C.coral}"/>
      <line x1="38" y1="92" x2="30" y2="104"/><line x1="82" y1="92" x2="90" y2="104"/>
      <circle cx="60" cy="64" r="36" fill="${C.coral}"/><circle cx="60" cy="64" r="26" fill="${C.creme}" stroke-width="3"/>
      <g stroke-width="3"><line x1="60" y1="42" x2="60" y2="46"/><line x1="82" y1="64" x2="78" y2="64"/><line x1="60" y1="86" x2="60" y2="82"/><line x1="38" y1="64" x2="42" y2="64"/></g>
      <line x1="60" y1="64" x2="60" y2="50"/><line class="min-hand" x1="60" y1="64" x2="73" y2="71"/>
    </g><circle cx="60" cy="64" r="3.5" fill="${C.ink}"/>
    <path d="M36 50 A30 30 0 0 1 50 36" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity="0.7"/>`),
  webhooks: () => svg(`
    <path d="${G.bolt}" fill="${C.mustard}" stroke="${C.ink}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M67 16 L42 58" stroke="${C.creme}" stroke-width="4" stroke-linecap="round" opacity="0.85"/>`),
  secrets: () => svg(`
    <g stroke="${C.ink}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round">
      <path d="M40 56 V40 A20 20 0 0 1 80 40 V56" fill="none" stroke-width="14"/>
      <path d="M40 56 V40 A20 20 0 0 1 80 40 V56" fill="none" stroke="${C.peach}" stroke-width="6"/>
      <rect x="26" y="52" width="68" height="54" rx="12" fill="${C.coral}"/>
      <circle cx="60" cy="74" r="7" fill="${C.ink}"/><path d="M57 78 L55 92 H65 L63 78" fill="${C.ink}" stroke-width="2"/>
    </g><path d="M34 62 H52" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity="0.6"/>`),
  sandboxes: () => svg(`
    <g stroke="${C.ink}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round">
      <path d="M34 48 A26 30 0 0 1 86 48" fill="none" stroke-width="4"/>
      <path d="M30 50 Q44 30 60 38 Q74 30 90 50 Z" fill="${C.mustard}"/>
      <path d="${G.bucket}" fill="${C.sky}"/>
      <path d="M31 66 H89 L87 80 H33 Z" fill="${C.coral}" stroke-width="3"/>
      <rect x="24" y="44" width="72" height="9" rx="4.5" fill="${C.creme}"/>
    </g><path d="M40 60 L44 98" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity="0.55"/>`),
  retries: () => svg(`
    <g class="spin">
      <path d="${G.arc}" fill="none" stroke="${C.ink}" stroke-width="20" stroke-linecap="round"/>
      <path d="${G.arc}" fill="none" stroke="${C.petrol}" stroke-width="11" stroke-linecap="round"/>
      <path d="${G.arrow}" fill="${C.petrol}" stroke="${C.ink}" stroke-width="4" stroke-linejoin="round"/>
    </g>`),
  code: () => svg(`
    <g stroke="${C.ink}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round">
      <path d="M30 12 H74 L92 30 V108 H30 Z" fill="${C.paper}"/><path d="M74 12 V30 H92" fill="${C.peach}"/>
      <path d="M50 52 L38 66 L50 80 M72 52 L84 66 L72 80" fill="none" stroke="${C.petrol}" stroke-width="6"/>
      <path d="M65 48 L57 84" stroke="${C.coral}" stroke-width="5"/>
    </g>`),
  done: () => svg(`
    <g stroke="${C.ink}" stroke-width="4" stroke-linejoin="round">
      <path d="M44 74 L32 108 L46 100 L54 112 L62 82 Z M76 74 L88 108 L74 100 L66 112 L58 82 Z" fill="${C.coral}"/>
      <circle cx="60" cy="50" r="34" fill="${C.mustard}"/><circle cx="60" cy="50" r="24" fill="${C.creme}" stroke-width="3"/>
      <path d="M48 50 L57 59 L73 41" fill="none" stroke="${C.petrol}" stroke-width="7" stroke-linecap="round"/>
    </g><path d="M34 40 A28 28 0 0 1 46 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity="0.7"/>`),
  logs: () => svg(`
    <path d="${G.receipt}" fill="${C.paper}" stroke="${C.ink}" stroke-width="4" stroke-linejoin="round"/>
    <g stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <path d="M40 32 L45 38 L54 27" stroke="${C.petrol}"/><path d="M40 52 L45 58 L54 47" stroke="${C.petrol}"/>
      <path d="M41 68 L53 80 M53 68 L41 80" stroke="${C.rust}"/>
      <g stroke="${C.ink}" stroke-width="4"><line x1="62" y1="33" x2="78" y2="33"/><line x1="62" y1="53" x2="78" y2="53"/><line x1="62" y1="74" x2="74" y2="74"/></g>
    </g>`),
};

export const icon = (name) => STICKER[name]();

