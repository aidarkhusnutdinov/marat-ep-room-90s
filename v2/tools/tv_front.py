"""Вырезать телевизор «Сапфир 401-1» в фас из картинки/новый ТВ/best.HEIC.

Логика повторяет секцию TV из process.py: жёлтая маска корпуса + синяя маска
экрана -> bbox -> обрезка; углы синего квада печатаются для clip-path.
Добавлено: чистка альфы после rembg (оставляем крупнейшую связную компоненту).
"""
import subprocess, sys
from pathlib import Path
from PIL import Image
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
SRC_HEIC = ROOT.parent / "картинки" / "новый ТВ" / "best.HEIC"
SRC_PNG = ROOT / "tools" / "src" / "tv_front_src.png"
CUT_PNG = ROOT / "tools" / "src" / "tv_front_cut.png"
OUT = ROOT / "assets" / "tv.png"

WORK_W = 1500  # рабочая ширина перед rembg

# ---------- 1. HEIC -> PNG (PIL не читает HEIC, только sips) ----------
if not SRC_PNG.exists():
    subprocess.run(["sips", "-s", "format", "png", str(SRC_HEIC),
                    "--out", str(SRC_PNG)], check=True,
                   stdout=subprocess.DEVNULL)
    im = Image.open(SRC_PNG)
    im = im.resize((WORK_W, round(im.height * WORK_W / im.width)), Image.LANCZOS)
    im.save(SRC_PNG)
    print(f"sips -> {SRC_PNG.name} {im.size}")

# ---------- 2. rembg ----------
if not CUT_PNG.exists():
    from rembg import remove
    print("rembg...", flush=True)
    cut = remove(Image.open(SRC_PNG).convert("RGB"))
    cut.save(CUT_PNG)
    print(f"rembg -> {CUT_PNG.name} {cut.size}")

im = Image.open(CUT_PNG).convert("RGBA")
a = np.asarray(im).astype(int)
r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
opaque = al > 40

# ---------- 3. маски корпуса и экрана ----------
yellow = opaque & (r > 150) & (g > 120) & (b < 140) & ((r + g) - 2 * b > 60)
blue = opaque & (b > 120) & (b - r > 30) & (b - g > 10)
print(f"yellow px: {yellow.sum()}  blue px: {blue.sum()}")

# ---------- 4. чистка: крупнейшая связная компонента альфы ----------
from scipy import ndimage
lab, n = ndimage.label(opaque)
if n > 1:
    sizes = ndimage.sum(opaque, lab, range(1, n + 1))
    keep = int(np.argmax(sizes)) + 1
    print(f"компонент альфы: {n}, крупнейшая {int(sizes.max())} px — остальные срезаны")
    arr = np.array(im)
    arr[lab != keep, 3] = 0
    im = Image.fromarray(arr)
    a = np.asarray(im).astype(int)
    al = a[..., 3]
    opaque = al > 40
    yellow &= opaque
    blue &= opaque
else:
    print("компонент альфы: 1 — чистка не нужна")

# ---------- 5. bbox по корпусу+экрану ----------
mask = yellow | blue
ys, xs = np.where(mask)
pad = 10
x0, x1 = max(xs.min() - pad, 0), min(xs.max() + pad, im.width)
y0, y1 = max(ys.min() - pad, 0), min(ys.max() + pad, im.height)
print(f"TV bbox: x[{x0}:{x1}] y[{y0}:{y1}] size={x1-x0}x{y1-y0}")

# ножки ниже жёлтой маски — тянем нижнюю границу до конца альфы внутри bbox
col = opaque[:, x0:x1]
rows = np.where(col.any(axis=1))[0]
y1 = min(max(y1, rows.max() + pad), im.height)
print(f"после учёта ножек: y1={y1}")

tv = im.crop((x0, y0, x1, y1))
# На сцене телевизор занимает 27% ширины; 1100 px хватает и для retina,
# а полный кадр весил 2.5 МБ.
TARGET_W = 1100
if tv.width > TARGET_W:
    tv = tv.resize((TARGET_W, round(tv.height * TARGET_W / tv.width)), Image.LANCZOS)
# Палитра на 256 цветов: 1.4 МБ -> ~210 КБ, разницы на глаз нет.
tv.quantize(colors=256, method=Image.FASTOCTREE,
            dither=Image.FLOYDSTEINBERG).save(OUT, optimize=True)
print(f"TV saved: {OUT} {tv.size}")

# ---------- 6. углы синего квада в долях (для clip-path) ----------
bys, bxs = np.where(blue)
keep_m = (bxs >= x0) & (bxs < x1) & (bys >= y0) & (bys < y1)
bxs, bys = bxs[keep_m] - x0, bys[keep_m] - y0
k = tv.width / (x1 - x0)          # учитываем ресайз выше
bxs, bys = bxs * k, bys * k
W, H = tv.size
s, d = bxs + bys, bxs - bys
corners = {"tl": (bxs[np.argmin(s)], bys[np.argmin(s)]),
           "tr": (bxs[np.argmax(d)], bys[np.argmax(d)]),
           "br": (bxs[np.argmax(s)], bys[np.argmax(s)]),
           "bl": (bxs[np.argmin(d)], bys[np.argmin(d)])}
print("SCREEN corners:")
for name, (cx, cy) in corners.items():
    print(f"  {name}: {cx},{cy} = {cx/W*100:.1f}% {cy/H*100:.1f}%")
print("clip-path: polygon(" + ", ".join(
    f"{cx/W*100:.1f}% {cy/H*100:.1f}%" for cx, cy in
    [corners["tl"], corners["tr"], corners["br"], corners["bl"]]) + ");")
print(f"screen bbox frac: x[{bxs.min()/W:.4f}:{bxs.max()/W:.4f}] "
      f"y[{bys.min()/H:.4f}:{bys.max()/H:.4f}]")
