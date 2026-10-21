"""
bake_scenery.py — paints the backgrounds for Heaven's Gate in a soft, hand-painted animation style.

  python3 tools/bake_scenery.py      (run from the project folder; needs numpy, scipy, Pillow)

Outputs:
  assets/world.jpg        the whole painted world, 1600 x 4600
  assets/door-left.png    the left golden door (the right one is mirrored in the page)
  js/geometry.js          where the stairs, platform, gate and grounds are, so the page and
                          the paintings always agree
World layout (y):  0–1150 Heaven · 1150–2050 the gate · 2050–3350 the stairs · 3350–3650 cloud sea · 3650–4600 Hell
"""
import os, json, math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
A = os.path.join(ROOT, 'assets')
W, H = 1600, 4600
R = np.random.default_rng(7)

# ───────── geometry (exported to js/geometry.js) ─────────
RUN, RISE, N = 34, 24, 10
PLATFORM = dict(x0=560, x1=1000, y=1880)
FLIGHTS = []          # each flight: dir (+1 climbs to the right), xl/yl = its low end
LANDINGS = []
y = PLATFORM['y']
for i in range(6):
    if i % 2 == 0:   # climbs leftward to a left-side top
        top_x = 1000; d = -1
    else:
        top_x = 1340; d = +1
    xl = top_x - d * N * RUN
    yl = y + N * RISE
    FLIGHTS.append(dict(dir=d, xl=xl, yl=yl, xt=top_x, yt=y))
    LANDINGS.append(dict(x0=xl, x1=xl + 90, y=yl) if d < 0 else dict(x0=xl - 90, x1=xl, y=yl))
    y = yl
GATE = dict(x=800, doorTop=1420, doorBase=1880, leftDoor=[690, 800], rightDoor=[800, 910],
            eyes=[[745, 1612], [855, 1612]], mouth=[800, 1718], crown=[800, 1286])
HEAVEN_GROUND = dict(base=905, a1=14, f1=210, a2=8, f2=97, p2=1.0)
HELL_GROUND = dict(base=4428, a1=6, f1=180)


def heavenY(x): return HEAVEN_GROUND['base'] + 14 * np.sin(x / 210) + 8 * np.sin(x / 97 + 1.0)
def hellY(x): return HELL_GROUND['base'] + 6 * np.sin(x / 180)


# ───────── helpers ─────────
def fbm(h, w, cells, octaves, seed, pers=0.5, stretch=1.0):
    rng = np.random.default_rng(seed)
    out = np.zeros((h, w), np.float32); amp, tot = 1.0, 0.0
    for o in range(octaves):
        cx = max(2, int(cells * 2 ** o)); cy = max(2, int(round(cx * h / w * stretch)))
        g = rng.random((cy + 3, cx + 3)).astype(np.float32)
        z = ndimage.zoom(g, (h / cy, w / cx), order=3, prefilter=False)
        out += amp * z[:h, :w]; tot += amp; amp *= pers
    return out / tot

def norm(n): return (n - n.mean()) / (n.std() + 1e-6)
def smooth(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t)
def hexc(s): s = s.lstrip('#'); return np.array([int(s[i:i + 2], 16) for i in (0, 2, 4)], np.float32)
def vgrad(h, stops):
    ys = np.arange(h); out = np.zeros((h, 3), np.float32)
    for c in range(3): out[:, c] = np.interp(ys, [s[0] for s in stops], [hexc(s[1])[c] for s in stops])
    return out
def over(base, col, a): a = a[..., None]; return base * (1 - a) + col * a
def mix3(a, b, c, t):
    """three-tone ramp a→b→c for t in [0,1] (colours may be per-row arrays)"""
    t = t[..., None]
    return np.where(t < 0.5, a + (b - a) * (t * 2), b + (c - b) * (t * 2 - 1))


def puff_density(h, w, y0, puffs):
    D = np.zeros((h, w), np.float32)
    for (px, py, r) in puffs:
        ly = py - y0
        x0 = int(max(0, px - 2.2 * r)); x1 = int(min(w, px + 2.2 * r))
        ya = int(max(0, ly - 2.2 * r)); yb = int(min(h, ly + 2.2 * r))
        if x1 <= x0 or yb <= ya: continue
        yy, xx = np.ogrid[ya:yb, x0:x1]
        D[ya:yb, x0:x1] += np.exp(-(((xx - px) ** 2 + (yy - ly) ** 2) / (r * r)) * 1.7)
    return D

def cumulus(rng, cx, cy, size, n=None, flat=True):
    n = n or int(16 + size / 8); out = []
    for _ in range(n):
        u = rng.uniform(-1, 1); x = cx + u * size; top = (1 - u * u) ** 0.7
        yy = cy - rng.uniform(0, 1) ** 0.8 * size * 0.9 * top
        r = size * rng.uniform(0.2, 0.4) * (0.65 + 0.5 * top)
        out.append((x, yy, r))
    return out

def light_through(D, L, steps=16, step=6, absorb=0.12):
    h, w = D.shape; pad = steps * step + 2
    Dp = np.pad(D, pad, mode='edge'); opt = np.zeros_like(D)
    for k in range(1, steps + 1):
        oy = int(round(L[1] * k * step)); ox = int(round(L[0] * k * step))
        opt += Dp[pad + oy:pad + oy + h, pad + ox:pad + ox + w]
    return np.exp(-opt * absorb)

def paint_clouds(img, y0, y1, puffs, L, lit, mid, shade, seed, thr=0.34, edge=0.05, alpha=1.0, under=None):
    """Painted cumulus: soft-edged shapes, three-tone cel shading from a light direction."""
    h = y1 - y0
    D = puff_density(h, W, y0, puffs)
    n = norm(fbm(h, W, 20, 4, seed)) * 0.1
    Aa = smooth(thr - edge, thr + edge, D + n)
    T = light_through(Aa, L, steps=14, step=5, absorb=0.16)
    T = ndimage.gaussian_filter(T, 2.0)
    t = np.clip(smooth(0.18, 0.4, T) * 0.5 + smooth(0.5, 0.72, T) * 0.5, 0, 1)
    col = mix3(shade, mid, lit, t)
    if under is not None:      # coloured bounce light on the undersides
        u = (1 - t) * smooth(0.0, 1.0, D)
        col = col + under * (0.25 * u)[..., None]
    img[y0:y1] = over(img[y0:y1], col, np.clip(Aa, 0, 1) * alpha)


def clouds(img, puffs, L, lit, mid, shade, seed, under=None, alpha=1.0, thr=0.34):
    """Paint cumulus whose region is sized from the puffs; colours are [(world_y, '#hex'), ...] ramps."""
    y0 = int(max(0, min(p[1] - 2.3 * p[2] for p in puffs))); y1 = int(min(H, max(p[1] + 2.3 * p[2] for p in puffs)))
    ramp = lambda st: vgrad(y1 - y0, [(yy - y0, c) for yy, c in st])[:, None, :]
    paint_clouds(img, y0, y1, puffs, L, ramp(lit), ramp(mid), ramp(shade), seed, under=under, alpha=alpha, thr=thr)


def poly_layer(shape_fn, box, ss=2):
    """Draw with PIL at ss x supersampling inside box=(x0,y0,x1,y1); return (mask float, x0, y0)."""
    x0, y0, x1, y1 = box
    m = Image.new('L', ((x1 - x0) * ss, (y1 - y0) * ss), 0)
    d = ImageDraw.Draw(m)
    shape_fn(d, lambda pts: [((px - x0) * ss, (py - y0) * ss) for px, py in pts], ss)
    m = m.resize((x1 - x0, y1 - y0), Image.LANCZOS)
    return np.asarray(m).astype(np.float32) / 255

def stamp(img, box, mask, color):
    x0, y0, x1, y1 = box
    sub = img[y0:y1, x0:x1]
    col = color if np.ndim(color) == 3 else np.broadcast_to(color, sub.shape)
    img[y0:y1, x0:x1] = over(sub, col, mask)

def polygon(img, pts, color, pad=4):
    xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
    box = (max(0, int(min(xs)) - pad), max(0, int(min(ys)) - pad), min(W, int(max(xs)) + pad), min(H, int(max(ys)) + pad))
    m = poly_layer(lambda d, T, ss: d.polygon(T(pts), fill=255), box)
    if callable(color):
        yy, xx = np.mgrid[box[1]:box[3], box[0]:box[2]]
        color = color(xx.astype(np.float32), yy.astype(np.float32))
    stamp(img, box, m, color)
    return box, m

def ellipse(img, cx, cy, rx, ry, color):
    box = (max(0, int(cx - rx) - 3), max(0, int(cy - ry) - 3), min(W, int(cx + rx) + 3), min(H, int(cy + ry) + 3))
    m = poly_layer(lambda d, T, ss: d.ellipse([*T([(cx - rx, cy - ry)])[0], *T([(cx + rx, cy + ry)])[0]], fill=255), box)
    if callable(color):
        yy, xx = np.mgrid[box[1]:box[3], box[0]:box[2]]
        color = color(xx.astype(np.float32), yy.astype(np.float32))
    stamp(img, box, m, color)

def lin(c0, c1, a0, a1, axis='y'):
    c0, c1 = hexc(c0), hexc(c1)
    def f(xx, yy):
        v = yy if axis == 'y' else xx
        t = np.clip((v - a0) / (a1 - a0), 0, 1)[..., None]
        return c0 + (c1 - c0) * t
    return f

def kuwahara(img, r=4):
    """Painterly smoothing: each pixel takes the mean of its calmest neighbouring quadrant."""
    k = r + 1
    lum = img.mean(-1)
    best_var = None; out = np.zeros_like(img)
    for oy in (-(k // 2), k // 2 - (1 - k % 2)):
        for ox in (-(k // 2), k // 2 - (1 - k % 2)):
            m = np.stack([ndimage.uniform_filter(img[..., c], k, origin=(oy, ox)) for c in range(3)], -1)
            v = ndimage.uniform_filter(lum * lum, k, origin=(oy, ox)) - ndimage.uniform_filter(lum, k, origin=(oy, ox)) ** 2
            if best_var is None:
                best_var = v; out = m
            else:
                sel = v < best_var
                best_var = np.where(sel, v, best_var); out = np.where(sel[..., None], m, out)
    return out


# ───────── the world ─────────
def paint_world():
    img = np.zeros((H, W, 3), np.float32)
    X = np.arange(W)[None, :].astype(np.float32)
    # one sky for everything, from Heaven's blue down to Hell's soot
    img[:] = vgrad(H, [(0, '#2F6CB3'), (380, '#5C9AD2'), (760, '#A8D0EA'), (1000, '#E9EFDB'), (1180, '#F6E3B4'),
                       (1500, '#F3C98E'), (1800, '#DFA582'), (2050, '#A88AA6'), (2500, '#73668F'), (3000, '#4B3A5B'),
                       (3350, '#3A2232'), (3650, '#3C140E'), (4000, '#5E1A10'), (4330, '#C9521F'), (4600, '#6E2010')])[:, None, :]

    # ── HEAVEN: towering clouds on the horizon, floating islands, the meadow ──
    rng = np.random.default_rng(1)
    pf = []
    for x in (-40, 300, 640, 980, 1330, 1640): pf += cumulus(rng, x + rng.uniform(-60, 60), rng.uniform(800, 860), rng.uniform(150, 260), n=30)
    hills = [(float(x), 860 - 40 * math.sin(x / 230 + 1) ** 2 - 25 * math.sin(x / 90) ** 2) for x in np.arange(0, W + 1, 10)]
    polygon(img, hills + [(W, 960), (0, 960)], lin('#9DBBD6', '#B9D2DE', 800, 900))
    clouds(img, pf, (0.45, -1), [(0, '#FFFFFF'), (H, '#FFFFFF')], [(0, '#F0EEF2'), (H, '#F0EEF2')], [(0, '#A9B8DA'), (H, '#A9B8DA')], 2, under=hexc('#F6D8B8'))
    pf = []
    for x in rng.uniform(-50, 1650, 7): pf += cumulus(rng, x, rng.uniform(150, 300), rng.uniform(70, 130))
    clouds(img, pf, (0.45, -1), [(0, '#FFFFFF'), (H, '#FFFFFF')], [(0, '#E7EEF6'), (H, '#E7EEF6')], [(0, '#9FB4DA'), (H, '#9FB4DA')], 3)
    # sun glow upper right
    yy, xx = np.mgrid[0:1150, 0:W]
    sun = np.exp(-(((xx - 1250) / 260.0) ** 2 + ((yy - 140) / 220.0) ** 2))
    img[:1150] += hexc('#FFF4D6') * (sun * 0.55)[..., None]

    def island(cx, top, w_, depth, haze, seed, grass=('#B7D27A', '#76A256'), rock=('#A8907A', '#6E5E66')):
        rr = np.random.default_rng(seed)
        topline = [(cx - w_ / 2 + i * w_ / 24, top + 6 * math.sin(i * 0.9) - (10 if 6 < i < 18 else 0)) for i in range(25)]
        bottom = [(cx + w_ / 2 - i * w_ / 12, top + 18 + depth * math.sin(math.pi * (i / 12)) ** 1.6 + rr.uniform(-8, 8)) for i in range(13)]
        hz = lambda c: '#%02x%02x%02x' % tuple(int(v) for v in hexc(c) * (1 - haze) + hexc('#9CC4E6') * haze)
        polygon(img, topline + bottom, lin(hz(rock[0]), hz(rock[1]), top, top + depth))
        polygon(img, topline + [(cx + w_ / 2, top + 20), (cx - w_ / 2, top + 20)], lin(hz(grass[0]), hz(grass[1]), top - 8, top + 22))
        return topline

    island(260, 420, 150, 90, 0.45, 11)
    island(560, 300, 90, 60, 0.55, 12)
    island(1500, 560, 120, 70, 0.4, 13)
    # the big island with the waterfall
    top = island(1250, 470, 330, 170, 0.0, 14)
    wf_x = 1180
    polygon(img, [(wf_x - 12, 476), (wf_x + 12, 476), (wf_x + 26, 930), (wf_x - 26, 930)], lin('#E4F4FC', '#B6D8EE', 476, 930))
    rr_ = np.random.default_rng(18)
    for k in range(9):
        o = rr_.uniform(-10, 10)
        polygon(img, [(wf_x + o - 1.2, 480), (wf_x + o + 1.2, 480), (wf_x + o * 2.2 + 1.6, 930), (wf_x + o * 2.2 - 1.6, 930)], hexc('#FFFFFF'))
    mp = cumulus(np.random.default_rng(15), wf_x, 925, 70, n=14)
    clouds(img, mp, (0.3, -1), [(0, '#FFFFFF'), (H, '#FFFFFF')], [(0, '#EEF4F8'), (H, '#EEF4F8')], [(0, '#B8C9E0'), (H, '#B8C9E0')], 16, alpha=0.85)

    # trees on the distant hills
    def tree(tx, ty, s, seed, lit='#C9DB7E', mid='#86AE5A', shade='#4E7E5A', trunk='#6E5440'):
        rr = np.random.default_rng(seed)
        polygon(img, [(tx - 6 * s, ty), (tx - 3 * s, ty - 70 * s), (tx + 3 * s, ty - 70 * s), (tx + 6 * s, ty)], hexc(trunk))
        blobs = [(tx + rr.uniform(-40, 40) * s, ty - (80 + rr.uniform(0, 70)) * s, rr.uniform(26, 42) * s) for _ in range(9)]
        for bx, by, br in blobs: ellipse(img, bx, by + br * 0.15, br * 1.05, br, hexc(shade))
        for bx, by, br in blobs: ellipse(img, bx - br * 0.12, by - br * 0.1, br * 0.82, br * 0.75, hexc(mid))
        for bx, by, br in blobs: ellipse(img, bx - br * 0.3, by - br * 0.32, br * 0.42, br * 0.36, hexc(lit))

    # the meadow island, where the admitted live
    xs = np.arange(0, W + 1, 8)
    topl = [(float(x), float(heavenY(x))) for x in xs]
    under = [(W, 1000), (1400, 1060), (1100, 1095), (800, 1110), (500, 1092), (200, 1060), (0, 1000)]
    polygon(img, topl + under, lin('#A08470', '#5E5160', 930, 1110))
    # back hills
    hills = [(float(x), float(heavenY(x) - 40 - 30 * math.sin(x / 300 + 0.6) ** 2)) for x in xs]
    polygon(img, hills + [(W, 940), (0, 940)], lin('#A9C97A', '#7FA65E', 840, 930))
    for tx in (140, 390, 1080, 1460): tree(tx, heavenY(tx) - 38, 0.5, int(tx), lit='#D9E39A', mid='#A2BF72', shade='#7C9A72')
    polygon(img, topl + [(W, 990), (0, 990)], lin('#B5D47A', '#6E9C50', 880, 990))
    # painted grass strokes and wildflowers
    gx = np.random.default_rng(31)
    box = (0, 860, W, 1000)
    sub = img[860:1000]
    strokes = norm(fbm(140, W, 260, 3, 32, stretch=1.2))
    sub *= (0.95 + 0.05 * strokes)[..., None]
    img[860:1000] = sub
    for _ in range(900):
        x = gx.uniform(0, W); yv = heavenY(x) + gx.uniform(4, 80)
        if yv > 992: continue
        c = gx.choice(['#FFFFFF', '#FFE58A', '#F6B8C8', '#C9B8F0', '#FFF4D0'])
        r = gx.uniform(1.4, 3.2) * (0.6 + (yv - 900) / 120)
        ellipse(img, x, yv, r, r * 0.8, hexc(c))
    # pond
    ellipse(img, 470, 962, 150, 22, lin('#7FA2B8', '#5E7E96', 940, 984))
    ellipse(img, 470, 960, 140, 18, lin('#D8EEF6', '#9CC6DE', 942, 978))
    ellipse(img, 430, 956, 50, 4, hexc('#F4FBFF'))
    # big trees framing the meadow
    tree(90, heavenY(90) + 10, 1.45, 41)
    tree(1530, heavenY(1530) + 10, 1.35, 42)
    # roots hanging under the island
    rr = np.random.default_rng(51)
    for _ in range(30):
        x = rr.uniform(150, 1450); y0 = 1040 + rr.uniform(0, 40)
        L = rr.uniform(20, 90)
        polygon(img, [(x - 2, y0), (x + 2, y0), (x + rr.uniform(-10, 10), y0 + L)], hexc('#5A4A48'))

    # clouds under Heaven, lit gold from the gate below
    pf = []
    for x in np.arange(-100, 1750, 120):
        if 560 < x < 1040: continue
        pf += cumulus(rng, x, rng.uniform(1160, 1200), rng.uniform(90, 150), n=24)
    for x in np.arange(-100, 1750, 150): pf += cumulus(rng, x, rng.uniform(1080, 1110), rng.uniform(70, 110), n=18)
    clouds(img, pf, (0.0, 1.0), [(1000, '#FFF1D2'), (1300, '#FFE2A8')], [(1000, '#F2D6B4'), (1300, '#F0C08E')], [(1000, '#C6B6C8'), (1300, '#C79A8C')], 4)

    # ── THE GATE: golden hour, clouds lit from behind the gate ──
    yy, xx = np.mgrid[1150:2050, 0:W]
    glow = np.exp(-(((xx - 800) / 420.0) ** 2 + ((yy - 1620) / 380.0) ** 2))
    img[1150:2050] += hexc('#FFE9B8') * (glow * 0.55)[..., None]
    # rays
    rays = np.zeros((900, W), np.float32)
    ang = np.arctan2(yy - 1640, xx - 800)
    rays = (np.sin(ang * 23) * 0.5 + 0.5) ** 6 * np.exp(-np.hypot(xx - 800, yy - 1640) / 700)
    img[1150:2050] += hexc('#FFF1CC') * (rays * 0.25)[..., None]
    for side in (-1, 1):
        pf = []
        for k in range(4):
            pf += cumulus(rng, 800 + side * rng.uniform(430, 800), 1420 + k * 150 + rng.uniform(-30, 30), rng.uniform(130, 210), n=26)
        L = (-side * 0.8, -0.6)
        clouds(img, pf, L, [(1150, '#FFF3D8'), (1650, '#FFE2A8'), (2120, '#F2B98C')], [(1150, '#F0CFA8'), (1650, '#E7B08C'), (2120, '#C88C88')],
               [(1150, '#A9A3C6'), (1650, '#8C86AE'), (2120, '#6E6490')], 20 + side, under=hexc('#FFB47A'))

    paint_gate(img)

    # cloud floor around the platform
    pf = []
    for x in np.arange(-60, 1700, 90):
        if 520 < x < 1040: continue
        pf += cumulus(rng, x, rng.uniform(1930, 1990), rng.uniform(80, 150))
    for x in np.arange(500, 1080, 70): pf += cumulus(rng, x, rng.uniform(1990, 2030), rng.uniform(60, 100))
    clouds(img, pf, (0, -1), [(1780, '#FFF0D4'), (2200, '#F1C9A6')], [(1780, '#EBC4A6'), (2200, '#C6A0A4')], [(1780, '#9C8EB2'), (2200, '#6E6490')], 23)

    # ── THE STAIRS: floating switchback flights through dusk clouds ──
    pf = []
    for yb in np.arange(2150, 3360, 260):
        pf += cumulus(rng, rng.uniform(-80, 420), yb + rng.uniform(-40, 40), rng.uniform(110, 190), n=26)
        if rng.random() < 0.6: pf += cumulus(rng, rng.uniform(450, 800), yb + 120 + rng.uniform(-30, 30), rng.uniform(70, 120), n=18)
    clouds(img, pf, (0.2, -1), [(2000, '#FBE2CC'), (2600, '#E0BCC8'), (3100, '#B48AA6'), (3500, '#8A5A72')], [(2000, '#D4AEC0'), (2600, '#A890B6'), (3100, '#7A6292'), (3500, '#5E3E58')], [(2000, '#8E86B0'), (2600, '#6A6290'), (3100, '#4A3E66'), (3500, '#3A2236')], 24, under=hexc('#E08A6A'))
    pf = []
    for yb in np.arange(2250, 3360, 300):
        pf += cumulus(rng, rng.uniform(1300, 1700), yb + rng.uniform(-40, 40), rng.uniform(100, 170), n=22)
    clouds(img, pf, (-0.2, -1), [(2000, '#FBE2CC'), (2600, '#E0BCC8'), (3100, '#B48AA6'), (3500, '#8A5A72')], [(2000, '#D4AEC0'), (2600, '#A890B6'), (3100, '#7A6292'), (3500, '#5E3E58')], [(2000, '#8E86B0'), (2600, '#6A6290'), (3100, '#4A3E66'), (3500, '#3A2236')], 26, under=hexc('#E08A6A'))
    paint_stairs(img)
    # mist in front of the lower flights, and the cloud sea they vanish into
    pf = []
    for x in np.arange(-100, 1750, 80): pf += cumulus(rng, x, rng.uniform(3330, 3400), rng.uniform(130, 220))
    for x in np.arange(-100, 1750, 90):
        for yv in np.arange(3450, 3700, 60): pf.append((x + rng.uniform(-30, 30), yv, rng.uniform(80, 130)))
    clouds(img, pf, (0.1, -1), [(3100, '#B48AA0'), (3400, '#9A6476'), (3800, '#6E2A26')], [(3100, '#8C6886'), (3400, '#6E4458'), (3800, '#4E1A18')],
           [(3100, '#4E3A58'), (3400, '#3E2234'), (3800, '#2E0E0E')], 25, under=hexc('#FF7A3A'))
    paint_hell(img, X)

    # ── finishing: paint texture and a soft, hand-made finish ──
    out = np.zeros_like(img)
    for y0 in range(0, H, 400):
        a, b = max(0, y0 - 10), min(H, y0 + 410)
        k = kuwahara(img[a:b], 4)
        out[y0:min(H, y0 + 400)] = k[y0 - a:y0 - a + min(400, H - y0)]
    paper = norm(fbm(H, W, 300, 2, 99)) * 2.2 + norm(fbm(H, W, 40, 3, 98)) * 2.0
    out = out + paper[..., None]
    Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).save(os.path.join(A, 'world.jpg'), quality=90)


def paint_gate(img):
    G = GATE
    # doorway: light from Heaven
    def doorway(xx, yy):
        d = np.hypot((xx - 800) / 110, (yy - 1660) / 230)
        t = np.clip(d, 0, 1)[..., None]
        return hexc('#FFFFFF') * (1 - t) + hexc('#F7C66A') * t
    arch = [(690, 1880), (690, 1530)] + [(800 - 110 * math.cos(a), 1530 - 110 * math.sin(a)) for a in np.linspace(0, math.pi, 40)] + [(910, 1530), (910, 1880)]
    # wall around the arch
    polygon(img, [(690, 1360), (910, 1360), (910, 1880), (690, 1880)], lin('#EFE4D2', '#C8BBD0', 1360, 1880))
    polygon(img, arch, doorway)
    ring = [(800 - 128 * math.cos(a), 1530 - 128 * math.sin(a)) for a in np.linspace(0, math.pi, 40)] + [(800 - 110 * math.cos(a), 1530 - 110 * math.sin(a)) for a in np.linspace(math.pi, 0, 40)]
    polygon(img, ring, lin('#FFF6E4', '#D9C9D6', 1400, 1530))
    inner = [(800 - 114 * math.cos(a), 1530 - 114 * math.sin(a)) for a in np.linspace(0, math.pi, 40)] + [(800 - 110 * math.cos(a), 1530 - 110 * math.sin(a)) for a in np.linspace(math.pi, 0, 40)]
    polygon(img, inner, hexc('#E2B45A'))
    polygon(img, [(788, 1398), (812, 1398), (808, 1424), (792, 1424)], lin('#F7DD8E', '#B8862E', 1398, 1424))
    # pillars, lit on the side facing the light
    for x0, lit_right in ((610, True), (910, False)):
        c0, c1 = ('#C2B4CC', '#FFF7E8') if lit_right else ('#FFF7E8', '#C2B4CC')
        polygon(img, [(x0, 1360), (x0 + 80, 1360), (x0 + 80, 1880), (x0, 1880)], lin(c0, c1, x0, x0 + 80, 'x'))
        polygon(img, [(x0 + 14, 1390), (x0 + 66, 1390), (x0 + 66, 1850), (x0 + 14, 1850)], lin('#E9DCC8', '#D6C6CC', 1390, 1850))
        for yv in range(1410, 1840, 34):
            ellipse(img, x0 + 40, yv, 9, 12, hexc('#D9B66A'))
            ellipse(img, x0 + 40, yv, 5, 7, hexc('#EFE4D2'))
        polygon(img, [(x0 - 10, 1342), (x0 + 90, 1342), (x0 + 90, 1364), (x0 - 10, 1364)], lin('#F7DD8E', '#B8862E', 1342, 1364))
        polygon(img, [(x0 - 10, 1858), (x0 + 90, 1858), (x0 + 90, 1884), (x0 - 10, 1884)], lin('#F2E8D8', '#B9AABE', 1858, 1884))
    # entablature and cornice
    polygon(img, [(590, 1306), (1010, 1306), (1010, 1344), (590, 1344)], lin('#FFF5E2', '#CDBDD0', 1306, 1344))
    polygon(img, [(578, 1296), (1022, 1296), (1022, 1310), (578, 1310)], lin('#F7DD8E', '#B8862E', 1296, 1310))
    # crowned pediment with a sunburst
    ped = [(800 - 160 * math.cos(a), 1298 - 66 * math.sin(a)) for a in np.linspace(0, math.pi, 50)]
    polygon(img, ped, lin('#FFF7E8', '#D6C6D2', 1230, 1298))
    for k in range(13):
        a = math.pi + k * math.pi / 12
        polygon(img, [(800 + math.cos(a - 0.05) * 16, 1292 + math.sin(a - 0.05) * 16), (800 + math.cos(a) * 52, 1292 + math.sin(a) * 52), (800 + math.cos(a + 0.05) * 16, 1292 + math.sin(a + 0.05) * 16)], hexc('#E2B45A'))
    ellipse(img, 800, 1286, 15, 15, lin('#FFF2C4', '#C99A3E', 1271, 1301))
    for k in range(1, 12):
        a = k * math.pi / 12
        px, py = 800 - 160 * math.cos(a), 1298 - 66 * math.sin(a)
        nx, ny = -math.cos(a) * 66 / 160, -math.sin(a)
        l = math.hypot(nx, ny); nx, ny = nx / l, ny / l
        polygon(img, [(px - ny * 7, py + nx * 7), (px + nx * 18, py + ny * 18), (px + ny * 7, py - nx * 7)], lin('#F7DD8E', '#B8862E', py - 18, py))
    # golden onion domes
    for x in (612, 988):
        polygon(img, [(x - 16, 1296), (x + 16, 1296), (x + 14, 1284), (x - 14, 1284)], hexc('#E9DCC8'))
        dome = [(x - 15, 1284), (x - 20, 1268), (x - 14, 1252), (x, 1232), (x + 14, 1252), (x + 20, 1268), (x + 15, 1284)]
        polygon(img, dome, lin('#FFF0B8', '#A8781E', 1232, 1284))
        polygon(img, [(x - 1.5, 1232), (x + 1.5, 1232), (x, 1212)], hexc('#C99A3E'))
        ellipse(img, x, 1210, 3.5, 3.5, hexc('#FFE9A0'))
    # the platform the visitors stand on
    P = PLATFORM
    polygon(img, [(P['x0'], P['y']), (P['x1'], P['y']), (P['x1'] + 6, P['y'] + 14), (P['x1'] - 20, P['y'] + 52), (P['x0'] + 20, P['y'] + 52), (P['x0'] - 6, P['y'] + 14)], lin('#F6EEDF', '#9C8EA8', P['y'], P['y'] + 52))
    polygon(img, [(P['x0'], P['y'] - 2), (P['x1'], P['y'] - 2), (P['x1'] + 6, P['y'] + 8), (P['x0'] - 6, P['y'] + 8)], lin('#FFF9EC', '#E8D9C4', P['y'] - 2, P['y'] + 8))
    # golden flowers either side of the doors
    rr = np.random.default_rng(61)
    for cx in (585, 1015, 640, 960):
        for _ in range(26):
            x = cx + rr.uniform(-34, 34); yv = P['y'] - rr.uniform(0, 34)
            ellipse(img, x, yv + 6, 7, 5, hexc('#6E7A44'))
        for _ in range(20):
            x = cx + rr.uniform(-30, 30); yv = P['y'] - rr.uniform(6, 40)
            ellipse(img, x, yv, 4.5, 4, hexc(rr.choice(['#F2B23A', '#FFD25A', '#E98A2A'])))


def flight_points(f):
    d, xl, yl = f['dir'], f['xl'], f['yl']
    pts = [(xl, yl)]
    x, yv = xl, yl
    for k in range(N):
        yv -= RISE; pts.append((x, yv))
        x += d * RUN; pts.append((x, yv))
    return pts


def paint_stairs(img):
    THICK = 46
    for i, f in enumerate(FLIGHTS):
        pts = flight_points(f)
        d = f['dir']
        bottom = [(f['xt'] + d * 6, f['yt'] + 16), (f['xt'] - d * 10, f['yt'] + THICK), (f['xl'] + d * 30, f['yl'] + THICK + 8), (f['xl'] - d * 4, f['yl'] + 10)]
        depth = (f['yl'] - 2100) / 1300
        c_hi = (np.array([255, 246, 228]) * (1 - depth) + np.array([196, 170, 190]) * depth)
        c_lo = (np.array([150, 136, 170]) * (1 - depth) + np.array([86, 66, 98]) * depth)
        def side(xx, yy, c_hi=c_hi, c_lo=c_lo, f=f):
            t = np.clip((yy - (f['yt'] + (f['yl'] - f['yt']) * np.clip((xx - f['xt']) / (f['xl'] - f['xt']), 0, 1)) + 10) / 70, 0, 1)[..., None]
            return c_hi + (c_lo - c_hi) * t
        polygon(img, pts + bottom, side)
        # a bright lip on every tread, a darker face on every riser
        for k in range(N):
            x = f['xl'] + d * k * RUN; yv = f['yl'] - (k + 1) * RISE
            x2 = x + d * RUN
            lo, hi = min(x, x2), max(x, x2)
            polygon(img, [(lo, yv), (hi, yv), (hi, yv + 4), (lo, yv + 4)], c_hi * 1.0 + 8)
            rx = x
            polygon(img, [(rx - d * 0.5, yv), (rx + d * 3.5, yv), (rx + d * 3.5, yv + RISE), (rx - d * 0.5, yv + RISE)], c_lo * 1.05)
    for i, Lg in enumerate(LANDINGS):
        depth = (Lg['y'] - 2100) / 1300
        c_hi = (np.array([255, 246, 228]) * (1 - depth) + np.array([196, 170, 190]) * depth)
        c_lo = (np.array([150, 136, 170]) * (1 - depth) + np.array([86, 66, 98]) * depth)
        cx = (Lg['x0'] + Lg['x1']) / 2
        polygon(img, [(Lg['x0'] - 6, Lg['y']), (Lg['x1'] + 6, Lg['y']), (Lg['x1'] + 2, Lg['y'] + 30), (cx + 14, Lg['y'] + 70), (cx - 14, Lg['y'] + 70), (Lg['x0'] - 2, Lg['y'] + 30)],
                lambda xx, yy, a=c_hi, b=c_lo, y0=Lg['y']: a + (b - a) * np.clip((yy - y0) / 70, 0, 1)[..., None])
        polygon(img, [(Lg['x0'] - 6, Lg['y']), (Lg['x1'] + 6, Lg['y']), (Lg['x1'] + 6, Lg['y'] + 4), (Lg['x0'] - 6, Lg['y'] + 4)], c_hi + 8)
    # ghostly flights continuing below, into the cloud sea
    f = FLIGHTS[-1]
    for j in range(1, 3):
        g = dict(dir=-f['dir'] if j % 2 else f['dir'], xl=0, yl=0)
        top_x = f['xl']; d = -f['dir'] if j % 2 else f['dir']
        g = dict(dir=d, xl=top_x - d * N * RUN, yl=f['yl'] + j * N * RISE, xt=top_x, yt=f['yl'] + (j - 1) * N * RISE)
        pts = flight_points(g)
        polygon(img, pts + [(g['xt'], g['yt'] + 40), (g['xl'], g['yl'] + 50)], np.array([90, 62, 84], np.float32))


def paint_hell(img, X):
    H0 = 3650; hh = H - H0
    hy = np.arange(hh)[:, None] + H0
    HY = hy + 0 * X
    HORIZON = 4340
    rng = np.random.default_rng(101)
    # smoke clouds lit orange from below, painted like the clouds above
    pf = []
    for x in np.arange(-100, 1750, 150): pf += cumulus(rng, x, rng.uniform(3880, 4120), rng.uniform(120, 200), n=26)
    clouds(img, pf, (0, 1), [(3500, '#B8502A'), (4300, '#FF9A4A')], [(3500, '#5E2018'), (4300, '#B8461E')], [(3500, '#2A0E0C'), (4300, '#4A160E')], 102, alpha=0.9)
    sub = img[H0:].copy()

    def city(seed, base, hmin, hmax, wmin, wmax, gap, col, glow_k, windows_p):
        rr = np.random.default_rng(seed)
        m = Image.new('L', (W * 2, hh * 2), 0); dd = ImageDraw.Draw(m)
        wl = Image.new('L', (W * 2, hh * 2), 0); wd = ImageDraw.Draw(wl)
        tops = []
        x = -40
        while x < W:
            wdt = rr.uniform(wmin, wmax); ht = rr.uniform(hmin, hmax); top = base - ht
            lean = rr.uniform(-16, 16) if rr.random() < 0.3 else 0
            if rr.random() < 0.65:
                pts = [(x, base), (x + lean, top + rr.uniform(0, 30))]
                n = rr.integers(3, 7)
                for i in range(1, n): pts.append((x + lean + wdt * i / n, top + rr.uniform(0, ht * 0.3)))
                pts += [(x + wdt + lean, top + rr.uniform(0, 50)), (x + wdt, base)]
            else:
                pts = [(x, base), (x + lean, top), (x + wdt + lean, top), (x + wdt, base)]
            dd.polygon([(px * 2, (py - H0) * 2) for px, py in pts], fill=255)
            for wy in np.arange(top + 24, base - 8, 16):
                for wx in np.arange(x + 7, x + wdt - 7, 12):
                    if rr.random() < windows_p: wd.rectangle([wx * 2, (wy - H0) * 2, (wx + 4) * 2, (wy - H0 + 7) * 2], fill=255)
            tops.append((x, wdt, top))
            x += wdt + rr.uniform(-wdt * 0.3, gap)
        a = np.asarray(m.resize((W, hh), Image.LANCZOS)).astype(np.float32) / 255
        wa = np.asarray(wl.resize((W, hh), Image.LANCZOS)).astype(np.float32) / 255 * a
        lift = smooth(base - hmax, base, HY)
        c = hexc(col) + hexc('#E0602A') * (lift ** 3 * glow_k)[..., None]
        c = c * (1 - wa[..., None]) + hexc('#FFB060') * wa[..., None]
        return c, a, tops

    for seed, base, hmin, hmax, wmin, wmax, gap, col, gk, wp in (
            (201, HORIZON + 6, 50, 190, 25, 70, 10, '#7A3020', 0.25, 0.02),
            (202, HORIZON + 22, 110, 300, 40, 100, 60, '#40181A', 0.45, 0.04),
            (203, HORIZON + 46, 180, 420, 60, 140, 240, '#1E0E12', 0.6, 0.06)):
        c, a, tops = city(seed, base, hmin, hmax, wmin, wmax, gap, col, gk, wp)
        sub = over(sub, c, a)
        rr = np.random.default_rng(seed + 9)
        for (x, wdt, top) in tops:
            if rr.random() < 0.4:
                fx = x + wdt * rr.uniform(0.25, 0.75); fy = top + rr.uniform(10, 40)
                fr = rr.uniform(10, 22) * (1.3 if seed == 203 else 0.8)
                for k, (cc, s) in enumerate((('#C2361A', 1.0), ('#FF7A30', 0.72), ('#FFD27A', 0.42))):
                    pts = [(fx - fr * s, fy), (fx - fr * 0.6 * s, fy - fr * 1.4 * s), (fx - fr * 0.15 * s, fy - fr * 0.9 * s), (fx, fy - fr * 2.6 * s),
                           (fx + fr * 0.3 * s, fy - fr * 1.1 * s), (fx + fr * 0.7 * s, fy - fr * 1.6 * s), (fx + fr * s, fy)]
                    box = (int(fx - fr * 1.2), int(fy - fr * 2.8 - H0), int(fx + fr * 1.2) + 1, int(fy - H0) + 2)
                    if box[0] < 0 or box[2] > W: continue
                    m = poly_layer(lambda d, T, ss: d.polygon(T([(px, py - H0) for px, py in pts]), fill=255), box)
                    sub[box[1]:box[3], box[0]:box[2]] = over(sub[box[1]:box[3], box[0]:box[2]], hexc(cc), m)
    # rubble ground with lava rivers
    gpts = [(-10, hh)] + [(gx, HORIZON + 40 - H0 + np.random.default_rng(gx + 100).uniform(0, 18)) for gx in range(-10, W + 20, 18)] + [(W + 10, hh)]
    gm = Image.new('L', (W, hh), 0); ImageDraw.Draw(gm).polygon(gpts, fill=255)
    ga = ndimage.gaussian_filter(np.asarray(gm).astype(np.float32) / 255, 1.0)
    depth = smooth(HORIZON + 40, H, HY)
    gcol = hexc('#2A1210') * (0.7 + 0.6 * fbm(hh, W, 60, 4, 301, stretch=0.5))[..., None] + hexc('#7A2A14') * ((1 - depth) ** 2 * 0.6)[..., None]
    rid = 1 - np.abs(norm(fbm(hh, W, 5, 6, 311, stretch=3.2)))
    lv = np.clip(smooth(0.9, 0.99, rid) * smooth(HORIZON + 50, HORIZON + 110, HY), 0, 1)
    gcol = gcol * (1 - lv[..., None]) + hexc('#FF8A3A') * lv[..., None]
    sub = over(sub, gcol, ga)
    bright = np.clip(sub - 150, 0, None)
    sub = sub + np.stack([ndimage.gaussian_filter(bright[..., i], 14) for i in range(3)], -1) * 1.1
    img[H0:] = sub


def paint_door():
    """The left golden door at 2x, with transparent gaps so the light shows through."""
    ss = 2
    x0, x1, y0, y1 = 690, 800, 1418, 1882
    w, h = (x1 - x0) * ss, (y1 - y0) * ss
    T = lambda pts: [((px - x0) * ss, (py - y0) * ss) for px, py in pts]
    outline = [(690, 1880), (690, 1530)] + [(800 - 110 * math.cos(a), 1530 - 110 * math.sin(a)) for a in np.linspace(0, math.pi / 2, 30)] + [(800, 1880)]
    m = Image.new('L', (w, h), 0); d = ImageDraw.Draw(m)
    lw = 7 * ss
    d.line(T(outline + [outline[0]]), fill=255, width=lw, joint='curve')
    for x in np.arange(708, 800, 16): d.line(T([(x, 1440), (x, 1880)]), fill=255, width=int(2.4 * ss))
    for yv in (1560, 1668, 1790): d.line(T([(690, yv), (800, yv)]), fill=255, width=int(4 * ss))
    for (cx, cy, r) in ((745, 1612, 32), (745, 1735, 22)):
        d.ellipse(T([(cx - r, cy - r), (cx + r, cy + r)])[0] + T([(cx + r, cy + r)])[0], outline=255, width=int(5 * ss))
        d.ellipse(T([(cx - r * 0.55, cy - r * 0.55)])[0] + T([(cx + r * 0.55, cy + r * 0.55)])[0], outline=255, width=int(3 * ss))
    for (cx, cy, s) in ((722, 1530, 1), (768, 1530, -1), (722, 1840, 1), (768, 1840, -1), (722, 1700, 1), (768, 1700, -1)):
        d.arc(T([(cx - 12, cy - 12)])[0] + T([(cx + 12, cy + 12)])[0], 0 if s > 0 else 180, 270 if s > 0 else 90, fill=255, width=int(3 * ss))
    for k in range(9):
        a = math.pi + k * (math.pi / 2) / 8
        d.line(T([(800, 1530), (800 + math.cos(a) * 100, 1530 + math.sin(a) * 100)]), fill=255, width=int(2 * ss))
    # clip to the door shape
    clip = Image.new('L', (w, h), 0); ImageDraw.Draw(clip).polygon(T(outline), fill=255)
    m = Image.fromarray(np.minimum(np.asarray(m), np.asarray(clip.filter(ImageFilter.MaxFilter(lw + 1)))))
    a = np.asarray(m).astype(np.float32) / 255
    yy = np.linspace(0, 1, h)[:, None]; xx = np.linspace(0, 1, w)[None, :]
    gold = hexc('#FFE9A0') * (1 - yy[..., None]) * 0.6 + hexc('#D8A43E') * 0.6 + hexc('#8A5E1E') * (yy[..., None] * 0.35)
    gold = gold * (0.88 + 0.24 * xx[..., None])
    hi = ndimage.gaussian_filter(a, 1.4)
    edge = np.clip(a - ndimage.shift(a, (2 * ss, 0), order=0), 0, 1)
    gold = gold + hexc('#FFF4C8') * (edge * 0.6)[..., None]
    rgba = np.dstack([np.clip(gold, 0, 255), np.clip(hi * 255, 0, 255)]).astype(np.uint8)
    Image.fromarray(rgba, 'RGBA').resize((x1 - x0, y1 - y0), Image.LANCZOS).save(os.path.join(A, 'door-left.png'))


def write_geometry():
    geo = dict(W=W, H=H, RUN=RUN, RISE=RISE, N=N, platform=PLATFORM, flights=FLIGHTS, landings=LANDINGS,
               gate=GATE, heavenGround=HEAVEN_GROUND, hellGround=HELL_GROUND)
    with open(os.path.join(ROOT, 'js', 'geometry.js'), 'w') as f:
        f.write('/* geometry.js — generated by tools/bake_scenery.py. Do not edit by hand: change the script and re-run it. */\n')
        f.write('window.HG = window.HG || {};\nwindow.HG.geo = ' + json.dumps(geo, indent=1) + ';\n')


if __name__ == '__main__':
    write_geometry()
    paint_door()
    paint_world()
    print('baked')
