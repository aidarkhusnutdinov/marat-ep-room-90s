"""Post-process rembg cutouts:
- TV: crop to just the television (rembg grabbed the suitcase below too),
      detect the blue-screen quad, print its corners.
- Chasy: paint over the 'leteo.kiev.ua' watermark.
"""
from PIL import Image, ImageFilter
import numpy as np

ASSETS = "assets"

# ---------- TV ----------
im = Image.open(f"{ASSETS}/tv.png").convert("RGBA")
a = np.asarray(im).astype(int)
r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
opaque = al > 40

# TV body = strong yellow (high R & G, low-ish B) ; screen = strong blue
yellow = opaque & (r > 150) & (g > 120) & (b < 140) & ((r + g) - 2 * b > 60)
blue = opaque & (b > 120) & (b - r > 30) & (b - g > 10)
tv_mask = yellow | blue

ys, xs = np.where(tv_mask)
pad = 12
x0, x1 = max(xs.min() - pad, 0), min(xs.max() + pad, im.width)
y0, y1 = max(ys.min() - pad, 0), min(ys.max() + pad, im.height)
print(f"TV bbox: x[{x0}:{x1}] y[{y0}:{y1}]  size={x1-x0}x{y1-y0}")

# Cut everything below the TV (the suitcase) by zeroing alpha under y1,
# then crop to bbox.
arr = np.array(im)
arr[y1:, :, 3] = 0
tv = Image.fromarray(arr).crop((x0, y0, x1, y1))
tv.save(f"{ASSETS}/tv.png")
print(f"TV saved: {tv.size}")

# blue screen corners in the CROPPED coordinate space (fractions)
bys, bxs = np.where(blue)
keep = (bxs >= x0) & (bxs < x1) & (bys >= y0) & (bys < y1)
bxs, bys = bxs[keep] - x0, bys[keep] - y0
W, H = tv.size
def corner(cond_x, cond_y):
    # pick extreme point
    pass
# approximate quad via extreme sums/diffs
s = bxs + bys
d = bxs - bys
tl = (bxs[np.argmin(s)], bys[np.argmin(s)])
br = (bxs[np.argmax(s)], bys[np.argmax(s)])
tr = (bxs[np.argmax(d)], bys[np.argmax(d)])
bl = (bxs[np.argmin(d)], bys[np.argmin(d)])
print("SCREEN corners (px in cropped tv):")
for name, (cx, cy) in [("tl", tl), ("tr", tr), ("br", br), ("bl", bl)]:
    print(f"  {name}: {cx},{cy}  = {cx/W:.4f},{cy/H:.4f}")
print(f"SCREEN bbox frac: x[{bxs.min()/W:.4f}:{bxs.max()/W:.4f}] "
      f"y[{bys.min()/H:.4f}:{bys.max()/H:.4f}]")

# ---------- CHASY watermark ----------
ch = Image.open(f"{ASSETS}/chasy.png").convert("RGBA")
cw, chh = ch.size
# watermark sits mid-right on the wood, roughly x 0.55-0.98, y 0.42-0.52
box = (int(cw*0.52), int(chh*0.40), int(cw*0.99), int(chh*0.53))
region = ch.crop(box)
# blur heavily to smear the text into the wood tone
region = region.filter(ImageFilter.GaussianBlur(6))
ch.paste(region, box)
ch.save(f"{ASSETS}/chasy.png")
print(f"Chasy watermark smudged in box {box}")
