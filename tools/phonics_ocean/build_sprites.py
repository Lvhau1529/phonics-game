"""
Phonics Ocean: cắt art board của Phonics Ocean pack (`_source/phonics-ocean/`) thành PNG trong
`public/assets/phonics-ocean/` + manifest `src/games/phonics-ocean/game/config/sprites.json`
(key ổn định -> đường dẫn, kích thước) — React và Phaser import thẳng manifest.

Chạy:  pnpm assets:phonics-ocean   (= python tools/phonics_ocean/build_sprites.py, kèm build_content.py)

Nguồn (README_COMPLETE_PACK: cá người chơi "không phải cá hề" là bản mới nhất):
  - art/player-revision-board.png: nền xanh navy theo ô -> cá người chơi 3 cấp, cá săn mồi, vật phẩm
  - art/level-design-master.png: nền sáng -> cá mồi (cá mang chữ — chữ vẽ live trong game, không nướng vào ảnh)
  - backgrounds/level_0x_*.png: nền 6 biome (bo góc + viền thẻ -> cắt bớt mép; ảnh nhỏ ~480px nên phóng
    ×4 kiểu pixel-art (nearest) để nền sắc nét thay vì nhoè)
  - oceanfeast/: khung bơi đã cắt sẵn của OceanFeast pack -> đàn cá nhỏ / cá vừa / cá lớn (kiểu Feeding Frenzy)
    và cá nhồng (barracuda)
Nền của board được xoá bằng flood fill từ mép box (pixel gần màu nền) rồi giữ mảng lớn nhất.

Ảnh HD thay thế (tài nguyên gen thêm — docs/phonics-ocean/ASSET_PROMPTS.md), có file nào thì dùng file đó:
  - hd/backgrounds/<biome>.png        nền 16:9 (≥ 1920×1080), vd coral_reef.png
  - hd/sprites/<key>.png              PNG nền trong suốt, tên = key trong sprites.json (vd player.1.0.png,
                                      school.tiny.pink.0.png, predator.shark.1.png, item.heart.png)
  - hd/sheets/<name>.png              sprite sheet nền magenta theo lưới (bảng HD_SHEETS) — thay cả nhóm khung

Texture xuất ở độ phân giải canvas (gấp RENDER_SCALE = 2 toạ độ logic), game tự đặt kích thước hiển thị.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from common.imaging import (  # noqa: E402
    clean_alpha, drop_fragments, load_rgba, resize_rgba, save_png, target_size, tight_bbox,
)
from common.magenta_sheet import find_items, key_sheet  # noqa: E402
from common.paths import GAME_APP, PUBLIC_ASSETS, SOURCE  # noqa: E402

SRC = SOURCE / "phonics-ocean"
OUT = PUBLIC_ASSETS / "phonics-ocean"
ASSET_URL = "assets/phonics-ocean"
MANIFEST = GAME_APP / "src" / "games" / "phonics-ocean" / "game" / "config" / "sprites.json"
HD = SRC / "hd"

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

# --------------------------------------------------------------------------- #
# Đàn cá kiểu Feeding Frenzy (OceanFeast pack, frames/ đã có nền trong suốt)
#   tiny   — cá nhỏ theo bầy: 4 màu × 6 khung bơi (prey_small r00..r03)
#   medium — cá vừa: sọc / bướm / đỏ (prey_medium) — chỉ lấy khung không dính vết cắt của ô bên cạnh
#   big    — cá mú lớn (predators r02)
# --------------------------------------------------------------------------- #
OCEANFEAST = SRC / "oceanfeast"
SCHOOL: dict[str, tuple[str, list[str], int]] = {
    # key: (thư mục, các khung, chiều rộng output)
    "tiny.gray": ("prey_small", [f"r00_c{c:02d}" for c in range(6)], 72),
    "tiny.pink": ("prey_small", [f"r01_c{c:02d}" for c in range(6)], 72),
    "tiny.yellow": ("prey_small", [f"r02_c{c:02d}" for c in range(6)], 72),
    "tiny.green": ("prey_small", [f"r03_c{c:02d}" for c in range(6)], 72),
    "medium.striped": ("prey_medium", ["r00_c00", "r00_c01", "r00_c02"], 116),
    "medium.butterfly": ("prey_medium", ["r01_c00", "r01_c01", "r01_c02"], 116),
    "medium.red": ("prey_medium", ["r02_c00", "r02_c01", "r02_c02"], 116),
    "big.grouper": ("predators", ["r02_c00", "r02_c01", "r02_c02"], 180),
}
# Cá săn mồi thêm từ OceanFeast: cá nhồng (Blend Wreck — bảng §9 của pack)
EXTRA_PREDATORS = {"barracuda": ("predators", ["r01_c00", "r01_c01", "r01_c02"], 132)}

# Nền 6 biome: cắt bớt mép (bo góc + viền thẻ), phóng ×BG_UPSCALE kiểu nearest (pixel-art sắc nét)
BACKGROUNDS = {
    "coral_reef": "level_01_coral_reef",
    "shipwreck": "level_02_shipwreck",
    "deep_ocean": "level_03_deep_ocean",
    "ice_sea": "level_04_ice_sea",
    "volcano": "level_05_volcano",
    "treasure_zone": "level_06_treasure_zone",
}
BG_INSET = 12
BG_UPSCALE = 4
# Nền HD: phủ kín khung 16:9 ở độ phân giải canvas lớn nhất (960 × 540 logic × RENDER_SCALE 2)
BG_HD_SIZE = (1920, 1080)

COVER_SIZE = (480, 270)

# --------------------------------------------------------------------------- #
# Sprite sheet HD nền magenta (#FF00FF) do AI gen (docs/phonics-ocean/ASSET_PROMPTS.md):
#   hd/sheets/<file>.png -> cắt theo lưới rows × cols (common/magenta_sheet.py), thứ tự đọc trái -> phải,
#   trên -> dưới, mỗi ô thành key tương ứng (ghi đè ảnh cắt từ pack; key mới thì thêm khung — vd eel.1, eel.2).
#   (file, rows, cols, keys theo thứ tự ô, spec kích thước output)
# --------------------------------------------------------------------------- #
def _keys(prefix: str, count: int) -> list[str]:
    return [f"{prefix}.{i}" for i in range(count)]


def _player_spec(tier: int) -> dict:
    return {"height": round(PLAYER_H * (0.82 + tier * 0.06))}


HD_SHEETS: list[tuple[str, int, int, list[str], dict]] = [
    ("player_tier1", 1, 6, _keys("player.1", 6), _player_spec(1)),
    ("player_tier2", 1, 6, _keys("player.2", 6), _player_spec(2)),
    # Cỡ 3: 0–1 bơi ngậm miệng, 2–4 há miệng (2 cũng là khung cắn player.bite)
    ("player_tier3", 1, 5, _keys("player.3", 5), _player_spec(3)),
    ("word_fish", 5, 5, _keys("prey", 25), {"width": PREY_W}),
    ("school_tiny", 4, 6, [f"school.tiny.{c}.{i}" for c in ("gray", "pink", "yellow", "green") for i in range(6)],
     {"width": SCHOOL["tiny.gray"][2]}),
    ("school_medium", 3, 3, [f"school.medium.{c}.{i}" for c in ("striped", "butterfly", "red") for i in range(3)],
     {"width": SCHOOL["medium.red"][2]}),
    ("school_big", 1, 3, _keys("school.big.grouper", 3), {"width": SCHOOL["big.grouper"][2]}),
    ("predator_shark", 1, 3, _keys("predator.shark", 3), {"height": 132}),
    ("predator_puffer", 1, 3, _keys("predator.puffer", 3), {"height": 120}),
    ("predator_eel", 1, 3, _keys("predator.eel", 3), {"height": 120}),
    ("predator_angler", 1, 3, _keys("predator.angler", 3), {"height": 140}),
    ("predator_barracuda", 1, 3, _keys("predator.barracuda", 3), {"height": 132}),
    ("items", 1, 6, [f"item.{k}" for k in ("star", "bolt", "bubble", "clock", "heart", "chest")], {"max_side": ITEM_SIDE}),
]


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


def trim(arr: np.ndarray) -> Image.Image:
    """Giữ mảng lớn nhất (bỏ phần lấn của sprite bên cạnh) rồi cắt sát"""
    arr = drop_fragments(clean_alpha(arr), largest_only=True)
    bx0, by0, bx1, by1 = tight_bbox(arr)
    return Image.fromarray(arr[by0:by1, bx0:bx1])


def cut(
    boards: dict[str, np.ndarray], board: str, box: tuple[int, int, int, int], tolerance: int | None = None
) -> Image.Image:
    x0, y0, x1, y1 = box
    return trim(remove_board_background(boards[board][y0:y1, x0:x1], tolerance or TOLERANCE[board]))


def frame(folder: str, name: str) -> Image.Image:
    """Khung OceanFeast: đã trong suốt, chỉ bỏ phần dính của ô bên cạnh"""
    return trim(load_rgba(OCEANFEAST / folder / f"{name}.png"))


def fit(img: Image.Image, spec: dict) -> Image.Image:
    return resize_rgba(img, target_size(img.width, img.height, spec))


class Builder:
    def __init__(self) -> None:
        self.manifest: dict[str, dict] = {}
        self.images: dict[str, Image.Image] = {}
        self.hd: list[str] = []

    def sprite(self, key: str, file: str, source: Image.Image, spec: dict) -> Image.Image:
        """Ảnh HD (hd/sprites/<key>.png) nếu có thay cho ảnh cắt từ pack, cùng kích thước output"""
        path = HD / "sprites" / f"{key}.png"
        if path.exists():
            self.hd.append(key)
            source = trim(load_rgba(path))
        img = fit(source, spec)
        self.add(key, img, file)
        return img

    def add(self, key: str, img: Image.Image, file: str) -> None:
        self.images[key] = img
        self.manifest[key] = {"path": save(img, file), "width": img.width, "height": img.height}


def apply_sheets(b: Builder) -> None:
    """Sheet HD có mặt -> thay cả nhóm khung (bỏ khung cũ của nhóm mà sheet không có)."""
    for name, rows, cols, keys, spec in HD_SHEETS:
        path = HD / "sheets" / f"{name}.png"
        if not path.exists():
            continue
        items = find_items(key_sheet(path), rows, cols)
        groups = {key.rsplit(".", 1)[0] for key in keys}
        for old in [k for k in b.manifest if k.rsplit(".", 1)[0] in groups and k not in keys]:
            (PUBLIC_ASSETS.parent / b.manifest.pop(old)["path"]).unlink(missing_ok=True)
            b.images.pop(old, None)
        for key, item in zip(keys, items):
            img = fit(trim(item), spec)
            b.add(key, img, f"hd/{key.replace('.', '_')}")
            if key == "player.3.2":
                b.add("player.bite", fit(trim(item), {"height": PLAYER_H}), "hd/player_bite")
        b.hd.append(f"sheet:{name}")


def build_background(biome: str, name: str) -> tuple[Image.Image, bool]:
    hd = HD / "backgrounds" / f"{biome}.png"
    if hd.exists():
        img = Image.open(hd).convert("RGB")
        scale = max(BG_HD_SIZE[0] / img.width, BG_HD_SIZE[1] / img.height)
        img = img.resize((round(img.width * scale), round(img.height * scale)), Image.LANCZOS)
        left, top = (img.width - BG_HD_SIZE[0]) // 2, (img.height - BG_HD_SIZE[1]) // 2
        return img.crop((left, top, left + BG_HD_SIZE[0], top + BG_HD_SIZE[1])), True
    img = Image.open(SRC / "backgrounds" / f"{name}.png").convert("RGB")
    w, h = img.size
    img = img.crop((BG_INSET, BG_INSET, w - BG_INSET, h - BG_INSET))
    return img.resize((img.width * BG_UPSCALE, img.height * BG_UPSCALE), Image.NEAREST), False


def build_cover(images: dict[str, Image.Image]) -> None:
    """Ảnh bìa 16:9 ở màn chọn game: rạn san hô đông cá, cá đỏ há miệng đuổi theo, cá mập phía sau."""
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

    paste("predator.shark.0", w * 0.8, h * 0.2, 58, flip=True, alpha=0.9)
    school = [
        ("pink", 0.62, 0.42), ("pink", 0.7, 0.36), ("pink", 0.74, 0.47), ("yellow", 0.86, 0.6),
        ("yellow", 0.93, 0.66), ("yellow", 0.88, 0.73), ("green", 0.12, 0.2), ("green", 0.19, 0.14),
    ]
    for index, (color, x, y) in enumerate(school):
        paste(f"school.tiny.{color}.{index % 6}", w * x, h * y, 14, flip=x > 0.5)
    paste("school.medium.butterfly.0", w * 0.58, h * 0.84, 26, flip=True)
    paste("prey.3", w * 0.72, h * 0.62, 38, flip=True)
    paste("prey.14", w * 0.84, h * 0.86, 32, flip=True)
    paste("player.3.2", w * 0.36, h * 0.6, 118)
    save(cover, "cover")


def main() -> None:
    boards = {name: load_rgba(path) for name, path in BOARDS.items()}
    b = Builder()

    for tier, frames in PLAYER.items():
        for index, (board, box) in enumerate(frames):
            b.sprite(f"player.{tier}.{index}", f"player/tier{tier}_{index}", cut(boards, board, box),
                     {"height": round(PLAYER_H * (0.82 + tier * 0.06))})
    b.sprite("player.bite", "player/bite", cut(boards, *PLAYER_BITE), {"height": PLAYER_H})

    for index, (board, box) in enumerate(PREY):
        b.sprite(f"prey.{index}", f"prey/fish_{index:02d}", cut(boards, board, box), {"width": PREY_W})

    for key, box, height in PREDATORS:
        b.sprite(f"predator.{key}", f"predators/{key.replace('.', '_')}", cut(boards, "revision", box),
                 {"height": height})
    for kind, (folder, names, height) in EXTRA_PREDATORS.items():
        for index, name in enumerate(names):
            b.sprite(f"predator.{kind}.{index}", f"predators/{kind}_{index}", frame(folder, name), {"height": height})

    for key, (folder, names, width) in SCHOOL.items():
        for index, name in enumerate(names):
            b.sprite(f"school.{key}.{index}", f"school/{key.replace('.', '_')}_{index}", frame(folder, name),
                     {"width": width})

    for key, box in ITEMS.items():
        b.sprite(f"item.{key}", f"items/{key}", cut(boards, "revision", box, ITEM_TOLERANCE), {"max_side": ITEM_SIDE})

    for biome, name in BACKGROUNDS.items():
        img, is_hd = build_background(biome, name)
        if is_hd:
            b.hd.append(f"bg.{biome}")
        b.add(f"bg.{biome}", img, f"backgrounds/{biome}")

    apply_sheets(b)
    build_cover(b.images)
    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(json.dumps(b.manifest, indent=2) + "\n", encoding="utf-8", newline="\n")
    print(f"Built {len(b.manifest)} images -> {OUT}" + (f" (HD: {', '.join(b.hd)})" if b.hd else ""))


if __name__ == "__main__":
    main()
