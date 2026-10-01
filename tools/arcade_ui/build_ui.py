"""
Giao diện chung của Phonics Arcade: cắt Bee resource pack trong `_source/platform/art/` thành ảnh dùng chung
cho mọi game ở `public/assets/shared/ui/` (icon, kim cương, linh vật ong, ảnh bìa COMING SOON, nền màn chọn game).

Chạy:  pnpm assets:ui   (= python tools/arcade_ui/build_ui.py)

Sheet 01–04: lưới 4×4 trên nền VÀNG gradient (RGB, không có alpha), icon có viền mực đậm:
  - nền = vùng vàng / trắng (khung bo của sheet) nối với mép sheet (flood fill) -> trong suốt;
  - lỗ kín nhỏ màu nền (quai khoá, vòng chìa khoá...) cũng là nền; thân vàng của khoá / sao có
    gradient + to hơn nhiều nên được giữ;
  - ăn 2px viền ngoài (pixel lẫn màu vàng) rồi làm mượt mép;
  - từng mảnh được gán vào ô chứa trọng tâm của nó -> icon lấn sang ô bên cạnh không bị cắt cụt.
Sheet 05: 9 cảnh linh vật ong (khung chữ nhật có nền vườn) -> cắt ô vuông giữa cảnh, khung bo do CSS vẽ.
Thứ tự ô theo `_source/platform/asset_manifest.json`. Chỉ xuất những ảnh app đang dùng (bảng EXPORTS / MASCOTS);
muốn dùng thêm ảnh nào thì thêm tên của nó vào bảng. Ảnh lớn (bìa, nền, linh vật) xuất WebP cho nhẹ.
Thư mục xuất được xoá sạch trước mỗi lần chạy.
"""

from __future__ import annotations

import json
import shutil
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from common.imaging import resize_rgba, save_png  # noqa: E402
from common.paths import SHARED_ASSETS, SOURCE  # noqa: E402

PACK = SOURCE / "platform"
OUT = SHARED_ASSETS / "ui"

ICON = 128  # hiển thị ~22–44px CSS, đủ nét cho màn hình 3x
MASCOT = 320
# Lề trong suốt quanh icon (tỉ lệ cạnh) để viền / bóng không chạm mép ảnh
ICON_PADDING = 0.04
EDGE_ERODE_PX = 2
# Lỗ kín màu nền: nhỏ hơn ngần này pixel (trên sheet 1024) và màu đều (độ lệch kênh G thấp)
HOLE_MAX_AREA = 2500
HOLE_MAX_STD = 30
# ... và được viền mực bao quanh (phần lớn pixel ngay sát bên ngoài là màu tối) — mảng vàng tô bóng trong
# thân icon (vd loa tắt tiếng) giáp màu kem / cam nên không bị coi là lỗ
HOLE_RING_DARK = 0.6
INK_LUMA = 110
MIN_FRAGMENT = 40

# tên trong asset_manifest -> (tên file xuất, cạnh dài nhất)
EXPORTS: dict[str, tuple[str, int]] = {
    # 01 — điều hướng
    "back": ("icons/back", ICON),
    "close": ("icons/close", ICON),
    "play": ("icons/play", ICON),
    "next": ("icons/next", ICON),
    "previous": ("icons/previous", ICON),
    "refresh_update_sparkle": ("icons/update", ICON),
    "settings": ("icons/settings", ICON),
    "check": ("icons/check", ICON),
    # 02 — âm thanh
    "speaker_on": ("icons/sound_on", ICON),
    "speaker_muted": ("icons/sound_off", ICON),
    "music_on": ("icons/music_on", ICON),
    "music_off": ("icons/music_off", ICON),
    "voice_on": ("icons/voice_on", ICON),
    "voice_off": ("icons/voice_off", ICON),
    "star_filled": ("icons/star_filled", ICON),
    # 03 — kim cương / mở khoá
    "gem_big": ("gems/gem", 128),
    "gem_small": ("gems/gem_small", 64),
    "gem_burst": ("gems/gem_burst", 160),
    "padlock_closed": ("gems/padlock", 160),
    "unlock_burst": ("gems/unlock_burst", 160),
    "crown": ("icons/crown", ICON),
    # 04 — huy hiệu / trang trí (tài khoản: xếp hạng, thông báo)
    "notification_dot": ("icons/notification_dot", 64),
    "trophy": ("icons/trophy", ICON),
    "medal": ("icons/medal", ICON),
}

# 05 — linh vật ong: tên trong asset_manifest -> tên file xuất
MASCOTS: dict[str, str] = {
    "encouraging_not_enough_gems": "mascot/encourage",
    "celebrate_unlock": "mascot/celebrate",
    "coming_soon_builder": "mascot/coming_soon",
    "rotate_device": "mascot/rotate",
    "loading_run": "mascot/loading",
    "error_unplugged": "mascot/error",
    "wave_hello": "mascot/hello",
    "empty_state_sleep": "mascot/sleep",
}

# Ảnh nguyên tấm: (file nguồn, tên xuất, kích thước tối đa (rộng, cao), vùng cắt (x0, y0, x1, y1) hoặc None)
# Bản dọc: tranh thật chỉ ở dải giữa, hai bên là bản phóng mờ + viền trắng -> cắt bỏ
FULL_IMAGES = [
    ("06_coming_soon_game_cover.png", "coming_soon_cover", (800, 457), None),
    ("08_hub_background_landscape.png", "hub_bg_landscape", (1792, 1024), None),
    ("09_hub_background_portrait.png", "hub_bg_portrait", (900, 1792), (206, 4, 808, 1786)),
]
WEBP_QUALITY = 84


def background_like(rgb: np.ndarray) -> np.ndarray:
    """Pixel có màu nền: vàng đậm của sheet hoặc trắng của khung bo ngoài."""
    r, g, b = (rgb[..., i].astype(int) for i in range(3))
    yellow = (r >= 225) & (g >= 150) & (g <= 248) & (b <= 150) & (r - b >= 110)
    white = (r >= 232) & (g >= 232) & (b >= 215)
    return yellow, white


def key_background(rgb: np.ndarray) -> np.ndarray:
    """RGB sheet -> RGBA, nền vàng thành trong suốt."""
    yellow, white = background_like(rgb)
    labels, count = ndimage.label(yellow | white)
    edge = np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))
    background = np.isin(labels, edge[edge > 0])

    # Lỗ kín: vùng vàng nhỏ, màu đều, không nối ra mép (vd khoảng trống trong quai khoá)
    hole_labels, hole_count = ndimage.label(yellow & ~background)
    if hole_count:
        index = np.arange(1, hole_count + 1)
        areas = ndimage.sum(np.ones_like(hole_labels), hole_labels, index)
        green = rgb[..., 1].astype(float)
        std = np.sqrt(np.maximum(
            ndimage.mean(green**2, hole_labels, index) - ndimage.mean(green, hole_labels, index) ** 2, 0
        ))
        dark = rgb.mean(axis=2) < INK_LUMA
        for idx in index[(areas <= HOLE_MAX_AREA) & (std <= HOLE_MAX_STD)]:
            hole = hole_labels == idx
            ring = ndimage.binary_dilation(hole, iterations=3) & ~hole
            if dark[ring].mean() >= HOLE_RING_DARK:
                background |= hole

    background = ndimage.binary_dilation(background, iterations=EDGE_ERODE_PX)
    alpha = Image.fromarray(np.where(background, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8))
    rgba = np.dstack([rgb[..., :3], np.array(alpha)]).astype(np.uint8)
    rgba[rgba[..., 3] == 0] = 0
    return rgba


def split_cells(rgba: np.ndarray, columns: int, rows: int) -> list[np.ndarray]:
    """Gán từng mảnh (vùng đặc liền nhau) vào ô chứa trọng tâm của nó."""
    height, width = rgba.shape[:2]
    solid = rgba[..., 3] > 0
    labels, count = ndimage.label(solid, structure=np.ones((3, 3)))
    index = np.arange(1, count + 1)
    areas = ndimage.sum(solid, labels, index)
    centers = ndimage.center_of_mass(solid, labels, index)

    owner = np.zeros(count + 1, dtype=int) - 1
    for idx, area, (cy, cx) in zip(index, areas, centers):
        if area >= MIN_FRAGMENT:
            owner[idx] = int(cy * rows / height) * columns + int(cx * columns / width)

    cells = []
    owner_map = owner[labels]
    for cell in range(columns * rows):
        part = rgba.copy()
        part[owner_map != cell] = 0
        cells.append(part)
    return cells


def export_icon(part: np.ndarray, name: str, max_side: int) -> None:
    ys, xs = np.nonzero(part[..., 3])
    crop = part[ys.min() : ys.max() + 1, xs.min() : xs.max() + 1]
    # Đệm thành ô vuông (có lề) để các icon cùng cỡ thẳng hàng nhau khi hiển thị
    side = round(max(crop.shape[:2]) * (1 + ICON_PADDING * 2))
    square = np.zeros((side, side, 4), np.uint8)
    oy, ox = (side - crop.shape[0]) // 2, (side - crop.shape[1]) // 2
    square[oy : oy + crop.shape[0], ox : ox + crop.shape[1]] = crop
    size = min(max_side, side)
    save_png(resize_rgba(Image.fromarray(square), (size, size)), OUT / f"{name}.png")


def scene_box(cell: np.ndarray) -> tuple[int, int, int, int]:
    """Khung cảnh chữ nhật trong ô của sheet 05: bỏ nền vàng xung quanh + viền trắng của khung."""
    yellow, white = background_like(cell)
    content = ~(yellow | white)
    cols = np.nonzero(content.mean(axis=0) > 0.5)[0]
    rows = np.nonzero(content.mean(axis=1) > 0.5)[0]
    inset = 6
    return cols.min() + inset, rows.min() + inset, cols.max() + 1 - inset, rows.max() + 1 - inset


def export_mascot(cell: np.ndarray, name: str) -> None:
    x0, y0, x1, y1 = scene_box(cell)
    # Ô vuông giữa cảnh (con ong nằm giữa khung)
    side = min(x1 - x0, y1 - y0)
    cx, cy = (x0 + x1) // 2, (y0 + y1) // 2
    sx, sy = cx - side // 2, cy - side // 2
    img = Image.fromarray(cell[sy : sy + side, sx : sx + side, :3]).resize((MASCOT, MASCOT), Image.LANCZOS)
    path = OUT / f"{name}.webp"
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, "WEBP", quality=WEBP_QUALITY, method=6)


def export_full(source: str, name: str, max_size: tuple[int, int], box: tuple[int, int, int, int] | None) -> None:
    img = Image.open(PACK / "art" / source).convert("RGB")
    if box:
        img = img.crop(box)
    img.thumbnail(max_size, Image.LANCZOS)
    path = OUT / f"{name}.webp"
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, "WEBP", quality=WEBP_QUALITY, method=6)
    print(f"  {source:34s} -> ui/{name}.webp {img.size}")


def main() -> None:
    shutil.rmtree(OUT, ignore_errors=True)
    manifest = json.loads((PACK / "asset_manifest.json").read_text(encoding="utf-8"))
    exported: set[str] = set()
    for sheet_info in manifest["image_assets"]:
        order = sheet_info.get("order")
        if not order:
            continue
        columns, rows = (int(n) for n in sheet_info["grid"].split("x"))
        rgb = np.array(Image.open(PACK / sheet_info["file"].replace("images/", "art/")).convert("RGB"))

        if any(item in MASCOTS for item in order):
            height, width = rgb.shape[:2]
            for i, item in enumerate(order):
                if item not in MASCOTS:
                    continue
                row, col = divmod(i, columns)
                cell = rgb[row * height // rows : (row + 1) * height // rows, col * width // columns : (col + 1) * width // columns]
                export_mascot(cell, MASCOTS[item])
                exported.add(item)
                print(f"  {item:34s} -> ui/{MASCOTS[item]}.webp")
            continue

        if not any(item in EXPORTS for item in order):
            continue
        for item, part in zip(order, split_cells(key_background(rgb), columns, rows)):
            if item in EXPORTS:
                name, max_side = EXPORTS[item]
                export_icon(part, name, max_side)
                exported.add(item)
                print(f"  {item:34s} -> ui/{name}.png")

    missing = (set(EXPORTS) | set(MASCOTS)) - exported
    if missing:
        raise SystemExit(f"Không tìm thấy trong asset_manifest.json: {sorted(missing)}")

    for source, name, max_size, box in FULL_IMAGES:
        export_full(source, name, max_size, box)


if __name__ == "__main__":
    main()
