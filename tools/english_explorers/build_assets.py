"""
Little English Explorers: tranh minh hoạ con vật / nơi sống + ảnh bìa thẻ game.

Chạy:  pnpm assets:english-explorers   (= python tools/english_explorers/build_assets.py)

Nguồn `_source/english-explorers/art/*.webp` (tách từ bản HTML gốc `little-english-explorers.original.html`,
đã cắt sẵn từ concept sheet): lion, rabbit, elephant, fish, elephant_scene, rabbit_scene, forest, ocean, desert.
Xuất `public/assets/english-explorers/`:
  - pictures/<tên>.webp: giữ nguyên kích thước; vài ảnh bị lẹm mảnh của concept sheet ở mép -> cắt bớt (CROP)
  - cover.png 480×270: trời -> cỏ, ba khung con vật như màn chào của bản gốc
"""

from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from common.paths import PUBLIC_ASSETS, SOURCE  # noqa: E402

SRC = SOURCE / "english-explorers" / "art"
OUT = PUBLIC_ASSETS / "english-explorers"
PICTURES = ["lion", "rabbit", "elephant", "fish", "elephant_scene", "rabbit_scene", "forest", "ocean", "desert"]
# Cắt mép (trái, trên, phải, dưới) theo px ảnh gốc
CROP = {"rabbit_scene": (14, 14, 0, 12), "lion": (0, 0, 0, 24), "rabbit": (12, 0, 0, 0)}

COVER_SIZE = (480, 270)
SCALE = 4


def vertical_gradient(size: tuple[int, int], stops: list[tuple[float, tuple[int, int, int]]]) -> Image.Image:
    width, height = size
    img = Image.new("RGBA", size)
    draw = ImageDraw.Draw(img)
    for y in range(height):
        t = y / max(1, height - 1)
        for (t0, c0), (t1, c1) in zip(stops, stops[1:]):
            if t0 <= t <= t1:
                k = (t - t0) / max(1e-6, t1 - t0)
                color = tuple(round(a + (b - a) * k) for a, b in zip(c0, c1))
                draw.line([(0, y), (width, y)], fill=(*color, 255))
                break
    return img


def framed(img: Image.Image, size: tuple[int, int]) -> Image.Image:
    """Ảnh cắt vừa khung (cover), bo góc, viền trắng dày + bóng khối — như thẻ con vật ở màn chào gốc."""
    width, height = size
    border = 6 * SCALE
    inner = (width - border * 2, height - border * 2)
    ratio = max(inner[0] / img.width, inner[1] / img.height)
    scaled = img.resize((round(img.width * ratio), round(img.height * ratio)), Image.LANCZOS)
    left = (scaled.width - inner[0]) // 2
    top = (scaled.height - inner[1]) // 2
    scaled = scaled.crop((left, top, left + inner[0], top + inner[1]))

    out = Image.new("RGBA", (width, height + 10 * SCALE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(out)
    radius = 26 * SCALE
    draw.rounded_rectangle([0, 10 * SCALE, width - 1, height - 1 + 10 * SCALE], radius, fill=(32, 51, 111, 70))
    draw.rounded_rectangle([0, 0, width - 1, height - 1], radius, fill=(255, 255, 255, 255))
    mask = Image.new("L", inner, 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, inner[0] - 1, inner[1] - 1], radius - border, fill=255)
    out.paste(scaled.convert("RGBA"), (border, border), mask)
    return out


def build_cover(pictures: dict[str, Image.Image]) -> Image.Image:
    width, height = COVER_SIZE
    big = vertical_gradient(
        (width * SCALE, height * SCALE),
        [(0.0, (116, 213, 255)), (0.5, (187, 235, 255)), (0.82, (129, 216, 117)), (1.0, (76, 176, 52))],
    )
    draw = ImageDraw.Draw(big)
    for cx, cy, r in [(60, 30, 26), (92, 24, 30), (124, 32, 22), (372, 40, 24), (402, 32, 30), (432, 42, 20)]:
        draw.ellipse([(cx - r) * SCALE, (cy - r * 0.6) * SCALE, (cx + r) * SCALE, (cy + r * 0.6) * SCALE], fill=(255, 255, 255, 220))

    frame = (138 * SCALE, 120 * SCALE)
    gap = 12 * SCALE
    names = ["lion", "rabbit", "elephant"]
    x = (big.width - (frame[0] * 3 + gap * 2)) // 2
    for index, name in enumerate(names):
        y = (78 if index == 1 else 92) * SCALE  # thẻ giữa nhô cao
        big.alpha_composite(framed(pictures[name], frame), (x, y))
        x += frame[0] + gap
    return big.resize(COVER_SIZE, Image.LANCZOS).convert("RGB")


def main() -> None:
    (OUT / "pictures").mkdir(parents=True, exist_ok=True)
    pictures: dict[str, Image.Image] = {}
    for name in PICTURES:
        img = Image.open(SRC / f"{name}.webp").convert("RGB")
        if name in CROP:
            left, top, right, bottom = CROP[name]
            img = img.crop((left, top, img.width - right, img.height - bottom))
        pictures[name] = img
        img.save(OUT / "pictures" / f"{name}.webp", "WEBP", quality=90, method=6)
    build_cover(pictures).save(OUT / "cover.png", optimize=True)
    print(f"[english-explorers] {len(pictures)} pictures + cover -> {OUT}")


if __name__ == "__main__":
    main()
