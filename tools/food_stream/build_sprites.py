"""
Food Stream: cắt art board gốc (`_source/food-stream/art/`) thành từng PNG trong
`public/assets/food-stream/`, kèm manifest `src/games/food-stream/game/config/sprites.json`
(key ổn định -> đường dẫn, kích thước, anchors) — code import thẳng manifest nên React và Phaser
cùng biết có những ảnh nào ngay lúc build.

Chạy:  pnpm assets:food-stream   (= python tools/food_stream/build_sprites.py)

Nguồn:
  - asset-board-initial.png: nền TRONG SUỐT -> nhân vật, đồ ăn, đạo cụ, icon UI (cắt theo box + alpha)
  - asset-board-01/02/03.png: thẻ tranh từ vựng trên nền thẻ màu -> xoá nền thẻ bằng flood fill
Chữ in sẵn trên đồ ăn (D, B, O...) được che bằng "huy hiệu chữ" vẽ live trong game:
anchor `badge` (tâm + bán kính, toạ độ ảnh output) ghi trong sprites.json.

Texture được xuất ở độ phân giải canvas (gấp RENDER_SCALE = 2 toạ độ logic): game hiển thị
ở scale 0.5 để mỗi pixel texture khớp 1 pixel màn hình (sắc nét, không nhoè).
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from common.imaging import (  # noqa: E402
    clean_alpha, drop_fragments, load_rgba, resize_rgba, save_png, target_size, tight_bbox,
)
from common.paths import GAME_APP, PUBLIC_ASSETS, SOURCE  # noqa: E402

SRC = SOURCE / "food-stream" / "art"
OUT = PUBLIC_ASSETS / "food-stream"
ASSET_URL = "assets/food-stream"
MANIFEST = GAME_APP / "src" / "games" / "food-stream" / "game" / "config" / "sprites.json"

BOARD_ALPHA = SRC / "asset-board-initial.png"
PAD = 2

# --------------------------------------------------------------------------- #
# Sprite trên board trong suốt (asset-board-initial.png)
#   box: (x0, y0, x1, y1) toạ độ trên board
#   height / width / max_side: kích thước output (px texture = 2 × px logic)
#   largest: chỉ giữ mảng lớn nhất (bỏ dấu "!", "?", phần lấn của sprite bên cạnh)
#   badge: (cx, cy, r) vùng chữ in sẵn cần che (toạ độ board)
# --------------------------------------------------------------------------- #
CHARACTER_H = 300
FOOD_SIDE = 172

SPRITES: dict[str, dict] = {
    # Nhân vật A (hồng) / B (xanh): vui (đang ăn) · wow (há miệng) · suy nghĩ
    "character.girl.happy": dict(file="characters/girl_happy", box=(23, 23, 209, 253), height=CHARACTER_H, largest=True),
    "character.girl.wow": dict(file="characters/girl_wow", box=(212, 28, 402, 254), height=CHARACTER_H, largest=True),
    "character.girl.think": dict(file="characters/girl_think", box=(412, 26, 560, 253), height=CHARACTER_H, largest=True),
    "character.boy.happy": dict(file="characters/boy_happy", box=(626, 29, 820, 253), height=CHARACTER_H, largest=True),
    "character.boy.wow": dict(file="characters/boy_wow", box=(841, 30, 1022, 253), height=CHARACTER_H, largest=True),
    "character.boy.think": dict(file="characters/boy_think", box=(1041, 28, 1200, 253), height=CHARACTER_H, largest=True),
    # Đồ ăn (chữ in sẵn được che bằng huy hiệu chữ live)
    "food.donut": dict(file="food/donut", box=(16, 281, 143, 414), max_side=FOOD_SIDE, badge=(78, 344, 37)),
    "food.cupcake": dict(file="food/cupcake", box=(147, 274, 257, 414), max_side=FOOD_SIDE, badge=(203, 347, 29)),
    "food.cookie": dict(file="food/cookie", box=(262, 285, 382, 415), max_side=FOOD_SIDE, largest=True, badge=(320, 349, 31)),
    "food.candy": dict(file="food/candy", box=(384, 285, 512, 415), max_side=FOOD_SIDE, largest=True, badge=(450, 348, 28)),
    "food.pancake": dict(file="food/pancake", box=(513, 285, 640, 415), max_side=FOOD_SIDE, largest=True, badge=(576, 350, 29)),
    "food.popsicle": dict(file="food/popsicle", box=(637, 270, 726, 406), max_side=FOOD_SIDE, badge=(683, 327, 28)),
    "food.ramen": dict(file="food/ramen", box=(745, 294, 880, 406), max_side=FOOD_SIDE, badge=(812, 372, 22)),
    "food.boba": dict(file="food/boba", box=(891, 272, 970, 403), max_side=FOOD_SIDE, badge=(930, 360, 22)),
    # Đĩa / khay
    "prop.plate.pink": dict(file="props/plate_pink", box=(15, 426, 193, 521), width=190),
    "prop.plate.blue": dict(file="props/plate_blue", box=(207, 426, 382, 520), width=190),
    # Đạo cụ phòng stream
    "prop.window": dict(file="props/window", box=(332, 1046, 521, 1225), height=200),
    "prop.shelf": dict(file="props/shelf", box=(528, 1050, 731, 1225), height=190),
    "prop.chalkboard": dict(file="props/chalkboard", box=(731, 1057, 862, 1240), height=190),
    "prop.plant": dict(file="props/plant", box=(854, 896, 966, 1028), height=120),
    "prop.lamp": dict(file="props/lamp", box=(716, 904, 779, 1025), height=120),
    "prop.camera": dict(file="props/camera", box=(622, 890, 697, 1032), height=150),
    "prop.sign": dict(file="props/sign", box=(786, 934, 857, 1029), height=96),
    "prop.tissue": dict(file="props/tissue", box=(958, 948, 1061, 1033), height=70),
    # UI
    "ui.live": dict(file="ui/live", box=(15, 670, 146, 734), height=52),
    "ui.chat": dict(file="ui/chat", box=(422, 670, 495, 740), height=56),
    "ui.star": dict(file="ui/star", box=(11, 753, 102, 838), max_side=72),
    "ui.coin": dict(file="ui/coin", box=(110, 755, 195, 842), max_side=64),
    "ui.stopwatch": dict(file="ui/stopwatch", box=(207, 745, 297, 845), max_side=56),
    "ui.heart": dict(file="ui/heart", box=(1199, 919, 1239, 961), max_side=44),
    "ui.sparkle": dict(file="ui/sparkle", box=(1045, 887, 1084, 931), max_side=40),
    "ui.question": dict(file="ui/question", box=(560, 48, 603, 108), height=56),
    "ui.combo": dict(file="ui/combo", box=(927, 659, 1081, 768), width=200),
    "ui.perfect": dict(file="ui/perfect", box=(1086, 653, 1241, 773), width=220),
    "ui.crown": dict(file="ui/crown", box=(1109, 1038, 1208, 1116), width=110),
    "ui.banner.a": dict(file="ui/banner_a", box=(868, 1053, 956, 1234), height=150),
    "ui.banner.b": dict(file="ui/banner_b", box=(969, 1053, 1057, 1233), height=150),
    "ui.btn.speaker": dict(file="ui/btn_speaker", box=(1030, 538, 1129, 639), max_side=96),
    "ui.btn.home": dict(file="ui/btn_home", box=(822, 783, 902, 869), max_side=84),
    "ui.btn.back": dict(file="ui/btn_back", box=(998, 783, 1082, 869), max_side=84),
    "ui.btn.pause": dict(file="ui/btn_pause", box=(1168, 783, 1248, 869), max_side=84),
    "ui.btn.play": dict(file="ui/btn_play", box=(1085, 783, 1165, 869), max_side=84),
}

# Đồ ăn có khung "đang ăn": cắn 1 miếng, cắn 2 miếng (plan §11) — tạo bằng code từ ảnh gốc
BITE_FRAMES = 2

# --------------------------------------------------------------------------- #
# Thẻ tranh từ vựng: xoá nền thẻ (flood fill từ mép box) -> tranh trong suốt
#   (board, box) — box nằm TRONG lòng thẻ, không lấy chữ bên dưới
# --------------------------------------------------------------------------- #
PICTURE_SIDE = 132


def _card(x: int, y: int, w: int = 41, h: int = 49) -> tuple[int, int, int, int]:
    return (x + 2, y + 2, x + w - 2, y + h - 2)


PICTURES: dict[str, tuple[str, tuple[int, int, int, int]]] = {
    # Letter D (board 01 — cùng một bộ tranh)
    "dog": ("asset-board-01", _card(284, 509)),
    "duck": ("asset-board-01", _card(333, 509)),
    "drum": ("asset-board-01", _card(381, 509)),
    "dinosaur": ("asset-board-01", _card(429, 509, 42)),
    "desk": ("asset-board-01", _card(478, 509, 42)),
    "doll": ("asset-board-01", _card(284, 595)),
    "dig": ("asset-board-01", _card(333, 595)),
    "dirt": ("asset-board-01", _card(381, 595)),
    "den": ("asset-board-01", _card(429, 595, 42)),
    "day": ("asset-board-01", _card(478, 598, 42, 46)),
    # Letter O + CVC (board 03 / 02)
    "octopus": ("asset-board-03", (1366, 240, 1410, 292)),
    "oven": ("asset-board-03", (1421, 240, 1465, 292)),
    "olive": ("asset-board-03", (1476, 240, 1521, 292)),
    "pot": ("asset-board-03", (1366, 329, 1410, 382)),
    "top": ("asset-board-03", (1421, 329, 1465, 382)),
    "mom": ("asset-board-03", (1476, 329, 1521, 382)),
    "onion": ("asset-board-02", (122, 624, 190, 668)),
    "otter": ("asset-board-02", (302, 624, 388, 668)),
}
BG_TOLERANCE = 38

# Ảnh bìa ở màn chọn game (16:9)
COVER_SIZE = (480, 270)


# --------------------------------------------------------------------------- #
# Builders
# --------------------------------------------------------------------------- #
def save(img: Image.Image, file: str) -> str:
    save_png(img, OUT / f"{file}.png")
    return f"{ASSET_URL}/{file}.png"


def cut_sprite(board: np.ndarray, spec: dict) -> tuple[Image.Image, dict]:
    x0, y0, x1, y1 = spec["box"]
    crop = clean_alpha(board[y0:y1, x0:x1])
    crop = drop_fragments(crop, spec.get("largest", False))
    bx0, by0, bx1, by1 = tight_bbox(crop)
    bx0, by0 = max(0, bx0 - PAD), max(0, by0 - PAD)
    bx1, by1 = min(crop.shape[1], bx1 + PAD), min(crop.shape[0], by1 + PAD)
    crop = crop[by0:by1, bx0:bx1]

    w, h = crop.shape[1], crop.shape[0]
    tw, th = target_size(w, h, spec)
    img = resize_rgba(Image.fromarray(crop), (tw, th))

    anchors = {}
    if "badge" in spec:
        cx, cy, r = spec["badge"]
        sx = tw / w
        anchors["badge"] = {
            "x": round((cx - x0 - bx0) * sx),
            "y": round((cy - y0 - by0) * sx),
            "r": round(r * sx),
        }
    return img, anchors


def bite(img: Image.Image, count: int) -> Image.Image:
    """Khuyết `count` miếng cắn tròn ở mép phải trên, kèm viền vụn bánh."""
    out = img.copy()
    w, h = out.size
    mask = Image.new("L", out.size, 0)
    draw = ImageDraw.Draw(mask)
    r = round(min(w, h) * 0.2)
    spots = [(w * 0.86, h * 0.22), (w * 0.94, h * 0.5)][:count]
    for cx, cy in spots:
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=255)
    arr = np.array(out)
    bitten = np.array(mask) > 0
    arr[bitten] = 0
    # Viền vụn bánh quanh vết cắn để nhìn ra "bị cắn" chứ không phải bị cắt
    edge = ndimage.binary_dilation(bitten, iterations=3) & ~bitten & (arr[..., 3] > 0)
    arr[edge] = (214, 160, 92, 255)
    return Image.fromarray(arr)


def remove_card_background(crop: np.ndarray) -> np.ndarray:
    """Flood fill từ mép box: pixel gần màu nền thẻ -> trong suốt."""
    rgb = crop[..., :3].astype(int)
    border = np.concatenate([rgb[0], rgb[-1], rgb[:, 0], rgb[:, -1]])
    bg = np.median(border, axis=0)
    similar = np.abs(rgb - bg).max(axis=2) < BG_TOLERANCE
    seeds = np.zeros_like(similar)
    seeds[0, :] = seeds[-1, :] = seeds[:, 0] = seeds[:, -1] = True
    labels, _ = ndimage.label(similar)
    background = np.isin(labels, np.unique(labels[seeds & similar]))
    out = crop.copy()
    out[background] = 0
    out[..., 3] = np.where(background, 0, 255)
    return out


def cut_picture(board: np.ndarray, box: tuple[int, int, int, int]) -> Image.Image:
    x0, y0, x1, y1 = box
    crop = remove_card_background(board[y0:y1, x0:x1])
    crop = drop_fragments(crop, largest_only=False)
    bx0, by0, bx1, by1 = tight_bbox(crop)
    crop = crop[by0:by1, bx0:bx1]
    w, h = crop.shape[1], crop.shape[0]
    return resize_rgba(Image.fromarray(crop), target_size(w, h, {"max_side": PICTURE_SIDE}))


def build_cover(images: dict[str, Image.Image]) -> None:
    w, h = COVER_SIZE
    cover = Image.new("RGBA", COVER_SIZE, (255, 214, 226, 255))
    draw = ImageDraw.Draw(cover)
    # Tường sọc hồng + sàn gỗ
    for x in range(0, w, 24):
        draw.rectangle([x, 0, x + 11, h], fill=(255, 226, 234, 255))
    draw.rectangle([0, round(h * 0.78), w, h], fill=(214, 150, 102, 255))

    def paste(key: str, x: float, y: float, scale: float) -> None:
        sprite = images[key]
        sprite = resize_rgba(sprite, (round(sprite.width * scale), round(sprite.height * scale)))
        cover.alpha_composite(sprite, (round(x - sprite.width / 2), round(y - sprite.height / 2)))

    paste("prop.window", w * 0.2, h * 0.3, 0.55)
    paste("prop.shelf", w * 0.82, h * 0.3, 0.55)
    paste("character.girl.happy", w * 0.3, h * 0.66, 0.55)
    paste("character.boy.wow", w * 0.7, h * 0.66, 0.55)
    paste("food.donut", w * 0.5, h * 0.84, 0.42)
    paste("food.cupcake", w * 0.62, h * 0.86, 0.36)
    paste("food.boba", w * 0.38, h * 0.85, 0.36)
    paste("ui.live", w * 0.12, h * 0.1, 0.8)
    save(cover, "cover")


def main() -> None:
    board = load_rgba(BOARD_ALPHA)
    manifest: dict[str, dict] = {}
    images: dict[str, Image.Image] = {}

    for key, spec in SPRITES.items():
        img, anchors = cut_sprite(board, spec)
        images[key] = img
        manifest[key] = {"path": save(img, spec["file"]), "width": img.width, "height": img.height}
        if anchors:
            manifest[key]["anchors"] = anchors
        if key.startswith("food."):
            for frame in range(1, BITE_FRAMES + 1):
                bitten = bite(img, frame)
                manifest[f"{key}.bite{frame}"] = {
                    "path": save(bitten, f"{spec['file']}_bite{frame}"),
                    "width": img.width,
                    "height": img.height,
                }

    boards: dict[str, np.ndarray] = {}
    for word, (board_name, box) in PICTURES.items():
        if board_name not in boards:
            boards[board_name] = load_rgba(SRC / f"{board_name}.png")
        img = cut_picture(boards[board_name], box)
        manifest[f"picture.{word}"] = {
            "path": save(img, f"pictures/{word}"),
            "width": img.width,
            "height": img.height,
        }

    build_cover(images)
    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(f"Built {len(manifest)} images -> {OUT}")


if __name__ == "__main__":
    main()
