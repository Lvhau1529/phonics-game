"""
Icon PWA / favicon của Phonics Arcade (ghi vào `public/icons/`).

Chạy:  pnpm assets:icons   (= python tools/build_app_icons.py)

Nguồn: Daisy Pixel Icon Pack trong `_source/platform/app-icon/` (linh vật hoa cúc pixel-art).
  - master-1024.png là ô vuông bo góc trên nền TRẮNG ĐỤC -> cắt bỏ phần trắng nối với mép ảnh
    (flood fill), ăn thêm 2px viền trắng lẫn màu rồi làm mượt mép.
  - icon-192 / icon-512 (purpose "any"): góc trong suốt.
  - icon-maskable-512: art thu vào vùng an toàn (hình tròn 80%) trên nền tím cùng màu khung.
  - apple-touch-icon: tràn viền, góc lấp bằng màu khung (iOS tự bo góc, không hỗ trợ trong suốt).
  - favicon: dùng nguyên các bản crop tối ưu cho 16–64px của pack (favicon.ico + PNG).
"""

from __future__ import annotations

import shutil
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common.paths import GAME_APP, SOURCE  # noqa: E402

PACK_DIR = SOURCE / "platform" / "app-icon"
ICONS_DIR = GAME_APP / "public" / "icons"

# Pixel "trắng nền": kênh nhỏ nhất > ngưỡng (mây hồng / cánh hoa nằm trong khung tím nên không bị nối)
WHITE_MIN = 200
HALO_PX = 2
MASKABLE_SCALE = 0.82

# (tên file, kích thước)
ANY_ICONS = [("icon-512.png", 512), ("icon-192.png", 192)]
FAVICONS = ["favicon.ico", "favicon-16x16.png", "favicon-32x32.png", "favicon-64x64.png"]
# Icon cũ (chữ "Ab") không còn dùng
OBSOLETE = ["favicon.png"]


def cut_white_corners(master: Image.Image) -> Image.Image:
    rgba = np.array(master.convert("RGBA"))
    whiteish = rgba[..., :3].min(axis=2) > WHITE_MIN
    labels, _ = ndimage.label(whiteish)
    edge_labels = np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))
    background = np.isin(labels, edge_labels[edge_labels > 0])
    background = ndimage.binary_dilation(background, iterations=HALO_PX)

    alpha = Image.fromarray(np.where(background, 0, 255).astype(np.uint8))
    alpha = alpha.filter(ImageFilter.GaussianBlur(1))
    out = Image.fromarray(rgba)
    out.putalpha(alpha)
    return out


def frame_color(art: Image.Image) -> tuple[int, int, int, int]:
    """Màu tím trung bình của dải khung ngay trong mép art (để lấp nền / góc)."""
    rgba = np.array(art)
    opaque = rgba[..., 3] == 255
    ring = opaque & ~ndimage.binary_erosion(opaque, iterations=24)
    r, g, b = (int(v) for v in rgba[ring][:, :3].mean(axis=0))
    return (r, g, b, 255)


def on_background(art: Image.Image, color: tuple[int, int, int, int], scale: float) -> Image.Image:
    size = art.width
    canvas = Image.new("RGBA", (size, size), color)
    inner = round(size * scale)
    offset = (size - inner) // 2
    small = art.resize((inner, inner), Image.LANCZOS)
    canvas.alpha_composite(small, (offset, offset))
    return canvas


def save(img: Image.Image, filename: str, size: int) -> None:
    img.resize((size, size), Image.LANCZOS).save(ICONS_DIR / filename, optimize=True)
    print(f"  {filename} ({size}px)")


def main() -> None:
    ICONS_DIR.mkdir(parents=True, exist_ok=True)
    art = cut_white_corners(Image.open(PACK_DIR / "master-1024.png"))
    color = frame_color(art)

    for filename, size in ANY_ICONS:
        save(art, filename, size)
    save(on_background(art, color, MASKABLE_SCALE), "icon-maskable-512.png", 512)
    save(on_background(art, color, 1.0).convert("RGB"), "apple-touch-icon.png", 180)

    for filename in FAVICONS:
        shutil.copyfile(PACK_DIR / filename, ICONS_DIR / filename)
        print(f"  {filename} (copy)")
    for filename in OBSOLETE:
        (ICONS_DIR / filename).unlink(missing_ok=True)


if __name__ == "__main__":
    main()
