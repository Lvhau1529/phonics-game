"""
Phonics Ocean: cắt Phonics Ocean v3 pack (`_source/phonics-ocean/v3/` — ảnh tách rời, độ phân giải cao) thành ảnh trong
`public/assets/phonics-ocean/` + manifest `src/games/phonics-ocean/game/config/sprites.json`
(key ổn định -> đường dẫn, kích thước) — React và Phaser import thẳng manifest.

Chạy:  pnpm assets:phonics-ocean   (= python tools/phonics_ocean/build_sprites.py, kèm build_content.py)

Nguồn (v3/README.md, v3/GAMEPLAY_PHONICS_V3.md):
  - backgrounds/<biome>.png: nền 6 biome 16:9 (rạn san hô -> núi lửa) -> WebP cùng độ phân giải
  - sheets/*.png: sprite sheet nền magenta (#FF00FF), mỗi hàng một nhóm. Sheet được chia thành các dải ngang
    (SHEETS: box x0, y0, x1, y1), mỗi dải cắt theo lưới rows × cols (common/magenta_sheet.py), thứ tự đọc trái -> phải,
    trên -> dưới; ô nào không có key thì bỏ (vd cá rùa, cá heo, chướng ngại, nút UI — game chưa dùng).
      player_fish_levels_sheet      6 loài cá của bé (mỗi biome một loài) × 4 khung bơi
      word_fish_and_prey_sheet      25 cá mang chữ (nhãn trống — chữ vẽ live trong game) + đàn cá nhỏ / vừa / lớn
      predators_ui_items_effects    cá săn mồi (cá mập, cá nóc, lươn, cá lồng đèn, cá nhồng) + vật phẩm

Texture xuất ở độ phân giải canvas (gấp RENDER_SCALE = 2 toạ độ logic), game tự đặt kích thước hiển thị.
"""

from __future__ import annotations

import json
import shutil
import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from common.imaging import (  # noqa: E402
    clean_alpha, drop_fragments, resize_rgba, save_png, target_size, tight_bbox,
)
from common.magenta_sheet import find_items, key_sheet  # noqa: E402
from common.paths import GAME_APP, PUBLIC_ASSETS, SOURCE  # noqa: E402

SRC = SOURCE / "phonics-ocean" / "v3"
OUT = PUBLIC_ASSETS / "phonics-ocean"
ASSET_URL = "assets/phonics-ocean"
MANIFEST = GAME_APP / "src" / "games" / "phonics-ocean" / "game" / "config" / "sprites.json"
# Thư mục ảnh do script này sinh (xoá sạch trước khi build; sfx/ do tools/build_audio.py sinh — giữ nguyên)
OUT_DIRS = ("backgrounds", "items", "player", "predators", "prey", "school")

# Biome theo thứ tự cấp của pack — cũng là thứ tự loài cá của bé trên player_fish_levels_sheet
BIOMES = ["coral_reef", "kelp_forest", "shipwreck_bay", "twilight_trench", "abyss_cave", "volcanic_ruins"]
BG_QUALITY = 86

# Kích thước output (px texture = 2 × px logic khi hiển thị lớn nhất)
PLAYER_H = 160
PLAYER_FRAMES = 4
PREY_W = 160
ITEM_SIDE = 96
SCHOOL_W = {"tiny": 72, "medium": 116, "big": 180}
PREDATOR_H = {"shark": 132, "puffer": 120, "eel": 120, "angler": 140, "barracuda": 112}

COVER_SIZE = (480, 270)


def _frames(prefix: str, count: int) -> list[str]:
    return [f"{prefix}.{i}" for i in range(count)]


def _school(size: str, kinds: list[str], frames: int) -> list[str]:
    return [f"school.{size}.{kind}.{i}" for kind in kinds for i in range(frames)]


# (sheet, box x0, y0, x1, y1, rows, cols, key theo thứ tự ô — None = bỏ ô, spec kích thước output)
W = 2000  # x1 "tới mép phải"
Band = tuple[str, tuple[int, int, int, int], int, int, list[str | None], dict]
SHEETS: list[Band] = [
    ("player_fish_levels_sheet", (0, 0, W, 1086), 6, PLAYER_FRAMES,
     [key for biome in BIOMES for key in _frames(f"player.{biome}", PLAYER_FRAMES)], {"height": PLAYER_H}),
    ("word_fish_and_prey_sheet", (0, 0, W, 780), 5, 5, _frames("prey", 25), {"width": PREY_W}),
    ("word_fish_and_prey_sheet", (0, 780, W, 885), 1, 12, _school("tiny", ["clown", "blue", "yellow", "green"], 3),
     {"width": SCHOOL_W["tiny"]}),
    ("word_fish_and_prey_sheet", (0, 885, W, 1020), 1, 9, _school("medium", ["idol", "butterfly", "tang"], 3),
     {"width": SCHOOL_W["medium"]}),
    ("word_fish_and_prey_sheet", (0, 1020, W, 1254), 1, 3, _school("big", ["grouper"], 3), {"width": SCHOOL_W["big"]}),
    ("predators_ui_items_effects_sheet", (0, 0, W, 160), 1, 6,
     _frames("predator.shark", 3) + _frames("predator.puffer", 3), {}),
    ("predators_ui_items_effects_sheet", (0, 160, W, 318), 1, 6,
     _frames("predator.eel", 3) + _frames("predator.angler", 3), {}),
    # Cá nhồng ×3 (bên phải: rùa, cá heo — chưa dùng)
    ("predators_ui_items_effects_sheet", (0, 318, 640, 466), 1, 3, _frames("predator.barracuda", 3), {}),
    # Sao · tia chớp · bong bóng · đồng hồ · tim · rương · nam châm (chưa dùng)
    ("predators_ui_items_effects_sheet", (0, 630, W, 776), 1, 7,
     [f"item.{k}" for k in ("star", "bolt", "bubble", "clock", "heart", "chest")] + [None], {"max_side": ITEM_SIDE}),
]


def file_for(key: str) -> str:
    """player.coral_reef.0 -> player/coral_reef_0; prey.3 -> prey/fish_03; item.star -> items/star"""
    group, rest = key.split(".", 1)
    if group == "prey":
        return f"prey/fish_{int(rest):02d}"
    folder = {"predator": "predators", "item": "items"}[group] if group in ("predator", "item") else group
    return f"{folder}/{rest.replace('.', '_')}"


def spec_for(key: str, spec: dict) -> dict:
    if spec:
        return spec
    return {"height": PREDATOR_H[key.split(".")[1]]}


def trim(arr: np.ndarray) -> Image.Image:
    """Bỏ mảnh vụn rồi cắt sát (giữ mảng rời của cùng một vật — vd quả đèn của cá lồng đèn)"""
    arr = drop_fragments(clean_alpha(arr), largest_only=False)
    bx0, by0, bx1, by1 = tight_bbox(arr)
    return Image.fromarray(arr[by0:by1, bx0:bx1])


class Builder:
    def __init__(self) -> None:
        self.manifest: dict[str, dict] = {}
        self.images: dict[str, Image.Image] = {}

    def add(self, key: str, img: Image.Image, file: str, fmt: str = "png") -> None:
        self.images[key] = img
        path = OUT / f"{file}.{fmt}"
        if fmt == "webp":
            path.parent.mkdir(parents=True, exist_ok=True)
            img.save(path, quality=BG_QUALITY, method=6)
        else:
            save_png(img, path)
        self.manifest[key] = {"path": f"{ASSET_URL}/{file}.{fmt}", "width": img.width, "height": img.height}


def build_sheets(b: Builder) -> None:
    keyed: dict[str, np.ndarray] = {}
    for sheet, (x0, y0, x1, y1), rows, cols, keys, spec in SHEETS:
        if sheet not in keyed:
            keyed[sheet] = key_sheet(SRC / "sheets" / f"{sheet}.png")
        items = find_items(keyed[sheet][y0:y1, x0:x1], rows, cols)
        if len(items) != len(keys):
            raise RuntimeError(f"{sheet} {y0}..{y1}: {len(items)} items, {len(keys)} keys")
        for key, item in zip(keys, items):
            if key is None:
                continue
            source = trim(item)
            img = resize_rgba(source, target_size(source.width, source.height, spec_for(key, spec)))
            b.add(key, img, file_for(key))


def build_backgrounds(b: Builder) -> None:
    for biome in BIOMES:
        img = Image.open(SRC / "backgrounds" / f"{biome}.png").convert("RGB")
        b.add(f"bg.{biome}", img, f"backgrounds/{biome}", "webp")


def build_cover(images: dict[str, Image.Image]) -> None:
    """Ảnh bìa 16:9 ở màn chọn game: rạn san hô đông cá, cá của bé đuổi theo, cá mập phía sau."""
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

    paste("predator.shark.0", w * 0.8, h * 0.2, 50, flip=True, alpha=0.9)
    school = [
        ("clown", 0.62, 0.42), ("clown", 0.7, 0.36), ("clown", 0.74, 0.47), ("yellow", 0.86, 0.6),
        ("yellow", 0.93, 0.66), ("yellow", 0.88, 0.73), ("green", 0.12, 0.2), ("green", 0.19, 0.14),
    ]
    for index, (color, x, y) in enumerate(school):
        paste(f"school.tiny.{color}.{index % 3}", w * x, h * y, 14, flip=x > 0.5)
    paste("school.medium.idol.0", w * 0.58, h * 0.84, 26, flip=True)
    paste("prey.3", w * 0.72, h * 0.62, 34, flip=True)
    paste("prey.14", w * 0.84, h * 0.86, 30, flip=True)
    paste("player.coral_reef.0", w * 0.36, h * 0.6, 80)
    save_png(cover, OUT / "cover.png")


def main() -> None:
    for folder in OUT_DIRS:
        shutil.rmtree(OUT / folder, ignore_errors=True)
    b = Builder()
    build_sheets(b)
    build_backgrounds(b)
    build_cover(b.images)
    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(json.dumps(b.manifest, indent=2) + "\n", encoding="utf-8", newline="\n")
    print(f"Built {len(b.manifest)} images -> {OUT}")


if __name__ == "__main__":
    main()
