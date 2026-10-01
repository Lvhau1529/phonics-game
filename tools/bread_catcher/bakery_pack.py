"""
Kids Bakery Phonics pack (`_source/bread-catcher/bakery-pack/`): sheet nền magenta (#FF00FF) không alpha,
vài sheet còn dải trắng ở mép + nhãn số in sẵn ở góc trên trái; background có nhãn số ở góc.

  01_bakery_treats.png        12 bánh có lòng kem trống -> bánh chữ (chữ vẽ live ở giữa lòng kem)
  02..07_*.png                tranh từ vựng (Picture Vocabulary + Blending) -> atlas words.webp
  08_sprite_sheet.png         huy chương / cúp / mũ đầu bếp -> icon phần thưởng ở hộp quà
  09_sprite_sheet.png         8 linh vật đầu bếp (chưa dùng)
  10 / 12 (ngang), 11 / 13 (dọc) -> bg_bakery_04 (tiệm bánh ngọt), bg_bakery_05 (bếp đêm bột tung toé)

Tách nền: flood fill từ mép sheet qua vùng magenta / trắng (không ăn vào màu tím / trắng bên trong vật),
viền chuyển tiếp được "gỡ" màu magenta. Vật được gom theo mảng liền (giãn nở để gom chi tiết rời
như dây bóng bay, hơi nóng...) rồi xếp theo hàng / cột như trên sheet.
"""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

from common.imaging import add_outline, resize_rgba, save_png
from common.paths import PUBLIC_ASSETS, SOURCE

SRC = SOURCE / "bread-catcher" / "bakery-pack"
OUT = PUBLIC_ASSETS / "bread-catcher"

# Ảnh xuất ở 2x độ phân giải hiển thị (game render gấp đôi, pixelArt = nearest):
# game vẽ ở scale 0.5 -> 1 texel = 1 pixel màn hình, không bị răng cưa.
HI_RES = 2

MAGENTA = np.array([255, 0, 255], dtype=float)
# Nhãn số in sẵn ở góc trên trái các sheet (bỏ mọi mảng nằm gọn trong vùng này)
BADGE_ZONE = (200, 135)
# Mảng nhỏ hơn MIN_AREA không tự tạo thành một vật (chỉ là chi tiết rời / lấp lánh)
MIN_AREA = 1500

STICKER_COLOR = (255, 250, 238)


# --------------------------------------------------------------------------- #
# Tách nền
# --------------------------------------------------------------------------- #
def _magenta_score(rgb: np.ndarray) -> np.ndarray:
    """0 = không giống magenta, 1 = magenta thuần."""
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    return np.clip((np.minimum(r, b) - g - 40) / 190, 0, 1)


def key_sheet(path: Path) -> np.ndarray:
    rgb = np.array(Image.open(path).convert("RGB")).astype(float)
    score = _magenta_score(rgb)
    # Họ màu nền: magenta, trắng và dải pha giữa hai màu (đường giáp mép dải trắng)
    candidate = (score > 0.55) | ((rgb[..., 0] > 200) & (rgb[..., 2] > 200))

    # Nền = mọi vùng magenta / trắng nối với mép sheet
    labels, _ = ndimage.label(candidate)
    edge = np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))
    bg = np.isin(labels, edge[edge > 0])
    # Đốm magenta kẹt giữa các chi tiết (giữa chân nhện, trong quai cốc...) cũng là nền
    bg |= score > 0.8

    alpha = np.where(bg, 0.0, 1.0)
    # Viền 2px sát nền: alpha theo mức "magenta", gỡ màu magenta lẫn vào
    band = ndimage.binary_dilation(bg, iterations=2) & ~bg
    a = np.clip(1 - score, 0.05, 1)
    alpha[band] = a[band]
    fg = rgb.copy()
    unmixed = (rgb - (1 - a)[..., None] * MAGENTA) / a[..., None]
    fg[band] = np.clip(unmixed[band], 0, 255)

    out = np.zeros(rgb.shape[:2] + (4,), dtype=np.uint8)
    out[..., :3] = fg.round().astype(np.uint8)
    out[..., 3] = (alpha * 255).round().astype(np.uint8)
    out[out[..., 3] < 40] = 0
    return out


def _centers(values: np.ndarray, weights: np.ndarray, k: int) -> np.ndarray:
    """K-means 1 chiều (có trọng số) — tâm hàng / cột của lưới trên sheet."""
    centers = np.quantile(values, (np.arange(k) + 0.5) / k)
    for _ in range(50):
        nearest = np.abs(values[:, None] - centers[None, :]).argmin(axis=1)
        updated = np.array([
            np.average(values[nearest == i], weights=weights[nearest == i]) if (nearest == i).any() else centers[i]
            for i in range(k)
        ])
        if np.allclose(updated, centers):
            break
        centers = updated
    return np.sort(centers)


def find_items(rgba: np.ndarray, rows: int, cols: int) -> list[np.ndarray]:
    """Cắt từng vật theo thứ tự đọc (trái -> phải, trên -> dưới).

    Mảng lớn xác định tâm hàng / cột của lưới; mọi mảng (kể cả chi tiết rời: dây bóng bay, hơi nóng...)
    được gán vào ô gần trọng tâm nhất. Mảng nằm gọn trong góc nhãn số bị bỏ.
    """
    bx, by = BADGE_ZONE
    rgba = rgba.copy()
    # Nhãn số (khối nâu đậm) có thể dính vào vật bên cạnh -> xoá phần tối trong góc nhãn
    corner = rgba[:by, :bx]
    corner[corner[..., :3].max(axis=2) < 100] = 0

    solid = rgba[..., 3] > 0
    labels, count = ndimage.label(solid, structure=np.ones((3, 3)))
    index = np.arange(1, count + 1)
    areas = ndimage.sum(solid, labels, index)
    cy, cx = np.array(ndimage.center_of_mass(solid, labels, index)).T
    boxes = ndimage.find_objects(labels)

    def usable(sl: tuple[slice, slice], area: float) -> bool:
        h, w = sl[0].stop - sl[0].start, sl[1].stop - sl[1].start
        in_badge = sl[1].stop <= bx and sl[0].stop <= by
        # Đường mảnh dài: mép dải trắng / khung sheet còn sót lại
        stray_line = max(w, h) > 60 and (min(w, h) <= 14 or (max(w, h) > 150 and area < 0.12 * w * h))
        return area >= 30 and not in_badge and not stray_line

    keep = np.array([usable(sl, area) for sl, area in zip(boxes, areas)])
    big = keep & (areas >= MIN_AREA)
    row_centers = _centers(cy[big], areas[big], rows)
    col_centers = _centers(cx[big], areas[big], cols)

    cell = np.full(count, -1)
    for i in np.nonzero(keep)[0]:
        r = np.abs(row_centers - cy[i]).argmin()
        c = np.abs(col_centers - cx[i]).argmin()
        cell[i] = r * cols + c

    items = []
    for target in range(rows * cols):
        members = np.nonzero(cell == target)[0]
        if areas[members].sum() < MIN_AREA:
            raise RuntimeError(f"No item found in cell {divmod(target, cols)}")
        mask = np.isin(labels, members + 1)
        ys, xs = np.nonzero(mask)
        sl = (slice(ys.min(), ys.max() + 1), slice(xs.min(), xs.max() + 1))
        crop = rgba[sl].copy()
        crop[~mask[sl]] = 0
        items.append(crop)
    return items


def fit(crop: np.ndarray, max_side: int) -> Image.Image:
    img = Image.fromarray(crop)
    scale = max_side / max(img.size)
    return resize_rgba(img, (max(1, round(img.width * scale)), max(1, round(img.height * scale))))


def sticker(img: Image.Image, width: int = 2 * HI_RES) -> Image.Image:
    return add_outline(img, width, STICKER_COLOR)


# --------------------------------------------------------------------------- #
# Bánh chữ: chữ đặt ở điểm "sâu" nhất của lòng kem (xa mép kem nhất)
# --------------------------------------------------------------------------- #
TREAT_SHEET = "01_bakery_treats.png"
# Kích thước hiển thị (cạnh dài, px logic) — bánh cũ 62..74
TREAT_MAX_SIDE = 68
TREAT_OUTLINE = 2
# Lòng kem hẹp hơn tỉ lệ này (so với cạnh ngắn) coi như không có
MIN_CREAM_RADIUS = 0.15


def _letter_anchor(img: Image.Image) -> dict:
    """Tâm + cỡ chữ (px của ảnh) theo vùng kem trống lớn nhất trên bánh."""
    arr = np.array(img).astype(int)
    r, g, b, a = arr[..., 0], arr[..., 1], arr[..., 2], arr[..., 3]
    cream = (a > 200) & (r > 225) & (g > 200) & (b > 150) & (r - b < 95)
    cream = ndimage.binary_opening(cream, iterations=2)
    depth = ndimage.distance_transform_edt(cream)
    # Bánh không có lòng kem đủ rộng (donut / bagel có lỗ giữa): chữ ở giữa bánh, cỡ mặc định
    if depth.max() < min(img.size) * MIN_CREAM_RADIUS:
        return {"x": img.width // 2, "y": img.height // 2, "radius": round(min(img.size) * 0.3, 1)}
    y, x = np.unravel_index(int(np.argmax(depth)), depth.shape)
    return {"x": int(x), "y": int(y), "radius": round(float(depth.max()), 1)}


def build_treats() -> dict[str, tuple[Image.Image, dict]]:
    """letter_treat_01..12 (2x) + metadata `letter` (tâm / bán kính lòng kem, px của ảnh 2x)."""
    items = find_items(key_sheet(SRC / TREAT_SHEET), rows=3, cols=4)
    treats = {}
    for index, crop in enumerate(items, start=1):
        img = fit(crop, TREAT_MAX_SIDE * HI_RES)
        anchor = _letter_anchor(img)
        pad = TREAT_OUTLINE * HI_RES
        img = sticker(img, pad)
        anchor["x"] += pad
        anchor["y"] += pad
        treats[f"bread/letter_treat_{index:02d}"] = (img, {"scale": HI_RES, "letter": anchor})
    return treats


# --------------------------------------------------------------------------- #
# Tranh từ vựng -> 1 atlas (frame = từ viết thường)
# --------------------------------------------------------------------------- #
WORD_SHEETS = [
    ("02_m_a_vocab.png", [
        "monkey", "milk", "money", "mouse", "moon", "mop", "muffin", "mittens",
        "apple", "ant", "ax", "alligator", "angel", "arm", "astronaut", "anchor",
    ]),
    ("03_sprite_sheet.png", [
        "seal", "soap", "sun", "socks", "square", "spider", "sink", "salad",
        "pen", "pineapple", "panda", "pizza", "parrot", "pumpkin", "puzzle", "turtle",
    ]),
    ("04_sprite_sheet.png", [
        "tent", "teacher", "tiger", "table", "two", "insect", "igloo", "ink",
        "iguana", "in", "italy", "infant", "nest", "nut", "net", "nose",
    ]),
    ("05_sprite_sheet.png", [
        "nine", "ninja", "cat", "cup", "car", "computer", "cake", "carrot",
        "octopus", "olive", "ostrich", "oven", "otter", "onion", "dog", "desk",
    ]),
    ("06_sprite_sheet.png", [
        "doll", "duck", "drum", "dinosaur", "map", "man", "mat", "men",
        "tap", "sit", "sip", "bin", "nap", "tin", "pan", "can",
    ]),
    ("07_sprite_sheet.png", [
        "cap", "top", "pot", "hop", "dot", "dip", "cod", "dad",
        "mom", "dam", "rod", "pad", "pat", "hid", "mad", "cast",
    ]),
]
# Cạnh dài của tranh (px logic) — ô từ cao 84..88
WORD_MAX_SIDE = 60
WORD_ATLAS_COLS = 12
WORD_ATLAS = OUT / "words"


def build_word_atlas() -> int:
    """Ghi words/words.webp + words/words.json (Phaser atlas JSON hash). Trả về số tranh."""
    pictures: dict[str, Image.Image] = {}
    for sheet, words in WORD_SHEETS:
        for word, crop in zip(words, find_items(key_sheet(SRC / sheet), rows=4, cols=4), strict=True):
            pictures[word] = sticker(fit(crop, WORD_MAX_SIDE * HI_RES))

    cell = max(max(img.size) for img in pictures.values()) + 2
    rows = -(-len(pictures) // WORD_ATLAS_COLS)
    atlas = Image.new("RGBA", (WORD_ATLAS_COLS * cell, rows * cell), (0, 0, 0, 0))
    frames = {}
    for index, (word, img) in enumerate(pictures.items()):
        x, y = (index % WORD_ATLAS_COLS) * cell, (index // WORD_ATLAS_COLS) * cell
        atlas.alpha_composite(img, (x, y))
        w, h = img.size
        frames[word] = {
            "frame": {"x": x, "y": y, "w": w, "h": h},
            "rotated": False,
            "trimmed": False,
            "spriteSourceSize": {"x": 0, "y": 0, "w": w, "h": h},
            "sourceSize": {"w": w, "h": h},
        }

    WORD_ATLAS.mkdir(parents=True, exist_ok=True)
    atlas.save(WORD_ATLAS / "words.webp", quality=90, method=6)
    meta = {"image": "words.webp", "size": {"w": atlas.width, "h": atlas.height}, "scale": "1"}
    (WORD_ATLAS / "words.json").write_text(json.dumps({"frames": frames, "meta": meta}, indent=1), encoding="utf-8")
    return len(pictures)


# --------------------------------------------------------------------------- #
# Icon phần thưởng (hàng đầu sheet 08: cúp, huy chương, nơ, mũ đầu bếp)
# --------------------------------------------------------------------------- #
REWARD_SHEET = "08_sprite_sheet.png"
REWARD_ICONS = ["trophy", "medal", "ribbon", "chef_hat"]
REWARD_MAX_SIDE = 56


def build_reward_icons() -> dict[str, tuple[Image.Image, dict]]:
    items = find_items(key_sheet(SRC / REWARD_SHEET), rows=4, cols=4)
    return {
        f"rewards/{name}": (sticker(fit(crop, REWARD_MAX_SIDE * HI_RES)), {"scale": HI_RES})
        for name, crop in zip(REWARD_ICONS, items)
    }


# --------------------------------------------------------------------------- #
# Background: cắt bỏ nhãn số ở góc trên trái (và viền trắng của ảnh 13)
#   (file nguồn, vùng crop x0, y0, x1, y1) — vùng crop đúng tỉ lệ ảnh xuất
# --------------------------------------------------------------------------- #
BACKGROUNDS = {
    # Tiệm bánh ngọt hồng ban ngày
    "backgrounds/bg_bakery_04": ("11_background.png", (190, 0, 996, 1792)),
    "backgrounds/bg_bakery_04_wide": ("10_background.png", (84, 63, 1792, 1024)),
    # Bếp ban đêm, bột mì tung toé (level HARD)
    "backgrounds/bg_bakery_05": ("13_background.png", (256, 205, 963, 1776)),
    "backgrounds/bg_bakery_05_wide": ("12_background.png", (104, 74, 1792, 1024)),
}


def build_backgrounds(portrait: tuple[int, int], wide: tuple[int, int]) -> dict[str, Image.Image]:
    out = {}
    for name, (source, box) in BACKGROUNDS.items():
        size = wide if name.endswith("_wide") else portrait
        x0, y0, x1, y1 = box
        ratio = (x1 - x0) / (y1 - y0)
        if abs(ratio - size[0] / size[1]) > 0.01:
            raise RuntimeError(f"{name}: crop ratio {ratio:.3f} != {size[0] / size[1]:.3f}")
        out[name] = Image.open(SRC / source).convert("RGB").crop(box).resize(size, Image.LANCZOS)
    return out
