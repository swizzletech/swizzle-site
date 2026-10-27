#!/usr/bin/env python3
"""Usage: python3 tools/device-gen.py [src/art/device-art.js] [preview.svg]

Generates the Swizzle 76 hero terminal (a PET-derived one-piece wedge in glossy lacquer, airbrush
style) as an ES module: DEVICE_SVG (the markup) and DEVICE (geometry the page needs to lay the live
CRT/VFD overlays and the page band onto the drawing, all in viewBox units).

A tiny renderer: the body is a rounded side profile extruded along x, projected with a mild
perspective (yaw + pitch), shaded per strip with Blinn-Phong for a glossy lacquer look. The screen
glass is left empty: the page lays the live terminal over it with DEVICE.screen.matrix.
"""
import json, math, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "..", "src", "art", "device-art.js")
PREVIEW = sys.argv[2] if len(sys.argv) > 2 else None

# ---------- camera ----------
YAW, PITCH, DIST = math.radians(31), math.radians(17), 2600.0
ca, sa, cb, sb = math.cos(YAW), math.sin(YAW), math.cos(PITCH), math.sin(PITCH)

def view(p):
    x, y, z = p
    x1 = x * ca + z * sa
    z1 = -x * sa + z * ca
    y2 = y * cb + z1 * sb
    z2 = -y * sb + z1 * cb
    return (x1, y2, z2)

def vdir(d):  # rotate a direction (no translation)
    return view(d)

S, CX, CY = 1.0, 0.0, 0.0
def proj(p):
    x, y, z = view(p)
    f = DIST / (DIST + z)
    return (CX + S * x * f, CY - S * y * f)

def norm(v):
    l = math.sqrt(sum(c * c for c in v)) or 1
    return tuple(c / l for c in v)

def dot(a, b): return sum(x * y for x, y in zip(a, b))
def add(a, b): return tuple(x + y for x, y in zip(a, b))
def sub(a, b): return tuple(x - y for x, y in zip(a, b))
def mul(a, k): return tuple(x * k for x in a)
def lerp(a, b, t): return tuple(x + (y - x) * t for x, y in zip(a, b))

LIGHT = norm((-0.55, 0.72, -0.45))  # view space, from top-left-front
HALF = norm(add(LIGHT, (0, 0, -1)))

def hexrgb(h): h = h.lstrip("#"); return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))
def rgbhex(c): return "#%02x%02x%02x" % tuple(max(0, min(255, int(round(x)))) for x in c)
def mix(a, b, t): return tuple(x + (y - x) * t for x, y in zip(a, b))

# lacquer ramp: shadow -> base -> light, then specular toward warm white
SHADOW, BASE, LIT, SPEC = hexrgb("#6e1f1a"), hexrgb("#e8663f"), hexrgb("#ff9a6e"), hexrgb("#fff6ea")

def lacquer(n_view, gloss=1.0):
    d = max(0.0, dot(n_view, LIGHT))
    c = mix(SHADOW, BASE, min(1, d * 1.5)) if d < 0.66 else mix(BASE, LIT, (d - 0.66) / 0.34)
    s = max(0.0, dot(n_view, HALF)) ** 70 * gloss * 1.2
    s2 = max(0.0, dot(n_view, HALF)) ** 12 * 0.18 * gloss
    return mix(c, SPEC, min(1, s * 0.95 + s2))

def pts(ps): return " ".join("%.1f,%.1f" % p for p in ps)

# ---------- profile (z, y): z = depth (front 0), y = height ----------
W = 440.0
X0, X1 = -W / 2, W / 2
corners = [  # (z, y, fillet radius)
    (6, 24, 4), (0, 56, 12), (176, 108, 12), (206, 392, 56), (380, 372, 40), (394, 24, 6)]

def fillet_profile(cs, step=1):
    out, n = [], len(cs)
    for i in range(n):
        p = cs[i]; a = cs[i - 1]; b = cs[(i + 1) % n]; r = p[2]
        if i == 0 or i == n - 1:  # bottom corners: keep simple
            out.append((p[0], p[1])); continue
        v1 = norm((a[0] - p[0], a[1] - p[1])); v2 = norm((b[0] - p[0], b[1] - p[1]))
        ang = math.acos(max(-1, min(1, v1[0] * v2[0] + v1[1] * v2[1])))
        t = r / math.tan(ang / 2)
        s1 = (p[0] + v1[0] * t, p[1] + v1[1] * t); s2 = (p[0] + v2[0] * t, p[1] + v2[1] * t)
        bis = norm((v1[0] + v2[0], v1[1] + v2[1])); dc = r / math.sin(ang / 2)
        c = (p[0] + bis[0] * dc, p[1] + bis[1] * dc)
        a1 = math.atan2(s1[1] - c[1], s1[0] - c[0]); a2 = math.atan2(s2[1] - c[1], s2[0] - c[0])
        da = a2 - a1
        while da > math.pi: da -= 2 * math.pi
        while da < -math.pi: da += 2 * math.pi
        k = max(2, int(abs(math.degrees(da)) / step))
        for j in range(k + 1):
            aa = a1 + da * j / k
            out.append((c[0] + r * math.cos(aa), c[1] + r * math.sin(aa)))
    return out

PROF = fillet_profile(corners)

# ---------- fit to the 900 x 720 canvas ----------
allp = [proj((x, y, z)) for (z, y) in PROF for x in (X0, X1)]
minx = min(p[0] for p in allp); maxx = max(p[0] for p in allp)
miny = min(p[1] for p in allp); maxy = max(p[1] for p in allp)
S = 660 / (maxx - minx)
CX = 36 - minx * S
CY = 70 - miny * S

svg = []
defs = []
def E(s): svg.append(s)

# ---------- ground shadow ----------
g = [proj((x, 0, z)) for x, z in ((X0 - 10, -10), (X1 + 10, -10), (X1 + 10, 404), (X0 - 10, 404))]
gcx = sum(p[0] for p in g) / 4; gcy = sum(p[1] for p in g) / 4
E(f'<ellipse cx="{gcx:.1f}" cy="{gcy + 14:.1f}" rx="{(max(p[0] for p in g) - min(p[0] for p in g)) * 0.56:.1f}" ry="{(max(p[1] for p in g) - min(p[1] for p in g)) * 0.42:.1f}" fill="#000" opacity="0.55" filter="url(#soft)"/>')
E(f'<ellipse cx="{gcx - 10:.1f}" cy="{gcy + 4:.1f}" rx="{(max(p[0] for p in g) - min(p[0] for p in g)) * 0.47:.1f}" ry="{(max(p[1] for p in g) - min(p[1] for p in g)) * 0.3:.1f}" fill="#000" opacity="0.5" filter="url(#soft2)"/>')

# ---------- plinth (dark oxblood, inset) ----------
pz0, pz1, px0, px1 = 16, 384, X0 + 14, X1 - 14
front = [proj(p) for p in ((px0, 0, pz0), (px1, 0, pz0), (px1, 24, pz0), (px0, 24, pz0))]
right = [proj(p) for p in ((px1, 0, pz0), (px1, 0, pz1), (px1, 24, pz1), (px1, 24, pz0))]
E(f'<polygon points="{pts(front)}" fill="url(#plinthF)"/>')
E(f'<polygon points="{pts(right)}" fill="#240c0d"/>')

# ---------- body strips ----------
strips = []
n = len(PROF)
for i in range(n - 1):
    (z0, y0), (z1, y1) = PROF[i], PROF[i + 1]
    tz, ty = z1 - z0, y1 - y0
    nrm = norm((0, tz, -ty))  # outward for a CCW-in-(z,y) profile walked front->back over the top
    nv = vdir(nrm)
    if nv[2] >= 0.02: continue
    quad = [(X0, y0, z0), (X1, y0, z0), (X1, y1, z1), (X0, y1, z1)]
    depth = sum(view(p)[2] for p in quad) / 4
    strips.append((depth, quad, nv))
strips.sort(key=lambda s: -s[0])
clip = []
for depth, quad, nv in strips:
    c = rgbhex(lacquer(nv))
    P = pts([proj(p) for p in quad])
    E(f'<polygon points="{P}" fill="{c}" stroke="{c}" stroke-width="0.9" stroke-linejoin="round"/>')
    clip.append(f'<polygon points="{P}"/>')
defs.append('<clipPath id="bodyclip">' + "".join(clip) + "</clipPath>")

# airbrush falloff across the width (light from the left), clipped to the visible strips
E('<rect x="0" y="0" width="900" height="720" fill="url(#falloff)" clip-path="url(#bodyclip)"/>')
E('<rect x="0" y="0" width="900" height="720" fill="url(#sheen)" clip-path="url(#bodyclip)"/>')

# ---------- right side cap ----------
cap = [proj((X1, y, z)) for (z, y) in PROF]
E(f'<polygon points="{pts(cap)}" fill="url(#capG)"/>')
# a slight lacquer reflection on the cap
capin = [proj((X1, y, z)) for (z, y) in PROF]
E(f'<polygon points="{pts(capin)}" fill="url(#capRefl)" opacity="0.9"/>')
# rim highlight along the cap edge where it meets the lit top
rim = [proj((X1, y, z)) for (z, y) in PROF if y > 60 and z < 330]
E(f'<polyline points="{pts(rim)}" fill="none" stroke="#ffb08c" stroke-width="1.6" opacity="0.55"/>')

# side panel seam: an inset line following the profile
def inset_profile(prof, d):
    out = []
    m = len(prof)
    for i, (z, y) in enumerate(prof):
        a = prof[i - 1]; b = prof[(i + 1) % m]
        tz, ty = b[0] - a[0], b[1] - a[1]
        nz, ny = norm((ty, -tz))
        out.append((z + nz * d, y + ny * d))
    return out
seam = inset_profile(PROF, 16)
seam = [(z, y) for (z, y) in seam if y > 34]
E(f'<polyline points="{pts([proj((X1 + 0.5, y, z)) for (z, y) in seam])}" fill="none" stroke="#1d0809" stroke-width="1.1" opacity="0.7"/>')
E(f'<polyline points="{pts([proj((X1 + 0.5, y - 1.6, z)) for (z, y) in seam])}" fill="none" stroke="#c4553a" stroke-width="0.8" opacity="0.45"/>')

# vent slits on the side, near the back of the hood
for k in range(9):
    z = 262 + k * 12
    a, b = proj((X1 + 0.5, 184, z)), proj((X1 + 0.5, 296, z - 4))
    E(f'<line x1="{a[0]:.1f}" y1="{a[1]:.1f}" x2="{b[0]:.1f}" y2="{b[1]:.1f}" stroke="#1a0708" stroke-width="5.2" stroke-linecap="round"/>')
    a2, b2 = proj((X1 + 0.5, 184, z + 2.4)), proj((X1 + 0.5, 296, z - 1.6))
    E(f'<line x1="{a2[0]:.1f}" y1="{a2[1]:.1f}" x2="{b2[0]:.1f}" y2="{b2[1]:.1f}" stroke="#b9472e" stroke-width="1" stroke-linecap="round" opacity="0.5"/>')

# screws on the side
for (z, y) in ((40, 76), (250, 76), (300, 318)):
    c = proj((X1 + 0.5, y, z))
    E(f'<circle cx="{c[0]:.1f}" cy="{c[1]:.1f}" r="3.6" fill="url(#screw)"/><line x1="{c[0]-2.4:.1f}" y1="{c[1]+1:.1f}" x2="{c[0]+2.4:.1f}" y2="{c[1]-1:.1f}" stroke="#3a1a14" stroke-width="0.9"/>')

# livery: the band's five lanes wrap the front lip, run back along the flank, kick up and fan out
# into the socket at the back of the side: the page band grows out of the paint job.
LIV = ["#ffd8bd", "#f2ae3d", "#ff8b61", "#c24e28", "#8e2a1e"]
LY0, LH, LG = 51.5, 3.7, 0.9
lipz = lambda y: 6 - 6 * (y - 24) / 32 - 0.6
ybot, ytop = LY0 - 5 * LH - 4 * LG - 0.9, LY0 + 0.9
E(f'<polygon points="{pts([proj((X0, ytop, lipz(ytop))), proj((X1, ytop, lipz(ytop))), proj((X1, ybot, lipz(ybot))), proj((X0, ybot, lipz(ybot)))])}" fill="#2a0e0c"/>')
for i, col in enumerate(LIV):
    yt = LY0 - i * (LH + LG); yb = yt - LH
    E(f'<polygon points="{pts([proj((X0, yt, lipz(yt))), proj((X1, yt, lipz(yt))), proj((X1, yb, lipz(yb))), proj((X0, yb, lipz(yb)))])}" fill="{col}"/>')

SOCK_Z, SOCK_Y = 344, 112          # socket centre on the side face
def smooth(t): t = max(0.0, min(1.0, t)); return t * t * (3 - 2 * t)
def stripe(z):                      # (centre y, total height) of the side stripe at depth z
    k = smooth((z - 120) / 150)
    return (LY0 - (5 * LH + 4 * LG) / 2) * (1 - k) + SOCK_Y * k, (5 * LH + 4 * LG) * (1 - k) + 66 * k
ZS = [z * 3.0 for z in range(0, int(SOCK_Z / 3) + 1)]
sidep = lambda z, y: proj((X1 + 0.6, y, z))
def lane_poly(f0, f1):
    top = [sidep(z, stripe(z)[0] + stripe(z)[1] * (0.5 - f0)) for z in ZS]
    bot = [sidep(z, stripe(z)[0] + stripe(z)[1] * (0.5 - f1)) for z in ZS[::-1]]
    return pts(top + bot)
E(f'<polygon points="{lane_poly(-0.03, 1.03)}" fill="#1a0707"/>')
gapf = 0.05
lw_f = (1 - 4 * gapf) / 5
for i, col in enumerate(LIV):
    f0 = i * (lw_f + gapf)
    E(f'<polygon points="{lane_poly(f0, f0 + lw_f)}" fill="{col}" opacity="0.86"/>')
# lacquer clear-coat over the paint: a soft highlight along the upper lane edge
E(f'<polyline points="{pts([sidep(z, stripe(z)[0] + stripe(z)[1] * 0.5) for z in ZS])}" fill="none" stroke="#fff" stroke-width="1" opacity="0.3"/>')

# the socket: a chrome-rimmed opening in the side, the band's boot plugs in here (drawn later, on top)
def sock(dz, dy): return sidep(SOCK_Z + dz, SOCK_Y + dy)
rim = [sock(dz, dy) for dz, dy in ((-40, -44), (40, -44), (40, 44), (-40, 44))]
E(f'<polygon points="{pts(rim)}" fill="url(#chrome)" stroke="#2a1210" stroke-width="1"/>')
hole = [sock(dz, dy) for dz, dy in ((-33, -37), (33, -37), (33, 37), (-33, 37))]
E(f'<polygon points="{pts(hole)}" fill="#140506"/>')
for dz, dy in ((-36, -40), (36, -40), (36, 40), (-36, 40)):
    c = sock(dz, dy)
    E(f'<circle cx="{c[0]:.1f}" cy="{c[1]:.1f}" r="2.2" fill="url(#screw)"/>')

# ---------- keyboard on the deck ----------
B = (PROF_B := None)
# deck plane runs between the front lip and the hood: take the straight part of the profile
def find_seg():
    best = None
    for i in range(len(PROF) - 1):
        (z0, y0), (z1, y1) = PROF[i], PROF[i + 1]
        L = math.hypot(z1 - z0, y1 - y0)
        if 0.1 < (y1 - y0) / max(1e-6, (z1 - z0)) < 0.6 and (best is None or L > best[2]):
            best = ((z0, y0), (z1, y1), L)
    return best
d0, d1, _ = find_seg()
def deck(x, t, lift=0.0):
    z = d0[0] + (d1[0] - d0[0]) * t; y = d0[1] + (d1[1] - d0[1]) * t
    tz, ty = norm((d1[0] - d0[0], d1[1] - d0[1]))
    return (x, y + tz * lift, z - ty * lift)

def rrect_plane(f, u0, v0, u1, v1, r, k=6):
    """Rounded rectangle in a plane parametrised by f(u, v) -> 3D, projected."""
    out = []
    for cu, cv, a0 in ((u1 - r, v0 + r, -90), (u1 - r, v1 - r, 0), (u0 + r, v1 - r, 90), (u0 + r, v0 + r, 180)):
        for j in range(k + 1):
            a = math.radians(a0 + 90 * j / k)
            out.append(proj(f(cu + r * math.cos(a), cv + r * math.sin(a))))
    return out

DL = math.hypot(d1[0] - d0[0], d1[1] - d0[1])
deckf = lambda u, v, lift=0.0: deck(u, v / DL, lift)
# keyboard well
well = rrect_plane(lambda u, v: deckf(u, v, -1.5), -196, 14, 196, DL - 10, 12)
E(f'<polygon points="{pts(well)}" fill="#1a0a0a"/>')
well_in = rrect_plane(lambda u, v: deckf(u, v, -1.5), -192, 17, 192, DL - 13, 10)
E(f'<polygon points="{pts(well_in)}" fill="url(#wellG)"/>')
# lip highlight on the front edge of the well
lip = [proj(deckf(u, 14, 0.2)) for u in (-190, 190)]
E(f'<line x1="{lip[0][0]:.1f}" y1="{lip[0][1]:.1f}" x2="{lip[1][0]:.1f}" y2="{lip[1][1]:.1f}" stroke="#ffb393" stroke-width="1.4" opacity="0.6"/>')

KEY_H = 7.0
ROWS = 5
v_top, v_bot = DL - 22, 24
pitch_v = (v_top - v_bot) / ROWS
keys = []
main_u0, main_u1 = -182, 102
pad_u0, pad_u1 = 120, 182
for r in range(ROWS):
    v0 = v_bot + r * pitch_v + 2.2; v1 = v0 + pitch_v - 4.4
    if r == 0:  # front row: space bar + RUN key
        keys.append((main_u0 + 52, v0, main_u1 - 70, v1, "space"))
        keys.append((main_u0, v0, main_u0 + 46, v1, "mod"))
        keys.append((main_u1 - 64, v0, main_u1, v1, "run"))
    else:
        cols = 11
        pu = (main_u1 - main_u0) / cols
        off = (r % 2) * pu * 0.25
        for c in range(cols):
            u0 = main_u0 + c * pu + 2.2 + (off if c > 0 else 0)
            u1 = main_u0 + (c + 1) * pu - 2.2 + (off if c < cols - 1 else 0)
            kind = "alpha"
            if r == ROWS - 1 and c in (0,): kind = "fn"
            keys.append((u0, v0, u1, v1, kind))
    pu = (pad_u1 - pad_u0) / 3
    for c in range(3):
        kind = "pad"
        if r == 0 and c == 2: kind = "enter"
        keys.append((pad_u0 + c * pu + 2.2, v0, pad_u0 + (c + 1) * pu - 2.2, v1, kind))

KEYCOL = {"alpha": ("#fbf3e4", "#d9c9b3", "#a8927c"), "pad": ("#ffd8bd", "#e3b394", "#b07e62"),
          "space": ("#fbf3e4", "#d9c9b3", "#a8927c"), "mod": ("#5b1621", "#43101a", "#2b0a10"),
          "fn": ("#f2ae3d", "#cf8d22", "#9a6514"), "run": ("#ff8b61", "#d9653f", "#a84528"),
          "enter": ("#f2ae3d", "#cf8d22", "#9a6514")}
# far to near: back rows first (large v), left to right
keys.sort(key=lambda k: (-k[1], k[0]))
for (u0, v0, u1, v1, kind) in keys:
    top, side, front = KEYCOL[kind]
    if kind == "run": E('<g class="run-key">')
    bt = lambda u, v: deckf(u, v, 0.5)
    tp = lambda u, v: deckf(u, v, KEY_H)
    # front skirt (faces down-slope, toward the camera)
    fs = [proj(bt(u0, v0)), proj(bt(u1, v0)), proj(tp(u1 - 1.2, v0 + 1.4)), proj(tp(u0 + 1.2, v0 + 1.4))]
    E(f'<polygon points="{pts(fs)}" fill="{front}"/>')
    # right skirt
    rs = [proj(bt(u1, v0)), proj(bt(u1, v1)), proj(tp(u1 - 1.2, v1 - 1.2)), proj(tp(u1 - 1.2, v0 + 1.4))]
    E(f'<polygon points="{pts(rs)}" fill="{side}"/>')
    tq = rrect_plane(tp, u0 + 1.2, v0 + 1.4, u1 - 1.2, v1 - 1.2, 2.2, 2)
    E(f'<polygon points="{pts(tq)}" fill="{top}"/>')
    # dished highlight
    hq = rrect_plane(lambda u, v: deckf(u, v, KEY_H + 0.1), u0 + 2.5, v0 + (v1 - v0) * 0.5, u0 + (u1 - u0) * 0.55, v1 - 2.4, 1.5, 2)
    E(f'<polygon points="{pts(hq)}" fill="#ffffff" opacity="0.22"/>')
    if kind == "run":
        c = proj(tp((u0 + u1) / 2, (v0 + v1) / 2))
        E(f'<text x="{c[0]:.1f}" y="{c[1] + 2.4:.1f}" font-family="Archivo Variable, Archivo" font-weight="800" font-size="7" letter-spacing="0.8" text-anchor="middle" fill="#3a1208" transform="rotate(-9 {c[0]:.1f} {c[1]:.1f})">RUN</text>')
    if kind == "run": E('</g>')

# ---------- hood front face: the screen ----------
def find_hood():
    best = None
    for i in range(len(PROF) - 1):
        (z0, y0), (z1, y1) = PROF[i], PROF[i + 1]
        L = math.hypot(z1 - z0, y1 - y0)
        if (y1 - y0) > 3 * abs(z1 - z0) and (best is None or L > best[2]):
            best = ((z0, y0), (z1, y1), L)
    return best
h0, h1, HL = find_hood()
def hood(u, v, lift=0.0):  # v measured downward from the top of the straight hood face
    t = v / HL
    z = h1[0] + (h0[0] - h1[0]) * t; y = h1[1] + (h0[1] - h1[1]) * t
    tz, ty = norm((h1[0] - h0[0], h1[1] - h0[1]))
    return (u, y + tz * lift, z - ty * lift)

SU0, SU1, SV0, SV1 = -166, 166, 20, 178   # glass
# recessed surround (dark rubber gasket), then the chrome bezel ring on top
bez_o = rrect_plane(lambda u, v: hood(u, v, 1.0), SU0 - 20, SV0 - 18, SU1 + 20, SV1 + 18, 34)
bez_i = rrect_plane(lambda u, v: hood(u, v, 1.0), SU0 - 9, SV0 - 8, SU1 + 9, SV1 + 8, 26)
E(f'<path d="M{pts(bez_o)}Z M{pts(bez_i[::-1])}Z" fill="url(#chromeRing)" fill-rule="evenodd"/>')
E(f'<polygon points="{pts(bez_o)}" fill="none" stroke="#5a2a20" stroke-width="0.9" opacity="0.7"/>')
E(f'<polygon points="{pts(bez_i)}" fill="#0b0605"/>')
glass = rrect_plane(lambda u, v: hood(u, v, 3.0), SU0, SV0, SU1, SV1, 24)
gpath = "M" + pts(glass) + "Z"
defs.append(f'<clipPath id="glassclip"><path d="{gpath}"/></clipPath>')

DEFS_BLOCK = """  <filter id="soft" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur stdDeviation="22"/></filter>
  <filter id="soft2" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur stdDeviation="7"/></filter>
  <filter id="soft3" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="4"/></filter>
  <filter id="phosphor" x="-10%" y="-10%" width="120%" height="120%">
    <feGaussianBlur in="SourceGraphic" stdDeviation="1.8" result="b"/>
    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <filter id="lamp" x="-200%" y="-200%" width="500%" height="500%">
    <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="b"/>
    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <linearGradient id="falloff" x1="0" y1="0" x2="1" y2="0.25">
    <stop offset="0" stop-color="#fff2e0" stop-opacity="0.16"/>
    <stop offset="0.45" stop-color="#fff2e0" stop-opacity="0"/>
    <stop offset="0.8" stop-color="#3a0d0c" stop-opacity="0.12"/>
  </linearGradient>
  <linearGradient id="sheen" gradientUnits="userSpaceOnUse" x1="150" y1="0" x2="330" y2="120">
    <stop offset="0" stop-color="#fff4e6" stop-opacity="0"/>
    <stop offset="0.42" stop-color="#fff4e6" stop-opacity="0"/>
    <stop offset="0.5" stop-color="#fff4e6" stop-opacity="0.2"/>
    <stop offset="0.56" stop-color="#fff4e6" stop-opacity="0.06"/>
    <stop offset="0.66" stop-color="#fff4e6" stop-opacity="0"/>
  </linearGradient>
  <linearGradient id="capG" x1="0" y1="0" x2="0.55" y2="1">
    <stop offset="0" stop-color="#c24e30"/><stop offset="0.35" stop-color="#9a3322"/><stop offset="0.75" stop-color="#6c1d18"/><stop offset="1" stop-color="#461012"/>
  </linearGradient>
  <linearGradient id="capRefl" x1="0" y1="0" x2="1" y2="0.6">
    <stop offset="0" stop-color="#ffb08c" stop-opacity="0"/>
    <stop offset="0.42" stop-color="#ffb08c" stop-opacity="0"/>
    <stop offset="0.5" stop-color="#ffb08c" stop-opacity="0.32"/>
    <stop offset="0.56" stop-color="#ffb08c" stop-opacity="0.04"/>
    <stop offset="1" stop-color="#ffb08c" stop-opacity="0"/>
  </linearGradient>
  <linearGradient id="plinthF" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#4a1418"/><stop offset="1" stop-color="#2a0b0e"/>
  </linearGradient>
  <linearGradient id="wellG" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#2a1312"/><stop offset="1" stop-color="#140707"/>
  </linearGradient>
  <linearGradient id="chrome" x1="0" y1="0" x2="0.4" y2="1">
    <stop offset="0" stop-color="#fffaf2"/><stop offset="0.35" stop-color="#cdbfb2"/><stop offset="0.5" stop-color="#6d5b52"/>
    <stop offset="0.62" stop-color="#e8ddd0"/><stop offset="1" stop-color="#8b7a6e"/>
  </linearGradient>
  <linearGradient id="chromeEnd" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#b9a99c"/><stop offset="1" stop-color="#5d4c44"/>
  </linearGradient>
  <linearGradient id="chromeRing" x1="0.15" y1="0" x2="0.6" y2="1">
    <stop offset="0" stop-color="#fffdf8"/><stop offset="0.18" stop-color="#e6dbcf"/><stop offset="0.4" stop-color="#7d6a60"/>
    <stop offset="0.52" stop-color="#3b2d28"/><stop offset="0.62" stop-color="#d9cbbd"/><stop offset="0.8" stop-color="#fff6ec"/>
    <stop offset="1" stop-color="#8e7c70"/>
  </linearGradient>
  <linearGradient id="trim" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#fff4e8"/><stop offset="0.5" stop-color="#9c8a7e"/><stop offset="0.75" stop-color="#e6d8ca"/><stop offset="1" stop-color="#5e4c44"/>
  </linearGradient>
  <radialGradient id="screw" cx="0.35" cy="0.35" r="0.7">
    <stop offset="0" stop-color="#fff"/><stop offset="0.5" stop-color="#b8a597"/><stop offset="1" stop-color="#4d3c35"/>
  </radialGradient>
  <radialGradient id="knurl" cx="0.4" cy="0.35" r="0.75">
    <stop offset="0" stop-color="#5b1621"/><stop offset="0.8" stop-color="#2b0a10"/><stop offset="1" stop-color="#14050a"/>
  </radialGradient>
  <radialGradient id="crt" cx="0.42" cy="0.4" r="0.75">
    <stop offset="0" stop-color="#103a33"/><stop offset="0.55" stop-color="#0a2420"/><stop offset="1" stop-color="#040c0b"/>
  </radialGradient>
  <radialGradient id="vignette" cx="0.5" cy="0.5" r="0.7">
    <stop offset="0.6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.55"/>
  </radialGradient>
  <pattern id="scan" width="4" height="3" patternUnits="userSpaceOnUse">
    <rect width="4" height="1.2" fill="#000"/>
  </pattern>
  <radialGradient id="bulge" cx="0.3" cy="0.22" r="0.9">
    <stop offset="0" stop-color="#d8fff4" stop-opacity="0.16"/>
    <stop offset="0.4" stop-color="#d8fff4" stop-opacity="0.03"/>
    <stop offset="0.85" stop-color="#000" stop-opacity="0.15"/>
    <stop offset="1" stop-color="#000" stop-opacity="0.45"/>
  </radialGradient>
  <linearGradient id="sweep" x1="0" y1="0" x2="1" y2="0.55">
    <stop offset="0" stop-color="#fff" stop-opacity="0"/>
    <stop offset="0.16" stop-color="#fff" stop-opacity="0"/>
    <stop offset="0.2" stop-color="#fff" stop-opacity="0.13"/>
    <stop offset="0.3" stop-color="#fff" stop-opacity="0.05"/>
    <stop offset="0.34" stop-color="#fff" stop-opacity="0"/>
    <stop offset="0.38" stop-color="#fff" stop-opacity="0.06"/>
    <stop offset="0.41" stop-color="#fff" stop-opacity="0"/>
  </linearGradient>
"""

# ---------- screen plane: affine u,v (px of a GW x GH glass) -> viewBox ----------
GW, GH, GR = SU1 - SU0, SV1 - SV0, 24
O = proj(hood(SU0, SV0, 3.0)); Ux = proj(hood(SU0 + 100, SV0, 3.0)); Vy = proj(hood(SU0, SV0 + 100, 3.0))
SM = [(Ux[0] - O[0]) / 100, (Ux[1] - O[1]) / 100, (Vy[0] - O[0]) / 100, (Vy[1] - O[1]) / 100, O[0], O[1]]
# the glass itself; the live terminal (HTML) is laid exactly over it by the page
E(f'<path id="glass" d="{gpath}" fill="url(#crt)"/>')

def plane_matrix(f, u, v):
    o = proj(f(u, v)); ux = proj(f(u + 100, v)); vy = proj(f(u, v + 100))
    return f"matrix({(ux[0]-o[0])/100:.4f} {(ux[1]-o[1])/100:.4f} {(vy[0]-o[0])/100:.4f} {(vy[1]-o[1])/100:.4f} {o[0]:.2f} {o[1]:.2f})"

# phosphor light spilling from the tube onto the back of the deck
spill_m = plane_matrix(lambda u, v: deckf(u, v, KEY_H + 0.5), 0, DL - 6)
E(f'<ellipse class="spill" transform="{spill_m}" cx="0" cy="0" rx="230" ry="70" fill="url(#spillG)" style="mix-blend-mode:screen"/>')

# under the screen: wordmark, VFD, lamps, dial
def on_hood_text(u, v, s, size, weight, fill, italic=True, anchor="start", ls=0, extra=""):
    m = plane_matrix(lambda uu, vv: hood(uu, vv, 0.6), u, v)
    st = "italic" if italic else "normal"
    return f'<text{extra} transform="{m}" font-family="Archivo Variable, Archivo" font-style="{st}" font-weight="{weight}" font-stretch="125%" font-size="{size}" fill="{fill}" text-anchor="{anchor}" letter-spacing="{ls}">{s}</text>'
E(on_hood_text(SU0 - 8, SV1 + 33.6, "swizzle", 21, 900, "#5a1812"))
E(on_hood_text(SU0 - 8.6, SV1 + 32.8, "swizzle", 21, 900, "#fff3e6"))

# VFD window: dark glass in a thin chrome frame, amber segments written by the page (#vfd-text)
VU0, VU1, VV0, VV1 = -58, 56, SV1 + 13, SV1 + 35
vf_o = rrect_plane(lambda u, v: hood(u, v, 0.8), VU0 - 3, VV0 - 3, VU1 + 3, VV1 + 3, 6, 3)
vf_i = rrect_plane(lambda u, v: hood(u, v, 0.4), VU0, VV0, VU1, VV1, 4, 3)
E(f'<polygon points="{pts(vf_o)}" fill="url(#chromeRing)"/>')
E(f'<polygon points="{pts(vf_i)}" fill="#120604"/>')
vm = plane_matrix(lambda u, v: hood(u, v, 0.6), VU0, VV0)
E(f'<g transform="{vm}"><rect width="{VU1 - VU0}" height="{VV1 - VV0}" fill="url(#vfdDots)"/>'
  f'<text id="vfd-text" x="{(VU1 - VU0) / 2}" y="{(VV1 - VV0) / 2 + 6}" text-anchor="middle" font-family="VT323, monospace" font-size="19" letter-spacing="2.4" fill="#ffb347" filter="url(#lamp)">RUN 4812 OK</text>'
  f'<rect width="{VU1 - VU0}" height="{(VV1 - VV0) * 0.45}" fill="#fff" opacity="0.05"/></g>')

# lamps
for i, (col, glow) in enumerate((("#8ff5da", 1), ("#ffb347", 1), ("#5b1621", 0))):
    c = proj(hood(SU1 - 96 + i * 20, SV1 + 24, 1.0))
    E(f'<circle cx="{c[0]:.1f}" cy="{c[1]:.1f}" r="6.4" fill="url(#chrome)"/>')
    E(f'<circle class="lamp lamp-{i}" cx="{c[0]:.1f}" cy="{c[1]:.1f}" r="4.4" fill="{col}"{" filter=\"url(#lamp)\"" if glow else ""}/>')
    E(f'<circle cx="{c[0]-1.3:.1f}" cy="{c[1]-1.5:.1f}" r="1.3" fill="#fff" opacity="0.8"/>')
# dial (the page turns .knob while a run is busy)
dc = proj(hood(SU1 - 16, SV1 + 24, 2.0))
E(f'<ellipse cx="{dc[0]+1.5:.1f}" cy="{dc[1]+3:.1f}" rx="14.5" ry="15" fill="#000" opacity="0.35" filter="url(#soft3)"/>')
E(f'<circle cx="{dc[0]:.1f}" cy="{dc[1]:.1f}" r="14" fill="url(#knurl)"/>')
E(f'<g class="knob" style="transform-origin:{dc[0]:.1f}px {dc[1]:.1f}px"><circle cx="{dc[0]:.1f}" cy="{dc[1]:.1f}" r="9.5" fill="url(#chrome)"/>'
  f'<line x1="{dc[0]:.1f}" y1="{dc[1]:.1f}" x2="{dc[0]+5.5:.1f}" y2="{dc[1]-6.5:.1f}" stroke="#3a1a14" stroke-width="2" stroke-linecap="round"/></g>')

# a chrome trim line running along the body just above the plinth
tl = [proj((x, 25, 4)) for x in (X0 + 2, X1)] + [proj((X1, 25, z)) for z in (4, 392)]
E(f'<polyline points="{pts(tl)}" fill="none" stroke="url(#trim)" stroke-width="2.4"/>')

# rim light: the hero sun stands behind the device and catches its back edges
back_top = max(PROF, key=lambda p: p[1] if p[0] > 300 else -1)
rim_pts = [proj((x, back_top[1], back_top[0])) for x in (X0 + 30, X1)] + [proj((X1, y, z)) for (z, y) in PROF if z > back_top[0] - 1 and y > 30]
E(f'<polyline points="{pts(rim_pts)}" fill="none" stroke="#ffd8bd" stroke-width="3" opacity="0.5" filter="url(#rimBlur)" stroke-linejoin="round"/>')
E(f'<polyline points="{pts(rim_pts)}" fill="none" stroke="#fff3e6" stroke-width="1.1" opacity="0.7" stroke-linejoin="round"/>')

# ---------- the band boot: a chrome sleeve plugged into the side socket; the page band leaves it ----------
sc = sidep(SOCK_Z, SOCK_Y)
BH, BL = 96.0, 92.0
bx0, bx1, by0 = sc[0] - 4, sc[0] + BL, sc[1] - BH / 2
E(f'<rect x="{bx0 + 6:.1f}" y="{by0 + 10:.1f}" width="{BL:.1f}" height="{BH:.1f}" rx="10" fill="#000" opacity="0.35" filter="url(#soft3)"/>')
E(f'<rect x="{bx0:.1f}" y="{by0:.1f}" width="{BL:.1f}" height="{BH:.1f}" rx="9" fill="url(#sleeve)" stroke="#2a1210" stroke-width="1"/>')
for k, xx in enumerate((bx0 + 20, bx0 + 28, bx1 - 22)):
    E(f'<rect x="{xx:.1f}" y="{by0 - 3:.1f}" width="{5 if k < 2 else 12}" height="{BH + 6:.1f}" rx="2.5" fill="url(#sleeve)" stroke="#2a1210" stroke-width="0.8"/>')
E(f'<rect x="{bx1 - 6:.1f}" y="{by0 + 6:.1f}" width="8" height="{BH - 12:.1f}" rx="3" fill="#1a0a09"/>')
PORT = (bx1 - 4, sc[1])

body_svg = "\n".join(svg)

# ---------- crop and emit ----------
allp = [proj((x, y, z)) for (z, y) in PROF for x in (X0, X1)]  # final camera, not the fitting pass
VX0 = min(p[0] for p in allp) - 24
VX1 = bx1 + 6
VY0 = min(p[1] for p in allp) - 16
VY1 = max(p[1] for p in allp) + 34
VW, VH = VX1 - VX0, VY1 - VY0

EXTRA_DEFS = """
  <filter id="rimBlur" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="2.2"/></filter>
  <radialGradient id="spillG"><stop offset="0" stop-color="#8ff5da" stop-opacity="0.2"/><stop offset="1" stop-color="#8ff5da" stop-opacity="0"/></radialGradient>
  <pattern id="vfdDots" width="3" height="3" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.5" r="0.6" fill="#ffb347" opacity="0.13"/></pattern>
  <linearGradient id="sleeve" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#8e7c70"/><stop offset="0.12" stop-color="#fffaf2"/><stop offset="0.3" stop-color="#d9cbbd"/>
    <stop offset="0.55" stop-color="#6d5b52"/><stop offset="0.7" stop-color="#3b2d28"/><stop offset="0.86" stop-color="#b9a99c"/><stop offset="1" stop-color="#4d3c35"/>
  </linearGradient>
"""
DEFS = DEFS_BLOCK

doc = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="{VX0:.1f} {VY0:.1f} {VW:.1f} {VH:.1f}" class="device" aria-hidden="true">
<defs>
{DEFS}{EXTRA_DEFS}  {"".join(defs)}
</defs>
<g id="device">
{body_svg}
</g>
</svg>'''

def rel(x, y): return [round(x - VX0, 2), round(y - VY0, 2)]
DEVICE = {
    "vb": [round(VW, 2), round(VH, 2)],
    "screen": {"w": GW, "h": GH, "r": GR, "matrix": [round(v, 5) for v in SM[:4]] + rel(SM[4], SM[5])},
    "port": rel(*PORT),
}
js = ("// Generated by device/gen.py. Do not edit by hand: change the generator and rerun it.\n"
      "// DEVICE holds viewBox-unit geometry for the live overlays and the page band's start.\n"
      f"export const DEVICE = {json.dumps(DEVICE)};\n"
      f"export const DEVICE_SVG = {json.dumps(doc)};\n")
open(OUT, "w").write(js)
if PREVIEW:
    open(PREVIEW, "w").write(doc.replace('class="device"', f'width="{VW:.0f}" height="{VH:.0f}" style="background:#1f0d0e"'))
print(json.dumps(DEVICE))
