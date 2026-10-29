"""
Halloween Candy Quest: sprite pixel-art, nền 3 khu vực, âm thanh + ảnh bìa thẻ game.

Chạy:  pnpm assets:halloween-candy-quest   (= python tools/halloween_candy_quest/build_assets.py)

Nguồn `_source/halloween-candy-quest/` = Halloween Candy Quest Resource Pack v1.0 (bỏ thư mục `source_atlases/`
— bảng tham khảo, không dùng lúc chạy). Xuất `public/assets/halloween-candy-quest/`:
  - bg/<zone>.png: nền 320×180 gốc (game phóng to nearest-neighbor bằng CSS)
  - chars/<id>.png: spritesheet 2 cột × 5 hàng × 48px (idle, walk, knock, celebrate, try_again) + chars/<id>_portrait.png
  - buildings/, doors/, npcs/, props/, candy/, baskets/, words/<id>.png (icon 72px), fx/
  - sfx/<key>.ogg|.mp3: 12 SFX + nhạc nền (encode lại như tools/build_audio.py)
  - cover.png 480×270

Sprite trong pack được cắt từ concept sheet nên còn sót vệt viền / nhãn chữ ("Mummy", "Owl"...): giữ các mảng điểm ảnh
liền nhau đủ lớn so với mảng lớn nhất, xoá mảng vụn (`clean`).
"""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
import soundfile as sf
from PIL import Image
from scipy import ndimage

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from build_audio import write_both  # noqa: E402
from common.paths import PUBLIC_ASSETS, SOURCE  # noqa: E402

SRC = SOURCE / "halloween-candy-quest"
OUT = PUBLIC_ASSETS / "halloween-candy-quest"

ZONES = ["pumpkin_garden", "candy_village", "magic_castle"]
CHARACTERS = ["pumpkin_kid", "little_ghost", "mini_witch", "vampire_kid", "black_cat", "bat_explorer"]
STATES = ["idle", "walk", "knock", "celebrate", "try_again"]
FRAME = 48

BUILDINGS = [
    "pumpkin_house", "ghost_house", "mushroom_shop", "witch_cottage", "candy_shop", "purple_house",
    "castle_gate", "castle_main", "castle_towers",
]
DOORS = [
    "wood_closed", "pumpkin_door", "pink_closed", "purple_closed", "dark_door", "golden_open", "stone_open",
    "wood_glowing", "pink_magic", "magic_pumpkin_portal",
]
NPCS = [
    "pumpkin_host", "friendly_ghost", "black_cat_host", "witch_host", "owl", "vampire_host", "cute_blue_monster",
    "skeleton", "mummy", "frankenstein",
]
PROPS = ["pumpkin_closed", "pumpkin_open", "chest_closed", "chest_open", "lantern", "cauldron", "candy_cart", "mailbox",
         "haystack", "well", "signpost", "barrel"]
FX = ["confetti", "magic_sparkles", "knock_spark", "heart_sparkles"]
# Nhãn chữ / vệt nhỏ hơn tỉ lệ này so với mảng lớn nhất thì xoá
MIN_PART = 0.04
# Vệt cắt dọc ở mép: mảnh (≤ SLIVER_WIDTH px) mà cao (≥ SLIVER_HEIGHT chiều cao ảnh)
SLIVER_WIDTH = 6
SLIVER_HEIGHT = 0.3
# Nhãn chữ phía trên sprite NPC: dải dẹt nằm gọn trong phần trên cùng của ảnh
LABEL_TOP = 0.22


def clean(img: Image.Image) -> Image.Image:
    """Xoá mảng điểm ảnh vụn (nhãn chữ, vệt viền còn sót khi cắt sprite)."""
    img = img.convert("RGBA")
    rgba = np.array(img)
    solid = rgba[:, :, 3] > 24
    labels, count = ndimage.label(solid, structure=np.ones((3, 3), dtype=int))
    if count <= 1:
        return img
    sizes = ndimage.sum(solid, labels, range(1, count + 1))
    largest = sizes.max()
    keep = np.zeros(count + 1, dtype=bool)
    height = rgba.shape[0]
    for index, box in enumerate(ndimage.find_objects(labels), start=1):
        top, bottom = box[0].start, box[0].stop
        width = box[1].stop - box[1].start
        sliver = width <= SLIVER_WIDTH and bottom - top >= height * SLIVER_HEIGHT
        label = bottom <= height * LABEL_TOP and width > 1.6 * (bottom - top)
        keep[index] = sizes[index - 1] >= largest * MIN_PART and not sliver and not label
    rgba[~keep[labels]] = 0
    return Image.fromarray(rgba)


def save(img: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, optimize=True)


def build_sprites() -> int:
    count = 0
    for zone in ZONES:
        save(Image.open(SRC / "backgrounds" / zone / "main_native_320x180.png").convert("RGB"), OUT / "bg" / f"{zone}.png")
        count += 1

    for char in CHARACTERS:
        # Ghép lại từ frame rời (đã tách nền) — làm sạch từng ô để vệt của ô này không lẹm sang ô khác
        sheet = Image.new("RGBA", (FRAME * 2, FRAME * len(STATES)))
        for row, state in enumerate(STATES):
            for col in range(2):
                frame = clean(Image.open(SRC / "characters" / char / f"{state}_0{col + 1}.png"))
                sheet.alpha_composite(frame, (col * FRAME, row * FRAME))
        save(sheet, OUT / "chars" / f"{char}.png")
        save(clean(Image.open(SRC / "characters" / char / "portrait_96.png")), OUT / "chars" / f"{char}_portrait.png")
        count += 2

    groups = [
        ("buildings", BUILDINGS, "{}_128.png"),
        ("doors", DOORS, "{}_80x96.png"),
        ("npcs", NPCS, "{}_96.png"),
        ("interactables", PROPS, "{}_96.png"),
    ]
    for folder, names, pattern in groups:
        target = "props" if folder == "interactables" else folder
        for name in names:
            save(clean(Image.open(SRC / folder / pattern.format(name))), OUT / target / f"{name}.png")
            count += 1

    for candy in sorted((SRC / "candy").glob("*_48.png")):
        save(clean(Image.open(candy)), OUT / "candy" / candy.name.replace("_48", ""))
        count += 1
    for basket in ["empty", "half", "full"]:
        save(clean(Image.open(SRC / "candy" / "baskets" / f"{basket}_112.png")), OUT / "baskets" / f"{basket}.png")
        count += 1
    for icon in sorted((SRC / "vocabulary" / "icons").glob("*_72.png")):
        save(clean(Image.open(icon)), OUT / "words" / icon.name.replace("_72", ""))
        count += 1
    for fx in FX:
        save(Image.open(SRC / "effects" / f"{fx}_transparent.png").convert("RGBA"), OUT / "fx" / f"{fx}.png")
        count += 1
    return count


def build_audio() -> int:
    wavs = sorted((SRC / "audio").glob("*.wav"))
    for wav in wavs:
        data, rate = sf.read(wav, always_2d=True)
        write_both(data, rate, OUT / "sfx" / wav.stem.removeprefix("sfx_"))
    return len(wavs)


def pixel(img: Image.Image, scale: int) -> Image.Image:
    return img.resize((img.width * scale, img.height * scale), Image.NEAREST)


def build_cover() -> Image.Image:
    """480×270: nền Pumpkin Garden + 3 nhân vật (giữa nhô cao), hàng kẹo phía trước."""
    cover = pixel(Image.open(OUT / "bg" / "pumpkin_garden.png").convert("RGBA"), 2).crop((80, 45, 560, 315))
    shade = Image.new("RGBA", cover.size, (24, 12, 48, 70))
    cover.alpha_composite(shade)
    portraits = ["little_ghost", "pumpkin_kid", "mini_witch"]
    for index, char in enumerate(portraits):
        portrait = pixel(Image.open(OUT / "chars" / f"{char}_portrait.png"), 2)
        x = 4 + index * 144
        y = 44 if index == 1 else 70
        cover.alpha_composite(portrait, (x, y))
    candies = ["lollipop", "candy_corn", "pink_wrap", "star_candy", "orange_wrap", "round_lollipop", "purple_wrap"]
    for index, candy in enumerate(candies):
        img = Image.open(OUT / "candy" / f"{candy}.png")
        cover.alpha_composite(img, (10 + index * 66, cover.height - img.height - 2))
    return cover.convert("RGB")


def main() -> None:
    sprites = build_sprites()
    sounds = build_audio()
    build_cover().save(OUT / "cover.png", optimize=True)
    print(f"[halloween-candy-quest] {sprites} images + {sounds} sounds + cover -> {OUT}")


if __name__ == "__main__":
    main()
