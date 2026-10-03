"""
Ảnh đại diện tài khoản (preset `AVATARS` của @phonics/contracts) -> `public/assets/shared/avatars/<key>.webp`.

Chạy:  pnpm assets:avatars   (= python tools/build_avatars.py)

Nguồn: Animal Avatar sheet 16-bit (`_source/platform/avatars/animal_avatars_16bit.webp`): 1254×1254 nền magenta,
2 hàng × 4 chân dung thú trong khung gỗ tròn. Tách nền bằng common/magenta_sheet.py; các khung trong một hàng
chạm nhau vài pixel nên không cắt theo mảng liền mà theo khe: hàng tách ở dải trống, cột tách ở cột ít pixel nhất
quanh mỗi đường chia đều. Mỗi ảnh căn giữa trên canvas vuông AVATAR_SIZE (UI hiển thị 36–112px CSS,
`object-fit: contain`).

Avatar cũ không có trong sheet (pip: ong Bee pack, girl / boy: streamer Food Stream) vẫn dùng ảnh sẵn có —
xem src/platform/account/avatars.ts.
"""

from __future__ import annotations

import shutil
import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common.imaging import resize_rgba  # noqa: E402
from common.magenta_sheet import key_sheet  # noqa: E402
from common.paths import SHARED_ASSETS, SOURCE  # noqa: E402

SHEET = SOURCE / "platform" / "avatars" / "animal_avatars_16bit.webp"
OUT = SHARED_ASSETS / "avatars"

# Thứ tự ô trên sheet = key AvatarKey của contracts
CELLS = ["tiger", "elephant", "lion", "monkey", "dog", "cat", "panda", "bunny"]
# 2x cỡ lớn nhất (ProfileScreen 112px)
AVATAR_SIZE = 224
# Lề trong suốt (tỉ lệ cạnh) để khung gỗ không chạm viền ô tròn / bo góc của UI
PADDING = 0.03
ROWS, COLS = 2, 4
# Tìm đường chia cột trong khoảng ± tỉ lệ này (theo bề rộng ô) quanh đường chia đều
SPLIT_SEARCH = 0.15


def _runs(mask: np.ndarray) -> list[tuple[int, int]]:
    """Các đoạn liên tiếp True của mảng 1 chiều: [(start, stop), ...]."""
    edges = np.diff(np.concatenate([[0], mask.astype(int), [0]]))
    return list(zip(np.nonzero(edges == 1)[0], np.nonzero(edges == -1)[0]))


def cut_cells(rgba: np.ndarray) -> list[np.ndarray]:
    """Ô theo thứ tự đọc, mỗi ô cắt sát theo alpha."""
    solid = rgba[..., 3] > 0
    rows = [run for run in _runs(solid.any(axis=1)) if run[1] - run[0] > 50]
    if len(rows) != ROWS:
        raise RuntimeError(f"Expected {ROWS} rows, found {rows}")
    cells = []
    for y0, y1 in rows:
        band = solid[y0:y1]
        xs = np.nonzero(band.any(axis=0))[0]
        left, right = xs.min(), xs.max() + 1
        width = (right - left) / COLS
        cuts = [left]
        for i in range(1, COLS):
            lo, hi = round(left + (i - SPLIT_SEARCH) * width), round(left + (i + SPLIT_SEARCH) * width)
            cuts.append(lo + int(band[:, lo:hi].sum(axis=0).argmin()))
        cuts.append(right)
        for x0, x1 in zip(cuts, cuts[1:]):
            cell = rgba[y0:y1, x0:x1]
            ys, xs = np.nonzero(cell[..., 3])
            cells.append(cell[ys.min():ys.max() + 1, xs.min():xs.max() + 1])
    return cells


def build_avatar(crop: np.ndarray) -> Image.Image:
    img = Image.fromarray(crop)
    box = AVATAR_SIZE * (1 - 2 * PADDING)
    scale = box / max(img.size)
    img = resize_rgba(img, (round(img.width * scale), round(img.height * scale)))
    canvas = Image.new("RGBA", (AVATAR_SIZE, AVATAR_SIZE), (0, 0, 0, 0))
    canvas.alpha_composite(img, ((AVATAR_SIZE - img.width) // 2, (AVATAR_SIZE - img.height) // 2))
    return canvas


def main() -> None:
    shutil.rmtree(OUT, ignore_errors=True)
    OUT.mkdir(parents=True)
    crops = cut_cells(key_sheet(SHEET))
    for key, crop in zip(CELLS, crops, strict=True):
        build_avatar(crop).save(OUT / f"{key}.webp", quality=90, method=6)
    print(f"Built {len(CELLS)} avatars -> {OUT}")


if __name__ == "__main__":
    main()
