"""Светлые пастельные обои для v2.

Из картинки/обои/2631857_640.jpg (кремово-оливковый дамаск) делаем бесшовный
тайл с мятно-бирюзовым орнаментом на молочном фоне:
  1. выравниваем неравномерный свет фотографии (деление на сильное размытие);
  2. режем ровно один раппорт по X и два по Y (период найден автокорреляцией);
  3. сшиваем края кросс-фейдом — иначе на светлой стене видны полосы;
  4. перекрашиваем в HSV: зелёный орнамент -> бирюза, фон -> почти белый.
"""
from pathlib import Path
from PIL import Image, ImageFilter
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT.parent / "картинки" / "обои" / "2631857_640.jpg"
OUT = ROOT / "assets" / "wall.png"

PX, PY = 269, 193   # период узора в пикселях (см. автокорреляцию)
FADE = 14           # ширина кросс-фейда шва

im = Image.open(SRC).convert("RGB")
a = np.asarray(im).astype(np.float64)

# ---------- 1. выравнивание света ----------
blur = np.asarray(im.filter(ImageFilter.GaussianBlur(55))).astype(np.float64)
a = np.clip(a / np.maximum(blur, 1) * blur.mean(axis=(0, 1)), 0, 255)
print(f"свет выровнен, средний RGB {a.mean(axis=(0,1)).round(1)}")

# ---------- 2. раппорт (+запас под кросс-фейд) ----------
x0, y0 = 30, 40
tile = a[y0:y0 + PY * 2 + FADE, x0:x0 + PX + FADE]
print(f"раппорт: {tile.shape[1]}x{tile.shape[0]} (с запасом {FADE})")

# ---------- 3. бесшовные края ----------
def stitch(t, fade):
    """Вклеить хвост шириной fade в начало с линейным переходом (по обеим осям)."""
    h, w = t.shape[:2]
    ramp = np.linspace(0, 1, fade)[None, :, None]
    t[:, :fade] = t[:, :fade] * ramp + t[:, w - fade:] * (1 - ramp)
    t = t[:, :w - fade]
    h, w = t.shape[:2]
    ramp = np.linspace(0, 1, fade)[:, None, None]
    t[:fade] = t[:fade] * ramp + t[h - fade:] * (1 - ramp)
    return t[:h - fade]

tile = stitch(tile, FADE)
print(f"после сшивки: {tile.shape[1]}x{tile.shape[0]}")

# ---------- 4. перекраска ----------
rgb = np.clip(tile, 0, 255) / 255.0
mx, mn = rgb.max(-1), rgb.min(-1)
v = mx
s = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
# hue через colorsys векторно не идёт — считаем вручную
d = np.maximum(mx - mn, 1e-6)
r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
h = np.where(mx == r, (g - b) / d % 6,
    np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) / 6.0
h = np.where(mn == mx, 0, h)

# Разделяем по яркости: фон обоев — самая светлая часть (V>0.88),
# орнамент — тёмная (V<0.76). Насыщенность для этого не годится: у исходника
# кремовый фон насыщеннее оливкового узора.
ink = np.clip((0.850 - v) / (0.850 - 0.700), 0, 1)   # 0 = фон, 1 = узор

H_MINT, H_CREAM = 0.455, 0.115      # бирюза / тёплый молочный
h = H_MINT * ink + H_CREAM * (1 - ink)
s = 0.30 * ink + 0.035 * (1 - ink)
# базовая яркость + микротекстура бумаги, чтобы не было «заливки»
v = np.clip((0.990 - 0.20 * ink) + (v - 0.80) * 0.18, 0, 1)

i = np.floor(h * 6.0)
f = h * 6.0 - i
p, q, t_ = v * (1 - s), v * (1 - s * f), v * (1 - s * (1 - f))
i = i.astype(int) % 6
choices = np.stack([np.stack([v, t_, p], -1), np.stack([q, v, p], -1),
                    np.stack([p, v, t_], -1), np.stack([p, q, v], -1),
                    np.stack([t_, p, v], -1), np.stack([v, p, q], -1)])
idx = np.broadcast_to(i[None, ..., None], (1,) + i.shape + (3,))
out = np.take_along_axis(choices, idx, axis=0)[0]

res = Image.fromarray(np.clip(out * 255, 0, 255).astype(np.uint8))
# Палитра на 256 цветов — у пастельного узора цветов заведомо меньше.
res.quantize(colors=256, method=Image.FASTOCTREE,
             dither=Image.FLOYDSTEINBERG).save(OUT, optimize=True)
m = np.asarray(res).reshape(-1, 3).mean(0)
print(f"сохранено: {OUT.name} {res.size}, средний RGB "
      f"#{int(m[0]):02x}{int(m[1]):02x}{int(m[2]):02x}")
