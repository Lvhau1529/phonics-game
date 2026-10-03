"""
Pixel-art cho phần lớp học của Phonics Bread Catcher (vẽ bằng code, không cần file gốc):
xúc xắc 6 mặt, hộp quà đóng / mở, vương miện (linh vật đội: Kids Bakery pack, bakery_pack.py).

Không có chữ nào được "nướng" vào hình — tên đội, chữ cái, điểm... đều vẽ live trong game.
Được gọi từ tools/build_sprites.py — không cần chạy riêng.
"""

from __future__ import annotations

from PIL import Image, ImageDraw

from brainrot_art import WHITE, _outline

SCALE = 3

# Bảng màu
DICE_FACE = (255, 252, 244, 255)
DICE_SHADE = (226, 214, 196, 255)
PIP = (226, 58, 72, 255)

GOLD = (255, 204, 56, 255)
GOLD_DARK = (214, 150, 30, 255)
GEM_RED = (232, 60, 80, 255)
GEM_BLUE = (70, 150, 240, 255)

GIFT_COLORS = [
    ((236, 72, 96, 255), (190, 40, 66, 255)),  # đỏ
    ((72, 150, 236, 255), (40, 104, 190, 255)),  # xanh dương
    ((96, 196, 96, 255), (58, 146, 62, 255)),  # xanh lá
]
RIBBON = GOLD
RIBBON_DARK = GOLD_DARK
SPARKLE = (255, 244, 160, 255)


def _finish(img: Image.Image, scale: int = SCALE) -> Image.Image:
    img = _outline(img)
    return img.resize((img.width * scale, img.height * scale), Image.NEAREST)


# --------------------------------------------------------------------------- #
# Xúc xắc (16x16, scale 4)
# --------------------------------------------------------------------------- #
PIP_POS = {"l": 2, "c": 6, "r": 10}
PIPS = {
    1: [("c", "c")],
    2: [("l", "l"), ("r", "r")],
    3: [("l", "l"), ("c", "c"), ("r", "r")],
    4: [("l", "l"), ("r", "l"), ("l", "r"), ("r", "r")],
    5: [("l", "l"), ("r", "l"), ("c", "c"), ("l", "r"), ("r", "r")],
    6: [("l", "l"), ("r", "l"), ("l", "c"), ("r", "c"), ("l", "r"), ("r", "r")],
}


def _dice(value: int) -> Image.Image:
    img = Image.new("RGBA", (16, 16), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([0, 0, 15, 15], radius=3, fill=DICE_SHADE)
    d.rounded_rectangle([0, 0, 14, 14], radius=3, fill=DICE_FACE)
    for px, py in PIPS[value]:
        x, y = PIP_POS[px], PIP_POS[py]
        d.rectangle([x, y, x + 2, y + 2], fill=PIP)
    return _finish(img, 4)


# --------------------------------------------------------------------------- #
# Hộp quà (20x20, scale 4) + vương miện
# --------------------------------------------------------------------------- #
def _gift_body(d: ImageDraw.ImageDraw, color, shade) -> None:
    d.rectangle([2, 9, 17, 19], fill=color)
    d.rectangle([2, 17, 17, 19], fill=shade)
    d.rectangle([9, 9, 10, 19], fill=RIBBON)


def _gift_closed(index: int) -> Image.Image:
    color, shade = GIFT_COLORS[index]
    img = Image.new("RGBA", (20, 20), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    _gift_body(d, color, shade)
    # Nắp + nơ
    d.rectangle([1, 6, 18, 9], fill=color)
    d.rectangle([1, 9, 18, 9], fill=shade)
    d.rectangle([9, 6, 10, 9], fill=RIBBON)
    d.ellipse([4, 1, 9, 6], fill=RIBBON)
    d.ellipse([10, 1, 15, 6], fill=RIBBON)
    d.point([(6, 3), (13, 3)], fill=RIBBON_DARK)
    d.rectangle([9, 4, 10, 6], fill=RIBBON_DARK)
    return _finish(img, 4)


def _gift_open(index: int) -> Image.Image:
    color, shade = GIFT_COLORS[index]
    img = Image.new("RGBA", (22, 24), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # Ánh sáng bung ra từ miệng hộp
    d.polygon([(4, 14), (0, 7), (8, 13)], fill=SPARKLE)
    d.polygon([(17, 14), (21, 7), (13, 13)], fill=SPARKLE)
    d.polygon([(8, 14), (10, 7), (11, 7), (13, 14)], fill=SPARKLE)
    # Thân hộp
    d.rectangle([3, 14, 18, 23], fill=color)
    d.rectangle([3, 21, 18, 23], fill=shade)
    d.rectangle([3, 14, 18, 14], fill=shade)
    d.rectangle([10, 14, 11, 23], fill=RIBBON)
    # Nắp bật lên cao
    d.rectangle([2, 3, 19, 6], fill=color)
    d.rectangle([2, 6, 19, 6], fill=shade)
    d.rectangle([10, 3, 11, 6], fill=RIBBON)
    d.ellipse([6, 0, 10, 3], fill=RIBBON)
    d.ellipse([11, 0, 15, 3], fill=RIBBON)
    return _finish(img, 4)


def _crown() -> Image.Image:
    img = Image.new("RGBA", (18, 12), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.polygon([(1, 11), (1, 3), (5, 7), (9, 1), (13, 7), (17, 3), (17, 11)], fill=GOLD)
    d.rectangle([1, 9, 17, 11], fill=GOLD_DARK)
    d.rectangle([8, 5, 9, 6], fill=GEM_RED)
    d.point([(4, 10), (13, 10)], fill=GEM_BLUE)
    d.point([(1, 3), (9, 1), (17, 3)], fill=WHITE)
    return _finish(img)


def build_phonics_sprites() -> dict[str, Image.Image]:
    sprites: dict[str, Image.Image] = {
        "phonics/crown": _crown(),
    }
    for value in range(1, 7):
        sprites[f"phonics/dice_{value}"] = _dice(value)
    for index in range(3):
        sprites[f"phonics/gift_closed_{index + 1:02d}"] = _gift_closed(index)
        sprites[f"phonics/gift_open_{index + 1:02d}"] = _gift_open(index)
    return sprites
