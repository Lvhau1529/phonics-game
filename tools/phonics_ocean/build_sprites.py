"""
Phonics Ocean: cắt art board của Phonics Ocean pack (`_source/phonics-ocean/`) thành PNG trong
`public/assets/phonics-ocean/` + manifest `src/games/phonics-ocean/game/config/sprites.json`
(key ổn định -> đường dẫn, kích thước) — React và Phaser import thẳng manifest.

Chạy:  pnpm assets:phonics-ocean   (= python tools/phonics_ocean/build_sprites.py, kèm build_content.py)

Nguồn (README_COMPLETE_PACK: cá người chơi "không phải cá hề" là bản mới nhất):
  - art/player-revision-board.png: nền xanh navy theo ô -> cá người chơi 3 cấp, cá săn mồi, vật phẩm
  - art/level-design-master.png: nền sáng -> cá mồi (cá mang chữ — chữ vẽ live trong game, không nướng vào ảnh)
  - backgrounds/level_0x_*.png: nền 6 biome (bo góc + viền thẻ -> cắt bớt mép)
Nền của board được xoá bằng flood fill từ mép box (pixel gần màu nền) rồi giữ mảng lớn nhất.

Texture xuất ở độ phân giải canvas (gấp RENDER_SCALE = 2 toạ độ logic), game tự đặt kích thước hiển thị.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from common.imaging import drop_fragments, load_rgba, resize_rgba, save_png, target_size, tight_bbox  # noqa: E402
from common.paths import GAME_APP, PUBLIC_ASSETS, SOURCE  # noqa: E402

SRC = SOURCE / "phonics-ocean"
OUT = PUBLIC_ASSETS / "phonics-ocean"
ASSET_URL = "assets/phonics-ocean"
MANIFEST = GAME_APP / "src" / "games" / "phonics-ocean" / "game" / "config" / "sprites.json"

BOARDS = {
    "revision": SRC / "art" / "player-revision-board.png",
    "master": SRC / "art" / "level-design-master.png",
}
# Độ lệch màu tối đa so với nền board (nền tối: thấp hơn để không ăn vào viền đen của sprite)
TOLERANCE = {"revision": 34, "master": 40}
PAD = 2

# Kích thước output (px texture = 2 × px logic khi hiển thị lớn nhất)
PLAYER_H = 150
PREY_W = 132
ITEM_SIDE = 96

# --------------------------------------------------------------------------- #
# (board, box x0, y0, x1, y1) — box bao quanh một sprite trên board, đo bằng phân mảnh tự động
# --------------------------------------------------------------------------- #
def _row(board: str, y0: int, y1: int, xs: list[tuple[int, int]]) -> list[tuple[str, tuple[int, int, int, int]]]:
    return [(board, (x0 - PAD, y0 - PAD, x1 + PAD, y1 + PAD)) for x0, x1 in xs]


# Cá người chơi (cá săn mồi đỏ): cấp 1 / 2 có 6 khung bơi; cấp 3 có khung há miệng (2, 3) dùng làm khung cắn
PLAYER = {
    1: _row("revision", 52, 92, [(78, 122), (134, 177), (190, 232), (243, 286), (298, 340), (352, 393)]),
    2: _row("revision", 120, 167, [(77, 123), (133, 180), (190, 233), (242, 288), (298, 340), (351, 394)]),
    3: _row("revision", 196, 262, [(72, 132), (137, 200), (210, 269), (275, 333), (340, 399)]),
}
PLAYER_BITE = PLAYER[3][2]

# Cá mồi 5 × 5 màu (CVC / blends / digraphs / long vowels / r-controlled trên board — chỉ lấy hình cá)
PREY = [
    ("master", (x0 - PAD, y0 - PAD, x1 + PAD, y1 + PAD))
    for x0, y0, x1, y1 in [
        (520, 320, 574, 357), (595, 320, 650, 357), (669, 320, 725, 358), (745, 320, 800, 357), (818, 320, 875, 358),
        (520, 385, 576, 422), (596, 384, 653, 422), (672, 379, 726, 422), (746, 378, 803, 423), (819, 378, 877, 424),
        (520, 449, 576, 491), (597, 449, 653, 490), (672, 447, 727, 491), (746, 447, 802, 491), (819, 447, 877, 492),
        (520, 519, 576, 559), (597, 519, 652, 561), (670, 517, 726, 560), (746, 517, 802, 561), (819, 516, 877, 560),
        (520, 585, 575, 626), (596, 586, 652, 628), (671, 583, 727, 626), (747, 582, 803, 627), (819, 582, 877, 627),
    ]
]

# Cá săn mồi: (key, box, chiều cao output)
PREDATORS: list[tuple[str, tuple[int, int, int, int], int]] = [
    ("shark.0", (794, 45, 887, 95), 132),
    ("shark.1", (904, 45, 1001, 91), 132),
    ("shark.2", (1019, 43, 1118, 92), 132),
    ("puffer.0", (795, 105, 857, 157), 120),
    ("puffer.1", (875, 105, 932, 156), 120),
    ("puffer.2", (950, 107, 1002, 155), 120),
    ("puffer.3", (1017, 107, 1067, 155), 120),
    ("puffer.4", (1082, 107, 1132, 154), 120),
    ("eel.0", (793, 174, 898, 224), 120),
    ("angler.0", (919, 166, 1027, 226), 140),
    ("angler.1", (1041, 166, 1130, 226), 140),
]

# Vật phẩm (power-up) trên hàng ITEMS của board mới — có quầng sáng tối quanh icon nên xoá nền mạnh tay hơn
ITEM_TOLERANCE = 72
ITEMS = {
    "star": (642, 360, 689, 400),
    "bolt": (709, 357, 753, 401),
    "bubble": (775, 358, 817, 400),
    "clock": (913, 357, 971, 401),
    "heart": (997, 356, 1045, 401),
    "chest": (1074, 359, 1123, 402),
}

# Nền 6 biome: cắt bớt mép (bo góc + viền thẻ) rồi giữ nguyên độ phân giải gốc
BACKGROUNDS = {
    "coral_reef": "level_01_coral_reef",
    "shipwreck": "level_02_shipwreck",
    "deep_ocean": "level_03_deep_ocean",
    "ice_sea": "level_04_ice_sea",
    "volcano": "level_05_volcano",
    "treasure_zone": "level_06_treasure_zone",
}
BG_INSET = 12

COVER_SIZE = (480, 270)


# --------------------------------------------------------------------------- #
# Builders
# --------------------------------------------------------------------------- #
def save(img: Image.Image, file: str) -> str:
    save_png(img, OUT / f"{file}.png")
    return f"{ASSET_URL}/{file}.png"


def remove_board_background(crop: np.ndarray, tolerance: int) -> np.ndarray:
    """Flood fill từ mép box: pixel gần màu nền board -> trong suốt (cả bóng đổ mờ quanh sprite)."""
    rgb = crop[..., :3].astype(int)
    border = np.concatenate([rgb[0], rgb[-1], rgb[:, 0], rgb[:, -1]])
    bg = np.median(border, axis=0)
    similar = np.abs(rgb - bg).max(axis=2) < tolerance
    seeds = np.zeros_like(similar)
    seeds[0, :] = seeds[-1, :] = seeds[:, 0] = seeds[:, -1] = True
    labels, _ = ndimage.label(similar)
    background = np.isin(labels, np.unique(labels[seeds & similar]))
    # Lấp lỗ nhỏ bên trong sprite (mắt / vảy gần màu nền) — chỉ xoá phần nối ra mép
    solid = ndimage.binary_fill_holes(~background)
    out = crop.copy()
    out[..., 3] = np.where(solid, 255, 0)
    out[~solid] = 0
    return out


def cut(
    boards: dict[str, np.ndarray], board: str, box: tuple[int, int, int, int], tolerance: int | None = None
) -> Image.Image:
    x0, y0, x1, y1 = box
    crop = remove_board_background(boards[board][y0:y1, x0:x1], tolerance or TOLERANCE[board])
    crop = drop_fragments(crop, largest_only=True)
    bx0, by0, bx1, by1 = tight_bbox(crop)
    return Image.fromarray(crop[by0:by1, bx0:bx1])


def fit(img: Image.Image, spec: dict) -> Image.Image:
    return resize_rgba(img, target_size(img.width, img.height, spec))


def add(manifest: dict, key: str, img: Image.Image, file: str) -> None:
    manifest[key] = {"path": save(img, file), "width": img.width, "height": img.height}


def build_background(name: str) -> Image.Image:
    img = Image.open(SRC / "backgrounds" / f"{name}.png").convert("RGB")
    w, h = img.size
    return img.crop((BG_INSET, BG_INSET, w - BG_INSET, h - BG_INSET))


def build_cover(images: dict[str, Image.Image]) -> None:
    """Ảnh bìa 16:9 ở màn chọn game: rạn san hô + cá đỏ đuổi cá mồi, cá mập phía sau."""
    w, h = COVER_SIZE
    bg = images["bg.coral_reef"]
    scale = w / bg.width
    bg = bg.resize((w, round(bg.height * scale)), Image.LANCZOS)
    top = round((bg.height - h) * 0.55)
    cover = bg.crop((0, top, w, top + h)).convert("RGBA")

    def paste(key: str, x: float, y: float, height: float, flip: bool = False, alpha: float = 1) -> None:
        sprite = images[key]
        sprite = resize_rgba(sprite, (round(sprite.width * height / sprite.height), round(height)))
        if flip:
            sprite = sprite.transpose(Image.FLIP_LEFT_RIGHT)
        if alpha < 1:
            arr = np.array(sprite)
            arr[..., 3] = (arr[..., 3] * alpha).astype(np.uint8)
            sprite = Image.fromarray(arr)
        cover.alpha_composite(sprite, (round(x - sprite.width / 2), round(y - sprite.height / 2)))

    paste("predator.shark.0", w * 0.8, h * 0.24, 62, flip=True, alpha=0.9)
    paste("prey.3", w * 0.67, h * 0.6, 40, flip=True)
    paste("prey.1", w * 0.84, h * 0.72, 36, flip=True)
    paste("prey.14", w * 0.58, h * 0.84, 34, flip=True)
    paste("player.3.2", w * 0.36, h * 0.6, 118)
    save(cover, "cover")


def main() -> None:
    boards = {name: load_rgba(path) for name, path in BOARDS.items()}
    manifest: dict[str, dict] = {}
    images: dict[str, Image.Image] = {}

    for tier, frames in PLAYER.items():
        for index, (board, box) in enumerate(frames):
            img = fit(cut(boards, board, box), {"height": round(PLAYER_H * (0.82 + tier * 0.06))})
            images[f"player.{tier}.{index}"] = img
            add(manifest, f"player.{tier}.{index}", img, f"player/tier{tier}_{index}")
    bite = fit(cut(boards, *PLAYER_BITE), {"height": PLAYER_H})
    add(manifest, "player.bite", bite, "player/bite")

    for index, (board, box) in enumerate(PREY):
        img = fit(cut(boards, board, box), {"width": PREY_W})
        images[f"prey.{index}"] = img
        add(manifest, f"prey.{index}", img, f"prey/fish_{index:02d}")

    for key, box, height in PREDATORS:
        img = fit(cut(boards, "revision", box), {"height": height})
        images[f"predator.{key}"] = img
        add(manifest, f"predator.{key}", img, f"predators/{key.replace('.', '_')}")

    for key, box in ITEMS.items():
        img = fit(cut(boards, "revision", box, ITEM_TOLERANCE), {"max_side": ITEM_SIDE})
        add(manifest, f"item.{key}", img, f"items/{key}")

    for biome, name in BACKGROUNDS.items():
        img = build_background(name)
        images[f"bg.{biome}"] = img
        add(manifest, f"bg.{biome}", img, f"backgrounds/{biome}")

    build_cover(images)
    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8", newline="\n")
    print(f"Built {len(manifest)} images -> {OUT}")


if __name__ == "__main__":
    main()
