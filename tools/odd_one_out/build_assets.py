"""
Odd One Out: ảnh minh hoạ màn Home + ảnh bìa thẻ game.

Chạy:  pnpm assets:odd-one-out   (= python tools/odd_one_out/build_assets.py)

Nguồn `_source/odd-one-out/art/` (tách từ bản HTML gốc `odd-one-out.original.html`):
  - explorer_boy_dog.png, explorer_girl_map.png: hai bé thám hiểm, nền trong suốt viền mờ
Xuất `public/assets/odd-one-out/`:
  - art/<tên>.webp: giữ nguyên kích thước (ảnh gốc nhỏ — phóng to sẽ nhoè)
  - cover.png 480×270: trời -> cỏ, hai bé hai bên, ở giữa lưới 2×2 thẻ (3 hình học + 1 quả táo "khác loại")
Câu đố dùng emoji / hình vẽ CSS nên không cần ảnh riêng.
"""

from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from common.paths import PUBLIC_ASSETS, SOURCE  # noqa: E402

SRC = SOURCE / "odd-one-out" / "art"
OUT = PUBLIC_ASSETS / "odd-one-out"
ART = ["explorer_boy_dog", "explorer_girl_map"]

COVER_SIZE = (480, 270)
SCALE = 4  # vẽ to rồi thu nhỏ cho mượt viền
INK = (46, 22, 8, 255)


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


def card(size: int, highlight: bool) -> tuple[Image.Image, ImageDraw.ImageDraw]:
    img = Image.new("RGBA", (size, size + 10), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    radius = size // 5
    draw.rounded_rectangle([0, 10, size - 1, size + 9], radius, fill=(0, 0, 0, 70))  # bóng khối
    border = (255, 200, 61, 255) if highlight else (255, 255, 255, 255)
    draw.rounded_rectangle([0, 0, size - 1, size - 1], radius, fill=(255, 253, 243, 255), outline=border, width=size // 14)
    return img, draw


def shape_cards(scale: int) -> list[Image.Image]:
    size = 62 * scale
    pad = size // 4
    box = [pad, pad, size - pad, size - pad]
    cards = []

    img, draw = card(size, False)
    draw.ellipse(box, fill=(63, 140, 255, 255), outline=INK, width=3 * scale)
    cards.append(img)

    img, draw = card(size, False)
    draw.rounded_rectangle(box, size // 30, fill=(255, 77, 94, 255), outline=INK, width=3 * scale)
    cards.append(img)

    img, draw = card(size, True)
    # Quả táo: thân đỏ + lá xanh — món "khác loại"
    left, top, right, bottom = box
    draw.ellipse([left, top + pad // 4, right, bottom], fill=(240, 60, 70, 255), outline=INK, width=3 * scale)
    draw.line([(size // 2, top + pad // 3), (size // 2 + pad // 6, top - pad // 5)], fill=INK, width=4 * scale)
    draw.ellipse([size // 2 + pad // 8, top - pad // 3, size // 2 + pad, top + pad // 6], fill=(92, 207, 74, 255), outline=INK, width=2 * scale)
    cards.append(img)

    img, draw = card(size, False)
    left, top, right, bottom = box
    draw.polygon([(size // 2, top), (right, bottom), (left, bottom)], fill=(255, 210, 63, 255), outline=INK, width=3 * scale)
    cards.append(img)
    return cards


def build_cover(art: dict[str, Image.Image]) -> Image.Image:
    width, height = COVER_SIZE
    big = vertical_gradient(
        (width * SCALE, height * SCALE),
        [(0.0, (141, 218, 255)), (0.55, (212, 246, 255)), (0.78, (195, 233, 154)), (1.0, (87, 184, 92))],
    )
    draw = ImageDraw.Draw(big)
    # Mây
    for cx, cy, r in [(70, 40, 26), (100, 34, 30), (130, 42, 22), (380, 52, 24), (408, 44, 30), (436, 54, 20)]:
        draw.ellipse([(cx - r) * SCALE, (cy - r * 0.6) * SCALE, (cx + r) * SCALE, (cy + r * 0.6) * SCALE], fill=(255, 255, 255, 220))

    cards = shape_cards(SCALE)
    gap = 10 * SCALE
    cell = cards[0].width + gap
    left = (big.width - cell * 2 + gap) // 2
    top = 64 * SCALE
    for index, c in enumerate(cards):
        lift = -6 * SCALE if index == 2 else 0
        big.alpha_composite(c, (left + (index % 2) * cell, top + (index // 2) * (c.height + gap) + lift))

    cover = big.resize(COVER_SIZE, Image.LANCZOS)
    # Hai bé đứng ở hai góc dưới, cao ~ 3/4 ảnh bìa
    for name, anchor in [("explorer_boy_dog", "left"), ("explorer_girl_map", "right")]:
        kid = art[name]
        h = int(height * 0.7)
        w = round(kid.width * h / kid.height)
        kid = kid.resize((w, h), Image.LANCZOS)
        cover.alpha_composite(kid, (-14 if anchor == "left" else width - w + 14, height - h))
    return cover.convert("RGB")


def main() -> None:
    (OUT / "art").mkdir(parents=True, exist_ok=True)
    art = {name: Image.open(SRC / f"{name}.png").convert("RGBA") for name in ART}
    for name, img in art.items():
        img.save(OUT / "art" / f"{name}.webp", "WEBP", quality=90, method=6)
    build_cover(art).save(OUT / "cover.png", optimize=True)
    print(f"[odd-one-out] {len(art)} art + cover -> {OUT}")


if __name__ == "__main__":
    main()
